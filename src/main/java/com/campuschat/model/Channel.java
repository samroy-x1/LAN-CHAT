package com.campuschat.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Channel {

    private String id;
    private String name;
    private String description;
    private String createdBy;
    private String createdAt;
    private boolean isSystem;

    public Channel() {
        this.createdAt = LocalDateTime.now().toString();
    }

    public Channel(String id, String name, String description, String createdBy, boolean isSystem) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.createdBy = createdBy;
        this.isSystem = isSystem;
        this.createdAt = LocalDateTime.now().toString();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isSystem() {
        return isSystem;
    }

    public void setSystem(boolean system) {
        isSystem = system;
    }
}
