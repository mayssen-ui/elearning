package com.elearning.feedbackservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "leaderboard-service", url = "http://host.docker.internal:3009")
public interface LeaderboardClient {
    
    @PostMapping("/api/leaderboard/points/award")
    void awardPoints(
        @RequestParam String userId,
        @RequestParam String actionType,
        @RequestParam String description,
        @RequestParam(required = false) Long referenceId,
        @RequestParam(required = false) String referenceType
    );
}
