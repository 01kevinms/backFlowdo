import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';

import { ProjectService } from './project.service';
import { AddMemberDTO, ProjectDTO, RemoveMemberDTO, updateRoleDTO } from './DTO/Project';
import { AuthGuard } from 'src/auth/auth.guard';
import { ProjectRoleGuard } from './projectRole.guard';
import { ActivityService } from 'src/activity/activity.service';

@Controller('project')
@UseGuards(AuthGuard)
export class ProjectController {
    constructor(private projectService: ProjectService,private ActivityService:ActivityService){}

    @Get('projects')
    async GetProjects(@Request() req){
        return this.projectService.getProjects(req.user.id)
    }

    @Get(':id')
    async getProjectId(@Param('id') id:string){
        return this.projectService.getProjectId(id)
    }

    @Get(':taskId/comments')
    async getComments(@Param('taskId') taskId:string){
        return this.projectService.getComments(taskId)
    }

    @Get(':projectId/activity')
    async getActivity(@Param('projectId') projectId:string){
        return this.ActivityService.getActivity(projectId)
    }

    @Get('activity/me')
    async getUserActivity(@Request() req){
        return this.ActivityService.getUserActivity(req.user.id)
    }

    @Get('home/dashboard')
    async getDashboard(@Request() req){
        return this.ActivityService.getDashboard(req.user.id)
    }

    @Get('members/:projectId')
    async getMembers(@Param('projectId') projectId:string){
        return this.projectService.getMemberProject(projectId)
    }

    @Get('invites/user')
    async getInvites(@Request() req){
        return this.projectService.getInviteProjects(req.user.id)
    }

    @Post('create')
    async CreateProject(@Body() data:ProjectDTO,@Request() req){
        return this.projectService.createProject(data,req.user.id)
    }

    @Put('accept/:inviteId')
    async acceptInvite(@Request() req,@Param('inviteId') inviteId:string){
        return this.projectService.acceptInviteProject(inviteId,req.user.id)
    }

    @Put('reject/:inviteId/:memberId')
    async rejectInvite(@Param('inviteId') inviteId:string,@Param('memberId') memberId:string){
        return this.projectService.rejectInviteProject(inviteId,memberId)
    }

    @Put('role/:projectId/')
    async updateRoleMember(@Param('projectId') projectId:string,@Body() data:updateRoleDTO,@Request() req){
        return this.projectService.updateRole(data,req.user.id,projectId)
    }

    @UseGuards(ProjectRoleGuard)
    @Post(':projectId/members')
    async addMemberProject(@Param('projectId') projectId:string,@Body() data:AddMemberDTO,@Request() req){
        return this.projectService.addMemberProject(projectId,req.user.id,data)
    }

    @Delete('projects/:projectId')
    async DeleteProject(@Param('projectId') projectId:string, @Request() req){
        return this.projectService.deleteProject(projectId,req.user.id)
    }

     @Delete('remove/:projectId')
    async RemoveMember(@Param('projectId') projectId:string,@Body() body:RemoveMemberDTO ,@Request() req){
        return this.projectService.removeMember(projectId,body.memberId,req.user.id)
    }

    @Delete('cancel/:inviteId')
    async CancelInvite(@Param('inviteId') inviteId:string,@Request() req){
        return this.projectService.cancelInvite(inviteId,req.user.id)
    }

}
