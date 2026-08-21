package com.campuschat;

import com.campuschat.controller.ServerInfoController;
import com.campuschat.service.ChatService;
import com.campuschat.service.NetworkService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ServerInfoController.class)
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NetworkService networkService;

    @MockBean
    private ChatService chatService;

    @Test
    @DisplayName("GET /api/info should return server network info")
    void testGetServerInfo() throws Exception {
        given(networkService.getLocalIpAddress()).willReturn("192.168.1.50");
        given(networkService.getServerPort()).willReturn(8080);
        given(networkService.getServerUrl()).willReturn("http://192.168.1.50:8080");
        given(chatService.getActiveUsersCount()).willReturn(3);

        mockMvc.perform(get("/api/info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ipAddress").value("192.168.1.50"))
                .andExpect(jsonPath("$.port").value(8080))
                .andExpect(jsonPath("$.serverUrl").value("http://192.168.1.50:8080"))
                .andExpect(jsonPath("$.status").value("Online"))
                .andExpect(jsonPath("$.activeUsersCount").value(3));
    }

    @Test
    @DisplayName("POST /api/validate-username should return valid status for unique username")
    void testValidateUsernameSuccess() throws Exception {
        given(chatService.validateAndSanitizeUsername("Karthik")).willReturn("Karthik");

        mockMvc.perform(post("/api/validate-username")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"Karthik\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.sanitizedUsername").value("Karthik"));
    }
}
