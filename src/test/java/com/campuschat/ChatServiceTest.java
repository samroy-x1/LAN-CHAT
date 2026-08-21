package com.campuschat;

import com.campuschat.exception.ChatException;
import com.campuschat.model.ChatMessage;
import com.campuschat.model.User;
import com.campuschat.service.ChatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ChatServiceTest {

    private ChatService chatService;

    @BeforeEach
    void setUp() {
        chatService = new ChatService();
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
    @DisplayName("Chat history should bound at 100 messages")
    void testHistoryCapacity() {
        for (int i = 1; i <= 105; i++) {
            ChatMessage msg = new ChatMessage("User" + i, "Message " + i, ChatMessage.MessageType.CHAT);
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
