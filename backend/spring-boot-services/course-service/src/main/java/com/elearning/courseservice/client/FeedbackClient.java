package com.elearning.courseservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.elearning.courseservice.dto.FeedbackRequest;

@FeignClient(name = "feedback-service", url = "http://host.docker.internal:3044")
public interface FeedbackClient {
    
    @PostMapping("/api/feedbacks")
    FeedbackRequest createFeedback(@RequestBody FeedbackRequest feedbackRequest);
    
    @PostMapping("/api/feedbacks/integration/auto")
    FeedbackRequest createAutoFeedback(@RequestBody FeedbackRequest feedbackRequest);
}
