import { Controller, Get, Post, Patch, Delete, Put, Body, Param, Query } from '@nestjs/common';
import { NotificationMicroserviceService } from './notification-microservice.service';

@Controller('notifications')
export class NotificationHttpController {
  constructor(private readonly notificationService: NotificationMicroserviceService) {}

  @Get('health')
  health() {
    return { status: 'UP', service: 'notification-service' };
  }

  @Get()
  async getNotifications(@Query('userId') userId?: string) {
    if (!userId) {
      return []; // Return empty array if no userId provided
    }
    return this.notificationService.getNotificationsForUser(userId);
  }

  /**
   * POST /notifications
   * Body examples:
   *   { type: 'achievement',  userId, courseId, message }
   *   { type: 'upload',       userId, courseId, message }
   *   { type: 'new_course',   userId, courseId, message }
   *   { type: 'progress',     userId, courseId, percentage, message }
   *   { type: 'feedback',     userId, courseId, rating, message }
   *   { type: 'reminder',     userId, courseId, message }
   *   { message, userId, ... }  ← generic fallback
   */
  @Post()
  async createNotification(@Body() data: any) {
    switch (data.type) {
      case 'achievement':
        return this.notificationService.createCourseCompletionNotification(data.userId, data.courseId);
      case 'upload':
        return this.notificationService.createPdfUploadNotification(data.userId, data.courseId);
      case 'new_course':
        return this.notificationService.createNewCourseNotification(data.userId, data.courseId);
      case 'progress':
        return this.notificationService.createProgressMilestoneNotification(data.userId, data.courseId, data.percentage);
      case 'feedback':
        return this.notificationService.createFeedbackNotification(data.userId, data.courseId, data.rating ?? 5);
      case 'reminder':
        return this.notificationService.createReminderNotification(data.userId, data.courseId);
      default:
        // Legacy path: if courseId present without explicit type → achievement
        if (data.courseId && !data.message) {
          return this.notificationService.createCourseCompletionNotification(data.userId, data.courseId);
        }
        return this.notificationService.createNotification(data);
    }
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: number) {
    return this.notificationService.markAsRead(id);
  }

  @Delete()
  async clearNotifications(@Query('userId') userId: string) {
    await this.notificationService.clearNotifications(userId);
    return { message: 'Notifications cleared' };
  }

  @Delete('all')
  async clearAllNotifications() {
    await this.notificationService.clearAllNotifications();
    return { message: 'All notifications cleared' };
  }

  @Get('preferences')
  async getPreferences(@Query('userId') userId: string) {
    return this.notificationService.getPreferences(userId);
  }

  @Put('preferences')
  async updatePreferences(@Query('userId') userId: string, @Body() preferences: any) {
    return this.notificationService.updatePreferences(userId, preferences);
  }
}
