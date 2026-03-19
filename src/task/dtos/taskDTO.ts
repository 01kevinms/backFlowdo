import {  TaskPriority, TaskStatus } from '@prisma/client';
import { IsString, IsNumber, IsEnum, IsNotEmpty, IsOptional, Max, Min, IsInt } from 'class-validator'

export class UpdateStatus{
  @IsEnum(TaskStatus)
  status: TaskStatus
}

export class CreateManyTasks{
  task: TaskDTO[]
}

export class RemoveMemberDTO{
  @IsString()
  memberId:string
}

export class TaskDTO {
  @IsString()
  title: string

  @IsString()
  description: string

  @IsNumber()
  priority: TaskPriority

  @IsEnum(TaskStatus)
  status: TaskStatus

  @IsOptional()
  comments: CommentDTO[]
}

export class TaskPendingDTO {
   @IsString()
  title: string

  @IsString()
  description: string

  @IsNumber()
  priority: TaskPriority

}

export class Priority{
  @IsString()
  priority:TaskPriority
}

export class CommentDTO {
  @IsString()
  @IsNotEmpty()
  content: string
  
}
