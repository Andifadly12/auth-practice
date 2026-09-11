import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { NotificationModule } from './notification/notification.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { ReminderModule } from './reminder/reminder.module';
import { TodoModule } from './todo/todo.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ProfileModule,
    TodoModule,
    CategoryModule,
    AiModule,
    ReminderModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
