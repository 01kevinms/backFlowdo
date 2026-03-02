import { Body, Controller, Get, Param, Post, Put, Request, UseGuards} from '@nestjs/common';

import { LoginDTO, RegisterDTO } from './dto/auth';
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

@Put(':notificationId/me')
async readNotification(@Param('notificationId')notificationId:string){
    return this.AuthService.readeNotifcation(notificationId)
}
}
