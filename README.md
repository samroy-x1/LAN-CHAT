# CampusChat - Real-Time Local Network (LAN) Chat

CampusChat is a real-time, zero-internet local area network (LAN) chat web application designed for campus environments, offices, dorms, and local gatherings. Built with **Java 21**, **Spring Boot**, **WebSockets (STOMP)**, and vanilla **HTML5/CSS3/JavaScript**, it allows multiple users connected to the same Wi-Fi or wired network to communicate instantaneously without relying on any external cloud services or databases.

---

## 🌟 Key Features

- 🌐 **Zero Internet Dependency**: Operates entirely within your local network (LAN / Wi-Fi).
- 💬 **Topic Channels**: Default channels (`#general`, `#study-group`, `#code-snippets`, `#random`) plus dynamic custom channel creation.
- 👤 **1-on-1 Direct Messaging (DMs)**: Private, point-to-point messaging between peers with isolated conversation history and private typing alerts.
- ⚡ **Real-Time STOMP Messaging**: Instantaneous delivery powered by Spring WebSocket STOMP broker.
- 😀 **Interactive Emoji Picker**: Categorized emoji popover with instant search (Smileys, Gestures, Campus/Tech, Hearts, Fun, Food).
- 🔥 **Live Message Reactions**: Quick emoji reaction bar (👍, ❤️, 😂, 🔥, 🚀) and toggleable animated reaction pill counters on message bubbles.
- 🔴 **Unread Notification Badges**: Real-time unread badge counters on both channels and private DM peers.
- 📁 **High-Speed LAN File Sharing**: Scoped drag-and-drop file transfers (up to 500MB) for channels and private DMs with inline media previews.
- 🟢 **Live Online Presence**: Dynamic online peer list with status indicators and self-identification.
- ✍️ **Scoped Typing Indicators**: Real-time debounce typing notifications scoped to the active channel or private recipient.
- 📡 **Local IP Auto-Detection & QR Code**: Auto-detects server LAN IP (`192.168.x.x` or `10.x.x.x`) and generates a server-side QR Code for instant mobile access.
- 📜 **Isolated In-Memory History**: Retains the latest 100 messages segregated per channel and per 1-on-1 conversation.
- 🔊 **Synthesized Notification Sounds**: Pure Web Audio API synthesized chimes with mute/unmute control.
- 🌙 **Dark / Light Theme Switcher**: Toggle theme with preference saved in `localStorage`.
- 🔒 **Security & XSS Sanitization**: Double-layer server & client HTML sanitization, duplicate username eviction, and input boundaries.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Browsers (LAN / Wi-Fi)               │
│        (Desktop / Laptop / Android Phone / iPhone)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
               HTTP / STOMP over WebSocket (/ws)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Spring Boot Backend                      │
│                                                             │
│   ┌─────────────────────┐       ┌──────────────────────┐    │
│   │ WebSocketConfig     │       │ ServerInfoController │    │
│   └──────────┬──────────┘       └──────────┬───────────┘    │
│              │                             │                │
│   ┌──────────▼──────────┐       ┌──────────▼───────────┐    │
│   │ ChatController      │       │ NetworkService       │    │
│   └──────────┬──────────┘       │ (IP & QR Generator)  │    │
│              │                  └──────────────────────┘    │
│   ┌──────────▼──────────┐                                   │
│   │ ChatService         │                                   │
│   │ (In-Memory State)   │                                   │
│   └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Backend
- **Java 21**: Modern LTS Java features.
- **Spring Boot 3.3.2**: Framework core.
- **Spring Web**: REST endpoints for server info & QR codes.
- **Spring WebSocket**: STOMP message broker.
- **Jackson JSON**: Object serialization/deserialization.
- **ZXing 3.5.3**: Local server-side QR code generator.

### Frontend
- **HTML5 & Vanilla CSS3**: CSS custom variables, responsive grid & flexbox layouts.
- **Vanilla JavaScript (ES6+)**: Zero bulky external frontend framework runtime.
- **Embedded SockJS & STOMP JS**: Bundled local WebSocket client.
- **Web Audio API**: Synthesized notification sounds without external audio assets.

---

## 📋 Prerequisites

Ensure your system has the following installed:

1. **Java 21 LTS** or newer
   ```bash
   java -version
   ```
2. **Apache Maven 3.8+**
   ```bash
   mvn -version
   ```

---

## 🚀 Running the Application

### Step 1: Clone or Extract Project
Navigate to the root directory of CampusChat:
```bash
cd "/Users/samstanleya/develop/LAN CHAT_JAVA"
```

### Step 2: Build the Application
Compile code and run all unit tests:
```bash
mvn clean install
```

### Step 3: Start the Server
Run the Spring Boot application:
```bash
mvn spring-boot:run
```

### Step 4: Open Local Interface
On the computer hosting the server, open your browser:
```
http://localhost:8080
```

---

## 📡 Accessing Across Local Network (Wi-Fi / LAN)

To allow other laptops and mobile phones connected to the same Wi-Fi to join:

### 1. Find Your Server Computer's Local IP Address

- **macOS / Linux**:
  ```bash
  ifconfig
  # or
  ip addr
  ```
  *Look for your active Wi-Fi interface (`en0` or `wlan0`), e.g., `192.168.1.15`.*

- **Windows**:
  ```cmd
  ipconfig
  ```
  *Look for "IPv4 Address" under Wireless LAN adapter Wi-Fi, e.g., `192.168.1.15`.*

### 2. Connect Mobile Phones & Other Computers
Open any web browser on connected devices and enter:
```
http://<YOUR_LOCAL_IP>:8080
```
*Example:* `http://192.168.1.15:8080`

Alternatively, click the **📡 Network Info** icon on the desktop header and scan the generated **QR Code** directly with your phone camera!

---

## 🧪 LAN Testing Guide

You can test CampusChat using 2+ devices (or multiple browser windows/incognito tabs):

1. **Device A (Host Computer)**:
   - Open `http://localhost:8080`
   - Enter username: `Sam` -> Click **JOIN CHAT**

2. **Device B (Mobile Phone or 2nd Computer)**:
   - Connect to same Wi-Fi.
   - Open `http://<SERVER_IP>:8080` or scan QR code.
   - Enter username: `Arun` -> Click **JOIN CHAT**

3. **Device C (3rd Device / Incognito Tab)**:
   - Open `http://<SERVER_IP>:8080`
   - Enter username: `Priya` -> Click **JOIN CHAT**

### Test Actions:
- **Instant Messages**: Send messages from `Sam` and verify they appear immediately on `Arun` and `Priya`'s screens.
- **Online Counter**: Verify online count updates dynamically (`🟢 3 Online`).
- **Typing Indicator**: Start typing on Device B and watch "Arun is typing..." appear on Device A & C.
- **System Messages**: Disconnect Device C and observe `"Priya left the chat"` system message.

---

## 🛡️ Firewall Configuration

If other devices on your Wi-Fi cannot connect to `http://<LOCAL_IP>:8080`, your computer's firewall may be blocking incoming TCP traffic on port 8080.

> [!IMPORTANT]
> **Do NOT disable your firewall completely.** Create a limited inbound rule for TCP Port 8080 instead:

### macOS:
Go to **System Settings** > **Network** > **Firewall** > **Options** > Allow incoming connections for Java / Maven.

### Windows Defender Firewall:
1. Open **Windows Defender Firewall** > Click **Advanced Settings**.
2. Click **Inbound Rules** > **New Rule...**
3. Select **Port** > Click **Next**.
4. Choose **TCP** and enter **8080** under Specific local ports.
5. Select **Allow the connection** > Save rule as `CampusChat LAN (8080)`.

### Linux (ufw):
```bash
sudo ufw allow 8080/tcp
```

---

## 📁 Project Structure

```
LAN CHAT_JAVA/
├── pom.xml                                  # Maven dependencies & build configuration
├── README.md                                # Documentation
└── src/
    ├── main/
    │   ├── java/com/campuschat/
    │   │   ├── CampusChatApplication.java   # Spring Boot Application Entry Point
    │   │   ├── config/
    │   │   │   └── WebSocketConfig.java     # STOMP & WebSocket Configuration
    │   │   ├── controller/
    │   │   │   ├── ChatController.java      # STOMP Messaging Handlers
    │   │   │   ├── FileController.java      # File Upload, Download & Preview Endpoints
    │   │   │   └── ServerInfoController.java# REST APIs for Network Info & QR Code
    │   │   ├── exception/
    │   │   │   ├── ChatException.java       # Custom Business Exception
    │   │   │   └── GlobalExceptionHandler.java # REST & Controller Exception Handling
    │   │   ├── model/
    │   │   │   ├── ChatMessage.java         # Chat Message Data Model
    │   │   │   ├── FileMetadata.java        # Uploaded File Metadata & Category Model
    │   │   │   ├── ServerInfo.java          # Network Server Information Model
    │   │   │   └── User.java                # User Model
    │   │   ├── service/
    │   │   │   ├── ChatService.java         # Core Business Logic & State Management
    │   │   │   ├── FileStorageService.java  # Local Disk File Storage & Categorization
    │   │   │   └── NetworkService.java      # Local Network IP & ZXing QR Generator
    │   │   └── websocket/
    │   │       └── WebSocketEventListener.java # Disconnect Listener
    │   └── resources/
    │       ├── application.properties       # Spring Configuration
    │       └── static/                      # Frontend Web Assets
    │           ├── index.html               # Main Web Interface
    │           ├── css/
    │           │   └── style.css            # Modern CSS Variables & Styling
    │           ├── js/
    │           │   ├── app.js               # Application Orchestrator & Controls
    │           │   ├── sockjs.min.js        # Embedded SockJS Client
    │           │   ├── stomp.min.js         # Embedded STOMP Client
    │           │   ├── ui.js                # DOM Renderer & Audio Synthesizer
    │           │   └── websocket.js         # WebSocket Connection Controller
    │           └── assets/
    │               └── logo.svg             # CampusChat Brand Logo
    └── test/java/com/campuschat/
        ├── ChatControllerTest.java          # REST API & Web Layer Tests
        └── ChatServiceTest.java             # Unit Tests for Chat Logic
```

---

## 🔒 Security Measures

- **No Remote Internet Leaks**: Completely isolated within the local network.
- **XSS Prevention**: Double-layer HTML escaping applied on both Spring Boot backend and JavaScript frontend prior to rendering.
- **Server-Side Validation**: Username length (2-20), regex patterns, duplicate checks, and message length (500 max) strictly enforced on backend.
- **Safe Error Reporting**: Exception stack traces are sanitized and never exposed to clients.

---

## 🔮 Future Roadmap (Version 2+)

*Features implemented and roadmap status:*
- [x] Local File & Media sharing over LAN (up to 500MB with live preview & progress tracking)
- [x] Direct Private Messaging (1-on-1 DMs) between connected users
- [x] Topic Channels (`#general`, `#study-group`, `#code-snippets`, `#random`) + Custom Channel Creation
- [x] Interactive Emoji Picker (Categorized & Searchable)
- [x] Message Emoji Reactions (Quick Reaction Bar & Animated Counter Pills)
- [x] Unread Notification Badges for Channels and DMs
- [ ] Database Persistence (MySQL / PostgreSQL / H2 integration)
- [ ] End-to-End Encrypted (E2EE) messaging options
- [ ] Collaborative Whiteboard & Screen Sharing

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
