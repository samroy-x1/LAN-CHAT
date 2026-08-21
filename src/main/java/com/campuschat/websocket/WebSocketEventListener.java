package com.campuschat.websocket;

import com.campuschat.model.ChatMessage;
import com.campuschat.model.User;
import com.campuschat.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventListener(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        User disconnectedUser = chatService.removeUserBySession(sessionId);

        if (disconnectedUser != null) {
            logger.info("User {} left the session: {}", disconnectedUser.getUsername(), sessionId);

            // Broadcast LEAVE message
            ChatMessage leaveMessage = new ChatMessage();
            leaveMessage.setType(ChatMessage.MessageType.LEAVE);
            leaveMessage.setSender(disconnectedUser.getUsername());
            leaveMessage.setMessage(disconnectedUser.getUsername() + " left the chat");
            messagingTemplate.convertAndSend("/topic/public", leaveMessage);

            // Broadcast updated users list
            ChatMessage usersUpdateMsg = new ChatMessage();
            usersUpdateMsg.setType(ChatMessage.MessageType.USERS_UPDATE);
            usersUpdateMsg.setOnlineUsers(chatService.getOnlineUsers());
            messagingTemplate.convertAndSend("/topic/public", usersUpdateMsg);
        }
    }
}
