import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { NotificationMicroserviceController } from './notification-microservice.controller';
import { NotificationHttpController } from './notification-http.controller';
import { NotificationMicroserviceService } from './notification-microservice.service';
import { Notification } from './notification.entity';
import { NotificationPreference } from './notification-preference.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433'),
      username: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'adminpassword',
      database: process.env.DB_NAME || 'notification_db',
      entities: [Notification, NotificationPreference],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Notification, NotificationPreference]),
    HttpModule,
  ],
  controllers: [NotificationMicroserviceController, NotificationHttpController],
  providers: [NotificationMicroserviceService],
})
export class NotificationMicroserviceModule {}
