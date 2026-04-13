package com.elearning.chatservice.repository;

import com.elearning.chatservice.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByConversationIdOrderByCreatedAtAsc(String conversationId);
    
    List<ChatMessage> findBySenderIdAndReceiverIdOrderByCreatedAtAsc(String senderId, String receiverId);
    
    @Query("SELECT m FROM ChatMessage m WHERE (m.senderId = ?1 AND m.receiverId = ?2) OR (m.senderId = ?2 AND m.receiverId = ?1) ORDER BY m.createdAt ASC")
    List<ChatMessage> findConversationBetweenUsers(String user1, String user2);
    
    List<ChatMessage> findByReceiverIdAndIsReadFalse(String receiverId);
    
    Long countByReceiverIdAndIsReadFalse(String receiverId);
    
    @Query("SELECT m FROM ChatMessage m WHERE m.courseId = ?1 ORDER BY m.createdAt ASC")
    List<ChatMessage> findCourseDiscussion(Long courseId);
}
