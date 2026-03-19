import { ProjectRole} from '@prisma/client';
import { IsString, IsEnum, IsNotEmpty, IsArray, IsEmail } from 'class-validator'
import { TaskDTO } from 'src/task/dtos/taskDTO';

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

export class RemoveMemberDTO{
  @IsString()
  memberId:string
}

export class CommentDTO {
  @IsString()
  @IsNotEmpty()
  content: string
  
}

export class updateRoleDTO{
  @IsString()
  role:ProjectRole

  @IsString()
  memberId:string
}