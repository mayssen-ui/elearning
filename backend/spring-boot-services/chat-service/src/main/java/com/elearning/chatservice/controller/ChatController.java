package com.elearning.chatservice.controller;

import com.elearning.chatservice.entity.ChatMessage;
import com.elearning.chatservice.entity.Conversation;
import com.elearning.chatservice.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @Autowired
    private ChatService chatService;
    
    @PostMapping("/messages")
    public ResponseEntity<ChatMessage> sendMessage(@RequestBody ChatMessage message) {
        ChatMessage saved = chatService.sendMessage(message);
        return ResponseEntity.ok(saved);
    }
    
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable String conversationId) {
        return ResponseEntity.ok(chatService.getConversation(conversationId));
    }
    
    @GetMapping("/users/{userId}/conversations")
    public ResponseEntity<List<Conversation>> getUserConversations(@PathVariable String userId) {
        return ResponseEntity.ok(chatService.getUserConversations(userId));
    }
    
    @GetMapping("/direct/{user1}/{user2}")
    public ResponseEntity<List<ChatMessage>> getDirectMessages(
            @PathVariable String user1, 
            @PathVariable String user2) {
        return ResponseEntity.ok(chatService.getDirectMessages(user1, user2));
    }
    
    @GetMapping("/users/{userId}/unread")
    public ResponseEntity<List<ChatMessage>> getUnreadMessages(@PathVariable String userId) {
        return ResponseEntity.ok(chatService.getUnreadMessages(userId));
    }
    
    @GetMapping("/users/{userId}/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable String userId) {
        Map<String, Long> result = new HashMap<>();
        result.put("count", chatService.getUnreadCount(userId));
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/messages/{messageId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long messageId) {
        chatService.markAsRead(messageId);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markConversationAsRead(
            @PathVariable String conversationId,
            @RequestParam String userId) {
        chatService.markConversationAsRead(conversationId, userId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/courses/{courseId}/discussion")
    public ResponseEntity<List<ChatMessage>> getCourseDiscussion(@PathVariable Long courseId) {
        return ResponseEntity.ok(chatService.getCourseDiscussion(courseId));
    }
    
    @PostMapping("/conversations/direct")
    public ResponseEntity<Map<String, Object>> createDirectConversation(
            @RequestParam String user1,
            @RequestParam String user2,
            @RequestParam(required = false) String user1Name) {
        return ResponseEntity.ok(chatService.getOrCreateDirectConversation(user1, user2, user1Name));
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable String conversationId,
            @RequestParam String userId) {
        chatService.deleteConversation(conversationId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{userId}/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(@PathVariable String userId) {
        chatService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }
}
