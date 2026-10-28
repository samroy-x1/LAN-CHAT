# CampusChat: Comprehensive Technical Project Specification & Report Blueprint

> **Purpose of this document:**  
> This file contains the complete, authoritative technical specifications, architectural diagrams, data models, communication protocols, file structures, security measures, and testing methodologies for **CampusChat**.  
> **How to use with ChatGPT:** Copy and paste sections of this file or upload the entire file into ChatGPT along with the customized prompt templates provided in **Section 11** to generate your formal Academic Project Report, Software Requirement Specification (SRS), System Design Document (SDD), or Project Presentation (PPT).

---

## 1. Project Overview & Executive Summary

### 1.1 Project Title
**CampusChat: A High-Speed, Real-Time Local Network (LAN) Communication & Collaboration System**

### 1.2 Abstract / Executive Summary
Modern enterprise and academic environments heavily depend on cloud-hosted collaboration tools (e.g., Slack, Microsoft Teams, Discord, WhatsApp). While feature-rich, these cloud solutions require continuous high-speed internet connectivity, expose sensitive internal communications to third-party servers, consume external bandwidth, and suffer outages when local internet gateways fail. 

**CampusChat** solves this challenge by providing a lightweight, ultra-low-latency, zero-cloud communication and media-sharing platform operating purely over a Local Area Network (LAN or Wi-Fi). Developed using **Java 21**, **Spring Boot 3.3.2**, **Spring WebSocket with STOMP protocol**, and **vanilla HTML5/CSS3/JavaScript (ES6+)**, CampusChat enables instant text messaging, scoped channel discussions, private 1-on-1 direct conversations, rich emoji reactions, synthesized audio notifications, and multi-megabyte local file sharing (up to 500 MB) without touching an external server or cloud database. Automatic local IP discovery and server-side QR Code generation (ZXing) allow mobile and laptop clients to join instantly within seconds.

### 1.3 Problem Statement
1. **Internet Dependency:** Educational institutions, dormitories, examination centers, rural labs, and disaster-relief setups frequently experience network throttling, intermittent WAN outages, or strict firewall limits on external messaging ports.
2. **Data Privacy & Compliance:** Internal campus conversations, examination discussions, confidential research files, and administrative notices risk privacy exposure when sent to external cloud brokers.
3. **Bandwidth Inefficiency:** Uploading large project files, recordings, or software binaries (up to 500MB) to remote cloud servers only for peers on the same physical Wi-Fi router to download them saturates the uplink.
4. **Heavyweight Client Footprints:** Contemporary desktop/mobile clients require gigabytes of RAM (Electron-based applications) and complex multi-step user registration (email verification, phone numbers, OAuth).

### 1.4 Objectives of the Project
- **Zero Internet Requirement:** Eliminate WAN / public internet dependency; function seamlessly on an isolated Wi-Fi router or mobile hotspot.
- **Sub-Millisecond Real-Time Latency:** Deliver instant messages and typing indicators using WebSockets and the STOMP publish-subscribe protocol.
- **Frictionless Onboarding:** Instant username registration with duplicate validation, eliminating database logins and passwords.
- **Dual-Scope Communication:** Support both public topic-based channels (`#general`, `#study-group`, `#code-snippets`, `#random`, + custom user-created channels) and private 1-on-1 direct messaging (DM).
- **High-Throughput LAN File Sharing:** Enable local streaming transfers of documents, images, audio, video, archives, and code up to 500 MB with inline previews and lightbox integration.
- **Zero-Install Client:** Run directly in any modern mobile or desktop web browser with no app installation required.
- **Self-Contained Media & Audio:** Synthesize notification sounds dynamically via the Web Audio API without needing external MP3 audio asset files.

---

## 2. Technology Stack & Specifications

| Layer / Component | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Language** | Java (JDK) | 21 LTS | Modern LTS Java featuring virtual threads readiness, pattern matching, record-like clarity, and long-term stability. |
| **Backend Framework** | Spring Boot | 3.3.2 | Rapid microservice and web application scaffolding, embedded Tomcat server, dependency injection, and production-grade metric logging. |
| **Real-Time Protocol** | Spring WebSocket + STOMP | 3.3.2 | Asynchronous full-duplex WebSocket communication with an in-memory STOMP message broker (`/topic`, `/queue`). |
| **Web Layer** | Spring Web MVC | 3.3.2 | RESTful endpoints for network discovery, QR code generation, username validation, and multipart file transfers. |
| **JSON Serialization** | Jackson Databind & JSR310 | 2.17.x | High-performance JSON parsing and Java 8/Java 21 `LocalDateTime` serialization. |
| **QR Code Generation** | ZXing (Zebra Crossing) | 3.5.3 | Local server-side matrix generation of 250x250 PNG QR codes encoding the host machine's LAN URL. |
| **Storage Engine** | In-Memory (Java Concurrent Collections) + Local Disk | N/A | Thread-safe in-memory collections (`ConcurrentHashMap`, `CopyOnWriteArrayList`) for ultra-fast zero-latency operations without external DB overhead. Local disk directory (`./uploads`) for binary files. |
| **Frontend Structure** | HTML5 (Semantic) | Semantic | Accessible, standards-compliant layout featuring modals, floating popovers, and mobile navigation drawers. |
| **Frontend Styling** | Vanilla CSS3 | Custom Properties | Glassmorphism, CSS grid & flexbox, custom scrollbars, animated keyframes, and instant Dark/Light theme switching via CSS variables. |
| **Frontend Logic** | Vanilla JavaScript | ES6+ (Native) | Zero external JavaScript framework overhead (No React, Angular, or Vue bloat). Fast DOM operations and reactive event listeners. |
| **WebSocket Client** | SockJS & STOMP.js | Embedded Minified | Embedded SockJS (1.6.1) fallback layer and STOMP client over WebSocket (`/ws` and `/ws-raw`). |
| **Audio Engine** | Web Audio API | HTML5 Native | Programmatic frequency synthesis (dual-tone chime: 587.33 Hz [D5] to 880 Hz [A5]) without fetching audio files. |
| **Build & Dependency Tool** | Apache Maven | 3.8+ | Standardized dependency management, compilation, and package lifecycle. |
| **Testing Framework** | JUnit 5 + Mockito + MockMvc | 5.10.x | Unit testing business invariants, validation boundaries, and REST API controller mock testing. |

---

## 3. System Architecture & Engineering Design

### 3.1 Architectural Style
CampusChat implements a **Layered Architecture combined with an Asynchronous Publish/Subscribe Event-Driven Model**:
1. **Presentation Layer (Client Browser):** Single Page Application (SPA) communicating via bidirectional WebSocket frames (STOMP) and HTTP REST calls.
2. **Transport & Controller Layer:** `WebSocketConfig`, `ChatController`, `FileController`, and `ServerInfoController`.
3. **Service & Business Logic Layer:** `ChatService` (state & message routing), `FileStorageService` (disk I/O & file validation), and `NetworkService` (NIC discovery & QR generation).
4. **Data & Storage Layer:** In-memory thread-safe queues and local file system directory storage.

### 3.2 High-Level Architecture Diagram

```
+-------------------------------------------------------------------------+
|                      Client Devices on LAN / Wi-Fi                      |
|       (Laptops, Desktops, Android Smartphones, iPhones, Tablets)        |
+------------------------------------+------------------------------------+
                                     |
                [HTTP REST]          |          [WebSocket / STOMP]
          (Upload / Download / Info) |          (Chat / Reactions / Typing)
                                     v
+-------------------------------------------------------------------------+
|                   Spring Boot Application (Port 8080)                   |
|                                                                         |
|  +----------------------------+     +--------------------------------+  |
|  |    REST Controllers        |     |      STOMP WebSocket Engine    |  |
|  | - ServerInfoController     |     | - WebSocketConfig              |  |
|  | - FileController           |     | - ChatController               |  |
|  | - GlobalExceptionHandler   |     | - WebSocketEventListener       |  |
|  +--------------+-------------+     +---------------+----------------+  |
|                 |                                   |                   |
|                 v                                   v                   |
|  +----------------------------+     +--------------------------------+  |
|  |      NetworkService        |     |          ChatService           |  |
|  | - Auto-Detect LAN IP       |     | - Concurrent User State        |  |
|  | - ZXing QR Generator       |     | - Channel & DM Message Queues  |  |
|  +----------------------------+     | - Reaction State & HTML Escape |  |
|                                     +--------------------------------+  |
|  +----------------------------+                     |                   |
|  |     FileStorageService     |                     |                   |
|  | - Path Traversal Check     |                     |                   |
|  | - MIME Type Categorization |                     |                   |
|  +--------------+-------------+                     |                   |
+-----------------|-----------------------------------|-------------------+
                  v                                   v
+---------------------------------+   +-----------------------------------+
|      Local Disk Storage         |   |      In-Memory RAM Store          |
|    (./uploads directory)        |   |   (Circular History Buffers)      |
+---------------------------------+   +-----------------------------------+
```

### 3.3 Network Topology & Zero-Internet Operation
```
                  [Wi-Fi Router or Smartphone Hotspot]
                      (No Internet Connection Required)
                      Subnet: 192.168.1.0/24 or 10.0.0.0/8
                                   |
        +--------------------------+--------------------------+
        |                                                     |
+-------v-------+                                     +-------v-------+
|  Host Server  | (IP: 192.168.1.15:8080)             | Client Mobile |
| Laptops/PC    |                                     | Phone Browser |
| Spring Boot   | <=================================> | Scans QR Code |
+---------------+       Zero-WAN Local Traffic        +---------------+
```

---

## 4. Detailed Functional Modules & Capabilities

### Module 1: Zero-Config LAN Discovery & Access
- **Intelligent NIC Auto-Detection:** Automatically enumerates system `NetworkInterface` objects. Skips virtual/tunnel interfaces (`utun`, `docker`, `vbox`, `vmnet`, `awdl`, `bridge`) and binds to the primary physical adapter (`en0`, `wlan0`, `eth0`).
- **Server-Side QR Code Engine:** ZXing generates an in-memory PNG QR matrix encoding `http://<SERVER_IP>:8080`. Mobile users simply scan the QR code to open the web app instantly.
- **Firewall & Hotspot Guidance:** Integrated UI modal providing specific instructions for bypassing OS firewalls (macOS, Windows Defender, Linux `ufw`) and handling Wi-Fi Access Point (AP) Isolation via mobile hotspot workarounds.

### Module 2: User Onboarding & Real-Time Presence
- **Sanitized Username Validation:** Validates length (2 to 20 chars) and allows alphanumeric characters, spaces, hyphens, and underscores (`^[a-zA-Z0-9 _-]+$`).
- **Pre-Flight Validation REST API:** `POST /api/validate-username` tests username availability before opening WebSocket connections.
- **Session Lifecycle & Auto-Eviction:** Listens to `SessionDisconnectEvent`. When a socket disconnects, the user is removed from `activeUsersBySession`, and a `LEAVE` system broadcast accompanied by an updated `USERS_UPDATE` payload is dispatched.

### Module 3: Scoped Channel-Based Group Messaging
- **Default System Channels:** Pre-seeded channels include:
  - `#general`: Public campus-wide discussions and announcements.
  - `#study-group`: Homework help, assignments, exam preparation & study materials.
  - `#code-snippets`: Programming questions, coding solutions & tech sharing.
  - `#random`: Casual conversations, memes, music & campus life.
- **Dynamic Channel Creation:** Any user can create custom channels (`#hackathon-2026`, `#project-team-a`) with name formatting (`/^[a-zA-Z0-9 _-]+$/` mapped to lowercase slugs) and descriptions.
- **Segregated Circular In-Memory History:** Keeps the latest 100 messages per channel in a `CopyOnWriteArrayList`. When new peers join, the recent channel history is pushed directly to `/user/queue/history`.

### Module 4: 1-on-1 Direct Messaging (Private DMs)
- **Direct Point-to-Point Messaging:** Messages sent to a target recipient are not broadcast to `/topic/public`.
- **Targeted Session Routing:** Spring's `messagingTemplate.convertAndSendToUser()` delivers the payload exclusively to the active WebSocket session IDs belonging to the recipient and sender.
- **Symmetric Conversation Keys:** DM history is indexed symmetrically via `getDmConversationKey(userA, userB)`: alphabetically sorting names (`"dm:" + min(a,b) + ":" + max(a,b)`), guaranteeing seamless retrieval regardless of who initiated the conversation.

### Module 5: Real-Time Typing Indicators
- **Debounced Scoped Events:** Tracks keyboard input events with a 300ms debounce.
- **Channel Scoping:** Shows `"[User] is typing..."` only to participants currently viewing the relevant channel.
- **Private DM Typing:** Delivers typing notifications strictly to the target recipient's private session queue without exposing activity to public topics.

### Module 6: Live Message Reactions
- **Interactive Reaction Bar:** Quick reaction buttons (`👍`, `❤️`, `😂`, `🔥`, `🚀`) on every message bubble.
- **Thread-Safe Reaction Toggling:** Synchronized message block updates a concurrent map (`Map<String, List<String>> reactions`). Clicking an existing reaction toggles the user's vote on or off.
- **Live Pill Counters:** Messages dynamically display animated reaction counters displaying total counts and active highlighting for the current user.

### Module 7: Categorized Emoji Picker & Search
- **Categorized Taxonomy:** Organized into 6 tabs:
  1. 😃 **Smileys:** 50+ facial expressions and emotions.
  2. 👍 **Gestures:** Hands, thumbs up/down, claps, peace, flexes.
  3. 🎓 **Campus & Tech:** Laptops, code brackets, books, graduation caps, rockets, trophies.
  4. ❤️ **Hearts:** Multi-colored hearts, sparks, stars.
  5. 🎉 **Fun & Activities:** Confetti, video games, guitars, sports.
  6. 🍕 **Food & Drinks:** Pizza, burgers, ramen, coffee.
- **Real-Time Substring Search:** Filter emojis by keywords (e.g. typing "code" highlights 💻, ⌨️).

### Module 8: High-Throughput LAN File Sharing (Up to 500MB)
- **Zero Cloud Ingestion:** Multipart HTTP upload streams directly to `./uploads` on host storage.
- **Path Traversal Protection:** File names are stripped of relative path components (`..`, `/`, `\`).
- **MIME & Extension Categorization:** Automatically categorized into `image`, `video`, `audio`, `document`, `archive`, `code`, and `other`.
- **Inline Previews & Lightbox:**
  - **Images:** Rendered inline as clickable responsive thumbnails opening in a full-screen Lightbox modal.
  - **Videos:** Embedded HTML5 `<video controls>` player.
  - **Audio:** Embedded HTML5 `<audio controls>` player.
  - **Documents & Code:** File badge displaying formatted size (KB, MB, GB), download button, and preview link.
- **Live Upload Progress:** Client XMLHttpRequest tracks progress percentage (`upload.onprogress`) and displays an animated progress bar.

### Module 9: Dual-Scope Notification Badges & Pure Web Audio
- **Unread Badge Counters:** Tracks unseen messages per channel and per DM contact. Red numeric pill updates in real time and clears upon selecting that chat.
- **Synthesized Notification Chime:** Implements HTML5 `AudioContext` with an exponential decay envelope:
  - Tone 1: 587.33 Hz (Note D5) decaying over 0.15s.
  - Tone 2: 880.00 Hz (Note A5) decaying over 0.35s.
  - Mute/Unmute state persisted in `localStorage`.

### Module 10: Premium Responsive UI & Dark/Light Themes
- **Modern Typography:** Uses Google Fonts Outfit and Plus Jakarta Sans.
- **Responsive Layout:** Adaptive desktop multi-column view and mobile off-canvas drawer navigation.
- **Theme Switcher:** Seamless CSS variable switching stored in `localStorage.getItem('campuschat_theme')`.

---

## 5. Software Architecture & File-by-File Breakdown

```
LAN CHAT_JAVA/
├── pom.xml                                  # Maven dependencies (Spring Boot, WebSocket, ZXing)
├── README.md                                # Quickstart & user documentation
├── uploads/                                 # Runtime directory for shared LAN files
└── src/
    ├── main/
    │   ├── java/com/campuschat/
    │   │   ├── CampusChatApplication.java   # Spring Boot entry point (@SpringBootApplication)
    │   │   ├── config/
    │   │   │   └── WebSocketConfig.java     # Configures /ws STOMP broker, /topic, /queue
    │   │   ├── controller/
    │   │   │   ├── ChatController.java      # Handles @MessageMapping routes (chat, typing, DMs, reactions)
    │   │   │   ├── FileController.java      # REST endpoints for file upload, download & preview
    │   │   │   └── ServerInfoController.java# REST endpoints for LAN IP, QR code & username validation
    │   │   ├── exception/
    │   │   │   ├── ChatException.java       # Custom runtime business exception
    │   │   │   └── GlobalExceptionHandler.java # @ControllerAdvice handling errors safely
    │   │   ├── model/
    │   │   │   ├── Channel.java             # Channel POJO (id, name, description, createdBy)
    │   │   │   ├── ChatMessage.java         # Master message DTO with MessageType enum
    │   │   │   ├── FileMetadata.java        # File metadata DTO (fileId, size, category, MIME)
    │   │   │   ├── ServerInfo.java          # Server status DTO (ipAddress, port, serverUrl)
    │   │   │   └── User.java                # Connected peer POJO (username, sessionId, joinedAt)
    │   │   ├── service/
    │   │   │   ├── ChatService.java         # Core business logic, memory store, validation, HTML sanitize
    │   │   │   ├── FileStorageService.java  # File disk I/O, security sanitization, MIME classification
    │   │   │   └── NetworkService.java      # Physical NIC discovery, private IP filtering, ZXing QR generator
    │   │   └── websocket/
    │   │       └── WebSocketEventListener.java # SessionDisconnectEvent listener for cleanup
    │   └── resources/
    │       ├── application.properties       # Server port (8080), upload bounds (500MB), logging
    │       └── static/                      # Frontend Single Page Web Application
    │           ├── index.html               # Semantic HTML markup (Join Screen, Chat Screen, Modals)
    │           ├── css/
    │           │   └── style.css            # Complete design system tokens, responsive CSS, themes
    │           ├── js/
    │           │   ├── app.js               # Application state orchestrator & DOM event coordinator
    │           │   ├── ui.js                # UI rendering engine, emoji catalog, Web Audio synthesizer
    │           │   ├── websocket.js         # STOMP/SockJS client lifecycle, reconnection, routing
    │           │   ├── sockjs.min.js        # Embedded SockJS fallback library
    │           │   └── stomp.min.js         # Embedded STOMP protocol client library
    │           └── assets/
    │               └── logo.svg             # Vector branding asset
    └── test/java/com/campuschat/
        ├── ChatServiceTest.java             # Unit tests for username, sanitization, channels & history
        └── ChatControllerTest.java          # MockMvc web layer integration tests
```

### Detailed Component Specifications

#### 1. `WebSocketConfig.java`
- Implements `WebSocketMessageBrokerConfigurer`.
- Configures in-memory message broker with destination prefixes `/topic` (broadcasts) and `/queue` (user-specific deliveries).
- Sets application prefix `/app` for incoming `@MessageMapping` handlers.
- Sets user destination prefix `/user` for private direct messaging.
- Exposes two endpoints:
  - `/ws`: SockJS enabled with wildcard origin patterns (`*`) for cross-device LAN access.
  - `/ws-raw`: Standard native WebSocket protocol endpoint.

#### 2. `ChatController.java`
- `@MessageMapping("/chat.addUser")`: Registers connected peer, broadcasts `JOIN` event to `/topic/public`, announces updated user/channel lists, and transmits existing `#general` history to `/user/queue/history`.
- `@MessageMapping("/chat.sendChannelMessage")`: Validates and sanitizes message content, updates circular history buffer, and broadcasts to `/topic/channel/{channelId}` and `/topic/public` for badge alerts.
- `@MessageMapping("/chat.sendPrivateMessage")`: Verifies sender and recipient, stores in symmetric DM history buffer, and routes exclusively to recipient and sender session queues via `messagingTemplate.convertAndSendToUser()`.
- `@MessageMapping("/chat.createChannel")`: Creates custom channels, validates name formatting, seeds history buffer, and notifies all peers.
- `@MessageMapping("/chat.getHistory")`: Retrieves up to 100 recent messages for the active channel or private conversation.
- `@MessageMapping("/chat.reactMessage")`: Handles emoji reaction toggling and broadcasts updated reaction state.
- `@MessageMapping("/chat.typing")`: Forwards typing events to the relevant channel topic or target DM recipient.

#### 3. `FileController.java`
- `@PostMapping("/api/files/upload")`: Accepts `MultipartFile`, sanitized sender, and target channel/recipient. Saves binary to disk, compiles `FileMetadata`, and generates a `FILE` type `ChatMessage`.
- `@GetMapping("/api/files/download/{fileId}")`: Returns binary with `Content-Disposition: attachment; filename="..."`.
- `@GetMapping("/api/files/preview/{fileId}")`: Returns media stream with `Content-Disposition: inline; filename="..."` for embedded browser playback.

#### 4. `ServerInfoController.java`
- `@GetMapping("/api/info")`: Returns JSON payload with detected local IP, port, server URL, active user count, and status.
- `@GetMapping("/api/qr")`: Calls `NetworkService.generateQrCodeImage()`, returning a 250x250 PNG image stream.
- `@PostMapping("/api/validate-username")`: Pre-validates username uniqueness and character compliance before socket connection.

#### 5. `ChatService.java`
- **State Collections:**
  - `Map<String, User> activeUsersBySession`: Map of active sessions to user objects.
  - `Map<String, Channel> channels`: Map of channel IDs to channel objects.
  - `Map<String, CopyOnWriteArrayList<ChatMessage>> channelHistories`: Per-channel message histories.
  - `Map<String, CopyOnWriteArrayList<ChatMessage>> dmHistories`: Per-DM pair message histories.
- **Security Sanitization:** `sanitizeHtml()` encodes `<`, `>`, `&`, `"`, and `'` to protect against Cross-Site Scripting (XSS).
- **History Clamping:** Limits buffers to 100 messages (`MAX_HISTORY_SIZE`) to maintain fixed memory boundaries.

#### 6. `FileStorageService.java`
- Reads target upload directory from `app.upload.dir` (`./uploads`).
- Ensures target directory exists on startup via `@PostConstruct init()`.
- Generates unique stored filenames: `UUID.randomUUID().toString() + "_" + cleanOriginalFilename`.
- Prevents directory traversal attacks by validating that resolved paths remain children of `fileStorageLocation`.
- Classifies files into 7 categories based on extensions and MIME types: `image`, `video`, `audio`, `document`, `archive`, `code`, and `other`.

#### 7. `NetworkService.java`
- Filters active IPv4 non-loopback addresses from all physical network interfaces.
- Prioritizes interfaces starting with `en` (macOS/Linux Ethernet/Wi-Fi), `wlan` (Linux Wi-Fi), and `eth` (Ethernet).
- Verifies addresses against private IP ranges (`192.168.0.0/16`, `10.0.0.0/8`, `172.16.0.0/12`).
- Uses ZXing `QRCodeWriter` and `MatrixToImageWriter` to produce standard byte streams for QR codes.

#### 8. `ChatMessage.java` (Data Transfer Model)
- **Supported `MessageType` values:**
  - `CHAT`, `CHANNEL_CHAT`, `PRIVATE_CHAT`, `JOIN`, `LEAVE`, `TYPING`, `SYSTEM`, `USERS_UPDATE`, `CHANNEL_LIST`, `CREATE_CHANNEL`, `HISTORY`, `FILE`, `REACTION`, `ERROR`.
- **Payload Fields:**
  - `id` (String UUID)
  - `sender` (String)
  - `recipient` (String, nullable)
  - `channelId` (String, nullable)
  - `message` (String)
  - `timestamp` (ISO-8601 String)
  - `type` (MessageType enum)
  - `onlineUsers` (List<User>)
  - `channels` (List<Channel>)
  - `history` (List<ChatMessage>)
  - `isTyping` (Boolean)
  - `fileMetadata` (FileMetadata object)
  - `targetMessageId` (String for reactions)
  - `reactionEmoji` (String)
  - `reactions` (`Map<String, List<String>>`)

---

## 6. Communication Protocols & STOMP Message Contracts

### 6.1 STOMP Broker Topics & Destinations

| Destination | Direction | Payload Type | Description |
| :--- | :--- | :--- | :--- |
| `/app/chat.addUser` | Client -> Server | `ChatMessage (JOIN)` | Initial handshake to register username and session. |
| `/app/chat.sendChannelMessage` | Client -> Server | `ChatMessage (CHANNEL_CHAT)` | Send message to a specific channel. |
| `/app/chat.sendPrivateMessage` | Client -> Server | `ChatMessage (PRIVATE_CHAT)` | Send direct message to a peer. |
| `/app/chat.createChannel` | Client -> Server | `ChatMessage (CREATE_CHANNEL)` | Create a new custom discussion channel. |
| `/app/chat.getHistory` | Client -> Server | `ChatMessage (HISTORY)` | Request history for a channel or DM pair. |
| `/app/chat.reactMessage` | Client -> Server | `ChatMessage (REACTION)` | Toggle an emoji reaction on a message. |
| `/app/chat.typing` | Client -> Server | `ChatMessage (TYPING)` | Transmit typing state indicator. |
| `/topic/public` | Server -> All Clients | `ChatMessage (JOIN, LEAVE, USERS_UPDATE)` | Public room events and presence updates. |
| `/topic/channel/{channelId}` | Server -> Channel Peers | `ChatMessage (CHANNEL_CHAT, REACTION, TYPING)` | Real-time messages within a specific channel. |
| `/user/queue/messages` | Server -> Specific Peer | `ChatMessage (PRIVATE_CHAT, REACTION, TYPING)` | Private messages delivered to recipient and sender. |
| `/user/queue/history` | Server -> Specific Peer | `ChatMessage (HISTORY)` | Historical messages delivered upon room entry. |
| `/user/queue/errors` | Server -> Specific Peer | `ChatMessage (ERROR)` | Validation errors returned to the initiating session. |

### 6.2 REST API Specification

| HTTP Method | Endpoint | Request Body / Params | Response Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/info` | None | `ServerInfo` JSON | Retrieves server IP, active port, full URL, and user count. |
| `GET` | `/api/qr` | None | `image/png` (binary stream) | Generates and serves dynamic QR code for host URL. |
| `POST` | `/api/validate-username` | `{"username": "Sam"}` | `{"valid": true, "sanitizedUsername": "Sam"}` | Pre-validates username before WebSocket handshake. |
| `POST` | `/api/files/upload` | `multipart/form-data` (`file`, `sender`, `channelId`, `recipient`) | `FileMetadata` JSON | Uploads file to local disk and triggers STOMP message. |
| `GET` | `/api/files/download/{fileId}` | Path variable `fileId` | Binary Stream (`Content-Disposition: attachment`) | Downloads file with original name and MIME type. |
| `GET` | `/api/files/preview/{fileId}` | Path variable `fileId` | Media Stream (`Content-Disposition: inline`) | Streams media for inline browser playback or preview. |

---

## 7. Security, Invariants & Performance Engineering

1. **Zero Internet Exfiltration:** The application operates strictly on the private subnet. No telemetry, third-party analytics, cloud CDN dependencies, or external API calls are made.
2. **Double-Layer XSS Protection:**
   - **Backend:** `ChatService.sanitizeHtml()` escapes raw HTML strings before messages are saved to history or pushed to WebSocket brokers.
   - **Frontend:** `ui.js` renders message content via safe DOM assignment (`textContent`) and regex parsing for URL auto-linking, preventing injected `<script>` tags from executing.
3. **Strict Path Traversal Defenses:** `FileStorageService` cleans file paths using `StringUtils.cleanPath()` and strips all instances of `..`, `/`, and `\`. An assertion confirms that `targetLocation.getParent().equals(fileStorageLocation)`.
4. **Memory Leak Mitigation:**
   - Channel and DM message buffers are capped at a maximum of 100 entries (`MAX_HISTORY_SIZE = 100`). Older entries are evicted using FIFO ordering.
   - Message payloads are constrained to 500 characters (`MAX_MESSAGE_LENGTH = 500`).
   - File uploads are capped at 500MB via `spring.servlet.multipart.max-file-size=500MB`.
5. **Thread Safety & Concurrency:** All shared application states use concurrent collections (`ConcurrentHashMap`, `CopyOnWriteArrayList`). Reaction toggles synchronize on the specific target message instance to avoid race conditions.

---

## 8. Verification & Testing Methodologies

### 8.1 Automated Unit & Integration Tests

The test suite covers validation boundaries, business logic, and API controllers:

- **`ChatServiceTest.java` (Unit Tests):**
  - `testValidUsername`: Verifies acceptance of standard usernames (e.g., `Sam_123`).
  - `testTooShortUsername` & `testTooLongUsername`: Enforces the 2–20 character limits.
  - `testInvalidCharacterUsername`: Confirms rejection of illegal characters (e.g., `Sam@World!`).
  - `testDuplicateUsername`: Validates case-insensitive duplicate username rejection.
  - `testHtmlSanitization`: Confirms conversion of `<script>alert('xss')</script>` into escaped HTML entities.
  - `testEmptyMessage` & `testLongMessage`: Tests rejection of empty strings and messages exceeding 500 characters.
  - `testUserLifecycle`: Verifies user registration, counter increments, and cleanup on disconnect.
  - `testDefaultChannels`: Confirms initialization of `#general`, `#study-group`, `#code-snippets`, and `#random`.
  - `testCustomChannelCreation`: Tests slugification of custom channel names (e.g., `Hackathon Team` -> `hackathon-team`).
  - `testPrivateMessaging`: Validates DM routing and history isolation.
  - `testToggleReaction`: Confirms adding, toggling, and removing user reactions.

- **`ChatControllerTest.java` (MockMvc Web Layer Tests):**
  - `testGetServerInfo`: Asserts `GET /api/info` returns HTTP 200 with the correct IP, port, and status fields.
  - `testValidateUsernameSuccess`: Verifies `POST /api/validate-username` correctly validates and sanitizes input.

### 8.2 Execution Instructions
Run the entire automated test suite using Maven:
```bash
mvn clean test
```

---

## 9. Installation, Deployment & User Operation Guide

### 9.1 Prerequisites
- **Java Development Kit (JDK):** Version 21 LTS or later.
- **Apache Maven:** Version 3.8+ (or use the included wrapper if present).
- **Network Interface:** Active connection to a Wi-Fi router, LAN switch, or personal mobile hotspot.

### 9.2 Build and Run Commands
1. Navigate to the project root:
   ```bash
   cd "/Users/samstanleya/develop/LAN CHAT_JAVA"
   ```
2. Compile and package the application:
   ```bash
   mvn clean package -DskipTests
   ```
3. Start the Spring Boot server:
   ```bash
   mvn spring-boot:run
   ```
   *The server starts on port `8080`, accessible at `http://localhost:8080` locally.*

### 9.3 Connecting Across the Local Network (LAN)
1. **Identify the Server IP:**
   - The application automatically logs its detected LAN IP upon startup (e.g., `192.168.1.15`).
   - You can also retrieve the IP via terminal:
     - **macOS / Linux:** `ifconfig` or `ip addr` (look for `en0` or `wlan0`).
     - **Windows:** `ipconfig` (look for Wireless LAN adapter IPv4).
2. **Accessing from Client Devices:**
   - Ensure the client device is connected to the same Wi-Fi or mobile hotspot.
   - Open a browser on the client and enter `http://<SERVER_IP>:8080`.
   - Alternatively, click **📡 Server Info** on the host desktop and scan the generated **QR Code** using any mobile camera.

### 9.4 Firewall Rules (Port 8080)
If client devices cannot reach the server:
- **macOS:** System Settings > Network > Firewall > Enable incoming connections for Java.
- **Windows Defender:** Windows Defender Firewall > Advanced Settings > Inbound Rules > New Rule > Port > TCP 8080 > Allow the connection.
- **Linux:** `sudo ufw allow 8080/tcp`.
- **AP Isolation:** Some public or university Wi-Fi networks block device-to-device traffic (Access Point Isolation). To bypass this, activate a mobile hotspot on a phone, connect the host computer and client devices to it, and resume communication.

---

## 10. Future Scope & Roadmap

While CampusChat provides a complete, production-ready LAN collaboration suite, potential future enhancements include:
1. **Optional Database Persistence:** Integrating an embedded database (such as H2, SQLite, or SQLite-JDBC) or external relational engines (PostgreSQL/MySQL) for long-term historical message archival across server restarts.
2. **End-to-End Encryption (E2EE):** Implementing client-side Web Crypto API key exchanges (Diffie-Hellman / WebCrypto AES-GCM) for encrypted private messaging across untrusted local networks.
3. **WebRTC Voice & Video Calling:** Leveraging the existing WebSocket signaling channel to negotiate peer-to-peer WebRTC audio/video calls and real-time screen sharing over the local network.
4. **Interactive Collaborative Whiteboard:** A shared HTML5 Canvas module allowing simultaneous diagramming, note-taking, and brainstorming during campus study sessions.

---

## 11. Copy-and-Paste Prompts for Generating Report Content in ChatGPT

Use the prompt templates below with ChatGPT to quickly generate specific chapters or documents for your project report. Simply copy a prompt, paste it into ChatGPT, and reference or include this specification file.

---

### Prompt 1: Comprehensive Academic Project Report (Chapters 1 to 7)

```text
I am submitting an academic project report for my computer science project titled "CampusChat: A High-Speed, Real-Time Local Network (LAN) Communication & Collaboration System".

I have provided the complete technical details, architecture, data models, protocols, and implementation specifics in the reference document.

Please generate a formal, academic-grade Project Report containing the following chapters, written in an authoritative, technical style with clear headings, detailed explanations, bullet points, and tables:

1. CHAPTER 1: INTRODUCTION
   - Background and Motivation
   - Problem Statement
   - Project Objectives and Scope
   - Organization of the Report

2. CHAPTER 2: LITERATURE SURVEY & EXISTING SYSTEMS
   - Review of Cloud-Based Collaboration Platforms (Slack, Teams, Discord, WhatsApp)
   - Limitations of Existing Systems (Internet dependency, privacy leaks, WAN bandwidth saturation)
   - Proposed System and Key Differentiators

3. CHAPTER 3: SYSTEM REQUIREMENT SPECIFICATION (SRS)
   - Functional Requirements (User onboarding, channels, 1-on-1 DMs, file sharing, reactions, typing, presence, QR code)
   - Non-Functional Requirements (Latency, security, reliability, usability, zero internet dependency)
   - Hardware and Software Requirements (Server and Client environments)

4. CHAPTER 4: SYSTEM ARCHITECTURE & DESIGN
   - Architectural Overview (Layered Client-Server + Pub/Sub WebSocket model)
   - System Architecture Diagram (described in detail)
   - Network Topology (LAN / Wi-Fi / Hotspot setup)
   - Concurrency & Thread-Safety Model (ConcurrentHashMap, CopyOnWriteArrayList)
   - Database / In-Memory Data Storage Design

5. CHAPTER 5: MODULES & IMPLEMENTATION DETAILS
   - Auto-Detection of LAN IP and Server-Side QR Code (ZXing)
   - WebSocket STOMP Messaging & Real-Time Channel / Private Message Routing
   - Scoped Typing Indicators and Emoji Reactions
   - High-Throughput LAN File Sharing Engine (MIME categorization, security, lightbox)
   - Synthesized Web Audio Notification System
   - Security Implementation (Double-layer XSS sanitization, path traversal prevention)

6. CHAPTER 6: TESTING & RESULTS
   - Unit Testing Strategy (JUnit 5 & Mockito test cases)
   - Controller MockMvc Integration Testing
   - LAN Multi-Device Test Scenarios and Performance Observations

7. CHAPTER 7: CONCLUSION & FUTURE SCOPE
   - Summary of Work Done
   - Limitations
   - Future Enhancements (E2EE, WebRTC, Whiteboard)
   - References / Bibliography

Ensure the tone is academic, thorough, and ready for inclusion in my final degree project report submission.
```

---

### Prompt 2: Software Requirement Specification (SRS) Document (IEEE Standard)

```text
Act as a Senior Software Systems Architect. Based on the technical documentation provided for "CampusChat", generate a formal, comprehensive Software Requirement Specification (SRS) document adhering to the IEEE 830-1998 standard.

Include:
1. INTRODUCTION
   1.1 Purpose
   1.2 Document Conventions
   1.3 Intended Audience and Reading Suggestions
   1.4 Project Scope
   1.5 References
2. OVERALL DESCRIPTION
   2.1 Product Perspective
   2.2 Product Features
   2.3 User Classes and Characteristics
   2.4 Operating Environment
   2.5 Design and Implementation Constraints
   2.6 User Documentation
   2.7 Assumptions and Dependencies
3. SYSTEM FEATURES & FUNCTIONAL REQUIREMENTS
   (Organize into detailed functional blocks with inputs, processing, outputs, and validation rules:
    - User Authentication & Session Tracking
    - Public Channels & Dynamic Channel Provisioning
    - Private 1-on-1 Direct Messaging
    - Real-Time Message Reactions & Typing Indicators
    - LAN File Transfer Engine
    - Server Discovery & QR Generation)
4. EXTERNAL INTERFACE REQUIREMENTS
   4.1 User Interfaces (UI Layout, Dark/Light Themes, Mobile Drawer)
   4.2 Hardware Interfaces (NIC, Wi-Fi 802.11 b/g/n/ac/ax)
   4.3 Software Interfaces (Spring Boot, Tomcat, Java 21, Browser Web APIs)
   4.4 Communications Interfaces (WebSocket, STOMP, HTTP/1.1 REST)
5. NON-FUNCTIONAL REQUIREMENTS
   5.1 Performance Requirements (Latency, message throughput)
   5.2 Safety & Security Requirements (XSS, path traversal, LAN isolation)
   5.3 Software Quality Attributes (Reliability, Availability, Maintainability, Portability)
```

---

### Prompt 3: High-Level & Low-Level Design (HLD & LLD) Document

```text
Act as a Principal Software Engineer. Using the technical specifications for "CampusChat", write a comprehensive High-Level Design (HLD) and Low-Level Design (LLD) document for software engineering review.

Include:
1. HIGH-LEVEL DESIGN (HLD):
   - System Context Diagram and Data Flow Diagram (DFD Level 0 and Level 1)
   - Publish/Subscribe Broker Architecture (STOMP destinations: /topic, /queue, /app, /user)
   - Network Interface Discovery Mechanism
   - Multi-Device LAN Communication Topology

2. LOW-LEVEL DESIGN (LLD):
   - Detailed Class Specifications: Methods, attributes, visibility, and responsibilities for:
     * ChatService, NetworkService, FileStorageService
     * ChatController, FileController, ServerInfoController
     * ChatMessage, User, Channel, FileMetadata, ServerInfo
     * WebSocketEventListener
   - Sequence Diagrams (provide detailed text-based step-by-step sequences for):
     * User Join and Session Initialization
     * Sending a Channel Message vs Sending a Private DM
     * Adding an Emoji Reaction
     * File Upload and Download flow
   - Data Structures & Concurrency Controls (Locks, Thread Safety, Buffer Limits)
```

---

### Prompt 4: Project Presentation (PPT) Slide Outline & Speaker Script

```text
I need to present my final year project "CampusChat: Real-Time Local Network (LAN) Communication & Collaboration System" to an evaluation panel of professors.

Based on the technical documentation provided, generate a 12-Slide PowerPoint Presentation Deck Outline.

For each slide, provide:
1. Slide Title
2. Bulleted Slide Content (Concise, high-impact points)
3. Visual / Diagram Suggestion (What graphic, screenshot, or architecture diagram to show)
4. Speaker Script / Talking Points (What I should explain verbally to the examiners in clear, technical terms)

Cover:
- Slide 1: Title & Team Credentials
- Slide 2: The Problem with Modern Cloud Messaging
- Slide 3: The CampusChat Solution & Vision
- Slide 4: Key Features at a Glance
- Slide 5: System Architecture & Data Flow
- Slide 6: Technology Stack & Technical Choices
- Slide 7: LAN Discovery & Server-Side QR Code Engine
- Slide 8: 1-on-1 Direct Messaging & Dynamic Channels
- Slide 9: High-Speed LAN File Sharing & Inline Media
- Slide 10: Security, Sanitization & Concurrency Handling
- Slide 11: Testing & Results Verification
- Slide 12: Conclusion & Future Roadmap
```
