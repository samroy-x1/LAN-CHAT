package com.campuschat.model;

public class ServerInfo {

    private String ipAddress;
    private int port;
    private String serverUrl;
    private String status;
    private int activeUsersCount;

    public ServerInfo() {
    }

    public ServerInfo(String ipAddress, int port, String serverUrl, String status, int activeUsersCount) {
        this.ipAddress = ipAddress;
        this.port = port;
        this.serverUrl = serverUrl;
        this.status = status;
        this.activeUsersCount = activeUsersCount;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public String getServerUrl() {
        return serverUrl;
    }

    public void setServerUrl(String serverUrl) {
        this.serverUrl = serverUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getActiveUsersCount() {
        return activeUsersCount;
    }

    public void setActiveUsersCount(int activeUsersCount) {
        this.activeUsersCount = activeUsersCount;
    }
}
