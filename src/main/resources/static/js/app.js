/* ==========================================================================
   CampusChat - Core Application Controller (app.js)
   ========================================================================== */

const App = {
    serverInfo: null,
    currentUsername: '',
    channels: [],
    onlineUsers: [],
    activeChat: {
        type: 'CHANNEL', // 'CHANNEL' or 'DM'
        id: 'general',
        channel: { id: 'general', name: 'general', description: 'Public campus-wide discussions and announcements.' },
        targetUser: null
    },
    unreadCounts: {},
    typingTimeout: null,
    remoteTypingTimers: {},

    init() {
        this.fetchServerInfo();
        this.bindEvents();
        this.loadSavedUsername();
        this.initMobileViewport();
    },

    initMobileViewport() {
        if (window.visualViewport) {
            const handleViewportChange = () => {
                const chatScreen = document.getElementById('chat-screen');
                if (chatScreen && !chatScreen.classList.contains('hidden')) {
                    document.documentElement.style.setProperty('--visual-viewport-height', `${window.visualViewport.height}px`);
                    const messagesContainer = document.getElementById('chat-messages');
                    if (messagesContainer) {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                }
            };
            window.visualViewport.addEventListener('resize', handleViewportChange);
            window.visualViewport.addEventListener('scroll', handleViewportChange);
        }
    },

    // 1. Fetch Server Info
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
        const bannerUrl = document.getElementById('banner-server-url');
        const modalIp = document.getElementById('modal-ip');
        const modalPort = document.getElementById('modal-port');
        const modalUrl = document.getElementById('modal-url');

        if (landingIp) landingIp.textContent = info.serverUrl || info.ipAddress;
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

        // Create Channel Modal Controls
        const openCreateChannelBtn = document.getElementById('open-create-channel-btn');
        const closeChannelModalBtn = document.getElementById('close-channel-modal-btn');
        const cancelChannelBtn = document.getElementById('cancel-channel-btn');
        const createChannelModal = document.getElementById('create-channel-modal');
        const createChannelForm = document.getElementById('create-channel-form');

        const openChannelModal = () => {
            if (createChannelModal) {
                createChannelModal.classList.remove('hidden');
                const nameInput = document.getElementById('channel-name-input');
                if (nameInput) {
                    nameInput.value = '';
                    nameInput.focus();
                }
                const descInput = document.getElementById('channel-desc-input');
                if (descInput) descInput.value = '';
                const errBox = document.getElementById('create-channel-error');
                if (errBox) errBox.classList.add('hidden');
            }
        };

        const closeChannelModal = () => {
            if (createChannelModal) createChannelModal.classList.add('hidden');
        };

        if (openCreateChannelBtn) openCreateChannelBtn.addEventListener('click', openChannelModal);
        if (closeChannelModalBtn) closeChannelModalBtn.addEventListener('click', closeChannelModal);
        if (cancelChannelBtn) cancelChannelBtn.addEventListener('click', closeChannelModal);
        if (createChannelModal) {
            createChannelModal.addEventListener('click', (e) => {
                if (e.target === createChannelModal) closeChannelModal();
            });
        }
        if (createChannelForm) {
            createChannelForm.addEventListener('submit', (e) => this.handleCreateChannelSubmit(e));
        }

        // Mobile Sidebar Drawer Controls
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const closeSidebarBtn = document.getElementById('close-sidebar-btn');
        const backdrop = document.getElementById('sidebar-backdrop');

        const openSidebar = () => {
            document.getElementById('chat-sidebar').classList.add('open');
            if (backdrop) backdrop.classList.add('active');
        };
        const closeSidebar = () => {
            document.getElementById('chat-sidebar').classList.remove('open');
            if (backdrop) backdrop.classList.remove('active');
        };

        if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openSidebar);
        if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
        if (backdrop) backdrop.addEventListener('click', closeSidebar);

        // QR Modal Controls
        const networkInfoBtn = document.getElementById('network-info-btn');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const qrModal = document.getElementById('qr-modal');

        if (networkInfoBtn) {
            networkInfoBtn.addEventListener('click', () => {
                if (qrModal) qrModal.classList.remove('hidden');
            });
        }
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                if (qrModal) qrModal.classList.add('hidden');
            });
        }
        if (qrModal) {
            qrModal.addEventListener('click', (e) => {
                if (e.target === qrModal) qrModal.classList.add('hidden');
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

        // Dismiss Banner
        const dismissBannerBtn = document.getElementById('dismiss-banner-btn');
        const serverBanner = document.getElementById('server-banner');
        if (dismissBannerBtn && serverBanner) {
            dismissBannerBtn.addEventListener('click', () => {
                serverBanner.style.display = 'none';
            });
        }

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
        const chatArea = document.querySelector('.chat-main-area');
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

    // 3. Join Handler
    handleJoin(e) {
        e.preventDefault();
        const input = document.getElementById('username-input');
        const errorBox = document.getElementById('join-error');
        const rawUsername = input ? input.value.trim() : '';

        errorBox.classList.add('hidden');

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

            // Update user profile chip in sidebar
            const myAvatar = document.getElementById('my-avatar');
            const myUsernameLabel = document.getElementById('sidebar-my-username');
            if (myAvatar) myAvatar.textContent = this.currentUsername.charAt(0).toUpperCase();
            if (myUsernameLabel) myUsernameLabel.textContent = this.currentUsername;

            // Reset active chat to #general
            this.activeChat = {
                type: 'CHANNEL',
                id: 'general',
                channel: { id: 'general', name: 'general', description: 'Public campus-wide discussions and announcements.' },
                targetUser: null
            };

            UI.showScreen('chat-screen');
            UI.updateActiveChatHeader(this.activeChat, this.currentUsername);

            WSController.connect(this.currentUsername, {
                onConnectSuccess: () => {
                    UI.showToast(`Welcome to CampusChat, ${this.currentUsername}!`, 'success');
                },
                onMessageReceived: (msg) => this.handleIncomingMessage(msg)
            });
        })
        .catch(() => {
            errorBox.textContent = 'Unable to connect to server. Please check your network connection.';
            errorBox.classList.remove('hidden');
        });
    },

    // 4. Incoming Message Dispatcher
    handleIncomingMessage(msg) {
        if (!msg || !msg.type) return;

        switch (msg.type) {
            case 'CHANNEL_CHAT':
            case 'CHAT':
            case 'FILE': {
                const isPrivate = !!msg.recipient;
                if (isPrivate) {
                    this.handleIncomingPrivateMessage(msg);
                } else {
                    this.handleIncomingChannelMessage(msg);
                }
                break;
            }

            case 'PRIVATE_CHAT':
                this.handleIncomingPrivateMessage(msg);
                break;

            case 'JOIN':
                UI.appendSystemMessage(`${msg.sender} joined the chat`);
                UI.showToast(`${msg.sender} joined`, 'info');
                break;

            case 'LEAVE':
                UI.appendSystemMessage(`${msg.sender} left the chat`);
                UI.showToast(`${msg.sender} left`, 'info');
                break;

            case 'USERS_UPDATE':
                if (msg.onlineUsers) this.onlineUsers = msg.onlineUsers;
                if (msg.channels) {
                    this.channels = msg.channels;
                    WSController.subscribeToAllChannels(this.channels);
                }
                this.refreshSidebar();
                break;

            case 'CREATE_CHANNEL':
                if (msg.channels) {
                    this.channels = msg.channels;
                    WSController.subscribeToAllChannels(this.channels);
                    this.refreshSidebar();
                }
                UI.appendSystemMessage(msg.message || `New channel created by ${msg.sender}`);
                UI.showToast(msg.message || 'New channel created', 'success');
                break;

            case 'HISTORY':
                if (msg.channels) {
                    this.channels = msg.channels;
                    WSController.subscribeToAllChannels(this.channels);
                }
                if (msg.onlineUsers) {
                    this.onlineUsers = msg.onlineUsers;
                }
                this.refreshSidebar();

                // Check if history corresponds to current active chat
                const isCurrentChannel = this.activeChat.type === 'CHANNEL' && msg.channelId &&
                    msg.channelId.toLowerCase() === this.activeChat.id.toLowerCase();
                const isCurrentDm = this.activeChat.type === 'DM' && msg.recipient &&
                    msg.recipient.toLowerCase() === this.activeChat.targetUser.toLowerCase();

                if (isCurrentChannel || isCurrentDm || (!msg.channelId && !msg.recipient)) {
                    const chatContainer = document.getElementById('chat-messages');
                    if (chatContainer) chatContainer.innerHTML = '';
                    if (msg.history && Array.isArray(msg.history)) {
                        msg.history.forEach(item => {
                            UI.appendChatMessage(item, this.currentUsername, (mId, em) => this.handleReactClick(mId, em));
                        });
                    }
                }
                break;

            case 'REACTION':
                UI.updateMessageReactions(msg.targetMessageId, msg.reactions, this.currentUsername, (mId, em) => this.handleReactClick(mId, em));
                break;

            case 'TYPING':
                this.handleRemoteTyping(msg);
                break;

            case 'ERROR':
                UI.showToast(msg.message || 'An error occurred.', 'error');
                if (msg.message && msg.message.includes('Username')) {
                    WSController.disconnect();
                    UI.showScreen('join-screen');
                    const errorBox = document.getElementById('join-error');
                    if (errorBox) {
                        errorBox.textContent = msg.message;
                        errorBox.classList.remove('hidden');
                    }
                }
                break;

            default:
                break;
        }
    },

    handleIncomingChannelMessage(msg) {
        const channelId = (msg.channelId || 'general').toLowerCase();
        const isCurrentActive = this.activeChat.type === 'CHANNEL' && this.activeChat.id.toLowerCase() === channelId;

        if (isCurrentActive) {
            UI.appendChatMessage(msg, this.currentUsername, (mId, em) => this.handleReactClick(mId, em));
        } else {
            const key = `channel:${channelId}`;
            this.unreadCounts[key] = (this.unreadCounts[key] || 0) + 1;
            this.refreshSidebar();
            if (msg.sender && msg.sender.toLowerCase() !== this.currentUsername.toLowerCase()) {
                UI.showToast(`[#${channelId}] ${msg.sender}: ${msg.message || 'Shared a file'}`, 'info');
            }
        }
    },

    handleIncomingPrivateMessage(msg) {
        const sender = (msg.sender || '').toLowerCase();
        const recipient = (msg.recipient || '').toLowerCase();
        const self = this.currentUsername.toLowerCase();

        // Identify the peer in this 1-on-1 DM
        const peer = sender === self ? recipient : sender;
        const isCurrentActive = this.activeChat.type === 'DM' && this.activeChat.targetUser.toLowerCase() === peer;

        if (isCurrentActive) {
            UI.appendChatMessage(msg, this.currentUsername, (mId, em) => this.handleReactClick(mId, em));
        } else {
            const key = `dm:${peer}`;
            this.unreadCounts[key] = (this.unreadCounts[key] || 0) + 1;
            this.refreshSidebar();
            if (sender !== self) {
                UI.showToast(`[@${msg.sender}] Direct Message: ${msg.message || 'Shared a file'}`, 'info');
            }
        }
    },

    // 5. Sidebar Navigation & Selection
    selectChannel(channel) {
        if (!channel) return;
        this.activeChat = {
            type: 'CHANNEL',
            id: channel.id,
            channel: channel,
            targetUser: null
        };

        // Clear unread
        delete this.unreadCounts[`channel:${channel.id.toLowerCase()}`];

        UI.updateActiveChatHeader(this.activeChat, this.currentUsername);
        this.refreshSidebar();

        // Clear existing messages and request history
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) chatContainer.innerHTML = '';
        WSController.subscribeToChannel(channel.id);
        WSController.requestHistory('CHANNEL', channel.id);

        // Close mobile drawer if open
        document.getElementById('chat-sidebar').classList.remove('open');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) backdrop.classList.remove('active');
    },

    selectDmUser(user) {
        if (!user) return;
        this.activeChat = {
            type: 'DM',
            id: null,
            channel: null,
            targetUser: user.username
        };

        // Clear unread
        delete this.unreadCounts[`dm:${user.username.toLowerCase()}`];

        UI.updateActiveChatHeader(this.activeChat, this.currentUsername);
        this.refreshSidebar();

        // Clear existing messages and request history
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) chatContainer.innerHTML = '';
        WSController.requestHistory('DM', user.username);

        // Close mobile drawer if open
        document.getElementById('chat-sidebar').classList.remove('open');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) backdrop.classList.remove('active');
    },

    refreshSidebar() {
        const activeChannelId = this.activeChat.type === 'CHANNEL' ? this.activeChat.id : null;
        const activeDmUser = this.activeChat.type === 'DM' ? this.activeChat.targetUser : null;

        UI.renderChannelsList(
            this.channels,
            activeChannelId,
            this.unreadCounts,
            (ch) => this.selectChannel(ch)
        );

        UI.renderDirectUsersList(
            this.onlineUsers,
            this.currentUsername,
            activeDmUser,
            this.unreadCounts,
            (u) => this.selectDmUser(u)
        );
    },

    // 6. Send Message Handler
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

        let sent = false;
        if (this.activeChat.type === 'DM') {
            sent = WSController.sendPrivateMessage(this.activeChat.targetUser, text);
        } else {
            sent = WSController.sendChannelMessage(this.activeChat.id, text);
        }

        if (sent) {
            textarea.value = '';
            textarea.style.height = '';
            this.updateCharCounter();
            textarea.focus();
            this.sendTypingStatus(false);

            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    },

    handleKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendMessage();
        }
    },

    // 7. Reactions & Emoji Handling
    handleReactClick(messageId, emoji) {
        const targetId = this.activeChat.type === 'DM' ? this.activeChat.targetUser : this.activeChat.id;
        WSController.sendReaction(messageId, emoji, this.activeChat.type, targetId);
    },

    // 8. Create Channel Handler
    handleCreateChannelSubmit(e) {
        e.preventDefault();
        const nameInput = document.getElementById('channel-name-input');
        const descInput = document.getElementById('channel-desc-input');
        const errBox = document.getElementById('create-channel-error');

        const rawName = nameInput ? nameInput.value.trim() : '';
        const rawDesc = descInput ? descInput.value.trim() : '';

        if (errBox) errBox.classList.add('hidden');

        if (rawName.length < 2 || rawName.length > 30) {
            if (errBox) {
                errBox.textContent = 'Channel name must be between 2 and 30 characters.';
                errBox.classList.remove('hidden');
            }
            return;
        }

        const validPattern = /^[a-zA-Z0-9 _-]+$/;
        if (!validPattern.test(rawName)) {
            if (errBox) {
                errBox.textContent = 'Channel name contains invalid characters. Use letters, numbers, spaces, _ or -.';
                errBox.classList.remove('hidden');
            }
            return;
        }

        WSController.createChannel(rawName, rawDesc);

        const modal = document.getElementById('create-channel-modal');
        if (modal) modal.classList.add('hidden');
    },

    // 9. Typing Indicators
    handleInputTyping() {
        const textarea = document.getElementById('message-input');
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
        this.updateCharCounter();
        this.sendTypingStatus(true);

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
        const targetId = this.activeChat.type === 'DM' ? this.activeChat.targetUser : this.activeChat.id;
        WSController.sendTyping(isTyping, this.activeChat.type, targetId);
    },

    handleRemoteTyping(msg) {
        if (!msg.sender || msg.sender.toLowerCase() === this.currentUsername.toLowerCase()) return;

        const indicatorContainer = document.getElementById('typing-indicator');
        const typingText = document.getElementById('typing-text');
        if (!indicatorContainer || !typingText) return;

        // Check if typing is relevant to current active chat
        let isRelevant = false;
        if (this.activeChat.type === 'CHANNEL' && msg.channelId &&
            msg.channelId.toLowerCase() === this.activeChat.id.toLowerCase()) {
            isRelevant = true;
        } else if (this.activeChat.type === 'DM' && msg.sender.toLowerCase() === this.activeChat.targetUser.toLowerCase()) {
            isRelevant = true;
        }

        if (!isRelevant) return;

        if (msg.isTyping) {
            typingText.textContent = `${UI.escapeHtml(msg.sender)} is typing...`;
            indicatorContainer.classList.remove('hidden');

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

    // 10. File Upload Handler (Scoped to active channel or active 1-on-1 DM)
    uploadFile(file) {
        if (!file) return;

        if (!this.currentUsername) {
            UI.showToast('Please join the chat before uploading files.', 'error');
            return;
        }

        const maxSize = 500 * 1024 * 1024; // 500 MB limit
        if (file.size > maxSize) {
            UI.showToast('File size exceeds the 500MB limit.', 'error');
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

        if (this.activeChat.type === 'DM') {
            formData.append('recipient', this.activeChat.targetUser);
        } else {
            formData.append('channelId', this.activeChat.id);
        }

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
                } catch {
                    UI.showToast('File upload failed.', 'error');
                }
            }
        };

        xhr.onerror = () => {
            if (progressContainer) progressContainer.classList.add('hidden');
            UI.showToast('Network error while uploading file.', 'error');
        };

        xhr.send(formData);
    },

    // 11. Leave Chat
    handleLeaveChat() {
        WSController.disconnect();
        this.currentUsername = '';
        this.unreadCounts = {};
        document.getElementById('chat-messages').innerHTML = '';
        UI.showScreen('join-screen');
        UI.showToast('You have left the chat.', 'info');
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
