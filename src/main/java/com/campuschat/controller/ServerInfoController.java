package com.campuschat.controller;

import com.campuschat.model.ServerInfo;
import com.campuschat.service.ChatService;
import com.campuschat.service.NetworkService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ServerInfoController {

    private final NetworkService networkService;
    private final ChatService chatService;

    public ServerInfoController(NetworkService networkService, ChatService chatService) {
        this.networkService = networkService;
        this.chatService = chatService;
    }

    @GetMapping("/info")
    public ResponseEntity<ServerInfo> getServerInfo() {
        ServerInfo info = new ServerInfo(
                networkService.getLocalIpAddress(),
                networkService.getServerPort(),
                networkService.getServerUrl(),
                "Online",
                chatService.getActiveUsersCount()
        );
        return ResponseEntity.ok(info);
    }

    @GetMapping("/qr")
    public ResponseEntity<byte[]> getQrCode() {
        try {
            String serverUrl = networkService.getServerUrl();
            byte[] qrBytes = networkService.generateQrCodeImage(serverUrl, 250, 250);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            return new ResponseEntity<>(qrBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/validate-username")
    public ResponseEntity<Map<String, Object>> validateUsername(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        String username = request.get("username");

        try {
            String sanitized = chatService.validateAndSanitizeUsername(username);
            response.put("valid", true);
            response.put("sanitizedUsername", sanitized);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("valid", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
