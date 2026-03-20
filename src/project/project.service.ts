import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { ActivityService } from './../activity/activity.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddMemberDTO, ProjectDTO, updateRoleDTO} from './DTO/Project';
import {  ProjectRole, StatusRequest} from '@prisma/client';

@Injectable()
export class ProjectService {
constructor(private prisma:PrismaService,private activityService:ActivityService){}

    // create logic for return only projects if user to participate projetc and projects create
    async getProjects(userId:string){
    return await this.prisma.project.findMany({
      where:{members:{
        some:{
          userId,
          status:StatusRequest.ACCEPTED
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

    async getProjectId(projectId:string){
      
      const project = await this.prisma.project.findUnique({
        where:{id:projectId},
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
            where:{status:StatusRequest.ACCEPTED},
            select:{
              joinedAt:true,
              status:true,
              role:true,
              user:{
                select:{
                  name:true,
                  id:true
                }
              }            
            }
          },
        }
      })
      if(!project) throw new BadRequestException('this project dont exist ')

    return project
      
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

    async getMemberProject(projectId:string){
        const exist = await this.prisma.project.findUnique({
        where:{id:projectId}
      })
      if(!exist) throw new BadRequestException('this project dont exist ')

        return this.prisma.projectMember.findMany({
          where:{
            projectId,
            
          },
          include:{
            user:{
              select:{
                name:true,
                id:true
              }
            }
          },
          orderBy:{
            role:'asc'
          }
        })
      
    }

    async getInviteProjects(userId:string){
      const invites = await this.prisma.projectMember.findMany({
        where:{status:StatusRequest.PENDING,userId},
        include:{
          project:{
            select:{
              id:true,
              name:true
            }
          },
          user:{
            select:{
              name:true,
              id:true
            }
          }
        }
      })
      if(!invites) throw new NotFoundException('dont have invites')

        return invites
    }

    async createProject(data:ProjectDTO,ownerId:string){
       const project = await this.prisma.project.create({
            data: {
                name: data.name,
                description: data.description,
                members:{
                  create:{
                    userId:ownerId,
                    role:"OWNER",
                    status:StatusRequest.ACCEPTED
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
          role: {in:['OWNER', 'ADMIN']}
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
          status:StatusRequest.ACCEPTED
        },
      });

      if (alreadyMember) {
        throw new ConflictException('User already in project');
      }
          const invite = await this.prisma.projectMember.create({
            data:{
              projectId,
              userId:user.id,
              role: data.role || 'MEMBER',
              status:StatusRequest.PENDING
            }
          })

          return invite
    }

    async acceptInviteProject(inviteId:string,userId:string){
   
      const invite = await this.prisma.projectMember.findFirst({
        where:{
          userId,
          status:StatusRequest.PENDING
        }
      })
      if(!invite) throw new NotFoundException('invite not found')
      
      await this.prisma.projectMember.update({
        where:{id:inviteId},
        data:{status:StatusRequest.ACCEPTED}
      })

      await this.activityService.createActivity({
        type:'MEMBER_ADDED',
        projectId:invite.projectId,
        userId
    })
    return {message:'Invite accepted'}
    }

    async rejectInviteProject(inviteId:string,memberId:string){
      await this.prisma.projectMember.update({
        where:{id:inviteId},
        data:{status:StatusRequest.REJECTED}
      })

      await this.prisma.projectMember.delete({
        where:{id:inviteId,userId:memberId}
      })
      
      return {message:'invite rejected'}
    }

    async updateRole(data:updateRoleDTO,ownerId:string,projectId:string){
      const isOwnerAdm = await this.prisma.projectMember.findFirst({
        where:{
          projectId,
          userId:ownerId,
          role:{
            in:['OWNER','ADMIN']}
          },
          include:{user:{select:{name:true}}}
      })
      if(!isOwnerAdm) throw new ForbiddenException('you dont have permission for this')
      if(isOwnerAdm.role === 'ADMIN' && data.role === 'OWNER') throw new ForbiddenException('admin cannot promote to owner')
      
      const member = await this.prisma.projectMember.findUnique({
        where:{id:data.memberId}
      })
      if(!member) throw new NotFoundException('Member not found')
      if(member.userId ===ownerId) throw new ForbiddenException('you cannot change your own role')  
        
       return await this.prisma.$transaction(async(tx)=>{

          const updateRole = await tx.projectMember.update({
            where:{id:data.memberId},
            data:{role:data.role}
          })
        await tx.notification.create({
          data:{
            type:'ROLE_UPDATED',
            userId:member.userId,
            message:`${isOwnerAdm.user.name} change you role`
          }
        })
        
        return updateRole
      })
    }

    async cancelInvite(inviteId:string,userId:string){
      const invite = await this.prisma.projectMember.findFirst({
        where:{id:inviteId, status:StatusRequest.PENDING}
      })
      if (!invite) throw new NotFoundException("Invite not found")

     const isOwnerAdm = await this.prisma.projectMember.findFirst({
      where:{userId,role:{in:["OWNER","ADMIN"]}}
     })
     if(!isOwnerAdm) throw new ForbiddenException("you dont have permission for this")

      await this.prisma.projectMember.delete({
        where:{id:inviteId},
      })

      return {message:"invite cancel succefully"}
    }

    async removeMember(projectId: string, memberId: string, ownerId: string) {

      const owner = await this.prisma.projectMember.findFirst({
        where:{
          projectId,
          userId: ownerId,
          role:{ in:['OWNER','ADMIN'] }
        }
      })

      if(!owner)
        throw new ForbiddenException(
          'only owner or admin can remove member'
        )

      const member = await this.prisma.projectMember.findFirst({
        where:{
          projectId,
          userId: memberId
        }
      })

      if(!member)
        throw new NotFoundException('Member not found')

      if(member.role === 'OWNER')
        throw new ForbiddenException('Cannot remove project owner')

      await this.prisma.projectMember.delete({
        where:{
          id: member.id
        }
      })

      return { message:'User removed successfully' }
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
