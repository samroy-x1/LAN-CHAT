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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

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
                                                   @RequestParam("sender") String sender) {
        String sanitizedSender = chatService.sanitizeHtml(sender != null ? sender.trim() : "Anonymous");
        FileMetadata metadata = fileStorageService.storeFile(file, sanitizedSender);

        // Create ChatMessage of type FILE and broadcast to websocket channel
        ChatMessage fileMessage = new ChatMessage();
        fileMessage.setType(ChatMessage.MessageType.FILE);
        fileMessage.setSender(sanitizedSender);
        fileMessage.setMessage("Shared a file: " + metadata.getFileName());
        fileMessage.setFileMetadata(metadata);

        // Process & store in history
        chatService.processAndAddMessage(fileMessage);

        // Broadcast to all WebSocket clients on public topic
        messagingTemplate.convertAndSend("/topic/public", fileMessage);

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
}
