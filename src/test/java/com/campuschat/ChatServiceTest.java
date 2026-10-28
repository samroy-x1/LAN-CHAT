package com.campuschat;

import com.campuschat.exception.ChatException;
import com.campuschat.model.Channel;
import com.campuschat.model.ChatMessage;
import com.campuschat.model.User;
import com.campuschat.service.ChatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ChatServiceTest {

    private ChatService chatService;

    @BeforeEach
    void setUp() {
        chatService = new ChatService();
        chatService.initDefaultChannels();
    }

    @Test
    @DisplayName("Valid username should pass validation")
    void testValidUsername() {
        String valid = chatService.validateAndSanitizeUsername("Sam_123");
        assertEquals("Sam_123", valid);
    }

    @Test
    @DisplayName("Username shorter than 2 characters should throw exception")
    void testTooShortUsername() {
        assertThrows(ChatException.class, () -> chatService.validateAndSanitizeUsername("A"));
    }

    @Test
    @DisplayName("Username longer than 20 characters should throw exception")
    void testTooLongUsername() {
        assertThrows(ChatException.class, () -> chatService.validateAndSanitizeUsername("SuperLongUsernameThatExceedsLimit"));
    }

    @Test
    @DisplayName("Username with invalid characters should throw exception")
    void testInvalidCharacterUsername() {
        assertThrows(ChatException.class, () -> chatService.validateAndSanitizeUsername("Sam@World!"));
    }

    @Test
    @DisplayName("Duplicate username (case-insensitive) should throw exception")
    void testDuplicateUsername() {
        chatService.registerUser("Arun", "session-1");
        assertThrows(ChatException.class, () -> chatService.validateAndSanitizeUsername("arun"));
    }

    @Test
    @DisplayName("HTML Script Injection should be escaped properly")
    void testHtmlSanitization() {
        String sanitized = chatService.sanitizeHtml("<script>alert('xss')</script>");
        assertEquals("&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;", sanitized);
    }

    @Test
    @DisplayName("Empty message should throw exception")
    void testEmptyMessage() {
        ChatMessage msg = new ChatMessage("Sam", "   ", ChatMessage.MessageType.CHAT);
        assertThrows(ChatException.class, () -> chatService.processAndAddMessage(msg));
    }

    @Test
    @DisplayName("Message longer than 500 chars should throw exception")
    void testLongMessage() {
        String longText = "a".repeat(501);
        ChatMessage msg = new ChatMessage("Sam", longText, ChatMessage.MessageType.CHAT);
        assertThrows(ChatException.class, () -> chatService.processAndAddMessage(msg));
    }

    @Test
    @DisplayName("User lifecycle register and remove should work correctly")
    void testUserLifecycle() {
        User user = chatService.registerUser("Priya", "session-100");
        assertNotNull(user);
        assertEquals(1, chatService.getActiveUsersCount());

        User removed = chatService.removeUserBySession("session-100");
        assertEquals("Priya", removed.getUsername());
        assertEquals(0, chatService.getActiveUsersCount());
    }

    @Test
    @DisplayName("Default channels should be initialized")
    void testDefaultChannels() {
        List<Channel> channels = chatService.getAllChannels();
        assertTrue(channels.size() >= 4);
        assertNotNull(chatService.getChannel("general"));
        assertNotNull(chatService.getChannel("study-group"));
        assertNotNull(chatService.getChannel("code-snippets"));
        assertNotNull(chatService.getChannel("random"));
    }

    @Test
    @DisplayName("Create custom channel should work and sanitize input")
    void testCreateCustomChannel() {
        Channel created = chatService.createChannel("Web Dev", "Discussion for frontend and backend", "Sam");
        assertNotNull(created);
        assertEquals("web-dev", created.getId());
        assertEquals("Web Dev", created.getName());
        assertEquals("Discussion for frontend and backend", created.getDescription());

        // Duplicate channel creation should fail
        assertThrows(ChatException.class, () -> chatService.createChannel("web dev", "duplicate", "Arun"));
    }

    @Test
    @DisplayName("Channel message should isolate history per channel")
    void testChannelHistoryIsolation() {
        ChatMessage msgGeneral = new ChatMessage("Sam", "Hello General", ChatMessage.MessageType.CHAT);
        msgGeneral.setChannelId("general");
        chatService.processChannelMessage(msgGeneral);

        ChatMessage msgStudy = new ChatMessage("Arun", "Hello Study", ChatMessage.MessageType.CHAT);
        msgStudy.setChannelId("study-group");
        chatService.processChannelMessage(msgStudy);

        List<ChatMessage> genHistory = chatService.getChannelHistory("general");
        List<ChatMessage> studyHistory = chatService.getChannelHistory("study-group");

        assertEquals(1, genHistory.size());
        assertEquals("Hello General", genHistory.get(0).getMessage());

        assertEquals(1, studyHistory.size());
        assertEquals("Hello Study", studyHistory.get(0).getMessage());
    }

    @Test
    @DisplayName("1-on-1 private messaging should isolate history between pairs")
    void testDirectMessagingIsolation() {
        ChatMessage dm1 = new ChatMessage("Sam", "Hey Priya, can you share notes?", ChatMessage.MessageType.PRIVATE_CHAT);
        dm1.setRecipient("Priya");
        chatService.processPrivateMessage(dm1);

        ChatMessage dm2 = new ChatMessage("Priya", "Sure Sam, here they are!", ChatMessage.MessageType.PRIVATE_CHAT);
        dm2.setRecipient("Sam");
        chatService.processPrivateMessage(dm2);

        // Third party user
        ChatMessage dm3 = new ChatMessage("Arun", "Hey Sam", ChatMessage.MessageType.PRIVATE_CHAT);
        dm3.setRecipient("Sam");
        chatService.processPrivateMessage(dm3);

        List<ChatMessage> samPriyaHistory = chatService.getDmHistory("Sam", "Priya");
        List<ChatMessage> priyaSamHistory = chatService.getDmHistory("Priya", "Sam");
        List<ChatMessage> arunSamHistory = chatService.getDmHistory("Arun", "Sam");

        assertEquals(2, samPriyaHistory.size());
        assertEquals(2, priyaSamHistory.size());
        assertEquals(1, arunSamHistory.size());
    }

    @Test
    @DisplayName("Message emoji reaction toggle should add and remove reactions")
    void testEmojiReactions() {
        ChatMessage msg = new ChatMessage("Sam", "Check out this update!", ChatMessage.MessageType.CHAT);
        msg.setChannelId("general");
        chatService.processChannelMessage(msg);

        // Sam reacts with 🔥
        Map<String, List<String>> r1 = chatService.toggleReaction(msg.getId(), "general", null, "Sam", "🔥");
        assertTrue(r1.containsKey("🔥"));
        assertTrue(r1.get("🔥").contains("Sam"));

        // Arun also reacts with 🔥
        Map<String, List<String>> r2 = chatService.toggleReaction(msg.getId(), "general", null, "Arun", "🔥");
        assertEquals(2, r2.get("🔥").size());

        // Sam removes their 🔥 reaction (toggled again)
        Map<String, List<String>> r3 = chatService.toggleReaction(msg.getId(), "general", null, "Sam", "🔥");
        assertEquals(1, r3.get("🔥").size());
        assertFalse(r3.get("🔥").contains("Sam"));
    }

    @Test
    @DisplayName("Chat history should bound at 100 messages per channel")
    void testHistoryCapacity() {
        for (int i = 1; i <= 105; i++) {
            ChatMessage msg = new ChatMessage("User" + i, "Message " + i, ChatMessage.MessageType.CHAT);
            msg.setChannelId("general");
            chatService.processAndAddMessage(msg);
        }

        List<ChatMessage> history = chatService.getRecentHistory();
        assertEquals(100, history.size());
        assertEquals("Message 6", history.get(0).getMessage());
        assertEquals("Message 105", history.get(99).getMessage());
    }

    @Test
    @DisplayName("User reconnecting with same username on new session should replace old session")
    void testUserReconnect() {
        chatService.registerUser("Sam", "session-old");
        assertEquals(1, chatService.getActiveUsersCount());

        User reconnected = chatService.registerUser("Sam", "session-new");
        assertNotNull(reconnected);
        assertEquals("session-new", reconnected.getSessionId());
        assertEquals(1, chatService.getActiveUsersCount());
        assertNull(chatService.removeUserBySession("session-old"));
    }
}
