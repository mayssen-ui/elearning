package com.elearning.chatservice.service;

import com.elearning.chatservice.entity.ChatMessage;
import com.elearning.chatservice.entity.Conversation;
import com.elearning.chatservice.repository.ChatMessageRepository;
import com.elearning.chatservice.repository.ConversationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ChatService {
    @Autowired
    private ChatMessageRepository messageRepository;
    
    @Autowired
    private ConversationRepository conversationRepository;
    
    public ChatMessage sendMessage(ChatMessage message) {
        message.setCreatedAt(LocalDateTime.now());
        message.setIsRead(false);
        
        String conversationId;
        if (message.getCourseId() != null) {
            conversationId = "course_" + message.getCourseId();
            message.setConversationId(conversationId);
            
            Optional<Conversation> existingConv = conversationRepository.findByConversationId(conversationId);
            if (existingConv.isEmpty()) {
                Conversation conv = new Conversation();
                conv.setConversationId(conversationId);
                conv.setParticipant1Id(message.getSenderId());
                conv.setCourseId(message.getCourseId());
                conv.setIsGroupChat(true);
                conv.setGroupName("Course Discussion");
                conv.setLastMessageAt(LocalDateTime.now());
                conversationRepository.save(conv);
            } else {
                Conversation conv = existingConv.get();
                conv.setLastMessageAt(LocalDateTime.now());
                conversationRepository.save(conv);
            }
        } else if (message.getReceiverId() != null) {
            conversationId = generateDirectConversationId(message.getSenderId(), message.getReceiverId());
            message.setConversationId(conversationId);
            
            Optional<Conversation> existingConv = conversationRepository.findDirectConversation(
                message.getSenderId(), message.getReceiverId());
            
            if (existingConv.isEmpty()) {
                Conversation conv = new Conversation();
                conv.setConversationId(conversationId);
                conv.setParticipant1Id(message.getSenderId());
                conv.setParticipant2Id(message.getReceiverId());
                conv.setIsGroupChat(false);
                conv.setLastMessageAt(LocalDateTime.now());
                conversationRepository.save(conv);
            } else {
                Conversation conv = existingConv.get();
                conv.setLastMessageAt(LocalDateTime.now());
                conversationRepository.save(conv);
            }
        }
        
        return messageRepository.save(message);
    }
    
    public List<ChatMessage> getConversation(String conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }
    
    public List<ChatMessage> getDirectMessages(String user1, String user2) {
        return messageRepository.findConversationBetweenUsers(user1, user2);
    }
    
    public List<Conversation> getUserConversations(String userId) {
        return conversationRepository.findByParticipant(userId);
    }
    
    public List<ChatMessage> getUnreadMessages(String userId) {
        return messageRepository.findByReceiverIdAndIsReadFalse(userId);
    }
    
    public Long getUnreadCount(String userId) {
        return messageRepository.countByReceiverIdAndIsReadFalse(userId);
    }
    
    public void markAsRead(Long messageId) {
        Optional<ChatMessage> msg = messageRepository.findById(messageId);
        msg.ifPresent(m -> {
            m.setIsRead(true);
            messageRepository.save(m);
        });
    }
    
    public void markConversationAsRead(String conversationId, String userId) {
        List<ChatMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        for (ChatMessage msg : messages) {
            if (msg.getReceiverId() != null && msg.getReceiverId().equals(userId) && !msg.getIsRead()) {
                msg.setIsRead(true);
                messageRepository.save(msg);
            }
        }
    }
    
    public List<ChatMessage> getCourseDiscussion(Long courseId) {
        return messageRepository.findCourseDiscussion(courseId);
    }
    
    private String generateDirectConversationId(String user1, String user2) {
        List<String> ids = Arrays.asList(user1, user2);
        Collections.sort(ids);
        return "dm_" + ids.get(0) + "_" + ids.get(1);
    }
    
    public Map<String, Object> getOrCreateDirectConversation(String user1, String user2, String user1Name) {
        String conversationId = generateDirectConversationId(user1, user2);
        Optional<Conversation> existing = conversationRepository.findDirectConversation(user1, user2);
        
        if (existing.isPresent()) {
            Map<String, Object> result = new HashMap<>();
            result.put("conversationId", existing.get().getConversationId());
            result.put("created", false);
            return result;
        }
        
        Conversation conv = new Conversation();
        conv.setConversationId(conversationId);
        conv.setParticipant1Id(user1);
        conv.setParticipant2Id(user2);
        conv.setIsGroupChat(false);
        conv.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conv);
        
        Map<String, Object> result = new HashMap<>();
        result.put("conversationId", conversationId);
        result.put("created", true);
        return result;
    }

    public void deleteConversation(String conversationId, String userId) {
        Optional<Conversation> convOpt = conversationRepository.findByConversationId(conversationId);
        if (convOpt.isPresent()) {
            Conversation conv = convOpt.get();
            // Verify user is a participant
            if (conv.getParticipant1Id().equals(userId) ||
                (conv.getParticipant2Id() != null && conv.getParticipant2Id().equals(userId)) ||
                (conv.getIsGroupChat() && conv.getParticipant1Id().equals(userId))) {
                // Delete all messages first
                List<ChatMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
                messageRepository.deleteAll(messages);
                // Delete conversation
                conversationRepository.delete(conv);
            }
        }
    }

    public void markAllAsRead(String userId) {
        List<ChatMessage> unreadMessages = messageRepository.findByReceiverIdAndIsReadFalse(userId);
        for (ChatMessage message : unreadMessages) {
            message.setIsRead(true);
        }
        messageRepository.saveAll(unreadMessages);
    }
}
