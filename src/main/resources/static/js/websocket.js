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

    connect(username, callbacks) {
        this.currentUsername = username;
        this.callbacks = callbacks || {};

        UI.updateConnectionStatus('CONNECTING');

        // Create SockJS connection or fallback to raw WebSocket
        let socket;
        if (typeof SockJS !== 'undefined') {
            socket = new SockJS('/ws');
        } else {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            socket = new WebSocket(`${protocol}//${window.location.host}/ws-raw`);
        }

        this.stompClient = Stomp.over(socket);

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

        // Subscribe to public chat topic
        this.stompClient.subscribe('/topic/public', (payload) => {
            try {
                const messageObj = JSON.parse(payload.body);
                this.handleIncomingMessage(messageObj);
            } catch (e) {
                console.error("Error parsing incoming message:", e);
            }
        });

        // Subscribe to private user queues (for history and errors)
        this.stompClient.subscribe('/user/queue/history', (payload) => {
            try {
                const messageObj = JSON.parse(payload.body);
                this.handleIncomingMessage(messageObj);
            } catch (e) {
                console.error("Error parsing user history message:", e);
            }
        });

        this.stompClient.subscribe('/user/queue/errors', (payload) => {
            try {
                const messageObj = JSON.parse(payload.body);
                this.handleIncomingMessage(messageObj);
            } catch (e) {
                console.error("Error parsing user error message:", e);
            }
        });

        // Register user with server
        this.stompClient.send('/app/chat.addUser', {}, JSON.stringify({
            sender: this.currentUsername,
            type: 'JOIN'
        }));
    },

    onError(error) {
        this.connected = false;
        UI.updateConnectionStatus('DISCONNECTED');
        UI.showToast('Connection lost. Attempting auto-reconnect...', 'error');

        if (this.callbacks.onConnectionLost) {
            this.callbacks.onConnectionLost();
        }

        this.scheduleReconnect();
    },

    scheduleReconnect() {
        if (this.reconnectTimer || !this.currentUsername) return;

        this.reconnectAttempts++;
        // Exponential backoff: 3s, 6s, 12s, 24s... max 30s
        const delay = Math.min(3000 * Math.pow(1.5, this.reconnectAttempts - 1), this.maxReconnectDelay);

        console.log(`Scheduling reconnect attempt #${this.reconnectAttempts} in ${Math.round(delay/1000)}s...`);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.currentUsername) {
                this.connect(this.currentUsername, this.callbacks);
            }
        }, delay);
    },

    sendMessage(messageText) {
        if (!this.connected || !this.stompClient) {
            UI.showToast('Cannot send message. Disconnected from server.', 'error');
            return false;
        }

        const chatMessage = {
            sender: this.currentUsername,
            message: messageText,
            type: 'CHAT'
        };

        this.stompClient.send('/app/chat.sendMessage', {}, JSON.stringify(chatMessage));
        return true;
    },

    sendTyping(isTyping) {
        if (!this.connected || !this.stompClient) return;

        const typingMessage = {
            sender: this.currentUsername,
            isTyping: isTyping,
            type: 'TYPING'
        };

        this.stompClient.send('/app/chat.typing', {}, JSON.stringify(typingMessage));
    },

    handleIncomingMessage(msg) {
        if (!msg || !msg.type) return;

        switch (msg.type) {
            case 'CHAT':
            case 'FILE':
                UI.appendChatMessage(msg, this.currentUsername);
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
                if (msg.onlineUsers) {
                    UI.updateOnlineUsersList(msg.onlineUsers, this.currentUsername);
                }
                break;

            case 'HISTORY':
                if (msg.history && Array.isArray(msg.history)) {
                    document.getElementById('chat-messages').innerHTML = ''; // clear history container
                    msg.history.forEach(item => UI.appendChatMessage(item, this.currentUsername));
                }
                if (msg.onlineUsers) {
                    UI.updateOnlineUsersList(msg.onlineUsers, this.currentUsername);
                }
                break;

            case 'TYPING':
                if (this.callbacks.onTypingReceived) {
                    this.callbacks.onTypingReceived(msg);
                }
                break;

            case 'ERROR':
                UI.showToast(msg.message || 'An error occurred.', 'error');
                if (msg.message && msg.message.includes('Username')) {
                    this.disconnect();
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

    disconnect() {
        this.currentUsername = null;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.stompClient && this.connected) {
            try {
                this.stompClient.disconnect();
            } catch(e){}
        }
        this.connected = false;
        UI.updateConnectionStatus('DISCONNECTED');
    }
};
