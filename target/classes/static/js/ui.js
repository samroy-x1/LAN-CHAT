/* ==========================================================================
   CampusChat - UI Helper & Render Logic (ui.js)
   ========================================================================== */

const UI = {
    // Sound & Theme preferences
    soundEnabled: false,

    // Audio Synthesizer using Web Audio API (Zero external mp3 files required)
    audioCtx: null,

    init() {
        this.initTheme();
        this.initSound();
        this.initLightbox();
    },

    initLightbox() {
        const modal = document.getElementById('lightbox-modal');
        const closeBtn = document.getElementById('close-lightbox-btn');
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        }
    },

    openLightbox(imageUrl, fileName, downloadUrl) {
        const modal = document.getElementById('lightbox-modal');
        const img = document.getElementById('lightbox-img');
        const title = document.getElementById('lightbox-filename');
        const downloadBtn = document.getElementById('lightbox-download-link');

        if (modal && img) {
            img.src = imageUrl;
            if (title) title.textContent = fileName;
            if (downloadBtn) {
                downloadBtn.href = downloadUrl;
                downloadBtn.download = fileName;
            }
            modal.classList.remove('hidden');
        }
    },

    // Theme Management
    initTheme() {
        const savedTheme = localStorage.getItem('campuschat_theme') || 'dark';
        this.setTheme(savedTheme);

        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                this.setTheme(newTheme);
            });
        });
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('campuschat_theme', theme);
        const icons = document.querySelectorAll('.theme-icon');
        const text = document.querySelector('.theme-text');
        icons.forEach(icon => icon.textContent = theme === 'dark' ? '🌙' : '☀️');
        if (text) text.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
    },

    // Sound Management
    initSound() {
        const savedSound = localStorage.getItem('campuschat_sound');
        this.soundEnabled = savedSound === 'true'; // Default disabled until user interacts
        this.updateSoundBtnUI();

        const soundBtn = document.getElementById('sound-toggle-btn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                this.soundEnabled = !this.soundEnabled;
                localStorage.setItem('campuschat_sound', this.soundEnabled);
                this.updateSoundBtnUI();
                if (this.soundEnabled) {
                    this.playNotificationSound(); // Play test chime
                }
            });
        }
    },

    updateSoundBtnUI() {
        const soundBtn = document.getElementById('sound-toggle-btn');
        if (soundBtn) {
            soundBtn.textContent = this.soundEnabled ? '🔊' : '🔇';
            soundBtn.title = this.soundEnabled ? 'Mute Sound' : 'Enable Sound';
        }
    },

    playNotificationSound() {
        if (!this.soundEnabled) return;
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5 note
            osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.15); // A5 note

            gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.3);
        } catch (e) {
            console.warn('Audio playback error:', e);
        }
    },

    // Toast Notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    // Screen Navigation
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            s.classList.add('hidden');
        });
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }
    },

    // Format Timestamp
    formatTime(rawTimestamp) {
        if (!rawTimestamp) return '';
        try {
            const date = new Date(rawTimestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    },

    // HTML Sanitization for Safe Rendering
    escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, "&amp;")
                   .replace(/</g, "&lt;")
                   .replace(/>/g, "&gt;")
                   .replace(/"/g, "&quot;")
                   .replace(/'/g, "&#039;");
    },

    renderFileCard(fileMeta) {
        if (!fileMeta) return '';
        const cat = fileMeta.fileCategory || 'other';
        const name = this.escapeHtml(fileMeta.fileName || 'file');
        const size = this.escapeHtml(fileMeta.formattedSize || '');
        const previewUrl = this.escapeHtml(fileMeta.previewUrl || '#');
        const downloadUrl = this.escapeHtml(fileMeta.downloadUrl || '#');

        if (cat === 'image') {
            return `
                <div class="file-message-card">
                    <div class="file-image-container" onclick="UI.openLightbox('${previewUrl}', '${name}', '${downloadUrl}')">
                        <img src="${previewUrl}" alt="${name}" class="file-image-preview" loading="lazy">
                        <div class="file-image-overlay">
                            <span>🔍 Click to expand</span>
                            <span>${size}</span>
                        </div>
                    </div>
                    <div class="file-card-box">
                        <span class="file-icon-badge">🖼️</span>
                        <div class="file-card-details">
                            <span class="file-name-text">${name}</span>
                            <span class="file-size-text">${size}</span>
                        </div>
                        <a href="${downloadUrl}" download="${name}" class="btn btn-sm btn-primary file-download-btn">⬇️</a>
                    </div>
                </div>
            `;
        }

        if (cat === 'video') {
            return `
                <div class="file-message-card">
                    <video src="${previewUrl}" controls class="file-media-player"></video>
                    <div class="file-card-box">
                        <span class="file-icon-badge">🎬</span>
                        <div class="file-card-details">
                            <span class="file-name-text">${name}</span>
                            <span class="file-size-text">${size}</span>
                        </div>
                        <a href="${downloadUrl}" download="${name}" class="btn btn-sm btn-primary file-download-btn">⬇️ Download</a>
                    </div>
                </div>
            `;
        }

        if (cat === 'audio') {
            return `
                <div class="file-message-card">
                    <audio src="${previewUrl}" controls class="file-media-player"></audio>
                    <div class="file-card-box">
                        <span class="file-icon-badge">🎵</span>
                        <div class="file-card-details">
                            <span class="file-name-text">${name}</span>
                            <span class="file-size-text">${size}</span>
                        </div>
                        <a href="${downloadUrl}" download="${name}" class="btn btn-sm btn-primary file-download-btn">⬇️ Download</a>
                    </div>
                </div>
            `;
        }

        let icon = '📁';
        if (cat === 'pdf') icon = '📄';
        else if (cat === 'archive') icon = '📦';
        else if (cat === 'code') icon = '💻';
        else if (cat === 'document') icon = '📝';

        return `
            <div class="file-message-card">
                <div class="file-card-box">
                    <span class="file-icon-badge">${icon}</span>
                    <div class="file-card-details">
                        <span class="file-name-text">${name}</span>
                        <span class="file-size-text">${size}</span>
                    </div>
                    <a href="${downloadUrl}" download="${name}" class="btn btn-sm btn-primary file-download-btn">⬇️ Download</a>
                </div>
            </div>
        `;
    },

    // Render Chat Message
    appendChatMessage(messageObj, currentUsername) {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;

        const isSelf = messageObj.sender && messageObj.sender.toLowerCase() === (currentUsername || '').toLowerCase();
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${isSelf ? 'self' : 'other'}`;

        const safeSender = this.escapeHtml(messageObj.sender || 'Anonymous');
        const safeText = this.escapeHtml(messageObj.message || '');
        const timeStr = this.formatTime(messageObj.timestamp);

        let bubbleContent = `<div class="message-bubble">${safeText}</div>`;
        if (messageObj.type === 'FILE' || messageObj.fileMetadata) {
            const fileCardHtml = this.renderFileCard(messageObj.fileMetadata);
            bubbleContent = `
                <div class="message-bubble">
                    ${safeText ? `<div style="margin-bottom: 8px;">${safeText}</div>` : ''}
                    ${fileCardHtml}
                </div>
            `;
        }

        wrapper.innerHTML = `
            ${!isSelf ? `<div class="message-header">${safeSender}</div>` : ''}
            ${bubbleContent}
            <div class="message-time">${timeStr}</div>
        `;

        chatContainer.appendChild(wrapper);
        this.scrollToBottom();

        if (!isSelf) {
            this.playNotificationSound();
        }
    },

    // Render System Message
    appendSystemMessage(text) {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;

        const sysDiv = document.createElement('div');
        sysDiv.className = 'system-message';
        sysDiv.textContent = text;

        chatContainer.appendChild(sysDiv);
        this.scrollToBottom();
    },

    // Render Online Users List
    updateOnlineUsersList(usersList, currentUsername) {
        const listContainer = document.getElementById('users-list');
        const countBadge = document.getElementById('online-count');
        const sidebarCount = document.getElementById('sidebar-users-count');

        if (!listContainer) return;
        listContainer.innerHTML = '';

        const count = usersList ? usersList.length : 0;
        if (countBadge) countBadge.textContent = count;
        if (sidebarCount) sidebarCount.textContent = count;

        if (usersList) {
            usersList.forEach(user => {
                const li = document.createElement('li');
                const isSelf = user.username.toLowerCase() === currentUsername.toLowerCase();
                li.className = `user-item ${isSelf ? 'self' : ''}`;
                
                const safeName = this.escapeHtml(user.username);
                li.innerHTML = `
                    <span class="user-dot"></span>
                    <span class="user-name">${safeName}</span>
                    ${isSelf ? '<span class="self-tag">You</span>' : ''}
                `;
                listContainer.appendChild(li);
            });
        }
    },

    // Connection Status Render
    updateConnectionStatus(statusStr) {
        const indicator = document.getElementById('connection-status');
        if (!indicator) return;

        const dot = indicator.querySelector('.status-dot');
        const text = indicator.querySelector('.status-text');

        if (statusStr === 'CONNECTED') {
            dot.className = 'status-dot green';
            text.textContent = 'Connected';
        } else if (statusStr === 'CONNECTING') {
            dot.className = 'status-dot yellow';
            text.textContent = 'Connecting...';
        } else {
            dot.className = 'status-dot red';
            text.textContent = 'Disconnected';
        }
    },

    // Scroll to Chat Bottom
    scrollToBottom() {
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    },

    // Copy to Clipboard Utility
    copyToClipboard(text, buttonElem) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = buttonElem.innerHTML;
            buttonElem.innerHTML = '✅ COPIED!';
            buttonElem.style.background = 'var(--success)';
            buttonElem.style.color = '#ffffff';
            setTimeout(() => {
                buttonElem.innerHTML = originalText;
                buttonElem.style.background = '';
                buttonElem.style.color = '';
            }, 2000);
        }).catch(err => {
            this.showToast('Could not copy address', 'error');
        });
    }
};

document.addEventListener('DOMContentLoaded', () => UI.init());
