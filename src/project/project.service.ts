import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { ActivityService } from './../activity/activity.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddMemberDTO, CommentDTO, Priority, ProjectDTO, TaskPendingDTO } from './DTO/Project';
import { ProjectRole, TaskStatus } from '@prisma/client';

@Injectable()
export class ProjectService {
constructor(private prisma:PrismaService,private activityService:ActivityService){}

    // create logic for return only projects if user to participate projetc and projects create
    async getProjects(userId:string){
    return await this.prisma.project.findMany({
      where:{members:{
        some:{
          userId
        }
      }},
      include:{
        task:{
          include:{
            comments:true
        }
        },
        members:{
          select:{
            role:true,
            user:{
              select:{
                name:true,
                email:true
              }
            }
          }
        }
      }
    })
        
    }

    async getProjectId(ProjectId:string){
      const exist = await this.prisma.project.findUnique({
        where:{id:ProjectId}
      })
      if(!exist){
        throw new BadRequestException('this project dont exist ')
      }
      return await this.prisma.project.findUnique({
        where:{id:exist.id},
        include:{
          task:{
            orderBy:{
             priority:'asc'
            },
            include:{
              comments:true,
              doingBy:{
                select:{
                  id:true,
                  name:true
                }
              },
            }
          },         
          owner:{
            select:{
              name:true
            }
          },
          members:{
            select:{
              joinedAt:true,
              role:true,
              user:{
                select:{
                  name:true
                }
              }            
            }
          }
        }
      })
    }

    async getComments(taskId:string){
      const task = await this.prisma.task.findUnique({
        where:{id:taskId}
      })
      if(!task){
        throw new BadRequestException()
      }
      return await this.prisma.comment.findMany({
        where:{taskId},
        include:{
          author:{
            select:{
              id:true,
              name:true
            }
          }
        },
        orderBy:{
          createdAt:'desc'
        },
      })
    }

    // create logic for when owner do creater project see list users wanted enter and accept
    async createProject(data:ProjectDTO,ownerId:string){
       const project = await this.prisma.project.create({
            data: {
                name: data.name,
                description: data.description,
                members:{
                  create:{
                    userId:ownerId,
                    role:"OWNER"
                  }
                },
                ownerId,             
                task: {
                create: data.tasks.map(task => ({
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    description: task.description,
                    requestedBy:{connect:{id:ownerId}}
                }))
                }
            },           
            include:{             
              task:true,
              owner:{
                select:{
                  name:true
                }
              },
              members:true     
            }       
            })
            return project;

    }

    async addMemberProject(projectId:string,ownerId:string,data:AddMemberDTO){
      const Isowner = await this.prisma.projectMember.findFirst({
        where:{
          projectId,
          userId:ownerId,
          role:'OWNER'
        }
      })
      if(!Isowner){
        throw new ForbiddenException('only owner can add member')
      }

      const user = await this.prisma.user.findUnique({
        where:{email:data.email}
      })
      if(!user){
        throw new NotFoundException('User not found')
      }

       // Verifica se já é membro do projeto
  const alreadyMember = await this.prisma.projectMember.findFirst({
    where: {
      projectId,
      userId: user.id,
    },
  });

  if (alreadyMember) {
    throw new ConflictException('User already in project');
  }
      const addMember= await this.prisma.projectMember.create({
        data:{
          projectId,
          userId:user.id,
          role:'MEMBER'
        }
      })

    await this.activityService.createActivity({
        type:'MEMBER_ADDED',
        projectId,
        userId: user.id
    })

      return addMember
    }

    async deleteProject(projectId:string,userId:string){
        const project = await this.prisma.project.findUnique({
            where:{id:projectId,ownerId:userId}
        })
        if(!project){
            throw new BadRequestException('Project not found or unauthorized');
        }
        await this.prisma.project.delete({
            where:{id:projectId}
        })
        return {
          message:'project deleted on success'
        }
    }

}
