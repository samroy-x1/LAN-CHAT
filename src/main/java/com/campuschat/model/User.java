package com.campuschat.model;

import java.time.LocalDateTime;

public class User {

    private String username;
    private String joinedAt;
    private String sessionId;

    public User() {
    }

    public User(String username, String sessionId) {
        this.username = username;
        this.sessionId = sessionId;
        this.joinedAt = LocalDateTime.now().toString();
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(String joinedAt) {
        this.joinedAt = joinedAt;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}
