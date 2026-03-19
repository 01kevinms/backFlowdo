import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { ProjectController } from './project/project.controller';
import { ProjectService } from './project/project.service';
import { TaskService } from './task/task.service';
import { TaskController } from './task/task.controller';
import { ActivityService } from './activity/activity.service';
import { FriendService } from './friend/friend.service';
import { FriendController } from './friend/friend.controller';
import { ChatService } from './chat/chat.service';
import { ChatController } from './chat/chat.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProjectController, TaskController, FriendController, ChatController],
  providers: [PrismaService, ProjectService, TaskService, ActivityService, FriendService, ChatService],
})
export class AppModule {}
