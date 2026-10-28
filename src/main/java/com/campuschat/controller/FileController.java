package com.campuschat.controller;

import com.campuschat.model.ChatMessage;
import com.campuschat.model.FileMetadata;
import com.campuschat.service.ChatService;
import com.campuschat.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Set;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    private static final Logger logger = LoggerFactory.getLogger(FileController.class);

    private final FileStorageService fileStorageService;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public FileController(FileStorageService fileStorageService, ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.fileStorageService = fileStorageService;
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/upload")
    public ResponseEntity<FileMetadata> uploadFile(@RequestParam("file") MultipartFile file,
                                                   @RequestParam("sender") String sender,
                                                   @RequestParam(value = "channelId", required = false) String channelId,
                                                   @RequestParam(value = "recipient", required = false) String recipient) {
        String sanitizedSender = chatService.sanitizeHtml(sender != null ? sender.trim() : "Anonymous");
        FileMetadata metadata = fileStorageService.storeFile(file, sanitizedSender);

        ChatMessage fileMessage = new ChatMessage();
        fileMessage.setType(ChatMessage.MessageType.FILE);
        fileMessage.setSender(sanitizedSender);
        fileMessage.setMessage("Shared a file: " + metadata.getFileName());
        fileMessage.setFileMetadata(metadata);

        if (recipient != null && !recipient.isBlank()) {
            // Private 1-on-1 File Transfer
            fileMessage.setRecipient(recipient.trim());
            chatService.processPrivateMessage(fileMessage);

            Set<String> recipientSessions = chatService.getSessionIdsForUser(recipient.trim());
            for (String sId : recipientSessions) {
                sendToSession(sId, "/queue/messages", fileMessage);
            }
            Set<String> senderSessions = chatService.getSessionIdsForUser(sanitizedSender);
            for (String sId : senderSessions) {
                sendToSession(sId, "/queue/messages", fileMessage);
            }
        } else {
            // Channel File Transfer
            String targetChannel = (channelId != null && !channelId.isBlank()) ? channelId.trim().toLowerCase() : "general";
            fileMessage.setChannelId(targetChannel);
            chatService.processChannelMessage(fileMessage);

            messagingTemplate.convertAndSend("/topic/channel/" + targetChannel, fileMessage);
            if (!"general".equalsIgnoreCase(targetChannel)) {
                messagingTemplate.convertAndSend("/topic/public", fileMessage);
            }
        }

        return ResponseEntity.ok(metadata);
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileId) {
        Resource resource = fileStorageService.loadFileAsResource(fileId);
        String originalFilename = fileStorageService.getOriginalFilenameFromId(fileId);
        String contentType = fileStorageService.getContentTypeForId(fileId);

        ContentDisposition contentDisposition = ContentDisposition.builder("attachment")
                .filename(originalFilename, StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .body(resource);
    }

    @GetMapping("/preview/{fileId}")
    public ResponseEntity<Resource> previewFile(@PathVariable String fileId) {
        Resource resource = fileStorageService.loadFileAsResource(fileId);
        String originalFilename = fileStorageService.getOriginalFilenameFromId(fileId);
        String contentType = fileStorageService.getContentTypeForId(fileId);

        ContentDisposition contentDisposition = ContentDisposition.builder("inline")
                .filename(originalFilename, StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .body(resource);
    }

    private void sendToSession(String sessionId, String destination, Object payload) {
        if (sessionId == null) return;
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        headerAccessor.setSessionId(sessionId);
        headerAccessor.setLeaveMutable(true);
        messagingTemplate.convertAndSendToUser(sessionId, destination, payload, headerAccessor.getMessageHeaders());
    }
}
