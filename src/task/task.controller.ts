import { CommentDTO} from 'src/project/DTO/Project';
import { TaskService } from './task.service';
import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { Priority, TaskPendingDTO, UpdateStatus } from './dtos/taskDTO';

@Controller('task')
@UseGuards(AuthGuard)
export class TaskController {
    constructor (private service: TaskService){}

    
@Get(':projectId/pending')
async taskPending(@Param('projectId') projectId:string){
    return this.service.getPendingTask(projectId)
}

@Post(':projectId/queue')
async addTaskQueue(
    @Param('projectId') projectId:string,
    @Body() data:TaskPendingDTO[],
    @Request() req){
    return this.service.addTaskToQueue(projectId,data,req.user.id)
}

@Post(':taskId/comments')
async CreateComments(
@Param('taskId') taskId:string,
@Body()data:CommentDTO,
@Request() req
){
return this.service.CreateComments(data,taskId,req.user.id)
}

@Post(':pendingTaskId/approved')
async taskApproved(@Param('pendingTaskId') pendingTaskId:string,@Request() req){
    return this.service.approvedTask(pendingTaskId,req.user.id)
}

@Put(":taskId/priority")
async UpdatePirority(@Param("taskId") taskId:string,@Body() priority:Priority,@Request() req){
    return this.service.updatePriority(taskId,priority,req.user.id)
}

@Put(":id/status")
async UpdateStatus(@Param("id")taskId:string,@Body() status:UpdateStatus,@Request()req){
    return this.service.updatStatus(status.status,taskId,req.user.id)
}

@Put(':pendingTaskId/reject')
async removeTaskPending(@Param('pendingTaskId') pendingTaskId:string,@Request() req){
    console.log(pendingTaskId)
    return this.service.rejectTask(pendingTaskId,req.user.id)
}

@Delete(':taskId/tasks')
    async DeleteTask(@Param('taskId') taskId:string,@Request() req:any){
        return this.service.deleteTask(taskId,req.user.id)
    }
    
}
