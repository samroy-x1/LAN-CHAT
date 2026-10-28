/* ==========================================================================
   CampusChat - UI Helper & Component Renderer (ui.js)
   ========================================================================== */

const UI = {
    soundEnabled: false,
    audioCtx: null,

    // Emoji Catalog Database
    emojiData: {
        smileys: [
            { e: '😀', k: 'grinning smile happy' }, { e: '😃', k: 'smiley happy joy' }, { e: '😄', k: 'smile laugh' },
            { e: '😁', k: 'beam grin' }, { e: '😆', k: 'laughing haha' }, { e: '😅', k: 'sweat smile relief' },
            { e: '🤣', k: 'rofl lol laugh' }, { e: '😂', k: 'joy tears laugh' }, { e: '🙂', k: 'slight smile' },
            { e: '🙃', k: 'upside down' }, { e: '😉', k: 'wink' }, { e: '😊', k: 'blush smile' },
            { e: '😇', k: 'innocent angel' }, { e: '🥰', k: 'love hearts' }, { e: '😍', k: 'heart eyes love' },
            { e: '🤩', k: 'star eyes wow' }, { e: '😘', k: 'kiss' }, { e: '😋', k: 'yum delicious' },
            { e: '😛', k: 'tongue' }, { e: '😜', k: 'winking tongue crazy' }, { e: '🤪', k: 'zany crazy' },
            { e: '😎', k: 'cool sunglasses' }, { e: '🤓', k: 'nerd geek glasses' }, { e: '🧐', k: 'monocle smart' },
            { e: '🥳', k: 'party celebrate' }, { e: '😏', k: 'smirk' }, { e: '😒', k: 'unamused bored' },
            { e: '😞', k: 'sad disappointed' }, { e: '😔', k: 'pensive' }, { e: '😟', k: 'worried' },
            { e: '😕', k: 'confused' }, { e: '🙁', k: 'frown' }, { e: '😮', k: 'surprised open mouth' },
            { e: '😲', k: 'astonished' }, { e: '😳', k: 'flushed shocked' }, { e: '🥺', k: 'pleading please' },
            { e: '😦', k: 'frowning' }, { e: '😨', k: 'fearful' }, { e: '😰', k: 'anxious sweat' },
            { e: '😱', k: 'scream shocked' }, { e: '🥱', k: 'yawn tired' }, { e: '😤', k: 'triumph proud' },
            { e: '😡', k: 'angry rage' }, { e: '😠', k: 'mad angry' }, { e: '🤬', k: 'cursing swear' },
            { e: '😈', k: 'devil smirk' }, { e: '👿', k: 'devil angry' }, { e: '💀', k: 'skull dead' },
            { e: '💩', k: 'poop' }, { e: '🤡', k: 'clown' }, { e: '👻', k: 'ghost boo' },
            { e: '👽', k: 'alien ufo' }, { e: '🤖', k: 'robot tech' }
        ],
        gestures: [
            { e: '👍', k: 'thumbs up like yes approve +1' }, { e: '👎', k: 'thumbs down dislike no -1' },
            { e: '👌', k: 'ok okay perfect' }, { e: '✌️', k: 'peace victory two' }, { e: '🤞', k: 'crossed fingers luck' },
            { e: '🤟', k: 'love you hand' }, { e: '🤘', k: 'rock on horns' }, { e: '🤙', k: 'call me hang loose' },
            { e: '👈', k: 'point left' }, { e: '👉', k: 'point right' }, { e: '👆', k: 'point up' },
            { e: '👇', k: 'point down' }, { e: '☝️', k: 'point up one' }, { e: '✋', k: 'raised hand stop' },
            { e: '🤚', k: 'back of hand' }, { e: '🖐️', k: 'hand splayed five' }, { e: '🖖', k: 'vulcan spock' },
            { e: '👋', k: 'wave hello bye' }, { e: '🤝', k: 'handshake deal agreement' }, { e: '🙏', k: 'pray please thanks namaste' },
            { e: '✍️', k: 'writing hand note' }, { e: '👏', k: 'clap applause bravo' }, { e: '🙌', k: 'hands celebrate praise' },
            { e: '👐', k: 'open hands' }, { e: '🤲', k: 'palms up' }, { e: '💪', k: 'flex muscle strong' }
        ],
        campus: [
            { e: '💻', k: 'laptop computer code tech' }, { e: '🖥️', k: 'desktop monitor screen' },
            { e: '⌨️', k: 'keyboard typing code' }, { e: '🖱️', k: 'mouse click' },
            { e: '📱', k: 'phone mobile smartphone' }, { e: '📚', k: 'books study reading campus' },
            { e: '📖', k: 'open book reading study' }, { e: '📝', k: 'memo notes assignment write' },
            { e: '✏️', k: 'pencil write draw' }, { e: '🎓', k: 'graduation cap degree university campus college' },
            { e: '🏫', k: 'school campus building' }, { e: '🔬', k: 'microscope science lab' },
            { e: '🔭', k: 'telescope astronomy science' }, { e: '📐', k: 'ruler triangle math geometry' },
            { e: '💡', k: 'lightbulb idea smart think' }, { e: '⚡', k: 'lightning fast power energy' },
            { e: '🚀', k: 'rocket launch fast ship deploy' }, { e: '🔥', k: 'fire hot lit trending' },
            { e: '🎯', k: 'target goal bullseye aim' }, { e: '☕', k: 'coffee tea energy study' },
            { e: '🏆', k: 'trophy winner prize award' }, { e: '🥇', k: 'first medal gold champion' },
            { e: '⚙️', k: 'gear settings engine engineering' }, { e: '📊', k: 'chart graph analytics data' }
        ],
        hearts: [
            { e: '❤️', k: 'red heart love like' }, { e: '🧡', k: 'orange heart' }, { e: '💛', k: 'yellow heart' },
            { e: '💚', k: 'green heart' }, { e: '💙', k: 'blue heart' }, { e: '💜', k: 'purple heart' },
            { e: '🖤', k: 'black heart' }, { e: '🤍', k: 'white heart' }, { e: '🤎', k: 'brown heart' },
            { e: '💔', k: 'broken heart' }, { e: '❣️', k: 'heart exclamation' }, { e: '💕', k: 'two hearts' },
            { e: '💖', k: 'sparkling heart' }, { e: '💗', k: 'growing heart' }, { e: '💓', k: 'beating heart' },
            { e: '💞', k: 'revolving hearts' }, { e: '✨', k: 'sparkles shine magic clean' }, { e: '⭐', k: 'star favorite' }
        ],
        fun: [
            { e: '🎉', k: 'party popper tada celebrate' }, { e: '🎊', k: 'confetti ball' }, { e: '🎈', k: 'balloon party' },
            { e: '🎁', k: 'gift present' }, { e: '🎵', k: 'musical note song' }, { e: '🎶', k: 'music audio' },
            { e: '🎸', k: 'guitar music rock' }, { e: '🎮', k: 'video game gaming controller' },
            { e: '🕹️', k: 'joystick arcade game' }, { e: '🎲', k: 'dice board game roll' },
            { e: '🎳', k: 'bowling game' }, { e: '⚽', k: 'soccer football ball' },
            { e: '🏀', k: 'basketball ball' }, { e: '🎾', k: 'tennis ball' },
            { e: '🍿', k: 'popcorn movie watch' }, { e: '🎬', k: 'cinema movie film' }
        ],
        food: [
            { e: '🍕', k: 'pizza food snack lunch' }, { e: '🍔', k: 'burger hamburger fast food' },
            { e: '🍟', k: 'fries french fries snack' }, { e: '🌭', k: 'hotdog' },
            { e: '🥪', k: 'sandwich lunch' }, { e: '🌮', k: 'taco mexican' },
            { e: '🍜', k: 'ramen noodles soup noodles' }, { e: '🍣', k: 'sushi japanese' },
            { e: '🍩', k: 'donut doughnut dessert sweet' }, { e: '🍪', k: 'cookie biscuit sweet' },
            { e: '🍫', k: 'chocolate candy sweet' }, { e: '🥤', k: 'cup with straw drink soda' },
            { e: '🧃', k: 'juice box drink' }, { e: '🍻', k: 'beers cheers drink' }
        ]
    },

    activeEmojiCategory: 'smileys',

    init() {
        this.initTheme();
        this.initSound();
        this.initLightbox();
        this.initEmojiPicker();
    },

    // ==================== Emoji Picker ====================
    initEmojiPicker() {
        const toggleBtn = document.getElementById('emoji-picker-toggle-btn');
        const popover = document.getElementById('emoji-picker-popover');
        const searchInput = document.getElementById('emoji-search-input');
        const tabBtns = document.querySelectorAll('.emoji-tab-btn');

        if (toggleBtn && popover) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                popover.classList.toggle('hidden');
                if (!popover.classList.contains('hidden')) {
                    this.renderEmojiGrid();
                    if (searchInput) {
                        searchInput.value = '';
                        searchInput.focus();
                    }
                }
            });

            // Close popover when clicking outside
            document.addEventListener('click', (e) => {
                if (popover && !popover.contains(e.target) && e.target !== toggleBtn) {
                    popover.classList.add('hidden');
                }
            });
        }

        if (tabBtns) {
            tabBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tabBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.activeEmojiCategory = btn.dataset.category || 'smileys';
                    if (searchInput) searchInput.value = '';
                    this.renderEmojiGrid();
                });
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim().toLowerCase();
                this.renderEmojiGrid(query);
            });
        }
    },

    renderEmojiGrid(searchQuery = '') {
        const grid = document.getElementById('emoji-grid-container');
        if (!grid) return;
        grid.innerHTML = '';

        let emojisToShow = [];

        if (searchQuery) {
            // Search all categories
            Object.values(this.emojiData).forEach(catList => {
                catList.forEach(item => {
                    if (item.k.includes(searchQuery)) {
                        if (!emojisToShow.some(x => x.e === item.e)) {
                            emojisToShow.push(item);
                        }
                    }
                });
            });
        } else {
            emojisToShow = this.emojiData[this.activeEmojiCategory] || this.emojiData.smileys;
        }

        if (emojisToShow.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">No matching emojis found</div>';
            return;
        }

        emojisToShow.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'emoji-btn-item';
            btn.textContent = item.e;
            btn.title = item.k;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.insertEmojiIntoInput(item.e);
            });
            grid.appendChild(btn);
        });
    },

    insertEmojiIntoInput(emoji) {
        const textarea = document.getElementById('message-input');
        if (!textarea) return;

        const start = textarea.selectionStart || textarea.value.length;
        const end = textarea.selectionEnd || textarea.value.length;
        const text = textarea.value;

        textarea.value = text.substring(0, start) + emoji + text.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();

        // Trigger input event for counter and typing status
        textarea.dispatchEvent(new Event('input'));
    },

    // ==================== Channels & Users Sidebar ====================

    renderChannelsList(channels, activeChannelId, unreadMap, onSelectChannel) {
        const listContainer = document.getElementById('channels-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        if (!channels || channels.length === 0) return;

        channels.forEach(ch => {
            const li = document.createElement('li');
            const isActive = activeChannelId && activeChannelId.toLowerCase() === ch.id.toLowerCase();
            const unreadCount = (unreadMap && unreadMap[`channel:${ch.id.toLowerCase()}`]) || 0;

            li.className = `nav-item ${isActive ? 'active' : ''}`;
            li.innerHTML = `
                <div class="nav-item-left">
                    <span class="nav-icon">#</span>
                    <span class="nav-name" title="${this.escapeHtml(ch.description || ch.name)}">${this.escapeHtml(ch.name)}</span>
                </div>
                ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
            `;

            li.addEventListener('click', () => {
                if (onSelectChannel) onSelectChannel(ch);
            });

            listContainer.appendChild(li);
        });
    },

    renderDirectUsersList(users, currentUsername, activeDmUser, unreadMap, onSelectUser) {
        const listContainer = document.getElementById('direct-users-list');
        const countBadge = document.getElementById('sidebar-online-pill');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        const onlineCount = users ? users.length : 0;
        if (countBadge) countBadge.textContent = `${onlineCount} Online`;

        if (!users) return;

        users.forEach(u => {
            const isSelf = u.username.toLowerCase() === (currentUsername || '').toLowerCase();
            const isActive = activeDmUser && activeDmUser.toLowerCase() === u.username.toLowerCase();
            const unreadCount = (unreadMap && unreadMap[`dm:${u.username.toLowerCase()}`]) || 0;
            const initial = (u.username.charAt(0) || 'U').toUpperCase();

            const li = document.createElement('li');
            li.className = `nav-item ${isActive ? 'active' : ''} ${isSelf ? 'is-self' : ''}`;
            li.innerHTML = `
                <div class="nav-item-left">
                    <div class="user-dm-avatar">
                        ${this.escapeHtml(initial)}
                        <span class="dm-status-dot"></span>
                    </div>
                    <span class="nav-name">${this.escapeHtml(u.username)}</span>
                    ${isSelf ? '<span class="self-tag">You</span>' : ''}
                </div>
                ${unreadCount > 0 && !isSelf ? `<span class="unread-badge">${unreadCount}</span>` : ''}
            `;

            li.addEventListener('click', () => {
                if (onSelectUser) onSelectUser(u);
            });

            listContainer.appendChild(li);
        });
    },

    updateActiveChatHeader(activeChat, currentUsername) {
        const titleElem = document.getElementById('active-chat-title');
        const descElem = document.getElementById('active-chat-desc');
        const iconElem = document.getElementById('active-chat-icon');
        const typePill = document.getElementById('active-type-pill');
        const msgInput = document.getElementById('message-input');

        if (!activeChat) return;

        if (activeChat.type === 'CHANNEL') {
            const ch = activeChat.channel || { id: 'general', name: 'general', description: 'Public discussion' };
            if (titleElem) titleElem.textContent = ch.name || ch.id;
            if (descElem) descElem.textContent = ch.description || `Channel #${ch.id}`;
            if (iconElem) {
                iconElem.textContent = '#';
                iconElem.style.background = 'var(--accent-light)';
                iconElem.style.color = 'var(--accent)';
            }
            if (typePill) typePill.textContent = 'Channel';
            if (msgInput) msgInput.placeholder = `Message #${ch.name || ch.id}...`;
        } else if (activeChat.type === 'DM') {
            const targetUser = activeChat.targetUser;
            const isSelf = targetUser.toLowerCase() === (currentUsername || '').toLowerCase();
            if (titleElem) titleElem.textContent = `@${targetUser}`;
            if (descElem) descElem.textContent = isSelf ? 'Notes to self' : '🟢 Online - Direct Message';
            if (iconElem) {
                iconElem.textContent = targetUser.charAt(0).toUpperCase();
                iconElem.style.background = 'linear-gradient(135deg, var(--accent), #8b5cf6)';
                iconElem.style.color = '#ffffff';
            }
            if (typePill) typePill.textContent = '1-on-1 DM';
            if (msgInput) msgInput.placeholder = `Message @${targetUser}...`;
        }
    },

    // ==================== Messages Rendering ====================

    appendChatMessage(messageObj, currentUsername, onReactClick) {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;

        const isSelf = messageObj.sender && messageObj.sender.toLowerCase() === (currentUsername || '').toLowerCase();
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${isSelf ? 'self' : 'other'}`;
        wrapper.id = `msg-wrap-${messageObj.id}`;

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

        // Reaction Bar HTML
        const quickReactions = ['👍', '❤️', '😂', '🔥', '🚀'];
        let quickButtonsHtml = quickReactions.map(em => `
            <button type="button" class="quick-react-btn" data-emoji="${em}" title="React with ${em}">${em}</button>
        `).join('');

        wrapper.innerHTML = `
            ${!isSelf ? `<div class="message-header">${safeSender}</div>` : ''}
            <div class="message-bubble-container">
                <div class="message-actions-bar">
                    ${quickButtonsHtml}
                </div>
                ${bubbleContent}
                <div class="reactions-row" id="reactions-${messageObj.id}">
                    ${this.renderReactionsHtml(messageObj.reactions, currentUsername, messageObj.id)}
                </div>
            </div>
            <div class="message-time">${timeStr}</div>
        `;

        // Bind quick reactions
        wrapper.querySelectorAll('.quick-react-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const em = btn.dataset.emoji;
                if (onReactClick) onReactClick(messageObj.id, em);
            });
        });

        // Bind existing reaction pills
        wrapper.querySelectorAll('.reaction-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                const em = pill.dataset.emoji;
                if (onReactClick) onReactClick(messageObj.id, em);
            });
        });

        chatContainer.appendChild(wrapper);
        this.scrollToBottom();

        if (!isSelf) {
            this.playNotificationSound();
        }
    },

    renderReactionsHtml(reactionsMap, currentUsername, msgId) {
        if (!reactionsMap || Object.keys(reactionsMap).length === 0) return '';

        let html = '';
        const user = currentUsername ? currentUsername.toLowerCase() : '';

        for (const [emoji, userList] of Object.entries(reactionsMap)) {
            if (!userList || userList.length === 0) continue;
            const hasReacted = userList.some(u => u.toLowerCase() === user);
            const count = userList.length;
            const reactorsTitle = this.escapeHtml(userList.join(', '));

            html += `
                <button type="button" class="reaction-pill ${hasReacted ? 'active' : ''}" data-emoji="${this.escapeHtml(emoji)}" title="${reactorsTitle}">
                    <span>${this.escapeHtml(emoji)}</span>
                    <span class="reaction-count">${count}</span>
                </button>
            `;
        }
        return html;
    },

    updateMessageReactions(msgId, reactionsMap, currentUsername, onReactClick) {
        const reactionsContainer = document.getElementById(`reactions-${msgId}`);
        if (!reactionsContainer) return;

        reactionsContainer.innerHTML = this.renderReactionsHtml(reactionsMap, currentUsername, msgId);

        reactionsContainer.querySelectorAll('.reaction-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                const em = pill.dataset.emoji;
                if (onReactClick) onReactClick(msgId, em);
            });
        });
    },

    appendSystemMessage(text) {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;

        const sysDiv = document.createElement('div');
        sysDiv.className = 'system-message';
        sysDiv.textContent = text;

        chatContainer.appendChild(sysDiv);
        this.scrollToBottom();
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

    // ==================== Lightbox ====================
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

    // ==================== Theme & Sound ====================
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

    initSound() {
        const savedSound = localStorage.getItem('campuschat_sound');
        this.soundEnabled = savedSound === 'true';
        this.updateSoundBtnUI();

        const soundBtn = document.getElementById('sound-toggle-btn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                this.soundEnabled = !this.soundEnabled;
                localStorage.setItem('campuschat_sound', this.soundEnabled);
                this.updateSoundBtnUI();
                if (this.soundEnabled) {
                    this.playNotificationSound();
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
            osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.15); // A5

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

    // ==================== Common Helpers ====================
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

    formatTime(rawTimestamp) {
        if (!rawTimestamp) return '';
        try {
            const date = new Date(rawTimestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    },

    escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

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

    scrollToBottom() {
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    },

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
        }).catch(() => {
            this.showToast('Could not copy address', 'error');
        });
    }
};

document.addEventListener('DOMContentLoaded', () => UI.init());
