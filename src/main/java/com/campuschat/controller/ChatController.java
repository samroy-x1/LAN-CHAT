package com.campuschat.controller;

import com.campuschat.exception.ChatException;
import com.campuschat.model.Channel;
import com.campuschat.model.ChatMessage;
import com.campuschat.model.User;
import com.campuschat.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Controller
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        String requestedUsername = chatMessage.getSender();

        try {
            User newUser = chatService.registerUser(requestedUsername, sessionId);

            if (headerAccessor.getSessionAttributes() != null) {
                headerAccessor.getSessionAttributes().put("username", newUser.getUsername());
            }

            // 1. Send public join notification
            ChatMessage joinMessage = new ChatMessage();
            joinMessage.setType(ChatMessage.MessageType.JOIN);
            joinMessage.setSender(newUser.getUsername());
            joinMessage.setMessage(newUser.getUsername() + " joined the chat");
            messagingTemplate.convertAndSend("/topic/public", joinMessage);

            // 2. Broadcast updated list of online users & channels to everyone
            broadcastOnlineUsersAndChannels();

            // 3. Send initial history for #general and channel list to the joined user
            ChatMessage initMsg = new ChatMessage();
            initMsg.setType(ChatMessage.MessageType.HISTORY);
            initMsg.setChannelId("general");
            initMsg.setHistory(chatService.getChannelHistory("general"));
            initMsg.setOnlineUsers(chatService.getOnlineUsers());
            initMsg.setChannels(chatService.getAllChannels());
            sendToSession(sessionId, "/queue/history", initMsg);

        } catch (ChatException e) {
            logger.warn("User join failed for '{}': {}", requestedUsername, e.getMessage());
            ChatMessage errorMsg = new ChatMessage();
            errorMsg.setType(ChatMessage.MessageType.ERROR);
            errorMsg.setMessage(e.getMessage());
            sendToSession(sessionId, "/queue/errors", errorMsg);
        }
    }

    // ==================== Channel Messages ====================

    @MessageMapping("/chat.sendChannelMessage")
    public void sendChannelMessage(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        try {
            resolveSender(chatMessage, headerAccessor);
            ChatMessage processed = chatService.processChannelMessage(chatMessage);

            String channelId = processed.getChannelId();
            // Send to channel topic
            messagingTemplate.convertAndSend("/topic/channel/" + channelId, processed);

            // Also send notification message to /topic/public for unread tracking across channels
            if (!"general".equalsIgnoreCase(channelId)) {
                messagingTemplate.convertAndSend("/topic/public", processed);
            }
        } catch (ChatException e) {
            logger.warn("Channel message sending failed: {}", e.getMessage());
            sendErrorMessage(sessionId, e.getMessage());
        }
    }

    // Legacy fallback mapping
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        if (chatMessage.getRecipient() != null && !chatMessage.getRecipient().isBlank()) {
            sendPrivateMessage(chatMessage, headerAccessor);
        } else {
            sendChannelMessage(chatMessage, headerAccessor);
        }
    }

    // ==================== 1-on-1 Direct Messages ====================

    @MessageMapping("/chat.sendPrivateMessage")
    public void sendPrivateMessage(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        try {
            resolveSender(chatMessage, headerAccessor);
            ChatMessage processed = chatService.processPrivateMessage(chatMessage);

            String sender = processed.getSender();
            String recipient = processed.getRecipient();

            // Deliver to recipient's active sessions
            Set<String> recipientSessions = chatService.getSessionIdsForUser(recipient);
            for (String rSession : recipientSessions) {
                sendToSession(rSession, "/queue/messages", processed);
            }

            // Deliver copy to sender's active sessions
            Set<String> senderSessions = chatService.getSessionIdsForUser(sender);
            for (String sSession : senderSessions) {
                sendToSession(sSession, "/queue/messages", processed);
            }

        } catch (ChatException e) {
            logger.warn("Private message sending failed: {}", e.getMessage());
            sendErrorMessage(sessionId, e.getMessage());
        }
    }

    // ==================== Channel Creation ====================

    @MessageMapping("/chat.createChannel")
    public void createChannel(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        try {
            resolveSender(chatMessage, headerAccessor);
            Channel newChannel = chatService.createChannel(
                    chatMessage.getMessage(), // channel name passed in message field
                    chatMessage.getChannelId(), // description passed in channelId field or extra
                    chatMessage.getSender()
            );

            // Broadcast new channel to everyone
            ChatMessage channelCreatedMsg = new ChatMessage();
            channelCreatedMsg.setType(ChatMessage.MessageType.CREATE_CHANNEL);
            channelCreatedMsg.setSender(chatMessage.getSender());
            channelCreatedMsg.setMessage("Created channel #" + newChannel.getName());
            channelCreatedMsg.setChannels(chatService.getAllChannels());
            messagingTemplate.convertAndSend("/topic/public", channelCreatedMsg);

        } catch (ChatException e) {
            logger.warn("Channel creation failed: {}", e.getMessage());
            sendErrorMessage(sessionId, e.getMessage());
        }
    }

    // ==================== History Fetching ====================

    @MessageMapping("/chat.getHistory")
    public void getHistory(@Payload ChatMessage request, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        resolveSender(request, headerAccessor);
        String sender = request.getSender();

        ChatMessage historyResponse = new ChatMessage();
        historyResponse.setType(ChatMessage.MessageType.HISTORY);

        if (request.getRecipient() != null && !request.getRecipient().isBlank()) {
            // Fetch 1-on-1 DM history
            String recipient = request.getRecipient().trim();
            historyResponse.setRecipient(recipient);
            historyResponse.setHistory(chatService.getDmHistory(sender, recipient));
        } else {
            // Fetch Channel history
            String channelId = (request.getChannelId() != null && !request.getChannelId().isBlank())
                    ? request.getChannelId().trim().toLowerCase() : "general";
            historyResponse.setChannelId(channelId);
            historyResponse.setHistory(chatService.getChannelHistory(channelId));
        }

        sendToSession(sessionId, "/queue/history", historyResponse);
    }

    // ==================== Emoji Reactions ====================

    @MessageMapping("/chat.reactMessage")
    public void reactMessage(@Payload ChatMessage reactMessage, SimpMessageHeaderAccessor headerAccessor) {
        resolveSender(reactMessage, headerAccessor);
        String username = reactMessage.getSender();
        String messageId = reactMessage.getTargetMessageId();
        String emoji = reactMessage.getReactionEmoji();
        String channelId = reactMessage.getChannelId();
        String recipient = reactMessage.getRecipient();

        Map<String, List<String>> updatedReactions = chatService.toggleReaction(
                messageId, channelId, recipient, username, emoji
        );

        ChatMessage reactionUpdate = new ChatMessage();
        reactionUpdate.setType(ChatMessage.MessageType.REACTION);
        reactionUpdate.setSender(username);
        reactionUpdate.setTargetMessageId(messageId);
        reactionUpdate.setReactionEmoji(emoji);
        reactionUpdate.setReactions(updatedReactions);
        reactionUpdate.setChannelId(channelId);
        reactionUpdate.setRecipient(recipient);

        if (recipient != null && !recipient.isBlank()) {
            // DM reaction: notify both users
            Set<String> rSessions = chatService.getSessionIdsForUser(recipient);
            for (String s : rSessions) {
                sendToSession(s, "/queue/messages", reactionUpdate);
            }
            Set<String> sSessions = chatService.getSessionIdsForUser(username);
            for (String s : sSessions) {
                sendToSession(s, "/queue/messages", reactionUpdate);
            }
        } else {
            // Channel reaction: broadcast to channel
            String ch = (channelId != null && !channelId.isBlank()) ? channelId : "general";
            messagingTemplate.convertAndSend("/topic/channel/" + ch, reactionUpdate);
        }
    }

    // ==================== Typing Indicator ====================

    @MessageMapping("/chat.typing")
    public void sendTyping(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        resolveSender(chatMessage, headerAccessor);
        chatMessage.setType(ChatMessage.MessageType.TYPING);

        if (chatMessage.getRecipient() != null && !chatMessage.getRecipient().isBlank()) {
            // DM typing: send only to target recipient
            Set<String> sessions = chatService.getSessionIdsForUser(chatMessage.getRecipient());
            for (String sId : sessions) {
                sendToSession(sId, "/queue/messages", chatMessage);
            }
        } else {
            // Channel typing: broadcast to channel
            String ch = chatMessage.getChannelId() != null ? chatMessage.getChannelId() : "general";
            messagingTemplate.convertAndSend("/topic/channel/" + ch, chatMessage);
        }
    }

    // ==================== Helpers ====================

    public void broadcastOnlineUsersAndChannels() {
        ChatMessage updateMsg = new ChatMessage();
        updateMsg.setType(ChatMessage.MessageType.USERS_UPDATE);
        updateMsg.setOnlineUsers(chatService.getOnlineUsers());
        updateMsg.setChannels(chatService.getAllChannels());
        messagingTemplate.convertAndSend("/topic/public", updateMsg);
    }

    private void resolveSender(ChatMessage msg, SimpMessageHeaderAccessor headerAccessor) {
        if (headerAccessor.getSessionAttributes() != null) {
            String sessionUsername = (String) headerAccessor.getSessionAttributes().get("username");
            if (sessionUsername != null && !sessionUsername.isBlank()) {
                msg.setSender(sessionUsername);
            }
        }
    }

    private void sendToSession(String sessionId, String destination, Object payload) {
        if (sessionId == null) return;
        messagingTemplate.convertAndSendToUser(sessionId, destination, payload, createSessionHeaders(sessionId));
    }

    private void sendErrorMessage(String sessionId, String error) {
        ChatMessage errorMsg = new ChatMessage();
        errorMsg.setType(ChatMessage.MessageType.ERROR);
        errorMsg.setMessage(error);
        sendToSession(sessionId, "/queue/errors", errorMsg);
    }

    private MessageHeaders createSessionHeaders(String sessionId) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        headerAccessor.setSessionId(sessionId);
        headerAccessor.setLeaveMutable(true);
        return headerAccessor.getMessageHeaders();
    }
}
