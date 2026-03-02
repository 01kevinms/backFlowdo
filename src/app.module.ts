import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { ProjectController } from './project/project.controller';
import { ProjectService } from './project/project.service';
import { TaskService } from './task/task.service';
import { TaskController } from './task/task.controller';
import { ActivityService } from './activity/activity.service';

@Module({
  imports: [AuthModule],
  controllers: [ProjectController, TaskController],
  providers: [PrismaService, ProjectService, TaskService, ActivityService],
})
export class AppModule {}
