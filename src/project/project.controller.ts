import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';

import { ProjectService } from './project.service';
import { AddMemberDTO, ProjectDTO } from './DTO/Project';
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

    @Post('create')
    async CreateProject(@Body() data:ProjectDTO,@Request() req){
        return this.projectService.createProject(data,req.user.id)
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

}
