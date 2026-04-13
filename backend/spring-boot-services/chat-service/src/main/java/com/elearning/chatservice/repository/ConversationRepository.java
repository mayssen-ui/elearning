package com.elearning.chatservice.repository;

import com.elearning.chatservice.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByConversationId(String conversationId);
    
    @Query("SELECT c FROM Conversation c WHERE c.participant1Id = ?1 OR c.participant2Id = ?1 ORDER BY c.lastMessageAt DESC")
    List<Conversation> findByParticipant(String userId);
    
    @Query("SELECT c FROM Conversation c WHERE (c.participant1Id = ?1 AND c.participant2Id = ?2) OR (c.participant1Id = ?2 AND c.participant2Id = ?1)")
    Optional<Conversation> findDirectConversation(String user1, String user2);
    
    List<Conversation> findByCourseIdAndIsGroupChatTrue(Long courseId);
}
