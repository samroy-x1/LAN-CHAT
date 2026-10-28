package com.campuschat.service;

import com.campuschat.exception.ChatException;
import com.campuschat.model.Channel;
import com.campuschat.model.ChatMessage;
import com.campuschat.model.User;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);
    private static final int MAX_HISTORY_SIZE = 100;
    private static final int MAX_MESSAGE_LENGTH = 500;
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9 _-]+$");
    private static final Pattern CHANNEL_NAME_PATTERN = Pattern.compile("^[a-zA-Z0-9 _-]+$");

    // Thread-safe state for active session users
    private final Map<String, User> activeUsersBySession = new ConcurrentHashMap<>();

    // Channels state
    private final Map<String, Channel> channels = new ConcurrentHashMap<>();

    // History segregated by channelId (e.g., "general", "study-group")
    private final Map<String, CopyOnWriteArrayList<ChatMessage>> channelHistories = new ConcurrentHashMap<>();

    // History segregated by 1-on-1 direct message conversation key (e.g., "dm:arun:sam")
    private final Map<String, CopyOnWriteArrayList<ChatMessage>> dmHistories = new ConcurrentHashMap<>();

    @PostConstruct
    public void initDefaultChannels() {
        registerSystemChannel("general", "general", "Public campus-wide discussions and announcements.");
        registerSystemChannel("study-group", "study-group", "Homework help, assignments, exam preparation & study materials.");
        registerSystemChannel("code-snippets", "code-snippets", "Programming questions, coding solutions & tech sharing.");
        registerSystemChannel("random", "random", "Casual conversations, memes, music & campus life.");
    }

    private void registerSystemChannel(String id, String name, String description) {
        Channel channel = new Channel(id, name, description, "System", true);
        channels.put(id, channel);
        channelHistories.put(id, new CopyOnWriteArrayList<>());
    }

    // ==================== User Management ====================

    public String validateAndSanitizeUsername(String rawUsername) {
        return validateAndSanitizeUsername(rawUsername, null);
    }

    public String validateAndSanitizeUsername(String rawUsername, String excludeSessionId) {
        if (rawUsername == null) {
            throw new ChatException("Username is required.");
        }

        String trimmed = rawUsername.trim();

        if (trimmed.length() < 2 || trimmed.length() > 20) {
            throw new ChatException("Username must be between 2 and 20 characters.");
        }

        if (!USERNAME_PATTERN.matcher(trimmed).matches()) {
            throw new ChatException("Username contains invalid characters. Only letters, numbers, spaces, underscore, and hyphen are allowed.");
        }

        String sanitized = sanitizeHtml(trimmed);

        if (isUsernameTaken(sanitized, excludeSessionId)) {
            throw new ChatException("Username '" + sanitized + "' is already taken.");
        }

        return sanitized;
    }

    public boolean isUsernameTaken(String username) {
        return isUsernameTaken(username, null);
    }

    public boolean isUsernameTaken(String username, String excludeSessionId) {
        if (username == null) return false;
        String lowerTarget = username.trim().toLowerCase();
        return activeUsersBySession.entrySet().stream()
                .filter(entry -> excludeSessionId == null || !entry.getKey().equals(excludeSessionId))
                .anyMatch(entry -> entry.getValue().getUsername().equalsIgnoreCase(lowerTarget));
    }

    public User registerUser(String username, String sessionId) {
        String trimmed = username != null ? username.trim() : "";

        // Remove old session if reconnecting with the same username
        activeUsersBySession.entrySet().removeIf(entry ->
                entry.getValue().getUsername().equalsIgnoreCase(trimmed) && !entry.getKey().equals(sessionId)
        );

        String validUsername = validateAndSanitizeUsername(username, sessionId);
        User user = new User(validUsername, sessionId);
        activeUsersBySession.put(sessionId, user);
        logger.info("User connected: {} (Session ID: {})", validUsername, sessionId);
        return user;
    }

    public User removeUserBySession(String sessionId) {
        if (sessionId == null) return null;
        User user = activeUsersBySession.remove(sessionId);
        if (user != null) {
            logger.info("User disconnected: {} (Session ID: {})", user.getUsername(), sessionId);
        }
        return user;
    }

    public List<User> getOnlineUsers() {
        return new ArrayList<>(activeUsersBySession.values());
    }

    public User getUserByUsername(String username) {
        if (username == null) return null;
        String lower = username.trim().toLowerCase();
        return activeUsersBySession.values().stream()
                .filter(u -> u.getUsername().equalsIgnoreCase(lower))
                .findFirst()
                .orElse(null);
    }

    public Set<String> getSessionIdsForUser(String username) {
        if (username == null) return Collections.emptySet();
        String lower = username.trim().toLowerCase();
        return activeUsersBySession.entrySet().stream()
                .filter(e -> e.getValue().getUsername().equalsIgnoreCase(lower))
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());
    }

    public int getActiveUsersCount() {
        return activeUsersBySession.size();
    }

    // ==================== Channels Management ====================

    public List<Channel> getAllChannels() {
        return new ArrayList<>(channels.values());
    }

    public Channel getChannel(String channelId) {
        if (channelId == null) return null;
        return channels.get(channelId.toLowerCase().trim());
    }

    public Channel createChannel(String rawName, String rawDescription, String createdBy) {
        if (rawName == null || rawName.trim().isEmpty()) {
            throw new ChatException("Channel name cannot be empty.");
        }

        String name = rawName.trim();
        if (name.length() < 2 || name.length() > 30) {
            throw new ChatException("Channel name must be between 2 and 30 characters.");
        }

        if (!CHANNEL_NAME_PATTERN.matcher(name).matches()) {
            throw new ChatException("Channel name contains invalid characters. Use letters, numbers, spaces, _ or -.");
        }

        String id = name.toLowerCase().replaceAll("[\\s_]+", "-");
        if (channels.containsKey(id)) {
            throw new ChatException("Channel '#" + id + "' already exists.");
        }

        String sanitizedName = sanitizeHtml(name);
        String sanitizedDesc = rawDescription != null ? sanitizeHtml(rawDescription.trim()) : "";
        String sanitizedCreator = createdBy != null ? sanitizeHtml(createdBy.trim()) : "Anonymous";

        Channel newChannel = new Channel(id, sanitizedName, sanitizedDesc, sanitizedCreator, false);
        channels.put(id, newChannel);
        channelHistories.put(id, new CopyOnWriteArrayList<>());

        logger.info("New channel created: #{} by {}", id, sanitizedCreator);
        return newChannel;
    }

    // ==================== Message Processing ====================

    public ChatMessage processChannelMessage(ChatMessage message) {
        validateMessageContent(message);

        String channelId = message.getChannelId() != null ? message.getChannelId().trim().toLowerCase() : "general";
        if (!channels.containsKey(channelId)) {
            channelId = "general";
        }
        message.setChannelId(channelId);
        message.setType(message.getType() != null && message.getType() == ChatMessage.MessageType.FILE
                ? ChatMessage.MessageType.FILE : ChatMessage.MessageType.CHANNEL_CHAT);

        // Sanitize
        message.setMessage(sanitizeHtml(message.getMessage().trim()));
        if (message.getSender() != null) {
            message.setSender(sanitizeHtml(message.getSender().trim()));
        }

        // Store in channel history
        CopyOnWriteArrayList<ChatMessage> history = channelHistories.computeIfAbsent(channelId, k -> new CopyOnWriteArrayList<>());
        history.add(message);
        if (history.size() > MAX_HISTORY_SIZE) {
            history.remove(0);
        }

        logger.info("[#{}] Message from {}: {}", channelId, message.getSender(), message.getMessage());
        return message;
    }

    public ChatMessage processPrivateMessage(ChatMessage message) {
        validateMessageContent(message);

        if (message.getRecipient() == null || message.getRecipient().trim().isEmpty()) {
            throw new ChatException("Recipient username is required for private messages.");
        }

        String recipient = message.getRecipient().trim();
        String sender = message.getSender() != null ? message.getSender().trim() : "";

        if (recipient.equalsIgnoreCase(sender)) {
            throw new ChatException("Cannot send a private message to yourself.");
        }

        message.setSender(sanitizeHtml(sender));
        message.setRecipient(sanitizeHtml(recipient));
        message.setMessage(sanitizeHtml(message.getMessage().trim()));
        message.setType(message.getType() != null && message.getType() == ChatMessage.MessageType.FILE
                ? ChatMessage.MessageType.FILE : ChatMessage.MessageType.PRIVATE_CHAT);

        // Store in 1-on-1 DM history
        String dmKey = getDmConversationKey(sender, recipient);
        CopyOnWriteArrayList<ChatMessage> history = dmHistories.computeIfAbsent(dmKey, k -> new CopyOnWriteArrayList<>());
        history.add(message);
        if (history.size() > MAX_HISTORY_SIZE) {
            history.remove(0);
        }

        logger.info("[DM {} ➔ {}]: {}", sender, recipient, message.getMessage());
        return message;
    }

    // Legacy method for test compatibility
    public ChatMessage processAndAddMessage(ChatMessage message) {
        if (message.getRecipient() != null && !message.getRecipient().isBlank()) {
            return processPrivateMessage(message);
        }
        return processChannelMessage(message);
    }

    private void validateMessageContent(ChatMessage message) {
        if (message == null || message.getMessage() == null) {
            throw new ChatException("Message content cannot be empty.");
        }

        String rawContent = message.getMessage().trim();
        if (rawContent.isEmpty()) {
            throw new ChatException("Message content cannot be empty.");
        }

        if (rawContent.length() > MAX_MESSAGE_LENGTH) {
            throw new ChatException("Message exceeds maximum length of " + MAX_MESSAGE_LENGTH + " characters.");
        }
    }

    // ==================== History Retrieval ====================

    public List<ChatMessage> getChannelHistory(String channelId) {
        String key = (channelId != null && !channelId.isBlank()) ? channelId.toLowerCase().trim() : "general";
        CopyOnWriteArrayList<ChatMessage> list = channelHistories.get(key);
        return list != null ? Collections.unmodifiableList(list) : Collections.emptyList();
    }

    public List<ChatMessage> getDmHistory(String userA, String userB) {
        if (userA == null || userB == null) return Collections.emptyList();
        String key = getDmConversationKey(userA, userB);
        CopyOnWriteArrayList<ChatMessage> list = dmHistories.get(key);
        return list != null ? Collections.unmodifiableList(list) : Collections.emptyList();
    }

    public List<ChatMessage> getRecentHistory() {
        return getChannelHistory("general");
    }

    public String getDmConversationKey(String userA, String userB) {
        String a = userA.trim().toLowerCase();
        String b = userB.trim().toLowerCase();
        if (a.compareTo(b) < 0) {
            return "dm:" + a + ":" + b;
        } else {
            return "dm:" + b + ":" + a;
        }
    }

    // ==================== Reactions ====================

    public Map<String, List<String>> toggleReaction(String messageId, String channelId, String dmRecipient, String username, String emoji) {
        if (messageId == null || emoji == null || username == null) {
            return Collections.emptyMap();
        }

        ChatMessage targetMsg = null;

        // 1. Search in channel history
        if (channelId != null && !channelId.isBlank()) {
            CopyOnWriteArrayList<ChatMessage> list = channelHistories.get(channelId.toLowerCase().trim());
            if (list != null) {
                targetMsg = list.stream().filter(m -> messageId.equals(m.getId())).findFirst().orElse(null);
            }
        }

        // 2. Search in DM history if not found
        if (targetMsg == null && dmRecipient != null && !dmRecipient.isBlank()) {
            String dmKey = getDmConversationKey(username, dmRecipient);
            CopyOnWriteArrayList<ChatMessage> list = dmHistories.get(dmKey);
            if (list != null) {
                targetMsg = list.stream().filter(m -> messageId.equals(m.getId())).findFirst().orElse(null);
            }
        }

        // 3. Fallback search across all channels
        if (targetMsg == null) {
            for (CopyOnWriteArrayList<ChatMessage> list : channelHistories.values()) {
                targetMsg = list.stream().filter(m -> messageId.equals(m.getId())).findFirst().orElse(null);
                if (targetMsg != null) break;
            }
        }

        if (targetMsg == null) {
            return Collections.emptyMap();
        }

        synchronized (targetMsg) {
            Map<String, List<String>> reactions = targetMsg.getReactions();
            if (reactions == null) {
                reactions = new ConcurrentHashMap<>();
                targetMsg.setReactions(reactions);
            }

            List<String> userList = reactions.computeIfAbsent(emoji, k -> new CopyOnWriteArrayList<>());
            String sanitizedUser = sanitizeHtml(username.trim());

            if (userList.contains(sanitizedUser)) {
                userList.remove(sanitizedUser);
                if (userList.isEmpty()) {
                    reactions.remove(emoji);
                }
            } else {
                userList.add(sanitizedUser);
            }

            return reactions;
        }
    }

    // ==================== Utilities ====================

    public String sanitizeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }
}
