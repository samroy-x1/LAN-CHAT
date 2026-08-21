package com.campuschat.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class FileMetadata {

    private String fileId;
    private String fileName;
    private long fileSize;
    private String formattedSize;
    private String fileType; // image, video, audio, document, archive, code, other
    private String contentType; // MIME type e.g. image/png
    private String downloadUrl;
    private String previewUrl;
    private String uploadedBy;
    private String timestamp;

    public FileMetadata() {
        this.timestamp = LocalDateTime.now().toString();
    }

    public FileMetadata(String fileId, String fileName, long fileSize, String formattedSize, 
                        String fileType, String contentType, String downloadUrl, String previewUrl, 
                        String uploadedBy) {
        this.fileId = fileId;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.formattedSize = formattedSize;
        this.fileType = fileType;
        this.contentType = contentType;
        this.downloadUrl = downloadUrl;
        this.previewUrl = previewUrl;
        this.uploadedBy = uploadedBy;
        this.timestamp = LocalDateTime.now().toString();
    }

    public String getFileId() {
        return fileId;
    }

    public void setFileId(String fileId) {
        this.fileId = fileId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public String getFormattedSize() {
        return formattedSize;
    }

    public void setFormattedSize(String formattedSize) {
        this.formattedSize = formattedSize;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }

    public String getPreviewUrl() {
        return previewUrl;
    }

    public void setPreviewUrl(String previewUrl) {
        this.previewUrl = previewUrl;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(String uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
