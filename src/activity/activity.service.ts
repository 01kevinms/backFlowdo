import { Or } from './../../generated/prisma/internal/prismaNamespace';
import { Injectable } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ActivityService {
    constructor (private prisma:PrismaService){}

   async createActivity({type,projectId,userId,taskId,metadata}:{type:ActivityType,projectId:string,userId:string,taskId?:string,metadata?:any}){
        const activity=await this.prisma.activity.create({
          data:{
            type,
            projectId,
            userId,
            taskId,
            metadata
          }
        })
       const notificationMap = {
        TASK_APPROVED: (metadata) => ({
          message: `Sua task "${metadata.title}" foi aprovada`,
          userId: metadata.requestedById
        }),
        TASK_REJECTED: (metadata) => ({
          message: `Sua task "${metadata.title}" foi rejeitada`,
          userId: metadata.requestedById
        })
      };
      const handler = notificationMap[type];

if (handler && metadata) {
  const notificationData = handler( metadata );

  await this.prisma.notification.create({
    data: {
      type,
      ...notificationData,
      activityId: activity.id
    }
  });
}


        return activity
    }

    async getUserActivity(userId: string) {
  const activities = await this.prisma.activity.findMany({
    where: {
      OR: [
        { project: { ownerId: userId } },
        { project: { members: { some: { userId } } } }
      ]
    },
    include: {
      user: { select: { name: true } },
      project: { select: { id: true, name: true } },
      task: { select: { title: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  //  agrupamento aqui
  const grouped = activities.reduce((acc, activity) => {
    const projectId = activity.project.id;

    if (!acc[projectId]) {
      acc[projectId] = {
        projectId,
        projectName: activity.project.name,
        activities: []
      };
    }

    acc[projectId].activities.push(activity);

    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped);
    }

    async getActivity(projectId:string){
      return this.prisma.activity.findMany({
        where:{projectId},
        include:{
          user:{
           select:{
            id:true,
            name:true
           }
          },
          task:{
            select:{
              id:true,
              title:true
            }
          }
        },
        orderBy:{
          createdAt:'desc'
        },
        take:30
      })
    }

    async getDashboard(userId: string) {
      // search for projects that the user participates in
      const projects = await this.prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: {
            select: { task: true }
          }
        }
      });
      if (!projects.length) {
          return {
            projectsCount: 0,
            pendingTasks: 0,
            doingTasks: 0,
            completedTasks: 0,
            recentProjects: []
          };
        }
      const projectIds = projects.map(p => p.id);

      // count tasks for status
      const tasks = await this.prisma.task.groupBy({
        by: ["status"],
        where: {
          projectId: { in: projectIds }
        },
        _count: true
      });

      const countByStatus = (status: string) =>
        tasks.find(t => t.status === status)?._count ?? 0;

      return {
        projectsCount: projects.length,
        pendingTasks: countByStatus("PENDING"),
        doingTasks: countByStatus("DOING"),
        completedTasks: countByStatus("DONE"),
        recentProjects: projects
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            name: p.name,
            tasksCount: p._count.task
          }))
      };
    }

}
