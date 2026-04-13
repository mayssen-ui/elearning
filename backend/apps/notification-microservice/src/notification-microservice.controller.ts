import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationMicroserviceService } from './notification-microservice.service';

@Controller()
export class NotificationMicroserviceController {
  constructor(private readonly notificationService: NotificationMicroserviceService) {}

  @MessagePattern({ cmd: 'get_notifications' })
  async getNotifications(@Payload() data: { userId: string }) {
    return this.notificationService.getNotificationsForUser(data.userId);
  }

  @MessagePattern({ cmd: 'send_notification' })
  async createNotification(@Payload() data: any) {
    // Check if this is a course completion notification
    if (data.courseId) {
      return this.notificationService.createCourseCompletionNotification(data.userId, data.courseId);
    }
    return this.notificationService.createNotification(data);
  }

  @MessagePattern({ cmd: 'mark_read' })
  async markAsRead(@Payload() data: { id: number }) {
    return this.notificationService.markAsRead(data.id);
  }

  @MessagePattern({ cmd: 'delete_notifications' })
  async clearNotifications(@Payload() data: { userId: string }) {
    await this.notificationService.clearNotifications(data.userId);
    return { message: 'Notifications cleared' };
  }

  @MessagePattern({ cmd: 'get_preferences' })
  async getPreferences(@Payload() data: { userId: string }) {
    return this.notificationService.getPreferences(data.userId);
  }

  @MessagePattern({ cmd: 'update_preferences' })
  async updatePreferences(@Payload() data: { userId: string; preferences: any }) {
    return this.notificationService.updatePreferences(data.userId, data.preferences);
  }

  @MessagePattern({ cmd: 'get_hello' })
  getHello() {
    return { message: this.notificationService.getHello() };
  }
}
