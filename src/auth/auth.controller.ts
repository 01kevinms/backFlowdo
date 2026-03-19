import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Request, UseGuards} from '@nestjs/common';

import { avatarDTO, LoginDTO, RegisterDTO, updatePasswordDTO } from './dto/auth';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private AuthService: AuthService){}
  
@Post('login')
async Login(@Body() data: LoginDTO) {
  return this.AuthService.loginUser(data)
}

@Post('register')
async Register(@Body() data: RegisterDTO){
    return this.AuthService.registerUser(data)
}

@Post('refresh')
async refresh(@Body('refreshToken') refreshToken:string){
    return this.AuthService.refresh(refreshToken)
}

@UseGuards(AuthGuard)
@Get('profile')
async getProfile(@Request() req){
    return this.AuthService.getProfile(req.user.id)
}

@UseGuards(AuthGuard)
@Get('notification/user')
async getNotification(@Request() req){
return this.AuthService.getNotification(req.user.id)
}

@UseGuards(AuthGuard)
@Patch('avatarUser')
async updateAvatar(@Request()req,@Body() body:avatarDTO){
    return this.AuthService.updateAvatar(req.user.id,body.avatar)
}

@UseGuards(AuthGuard)
@Put('updatePassword')
async updatePassword(@Request() req,@Body() data:updatePasswordDTO){
    return this.AuthService.updatePassword(req.user.id,data)
}

@Put(':notificationId/me')
async readNotification(@Param('notificationId')notificationId:string){
    return this.AuthService.readeNotifcation(notificationId)
}

@UseGuards(AuthGuard)
@Delete('leave/:projectId')
async exitProject(@Param('projectId') projectId:string,@Request() req){
    return this.AuthService.exitProject(projectId,req.user.id)
}

@UseGuards(AuthGuard)
@Delete('delete/user')
async deleteUser(@Request() req){
    return this.AuthService.deleteUser(req.user.id)
}
}
