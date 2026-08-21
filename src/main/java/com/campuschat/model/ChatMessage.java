package com.campuschat.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatMessage {

    public enum MessageType {
        CHAT,
        JOIN,
        LEAVE,
        TYPING,
        SYSTEM,
        USERS_UPDATE,
        HISTORY,
        FILE,
        ERROR
    }

    private String id;
    private String sender;
    private String message;
    private String timestamp;
    private MessageType type;
    private List<User> onlineUsers;
    private List<ChatMessage> history;
    private Boolean isTyping;
    private FileMetadata fileMetadata;

    public ChatMessage() {
        this.id = UUID.randomUUID().toString();
        this.timestamp = LocalDateTime.now().toString();
    }

    public ChatMessage(String sender, String message, MessageType type) {
        this.id = UUID.randomUUID().toString();
        this.sender = sender;
        this.message = message;
        this.type = type;
        this.timestamp = LocalDateTime.now().toString();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public List<User> getOnlineUsers() {
        return onlineUsers;
    }

    public void setOnlineUsers(List<User> onlineUsers) {
        this.onlineUsers = onlineUsers;
    }

    public List<ChatMessage> getHistory() {
        return history;
    }

    public void setHistory(List<ChatMessage> history) {
        this.history = history;
    }

    public Boolean getIsTyping() {
        return isTyping;
    }

    public void setIsTyping(Boolean typing) {
        isTyping = typing;
    }

    public FileMetadata getFileMetadata() {
        return fileMetadata;
    }

    public void setFileMetadata(FileMetadata fileMetadata) {
        this.fileMetadata = fileMetadata;
    }
}
