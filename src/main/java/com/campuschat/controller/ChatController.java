package com.campuschat.controller;

import com.campuschat.exception.ChatException;
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

            // Save username in WebSocket session attributes
            if (headerAccessor.getSessionAttributes() != null) {
                headerAccessor.getSessionAttributes().put("username", newUser.getUsername());
            }

            // 1. Send join notification message to all users
            ChatMessage joinMessage = new ChatMessage();
            joinMessage.setType(ChatMessage.MessageType.JOIN);
            joinMessage.setSender(newUser.getUsername());
            joinMessage.setMessage(newUser.getUsername() + " joined the chat");
            messagingTemplate.convertAndSend("/topic/public", joinMessage);

            // 2. Broadcast updated list of online users
            broadcastOnlineUsers();

            // 3. Send recent history ONLY to the joining user via private user destination
            List<ChatMessage> history = chatService.getRecentHistory();
            ChatMessage historyMsg = new ChatMessage();
            historyMsg.setType(ChatMessage.MessageType.HISTORY);
            historyMsg.setHistory(history);
            historyMsg.setOnlineUsers(chatService.getOnlineUsers());
            messagingTemplate.convertAndSendToUser(sessionId, "/queue/history", historyMsg, createSessionHeaders(sessionId));

        } catch (ChatException e) {
            logger.warn("User join failed for '{}': {}", requestedUsername, e.getMessage());
            ChatMessage errorMsg = new ChatMessage();
            errorMsg.setType(ChatMessage.MessageType.ERROR);
            errorMsg.setMessage(e.getMessage());
            // Send error specifically to the failing user session
            messagingTemplate.convertAndSendToUser(sessionId, "/queue/errors", errorMsg, createSessionHeaders(sessionId));
        }
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        try {
            if (headerAccessor.getSessionAttributes() != null) {
                String sessionUsername = (String) headerAccessor.getSessionAttributes().get("username");
                if (sessionUsername != null && !sessionUsername.isBlank()) {
                    chatMessage.setSender(sessionUsername);
                }
            }
            return chatService.processAndAddMessage(chatMessage);
        } catch (ChatException e) {
            logger.warn("Message sending failed: {}", e.getMessage());
            ChatMessage errorMsg = new ChatMessage();
            errorMsg.setType(ChatMessage.MessageType.ERROR);
            errorMsg.setSender(chatMessage.getSender());
            errorMsg.setMessage(e.getMessage());
            return errorMsg;
        }
    }

    @MessageMapping("/chat.typing")
    @SendTo("/topic/public")
    public ChatMessage sendTyping(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        if (headerAccessor.getSessionAttributes() != null) {
            String sessionUsername = (String) headerAccessor.getSessionAttributes().get("username");
            if (sessionUsername != null && !sessionUsername.isBlank()) {
                chatMessage.setSender(sessionUsername);
            }
        }
        chatMessage.setType(ChatMessage.MessageType.TYPING);
        return chatMessage;
    }

    public void broadcastOnlineUsers() {
        ChatMessage usersUpdateMsg = new ChatMessage();
        usersUpdateMsg.setType(ChatMessage.MessageType.USERS_UPDATE);
        usersUpdateMsg.setOnlineUsers(chatService.getOnlineUsers());
        messagingTemplate.convertAndSend("/topic/public", usersUpdateMsg);
    }

    private MessageHeaders createSessionHeaders(String sessionId) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        headerAccessor.setSessionId(sessionId);
        headerAccessor.setLeaveMutable(true);
        return headerAccessor.getMessageHeaders();
    }
}
