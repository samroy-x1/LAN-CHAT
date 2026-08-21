package com.campuschat.service;

import com.campuschat.exception.ChatException;
import com.campuschat.model.FileMetadata;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.text.DecimalFormat;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Stream;

@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${app.upload.dir:./uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
            logger.info("File upload directory initialized at: {}", this.fileStorageLocation);
        } catch (Exception ex) {
            throw new ChatException("Could not create upload directory: " + this.fileStorageLocation, ex);
        }
    }

    public FileMetadata storeFile(MultipartFile file, String uploadedBy) {
        if (file == null || file.isEmpty()) {
            throw new ChatException("Cannot upload empty file.");
        }

        String rawOriginalFilename = file.getOriginalFilename();
        String cleanOriginalFilename = StringUtils.cleanPath(rawOriginalFilename != null ? rawOriginalFilename : "unnamed_file");

        // Prevent path traversal attacks
        if (cleanOriginalFilename.contains("..") || cleanOriginalFilename.contains("/") || cleanOriginalFilename.contains("\\")) {
            cleanOriginalFilename = cleanOriginalFilename.replaceAll("[/\\\\]", "_");
            if (cleanOriginalFilename.contains("..")) {
                cleanOriginalFilename = cleanOriginalFilename.replace("..", "");
            }
        }
        if (cleanOriginalFilename.isBlank()) {
            cleanOriginalFilename = "file_" + System.currentTimeMillis();
        }

        String fileId = UUID.randomUUID().toString();
        String storedFileName = fileId + "_" + cleanOriginalFilename;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(storedFileName).normalize();
            
            // Security check: ensure target is within storage directory
            if (!targetLocation.getParent().equals(this.fileStorageLocation)) {
                throw new ChatException("Invalid file storage target path.");
            }

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            long size = file.getSize();
            String formattedSize = formatFileSize(size);
            String contentType = file.getContentType();
            if (contentType == null || contentType.isBlank()) {
                try {
                    contentType = Files.probeContentType(targetLocation);
                } catch (IOException ignored) {}
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
            }

            String category = determineFileCategory(cleanOriginalFilename, contentType);
            String downloadUrl = "/api/files/download/" + fileId;
            String previewUrl = "/api/files/preview/" + fileId;

            logger.info("File uploaded successfully: {} (ID: {}, Size: {}, Type: {}, User: {})",
                    cleanOriginalFilename, fileId, formattedSize, category, uploadedBy);

            return new FileMetadata(
                    fileId,
                    cleanOriginalFilename,
                    size,
                    formattedSize,
                    category,
                    contentType,
                    downloadUrl,
                    previewUrl,
                    uploadedBy
            );
        } catch (IOException ex) {
            logger.error("Could not store file {}", cleanOriginalFilename, ex);
            throw new ChatException("Could not store file " + cleanOriginalFilename + ". Please try again!", ex);
        }
    }

    public Resource loadFileAsResource(String fileId) {
        Path filePath = resolveFilePath(fileId);
        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ChatException("File not found or unreadable with ID: " + fileId);
            }
        } catch (MalformedURLException ex) {
            throw new ChatException("File path error for ID: " + fileId, ex);
        }
    }

    public Path resolveFilePath(String fileId) {
        if (fileId == null || fileId.isBlank()) {
            throw new ChatException("File ID is required.");
        }

        try (Stream<Path> stream = Files.list(this.fileStorageLocation)) {
            return stream
                    .filter(path -> path.getFileName().toString().startsWith(fileId + "_"))
                    .findFirst()
                    .orElseThrow(() -> new ChatException("File not found with ID: " + fileId));
        } catch (IOException e) {
            throw new ChatException("Error finding file with ID: " + fileId, e);
        }
    }

    public String getOriginalFilenameFromId(String fileId) {
        Path filePath = resolveFilePath(fileId);
        String fileName = filePath.getFileName().toString();
        int prefixIndex = fileName.indexOf('_');
        if (prefixIndex != -1 && prefixIndex < fileName.length() - 1) {
            return fileName.substring(prefixIndex + 1);
        }
        return fileName;
    }

    public String getContentTypeForId(String fileId) {
        Path filePath = resolveFilePath(fileId);
        try {
            String type = Files.probeContentType(filePath);
            return type != null ? type : "application/octet-stream";
        } catch (IOException e) {
            return "application/octet-stream";
        }
    }

    public String formatFileSize(long bytes) {
        if (bytes <= 0) return "0 B";
        final String[] units = new String[]{"B", "KB", "MB", "GB", "TB"};
        int digitGroups = (int) (Math.log10(bytes) / Math.log10(1024));
        if (digitGroups >= units.length) digitGroups = units.length - 1;
        return new DecimalFormat("#,##0.#").format(bytes / Math.pow(1024, digitGroups)) + " " + units[digitGroups];
    }

    public String determineFileCategory(String filename, String contentType) {
        String lowerName = filename != null ? filename.toLowerCase(Locale.ROOT) : "";
        String lowerType = contentType != null ? contentType.toLowerCase(Locale.ROOT) : "";

        if (lowerType.startsWith("image/") || lowerName.matches(".*\\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$")) {
            return "image";
        }
        if (lowerType.startsWith("video/") || lowerName.matches(".*\\.(mp4|webm|mkv|mov|avi|wmv|flv)$")) {
            return "video";
        }
        if (lowerType.startsWith("audio/") || lowerName.matches(".*\\.(mp3|wav|ogg|m4a|flac|aac|wma)$")) {
            return "audio";
        }
        if (lowerName.matches(".*\\.(pdf)$") || lowerType.contains("pdf")) {
            return "pdf";
        }
        if (lowerName.matches(".*\\.(zip|rar|7z|tar|gz|bz2|xz)$") || lowerType.contains("zip") || lowerType.contains("compressed")) {
            return "archive";
        }
        if (lowerName.matches(".*\\.(java|js|ts|py|html|css|json|xml|c|cpp|cs|go|rs|php|rb|sql|sh|yaml|yml|md)$")) {
            return "code";
        }
        if (lowerName.matches(".*\\.(doc|docx|xls|xlsx|ppt|pptx|txt|rtf|csv)$")) {
            return "document";
        }
        return "other";
    }

    public Path getFileStorageLocation() {
        return fileStorageLocation;
    }
}
