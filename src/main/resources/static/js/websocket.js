/* ==========================================================================
   CampusChat - WebSocket & STOMP Client Handler (websocket.js)
   ========================================================================== */

const WSController = {
    stompClient: null,
    connected: false,
    reconnectAttempts: 0,
    maxReconnectDelay: 30000,
    reconnectTimer: null,
    currentUsername: null,
    callbacks: {},
    channelSubscriptions: {},

    connect(username, callbacks) {
        this.currentUsername = username;
        this.callbacks = callbacks || {};

        UI.updateConnectionStatus('CONNECTING');

        let socket;
        if (typeof SockJS !== 'undefined') {
            socket = new SockJS('/ws');
        } else {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            socket = new WebSocket(`${protocol}//${window.location.host}/ws-raw`);
        }

        this.stompClient = Stomp.over(socket);
        this.stompClient.debug = () => {}; // Disable noisy debug logs in console

        this.stompClient.connect(
            {},
            (frame) => this.onConnected(frame),
            (error) => this.onError(error)
        );
    },

    onConnected(frame) {
        this.connected = true;
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        UI.updateConnectionStatus('CONNECTED');
        if (this.callbacks.onConnectSuccess) {
            this.callbacks.onConnectSuccess();
        }

        // 1. Subscribe to public topic (System alerts, user updates, channel creations)
        this.stompClient.subscribe('/topic/public', (payload) => {
            try {
                const messageObj = JSON.parse(payload.body);
                this.handleIncomingMessage(messageObj);
            } catch (e) {
                console.error("Error parsing public message:", e);
            }
        });

        // 2. Subscribe to private user queue (1-on-1 Direct Messages, DM reactions, DM typing)
        this.stompClient.subscribe('/user/queue/messages', (payload) => {
            try {
                const messageObj = JSON.parse(payload.body);
                this.handleIncomingMessage(messageObj);
            } catch (e) {
                console.error("Error parsing user private message:", e);
            }
        });

        // 3. Subscribe to history response queue
        this.stompClient.subscribe('/user/queue/history', (payload) => {
            try {
                const messageObj = JSON.parse(payload.body);
                this.handleIncomingMessage(messageObj);
            } catch (e) {
                console.error("Error parsing history message:", e);
            }
        });

        // 4. Subscribe to error queue
        this.stompClient.subscribe('/user/queue/errors', (payload) => {
            try {
                const messageObj = JSON.parse(payload.body);
                this.handleIncomingMessage(messageObj);
            } catch (e) {
                console.error("Error parsing error message:", e);
            }
        });

        // 5. Register user with server
        this.stompClient.send('/app/chat.addUser', {}, JSON.stringify({
            sender: this.currentUsername,
            type: 'JOIN'
        }));
    },

    subscribeToChannel(channelId) {
        if (!this.stompClient || !this.connected || !channelId) return;
        const cleanId = channelId.toLowerCase().trim();
        if (this.channelSubscriptions[cleanId]) return;

        const sub = this.stompClient.subscribe(`/topic/channel/${cleanId}`, (payload) => {
            try {
                const msg = JSON.parse(payload.body);
                this.handleIncomingMessage(msg);
            } catch (e) {
                console.error(`Error parsing channel message for #${cleanId}:`, e);
            }
        });

        this.channelSubscriptions[cleanId] = sub;
    },

    subscribeToAllChannels(channelsList) {
        if (!channelsList || !Array.isArray(channelsList)) return;
        channelsList.forEach(ch => this.subscribeToChannel(ch.id));
    },

    onError(error) {
        this.connected = false;
        UI.updateConnectionStatus('DISCONNECTED');
        UI.showToast('Connection lost. Reconnecting to LAN server...', 'error');

        if (this.callbacks.onConnectionLost) {
            this.callbacks.onConnectionLost();
        }

        this.scheduleReconnect();
    },

    scheduleReconnect() {
        if (this.reconnectTimer || !this.currentUsername) return;

        this.reconnectAttempts++;
        const delay = Math.min(3000 * Math.pow(1.5, this.reconnectAttempts - 1), this.maxReconnectDelay);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.currentUsername) {
                this.channelSubscriptions = {};
                this.connect(this.currentUsername, this.callbacks);
            }
        }, delay);
    },

    // ==================== Outgoing Actions ====================

    sendChannelMessage(channelId, messageText) {
        if (!this.connected || !this.stompClient) {
            UI.showToast('Cannot send message. Disconnected.', 'error');
            return false;
        }

        const chatMessage = {
            sender: this.currentUsername,
            channelId: channelId || 'general',
            message: messageText,
            type: 'CHANNEL_CHAT'
        };

        this.stompClient.send('/app/chat.sendChannelMessage', {}, JSON.stringify(chatMessage));
        return true;
    },

    sendPrivateMessage(recipient, messageText) {
        if (!this.connected || !this.stompClient) {
            UI.showToast('Cannot send message. Disconnected.', 'error');
            return false;
        }

        const chatMessage = {
            sender: this.currentUsername,
            recipient: recipient,
            message: messageText,
            type: 'PRIVATE_CHAT'
        };

        this.stompClient.send('/app/chat.sendPrivateMessage', {}, JSON.stringify(chatMessage));
        return true;
    },

    createChannel(name, description) {
        if (!this.connected || !this.stompClient) return false;

        const chatMessage = {
            sender: this.currentUsername,
            message: name,
            channelId: description || '',
            type: 'CREATE_CHANNEL'
        };

        this.stompClient.send('/app/chat.createChannel', {}, JSON.stringify(chatMessage));
        return true;
    },

    requestHistory(chatType, targetId) {
        if (!this.connected || !this.stompClient) return;

        const req = {
            sender: this.currentUsername,
            type: 'HISTORY'
        };

        if (chatType === 'DM') {
            req.recipient = targetId;
        } else {
            req.channelId = targetId || 'general';
        }

        this.stompClient.send('/app/chat.getHistory', {}, JSON.stringify(req));
    },

    sendReaction(messageId, emoji, chatType, targetId) {
        if (!this.connected || !this.stompClient) return;

        const req = {
            sender: this.currentUsername,
            targetMessageId: messageId,
            reactionEmoji: emoji,
            type: 'REACTION'
        };

        if (chatType === 'DM') {
            req.recipient = targetId;
        } else {
            req.channelId = targetId || 'general';
        }

        this.stompClient.send('/app/chat.reactMessage', {}, JSON.stringify(req));
    },

    sendTyping(isTyping, chatType, targetId) {
        if (!this.connected || !this.stompClient) return;

        const typingMessage = {
            sender: this.currentUsername,
            isTyping: isTyping,
            type: 'TYPING'
        };

        if (chatType === 'DM') {
            typingMessage.recipient = targetId;
        } else {
            typingMessage.channelId = targetId || 'general';
        }

        this.stompClient.send('/app/chat.typing', {}, JSON.stringify(typingMessage));
    },

    // ==================== Incoming Dispatcher ====================

    handleIncomingMessage(msg) {
        if (!msg || !msg.type) return;

        if (this.callbacks.onMessageReceived) {
            this.callbacks.onMessageReceived(msg);
        }
    },

    disconnect() {
        this.currentUsername = null;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.stompClient && this.connected) {
            try {
                this.stompClient.disconnect();
            } catch (e) {}
        }
        this.channelSubscriptions = {};
        this.connected = false;
        UI.updateConnectionStatus('DISCONNECTED');
    }
};
