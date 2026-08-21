package com.campuschat.service;

import com.campuschat.exception.ChatException;
import com.campuschat.model.ChatMessage;
import com.campuschat.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Pattern;

@Service
public class ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);
    private static final int MAX_HISTORY_SIZE = 100;
    private static final int MAX_MESSAGE_LENGTH = 500;
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9 _-]+$");

    // Thread-safe state for active session users and chat history
    private final Map<String, User> activeUsersBySession = new ConcurrentHashMap<>();
    private final CopyOnWriteArrayList<ChatMessage> messageHistory = new CopyOnWriteArrayList<>();

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

    public ChatMessage processAndAddMessage(ChatMessage message) {
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

        // Sanitize content against XSS
        message.setMessage(sanitizeHtml(rawContent));
        if (message.getSender() != null) {
            message.setSender(sanitizeHtml(message.getSender().trim()));
        }

        // Store in history if it's a CHAT or FILE message
        if (message.getType() == ChatMessage.MessageType.CHAT || message.getType() == ChatMessage.MessageType.FILE) {
            messageHistory.add(message);
            if (messageHistory.size() > MAX_HISTORY_SIZE) {
                messageHistory.remove(0);
            }
            logger.info("Message [{}] received from {}: {}", message.getType(), message.getSender(), message.getMessage());
        }

        return message;
    }

    public List<ChatMessage> getRecentHistory() {
        return Collections.unmodifiableList(messageHistory);
    }

    public int getActiveUsersCount() {
        return activeUsersBySession.size();
    }

    public String sanitizeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#x27;");
    }
}
