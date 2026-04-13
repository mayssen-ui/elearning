import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { NotificationPreference } from './notification-preference.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export type NotificationType =
  | 'achievement'   // course completed
  | 'upload'        // PDF uploaded
  | 'enrollment'    // enrolled in a new course
  | 'progress'      // milestone reached
  | 'new_course'    // new course published
  | 'feedback'      // feedback left on a course
  | 'reminder'      // inactivity reminder
  | 'info';         // generic

@Injectable()
export class NotificationMicroserviceService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
    private readonly httpService: HttpService,
  ) {}

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async fetchCourseName(courseId: number): Promise<string> {
    if (!courseId) return "General Platform";
    
    try {
      interface CourseResponse { title?: string; }
      // Appel direct au course-service (via Eureka/load balancer)
      const courseServiceUrl = process.env.COURSE_SERVICE_URL || 'http://host.docker.internal:3002';
      const response = await firstValueFrom(
        this.httpService.get<CourseResponse>(`${courseServiceUrl}/api/courses/${courseId}`),
      );
      if (response.data?.title) return response.data.title;
    } catch (error) {
      console.log(`Could not fetch course name for id ${courseId}:`, error.message);
    }
    return `Course #${courseId}`;
  }

  private async save(payload: Partial<Notification>): Promise<Notification> {
    const entity = this.notificationRepository.create(payload);
    const saved = await this.notificationRepository.save(entity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async createNotification(dto: any): Promise<Notification> {
    return this.save(dto);
  }

  async markAsRead(id: number): Promise<Notification> {
    await this.notificationRepository.update(id, { read: true });
    return this.notificationRepository.findOneBy({ id });
  }

  async clearNotifications(userId: string): Promise<void> {
    await this.notificationRepository.delete({ userId });
  }

  async clearAllNotifications(): Promise<void> {
    await this.notificationRepository.clear();
  }

  async getPreferences(userId: string): Promise<NotificationPreference> {
    let pref = await this.preferenceRepository.findOneBy({ userId });
    if (!pref) {
      pref = this.preferenceRepository.create({ userId });
      pref = await this.preferenceRepository.save(pref);
    }
    return pref;
  }

  async updatePreferences(userId: string, preferences: any): Promise<NotificationPreference> {
    await this.preferenceRepository.update({ userId }, preferences);
    return this.getPreferences(userId);
  }

  // ─── Typed notification factories ────────────────────────────────────────────

  /** 🎓 Course completed */
  async createCourseCompletionNotification(userId: string, courseId: number): Promise<Notification> {
    const courseName = await this.fetchCourseName(courseId);
    return this.save({
      userId, courseId, type: 'achievement', read: false,
      message: `Congratulations! You have successfully completed "${courseName}". Keep up the great work!`,
    });
  }

  /** 📄 PDF uploaded */
  async createPdfUploadNotification(userId: string, courseId: number): Promise<Notification> {
    const courseName = await this.fetchCourseName(courseId);
    return this.save({
      userId, courseId, type: 'upload', read: false,
      message: `A new PDF resource has been added to "${courseName}". Check it out now!`,
    });
  }

  /** 🆕 New course published */
  async createNewCourseNotification(userId: string, courseId: number): Promise<Notification> {
    const courseName = await this.fetchCourseName(courseId);
    return this.save({
      userId, courseId, type: 'new_course', read: false,
      message: `New course available: "${courseName}". Enroll now and start learning!`,
    });
  }

  /** 📈 Progress milestone */
  async createProgressMilestoneNotification(userId: string, courseId: number, percentage: number): Promise<Notification> {
    const courseName = await this.fetchCourseName(courseId);
    const emoji = percentage >= 75 ? '🔥' : percentage >= 50 ? '⚡' : '🚀';
    return this.save({
      userId, courseId, type: 'progress', read: false,
      message: `${emoji} You've reached ${percentage}% completion in "${courseName}". You're almost there!`,
    });
  }

  /** ⭐ Feedback received */
  async createFeedbackNotification(userId: string, courseId: number, rating: number): Promise<Notification> {
    const courseName = await this.fetchCourseName(courseId);
    const stars = '⭐'.repeat(Math.min(rating, 5));
    return this.save({
      userId, courseId, type: 'feedback', read: false,
      message: `A student left a ${rating}/5 rating on "${courseName}". View their feedback!`,
    });
  }

  /** ⏰ Inactivity reminder */
  async createReminderNotification(userId: string, courseId: number): Promise<Notification> {
    const courseName = await this.fetchCourseName(courseId);
    return this.save({
      userId, courseId, type: 'reminder', read: false,
      message: `You haven't made progress on "${courseName}" recently. Resume your learning today!`,
    });
  }

  getHello(): string {
    return 'Notification Microservice is running!';
  }
}
