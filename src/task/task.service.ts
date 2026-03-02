import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRole, TaskStatus } from '@prisma/client';
import { ActivityService } from 'src/activity/activity.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommentDTO, Priority, TaskPendingDTO } from 'src/project/DTO/Project';

@Injectable()
export class TaskService {
    constructor (private prisma:PrismaService,private activityService:ActivityService){}

    
    async getPendingTask(projectId:string,userId:string){
        const isAllowed = await this.prisma.project.findFirst({
        where:{
            id:projectId, 
            OR:[ { ownerId: userId },
        { members: { 
            some: { 
            userId, 
                role: 'ADMIN' } } }]},
        include:{owner:true}
        })
        if(!isAllowed) throw new ForbiddenException()

        return await this.prisma.task.findMany({
        where:{
            projectId,
            status:TaskStatus.PENDING
        },
        include:{
            requestedBy:{
            select:{             
                name:true
            }
            }
        },
        orderBy:{
            createdAt:'asc'
        }
        })  
    }

    async addTaskToQueue(projectId: string,data: TaskPendingDTO[],userId: string) {
    return this.prisma.$transaction(async (prisma) => {

    // verifica papel do usuário no projeto
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      },
      select: { role: true }
    });

    if (!member) {
      throw new BadRequestException("User is not part of this project");
    }

    const isPrivileged =
      member.role === "OWNER" || member.role === "ADMIN";

    //  define status baseado na role
    const status = isPrivileged
      ? TaskStatus.TODO
      : TaskStatus.PENDING;

    // cria todas tasks
    const tasks = await Promise.all(
      data.map((task) =>
        prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            priority: task.priority,
            projectId,
            status,
            requestedById: userId
          },
          include: {
            requestedBy: {
              select: { name: true }
            }
          }
        })
      )
    );

    return tasks;
  });
}

    async CreateComments(data:CommentDTO,taskId:string,authorId:string){
        const task = await this.prisma.task.findUnique({
        where:{id:taskId},
        select:{id:true,status:true,projectId:true}
        })
        if(!task){
        throw new BadRequestException('Task not found')
        }
        if(task.status !== 'DONE'){
        throw new BadRequestException('Comments are only all when the task status is DONE')
        }

        const comment = await this.prisma.comment.create({
            data:{
            content:data.content,
            author:{
                connect:{
                id:authorId
                }
            },
            task:{
                connect:{
                id:taskId
                }
            }
            }
        })
        await this.activityService.createActivity({
            type:'COMMENT_ADDED',
            projectId:task.projectId,
            userId:authorId,
            taskId

        })

        return comment
    }
    
    async approvedTask(pendingTaskId:string,userId:string){
        return this.prisma.$transaction(async tx =>{
        const pending = await tx.task.findUnique({
            where:{id:pendingTaskId}
        })
        if(!pending) throw new NotFoundException()

        const task = await this.prisma.task.create({
            data:{
            title:pending.title,
            description: pending.description,
            priority: pending.priority,
            status: TaskStatus.TODO,           
            projectId: pending.projectId,
            requestedById: pending.requestedById,
            assignedToId:userId
            },
            include:{
            assignedTo:{
                select:{name:true}
            }
            }
        })
    await this.activityService.createActivity({
        type:'TASK_APPROVED',
        projectId:task.projectId,
        userId:task.assignedToId!,
        taskId:task.id,
        metadata:{
            title:task.title,
            requestedById:pending.requestedById
        }
    })
    
        // remove queue
        await tx.task.delete({
            where:{id:pendingTaskId}
        })
        return task
        })
    }

    async updatStatus(status: TaskStatus,taskId: string,userId: string) {
    return this.prisma.$transaction(async (tx) => {
    const task = await tx.task.findUnique({
        where: { id: taskId },
        include:{
        doingBy:{
            select:{
            id:true,
            name:true
            }
        }
        }
    })

    if (!task) {
        throw new NotFoundException('Task não encontrada')
    }


    await this.activityService.createActivity({
        type:'STATUS_CHANGED',
        projectId:task.projectId,
        userId,
        taskId:task.id,
        metadata:{
            newStatus:status
        }
    })

    // 🔒 já está ocupada por outra pessoa
    if (
        status === TaskStatus.DOING &&
        task.doingById &&
        task.doingById !== userId
    ) {
        throw new ForbiddenException(
        `Essa task está sendo feita por ${task.doingBy?.name}`
        )
    }
    // 👉 entrar em DOING
    if (status === TaskStatus.DOING) {
        return tx.task.update({
        where: { id: taskId },
        data: {
            status: TaskStatus.DOING,
            doingById: userId,
        },
        })
    }

    // 👉 finalizar
    if (status === TaskStatus.DONE) {
        if (task.doingById !== userId) {
        throw new ForbiddenException(
            'Você só pode finalizar tasks que iniciou'
        )
        }

        return tx.task.update({
        where: { id: taskId },
        data: {
            status: TaskStatus.DONE,
            doingById: null,
        },
        })
    }

    // 👉 voltar pra TODO
    if (status === TaskStatus.TODO) {
        if (task.doingById !== userId) {
        throw new ForbiddenException()
        }

        return tx.task.update({
        where: { id: taskId },
        data: {
            status: TaskStatus.TODO,
            doingById: null,
        },
        })
    }

    return task
    })
    }

    async updatePriority(taskId:string,priority:Priority,userId:string){

    const task = await this.prisma.task.findUnique({
        where:{id:taskId},
        select:{id:true,projectId:true}
    })
    if(!task) throw new NotFoundException('Task not found')

    const canManage = await this.prisma.projectMember.findFirst({
        where:{
        projectId:task.projectId,
        userId,
        role:{in:[ProjectRole.OWNER,ProjectRole.ADMIN]}
        }
    })
    if(!canManage) throw new ForbiddenException('You do not have permission')
        
    const ChangePriority= await this.prisma.task.update({
        where:{id:taskId},
        data:{priority:priority.priority}
    })
        
    await this.activityService.createActivity({
        type:'PRIORITY_CHANGED',
        projectId:ChangePriority.projectId,
        userId,
        taskId:ChangePriority.id,
        metadata:{
            priority:priority.priority
        }
    })

    return ChangePriority
    }

    async rejectTask(pendingTaskId:string,userId:string){
    return this.prisma.$transaction(async(prisma)=>{

    const task=await prisma.task.findUnique({
        where:{id:pendingTaskId},
        include:{project:{select:{ownerId:true}}}
    })

        if (!task || task.status !== 'PENDING') {
    throw new BadRequestException('Invalid task')
    }
        if(task.project.ownerId !== userId){
        throw new ForbiddenException('Only owner can reject task')
        }
        const taskReject = await prisma.task.update({
        where:{id:pendingTaskId},
        data:{
            status:'REJECTED',
            assignedToId:userId,
            }
    })

    await this.activityService.createActivity({
        type:'TASK_REJECTED',
        projectId:taskReject.projectId,
        userId,
        taskId:taskReject.id
    })
    return {message:'task rejeitada'}
        })
    }

    async deleteTask(taskId:string,userId:string){
    const task = await this.prisma.task.findUnique({
    where:{id:taskId},
    select:{
        id:true,
        project:{
        select:{
            ownerId:true
        }
        }
    }

    })
    if (!task) {
    throw new NotFoundException("Task não encontrada");
    }
    if (task.project.ownerId !== userId) {
    throw new NotFoundException("Voce nao tem permissao para deletar esta task");
    }
    await this.prisma.task.delete({
    where:{id:taskId}
    })

    return { message: "Task deletada com sucesso"}
    }
}
