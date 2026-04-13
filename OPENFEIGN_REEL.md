# OpenFeign — Real Inter-Service Communication

## 🎯 Objective

Document the **real OpenFeign workflow** used in the application when a student completes a course.

---

## 🚀 Architecture

```
Frontend (React)
       │  POST /progress  { percentage: 100 }
       │  POST /notifications { type: "achievement" }
       ▼
Progress Service (Port 3003)
       │  OpenFeign → notifyCourseCompletion(courseId, userId)
       ▼
Course Service (Port 3002)
       │  OpenFeign → createAutoFeedback(feedbackRequest)
       ▼
Feedback Service (Port 3006)
       │  feedbackRepository.save(feedback)
       ▼
MySQL Database (feedback_db, port 3307)
```

---

## 📋 Real Scenario — Step by Step

| Step | Actor | Action |
|---|---|---|
| 1 | Frontend | User sets progress to 100% → `POST /progress` |
| 2 | Progress Service | Detects `percentage >= 100` → calls Course Service via Feign |
| 3 | Course Service | Receives completion → calls Feedback Service via Feign |
| 4 | Feedback Service | Saves auto-feedback (type=`AUTO`, rating=5) to MySQL |
| 5 | Frontend | Calls `POST /notifications` with `type: "achievement"` |
| 6 | Notification Service | Fetches real course name from Course Service → stores notification |

---

## 🔧 Implementation Details

### 1. Progress Service

**`CourseClient.java`** — Feign interface:
```java
@FeignClient(name = "course-service", url = "http://localhost:3002")
public interface CourseClient {
    @PostMapping("/api/courses/{courseId}/complete/{userId}")
    ResponseEntity<String> notifyCourseCompletion(
            @PathVariable("courseId") Long courseId,
            @PathVariable("userId") Long userId);
}
```

**`ProgressController.java`** — triggers the call:
```java
if (savedProgress.getPercentage() >= 100) {
    courseClient.notifyCourseCompletion(courseId, numericUserId);
}
```

### 2. Course Service

**`CourseController.java`** — receives the OpenFeign call:
```java
@PostMapping("/{courseId}/complete/{userId}")
public ResponseEntity<String> completeCourse(
        @PathVariable("courseId") Long courseId,
        @PathVariable("userId") Long userId) { ... }
```

**`FeedbackClient.java`** — calls Feedback Service:
```java
@FeignClient(name = "feedback-service", url = "http://localhost:3006")
public interface FeedbackClient {
    @PostMapping("/api/feedbacks/integration/auto")
    ResponseEntity<String> createAutoFeedback(@RequestBody FeedbackRequest request);
}
```

### 3. Notification Service (NestJS)

**`notification-microservice.service.ts`** — resolves real course name before persisting:
```typescript
async createCourseCompletionNotification(userId: string, courseId: number) {
    const courseName = await this.fetchCourseName(courseId); // calls localhost:3002
    return this.save({
        userId, courseId, type: 'achievement', read: false,
        message: `Congratulations! You have successfully completed "${courseName}".`,
    });
}
```

---

## ⚠️ Critical — Named @PathVariable

**Every** `@PathVariable` in all Spring Boot controllers and Feign interfaces **must include the explicit name**:

```java
// ✅ Required
@PathVariable("courseId") Long courseId

// ❌ Causes: IllegalStateException: PathVariable annotation was empty on param 0
@PathVariable Long courseId
```

This applies to: `CourseController`, `CourseIntegrationController`, `ProgressController`, `UserController`, `FeedbackController`, `TestCommunicationController`, `TestFeedbackController` and all Feign client interfaces.

---

## 🧪 Tests

### Full chain test
```bash
# 1. Set progress to 100% (triggers chain)
curl -X POST http://localhost:3000/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"userId":"<sub>","courseId":1,"percentage":100}'

# 2. Verify feedback was auto-created
curl http://localhost:3006/api/feedbacks

# 3. Verify notification
curl "http://localhost:3005/notifications?userId=<sub>"
```

### Progress milestone notifications (25%, 50%, 75%)
The frontend triggers a `progress` type notification at these milestones when the admin updates progress via the Progress page.

---

## 📊 Notification Types Reference

| Type | Trigger | Message pattern |
|---|---|---|
| `achievement` | Course completed (100%) | `Congratulations! You completed "…"` |
| `upload` | PDF uploaded to course | `A new PDF has been added to "…"` |
| `new_course` | Course created | `New course available: "…"` |
| `progress` | Milestone 25/50/75% | `You've reached X% in "…"` |
| `feedback` | Feedback submitted | `A student rated "…" X/5` |
| `reminder` | Manual trigger | `You haven't progressed in "…" recently` |
