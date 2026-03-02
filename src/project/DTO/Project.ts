import { ProjectRole, TaskStatus } from '@prisma/client';
import { IsString, IsNumber, IsEnum, IsNotEmpty, IsArray, IsOptional, IsEmail, Max, Min, IsInt } from 'class-validator'

export class ProjectDTO {
  @IsString()
  name: string

  @IsNotEmpty()
  @IsString()
  description: string

  @IsArray()
  tasks: TaskDTO[]
}

export class AddMemberDTO {
  @IsEmail()
  email: string

  @IsEnum(ProjectRole)
  role:ProjectRole
}

export class UpdateStatus{
  @IsEnum(TaskStatus)
  status: TaskStatus
}

export class CreateManyTasks{
  task: TaskDTO[]
}

export class TaskDTO {
  @IsString()
  title: string

  @IsString()
  description: string

  @IsNumber()
  priority: number

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
  priority: number

}

export class Priority{
  @IsInt()
  @Min(1)
  @Max(5)
  priority:number
}

export class CommentDTO {
  @IsString()
  @IsNotEmpty()
  content: string
  
}
