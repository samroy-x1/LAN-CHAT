/* ==========================================================================
   CampusChat - Core Application Controller (app.js)
   ========================================================================== */

const App = {
    serverInfo: null,
    currentUsername: '',
    typingTimeout: null,
    remoteTypingTimers: {},

    init() {
        this.fetchServerInfo();
        this.bindEvents();
        this.loadSavedUsername();
    },

    // 1. Fetch Local Network Server Information from Backend REST API
    fetchServerInfo() {
        fetch('/api/info')
            .then(res => res.json())
            .then(data => {
                this.serverInfo = data;
                this.updateServerInfoUI(data);
            })
            .catch(err => {
                console.warn('Could not fetch server info:', err);
                const fallbackUrl = window.location.origin;
                this.serverInfo = { serverUrl: fallbackUrl, ipAddress: window.location.hostname, port: window.location.port || 8080 };
                this.updateServerInfoUI(this.serverInfo);
            });
    },

    updateServerInfoUI(info) {
        const landingIp = document.getElementById('landing-server-ip');
        const headerBadge = document.getElementById('header-server-badge');
        const bannerUrl = document.getElementById('banner-server-url');
        const modalIp = document.getElementById('modal-ip');
        const modalPort = document.getElementById('modal-port');
        const modalUrl = document.getElementById('modal-url');

        if (landingIp) landingIp.textContent = info.serverUrl || info.ipAddress;
        if (headerBadge) headerBadge.textContent = info.serverUrl;
        if (bannerUrl) bannerUrl.textContent = info.serverUrl;
        if (modalIp) modalIp.textContent = info.ipAddress;
        if (modalPort) modalPort.textContent = info.port;
        if (modalUrl) modalUrl.textContent = info.serverUrl;
    },

    loadSavedUsername() {
        const saved = localStorage.getItem('campuschat_last_username');
        if (saved) {
            const input = document.getElementById('username-input');
            if (input) input.value = saved;
        }
    },

    // 2. Event Listeners Setup
    bindEvents() {
        // Join Form Handler
        const joinForm = document.getElementById('join-form');
        if (joinForm) {
            joinForm.addEventListener('submit', (e) => this.handleJoin(e));
        }

        // Message Input & Typing Handler
        const msgInput = document.getElementById('message-input');
        if (msgInput) {
            msgInput.addEventListener('input', () => this.handleInputTyping());
            msgInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        }

        // Send Message Form Submit
        const msgForm = document.getElementById('message-form');
        if (msgForm) {
            msgForm.addEventListener('submit', (e) => this.handleSendMessage(e));
        }

        // Mobile Sidebar Drawer Controls
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const closeSidebarBtn = document.getElementById('close-sidebar-btn');
        const backdrop = document.getElementById('sidebar-backdrop');
        const onlineCountBtn = document.getElementById('online-users-badge');

        const openSidebar = () => {
            document.getElementById('users-sidebar').classList.add('open');
            if (backdrop) backdrop.classList.add('active');
        };
        const closeSidebar = () => {
            document.getElementById('users-sidebar').classList.remove('open');
            if (backdrop) backdrop.classList.remove('active');
        };

        if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openSidebar);
        if (onlineCountBtn) onlineCountBtn.addEventListener('click', openSidebar);
        if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
        if (backdrop) backdrop.addEventListener('click', closeSidebar);

        // QR Modal Controls
        const networkInfoBtn = document.getElementById('network-info-btn');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const modalBackdrop = document.getElementById('qr-modal');

        if (networkInfoBtn) {
            networkInfoBtn.addEventListener('click', () => {
                if (modalBackdrop) modalBackdrop.classList.remove('hidden');
            });
        }
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                if (modalBackdrop) modalBackdrop.classList.add('hidden');
            });
        }
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', (e) => {
                if (e.target === modalBackdrop) modalBackdrop.classList.add('hidden');
            });
        }

        // Copy Server Address Buttons
        const copyBannerBtn = document.getElementById('copy-address-btn');
        const copyModalBtn = document.getElementById('modal-copy-btn');

        const triggerCopy = (btn) => {
            const url = this.serverInfo ? this.serverInfo.serverUrl : window.location.origin;
            UI.copyToClipboard(url, btn);
        };

        if (copyBannerBtn) copyBannerBtn.addEventListener('click', () => triggerCopy(copyBannerBtn));
        if (copyModalBtn) copyModalBtn.addEventListener('click', () => triggerCopy(copyModalBtn));

        // Leave Chat Button
        const leaveBtn = document.getElementById('leave-btn');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => this.handleLeaveChat());
        }

        // File Attachment Controls
        const attachBtn = document.getElementById('attach-file-btn');
        const fileInput = document.getElementById('file-input');

        if (attachBtn && fileInput) {
            attachBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.uploadFile(e.target.files[0]);
                    e.target.value = '';
                }
            });
        }

        // Paste Image/File from Clipboard
        if (msgInput) {
            msgInput.addEventListener('paste', (e) => {
                if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
                    e.preventDefault();
                    this.uploadFile(e.clipboardData.files[0]);
                }
            });
        }

        // Drag & Drop File Handling
        const chatArea = document.querySelector('.chat-area');
        const dropzone = document.getElementById('dropzone-overlay');

        if (chatArea && dropzone) {
            ['dragenter', 'dragover'].forEach(eventName => {
                chatArea.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.classList.remove('hidden');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                chatArea.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.classList.add('hidden');
                }, false);
            });

            chatArea.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                if (dt && dt.files && dt.files.length > 0) {
                    this.uploadFile(dt.files[0]);
                }
            }, false);
        }
    },

    // 3. User Join Handler
    handleJoin(e) {
        e.preventDefault();
        const input = document.getElementById('username-input');
        const errorBox = document.getElementById('join-error');
        const rawUsername = input ? input.value.trim() : '';

        errorBox.classList.add('hidden');

        // Client-side quick checks
        if (rawUsername.length < 2 || rawUsername.length > 20) {
            errorBox.textContent = 'Username must be between 2 and 20 characters.';
            errorBox.classList.remove('hidden');
            return;
        }

        const validPattern = /^[a-zA-Z0-9 _-]+$/;
        if (!validPattern.test(rawUsername)) {
            errorBox.textContent = 'Username contains invalid characters. Use letters, numbers, spaces, _ or -.';
            errorBox.classList.remove('hidden');
            return;
        }

        // Pre-validate with REST API for instant duplicate detection
        fetch('/api/validate-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: rawUsername })
        })
        .then(res => res.json())
        .then(data => {
            if (!data.valid) {
                errorBox.textContent = data.message || 'Username already taken or invalid.';
                errorBox.classList.remove('hidden');
                return;
            }

            this.currentUsername = data.sanitizedUsername;
            localStorage.setItem('campuschat_last_username', this.currentUsername);

            // Switch to Chat Screen & Connect WebSocket
            UI.showScreen('chat-screen');
            WSController.connect(this.currentUsername, {
                onConnectSuccess: () => {
                    UI.showToast(`Welcome to CampusChat, ${this.currentUsername}!`, 'success');
                },
                onTypingReceived: (msg) => this.handleRemoteTyping(msg)
            });
        })
        .catch(err => {
            errorBox.textContent = 'Unable to connect to server. Please try again.';
            errorBox.classList.remove('hidden');
        });
    },

    // 4. Send Message Handler
    handleSendMessage(e) {
        if (e) e.preventDefault();
        const textarea = document.getElementById('message-input');
        if (!textarea) return;

        const text = textarea.value.trim();
        if (!text) return;

        if (text.length > 500) {
            UI.showToast('Message exceeds maximum length of 500 characters.', 'error');
            return;
        }

        const sent = WSController.sendMessage(text);
        if (sent) {
            textarea.value = '';
            this.updateCharCounter();
            textarea.focus();
            this.sendTypingStatus(false);
        }
    },

    handleKeydown(e) {
        // Submit on Enter without Shift key
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendMessage();
        }
    },

    // 5. Typing Indicator Logic
    handleInputTyping() {
        this.updateCharCounter();

        // Send typing indicator true
        this.sendTypingStatus(true);

        // Debounce 1 second of inactivity to clear typing indicator
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.sendTypingStatus(false);
        }, 1000);
    },

    updateCharCounter() {
        const textarea = document.getElementById('message-input');
        const counter = document.getElementById('char-counter');
        if (!textarea || !counter) return;

        const len = textarea.value.length;
        counter.textContent = `${len} / 500`;

        if (len > 450) {
            counter.classList.add('warning');
        } else {
            counter.classList.remove('warning');
        }
    },

    sendTypingStatus(isTyping) {
        WSController.sendTyping(isTyping);
    },

    handleRemoteTyping(msg) {
        if (!msg.sender || msg.sender.toLowerCase() === this.currentUsername.toLowerCase()) return;

        const indicatorContainer = document.getElementById('typing-indicator');
        const typingText = document.getElementById('typing-text');
        if (!indicatorContainer || !typingText) return;

        if (msg.isTyping) {
            typingText.textContent = `${UI.escapeHtml(msg.sender)} is typing...`;
            indicatorContainer.classList.remove('hidden');

            // Auto-clear after 2 seconds if stop signal missed
            if (this.remoteTypingTimers[msg.sender]) {
                clearTimeout(this.remoteTypingTimers[msg.sender]);
            }
            this.remoteTypingTimers[msg.sender] = setTimeout(() => {
                indicatorContainer.classList.add('hidden');
            }, 2000);
        } else {
            if (this.remoteTypingTimers[msg.sender]) {
                clearTimeout(this.remoteTypingTimers[msg.sender]);
            }
            indicatorContainer.classList.add('hidden');
        }
    },

    // 6. Leave Chat
    handleLeaveChat() {
        WSController.disconnect();
        this.currentUsername = '';
        document.getElementById('chat-messages').innerHTML = '';
        UI.showScreen('join-screen');
        UI.showToast('You have left the chat.', 'info');
    },

    // 7. File Upload Handler
    uploadFile(file) {
        if (!file) return;

        if (!this.currentUsername) {
            UI.showToast('Please join the chat before uploading files.', 'error');
            return;
        }

        const maxSize = 50 * 1024 * 1024; // 50 MB limit
        if (file.size > maxSize) {
            UI.showToast('File size exceeds the 50MB limit.', 'error');
            return;
        }

        const progressContainer = document.getElementById('upload-progress-container');
        const fileNameElem = document.getElementById('upload-file-name');
        const percentageElem = document.getElementById('upload-percentage');
        const progressBar = document.getElementById('upload-progress-bar');

        if (progressContainer) progressContainer.classList.remove('hidden');
        if (fileNameElem) fileNameElem.textContent = `Uploading ${file.name}...`;
        if (percentageElem) percentageElem.textContent = '0%';
        if (progressBar) progressBar.style.width = '0%';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('sender', this.currentUsername);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/files/upload', true);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                if (percentageElem) percentageElem.textContent = `${percent}%`;
                if (progressBar) progressBar.style.width = `${percent}%`;
            }
        };

        xhr.onload = () => {
            if (progressContainer) progressContainer.classList.add('hidden');
            if (xhr.status >= 200 && xhr.status < 300) {
                UI.showToast(`File "${file.name}" uploaded successfully!`, 'success');
            } else {
                try {
                    const res = JSON.parse(xhr.responseText);
                    UI.showToast(res.message || 'File upload failed.', 'error');
                } catch(err) {
                    UI.showToast('File upload failed.', 'error');
                }
            }
        };

        xhr.onerror = () => {
            if (progressContainer) progressContainer.classList.add('hidden');
            UI.showToast('Network error while uploading file.', 'error');
        };

        xhr.send(formData);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
