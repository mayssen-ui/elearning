# Postman Backend Testing Guide — E-Learning Platform

## 🚀 Postman Environment Setup

Create a Postman environment with these variables:

| Variable | Value | Service |
|---|---|---|
| `gateway` | `http://localhost:3000` | API Gateway (use this for all frontend-facing calls) |
| `users` | `http://localhost:3001` | User Service (direct) |
| `courses` | `http://localhost:3002` | Course Service (direct) |
| `progress` | `http://localhost:3003` | Progress Service (direct) |
| `notifications` | `http://localhost:3005` | Notification Service (direct) |
| `feedback` | `http://localhost:3006` | Feedback Service (direct) |

> **Tip**: Prefer using `{{gateway}}` for all calls — the API Gateway handles auth and routing just like the frontend does.

---

## 👤 USER SERVICE (Port 3001)

### Get All Users
```
GET {{users}}/api/users
```

### Create User
```
POST {{users}}/api/users
Content-Type: application/json

{
  "username": "newstudent",
  "email": "newstudent@example.com",
  "role": "STUDENT"
}
```

### Get User by ID
```
GET {{users}}/api/users/1
```

### Update User
```
PUT {{users}}/api/users/1
Content-Type: application/json

{
  "username": "updatedstudent",
  "email": "updated@example.com",
  "role": "STUDENT"
}
```

### Delete User
```
DELETE {{users}}/api/users/1
```

---

## 📚 COURSE SERVICE (Port 3002)

### Get All Courses
```
GET {{courses}}/api/courses
```

**Response:**
```json
[
  { "id": 1, "title": "NestJS Basics", "description": "...", "pdfUrl": null },
  { "id": 2, "title": "React Advanced", "description": "...", "pdfUrl": "/uploads/react.pdf" }
]
```

### Create Course
```
POST {{courses}}/api/courses
Content-Type: application/json

{
  "title": "Spring Boot Microservices",
  "description": "Learn to build microservices with Spring Boot"
}
```

### Update Course
```
PUT {{courses}}/api/courses/1
Content-Type: application/json

{
  "title": "NestJS Basics — Updated",
  "description": "Updated description"
}
```

> [!IMPORTANT]
> The `pdfUrl` is preserved automatically when updating a course — only provided fields are overwritten.

### Delete Course
```
DELETE {{courses}}/api/courses/1
```

### Upload PDF to Course
```
POST {{courses}}/api/courses/1/pdf
Content-Type: multipart/form-data

file: <select your PDF>
```

### Delete PDF from Course
```
DELETE {{courses}}/api/courses/1/pdf
```

### Complete Course (triggers OpenFeign → Feedback)
```
POST {{courses}}/api/courses/1/complete/123
```

**Response:**
```
"Course 1 marked as completed for user 123."
```

### Integration Test Endpoints
```
GET  {{courses}}/api/test/ping
POST {{courses}}/api/test/complete-course/1/user/123
POST {{courses}}/api/test/create-feedback
GET  {{courses}}/api/courses/integration/test-communication
```

---

## 📊 PROGRESS SERVICE (Port 3003)

### Get All Progress
```
GET {{progress}}/api/progress
```

### Update / Create Progress
```
POST {{progress}}/api/progress
Content-Type: application/json

{
  "userId": "your-keycloak-sub",
  "courseId": 1,
  "percentage": 75
}
```

> **When `percentage = 100`**: triggers OpenFeign call to Course Service → auto-feedback created in Feedback Service.

### Delete Progress Entry
```
DELETE {{progress}}/api/progress/1
```

---

## 💬 FEEDBACK SERVICE (Port 3006)

### Get All Feedbacks
```
GET {{feedback}}/api/feedbacks
```

### Create Feedback (manual)
```
POST {{feedback}}/api/feedbacks
Content-Type: application/json

{
  "userId": "your-keycloak-sub",
  "courseId": 1,
  "rating": 5,
  "comment": "Excellent course!",
  "type": "MANUAL"
}
```

### Get Feedbacks by Course
```
GET {{feedback}}/api/feedbacks/course/1
```

### Update Feedback
```
PUT {{feedback}}/api/feedbacks/1
Content-Type: application/json

{
  "userId": "your-keycloak-sub",
  "courseId": 1,
  "rating": 4,
  "comment": "Updated comment",
  "type": "MANUAL"
}
```

### Delete Feedback
```
DELETE {{feedback}}/api/feedbacks/1
```

### Test / Debug Endpoints
```
GET  {{feedback}}/api/test/health
GET  {{feedback}}/api/test/feedbacks
GET  {{feedback}}/api/test/feedbacks/course/1
POST {{feedback}}/api/test/create-test-feedback
```

### Integration Endpoint (called by OpenFeign from Course Service)
```
POST {{feedback}}/api/feedbacks/integration/auto
Content-Type: application/json

{
  "userId": "123",
  "courseId": 1,
  "rating": 5,
  "comment": "Auto-generated on course completion",
  "type": "AUTO"
}
```

---

## 🔔 NOTIFICATION SERVICE (Port 3005)

### Get Notifications for a User
```
GET {{notifications}}/notifications?userId=<keycloak-sub>
```

### Create Notification (typed)
```
POST {{notifications}}/notifications
Content-Type: application/json
```

**Achievement (course completed):**
```json
{ "type": "achievement", "userId": "sub", "courseId": 1 }
```

**PDF uploaded:**
```json
{ "type": "upload", "userId": "sub", "courseId": 1 }
```

**New course published:**
```json
{ "type": "new_course", "userId": "sub", "courseId": 1 }
```

**Progress milestone:**
```json
{ "type": "progress", "userId": "sub", "courseId": 1, "percentage": 50 }
```

**Feedback received:**
```json
{ "type": "feedback", "userId": "sub", "courseId": 1, "rating": 4 }
```

**Inactivity reminder:**
```json
{ "type": "reminder", "userId": "sub", "courseId": 1 }
```

### Mark as Read
```
PATCH {{notifications}}/notifications/1/read
```

### Clear All Notifications for User
```
DELETE {{notifications}}/notifications?userId=<sub>
```

---

## 🌐 API GATEWAY (Port 3000) — Frontend-style calls

The Gateway proxies all requests and validates Keycloak JWT tokens.

```
GET  {{gateway}}/courses
POST {{gateway}}/courses
GET  {{gateway}}/progress
POST {{gateway}}/progress
GET  {{gateway}}/feedbacks
POST {{gateway}}/feedbacks
GET  {{gateway}}/users
GET  {{gateway}}/notifications?userId=<sub>
POST {{gateway}}/notifications
```

---

## 🔄 Full End-to-End Scenarios

### Scenario 1 — Student completes a course

1. `POST {{progress}}/api/progress` — `{ percentage: 100, courseId: 1, userId: "sub" }`
2. OpenFeign triggers → check `GET {{feedback}}/api/feedbacks` for auto-feedback
3. Frontend also posts `POST {{notifications}}/notifications` — `{ type: "achievement", courseId: 1 }`
4. `GET {{notifications}}/notifications?userId=sub` — should show "Course Completed!" with real name

### Scenario 2 — Admin uploads a PDF

1. `POST {{courses}}/api/courses/1/pdf` — upload file
2. Frontend automatically calls `POST {{notifications}}/notifications` — `{ type: "upload", courseId: 1 }`
3. Check notification: message should contain the real course title (not "Course #1")

### Scenario 3 — Error handling

| Test | Request | Expected |
|---|---|---|
| Non-existent course | `POST {{courses}}/api/courses/999/complete/123` | `404` |
| Invalid percentage | `POST {{progress}}/api/progress` with `percentage: 150` | `400` or capped at 100 |
| Notification with missing courseId | `POST {{notifications}}/notifications` `{ type: "achievement" }` | Message without course name |

---

## 🔍 Database Verification

### H2 — Course Service
- URL: http://localhost:3002/h2-console
- JDBC: `jdbc:h2:file:./data/coursedb`
- User: `sa` / Password: *(empty)*
```sql
SELECT * FROM COURSE;
SELECT * FROM COURSE WHERE PDF_URL IS NOT NULL;
```

### H2 — Progress Service
- URL: http://localhost:3003/h2-console
```sql
SELECT * FROM PROGRESS WHERE PERCENTAGE = 100;
```

### MySQL — Feedback Service
- phpMyAdmin: http://localhost:8085
```sql
SELECT * FROM feedbacks WHERE type = 'AUTO';
SELECT * FROM feedbacks ORDER BY id DESC LIMIT 10;
```

### PostgreSQL — Notification Service
- pgAdmin: `localhost:5433` / DB: `notification_db`
```sql
SELECT type, message, read, created_at FROM notifications ORDER BY created_at DESC;
```

---

## ✅ Test Checklist

### Individual services
- [ ] User Service CRUD
- [ ] Course Service CRUD + PDF upload/delete
- [ ] Progress Service CRUD
- [ ] Feedback Service CRUD
- [ ] Notification Service — all 6 types

### Inter-service communication
- [ ] Progress → Course (OpenFeign at 100%)
- [ ] Course → Feedback (OpenFeign auto-feedback)
- [ ] Notification with real course name (not "Course #N")
- [ ] API Gateway routing

### Error handling
- [ ] Non-existent resource returns 404
- [ ] Service unavailable — partial failure handled gracefully
- [ ] OpenFeign timeout — does not crash Progress Service
