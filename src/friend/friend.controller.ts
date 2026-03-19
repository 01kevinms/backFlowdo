import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { FriendService } from './friend.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('friend')
@UseGuards(AuthGuard)
export class FriendController {
    constructor(private service:FriendService){}

@Get()
async getFriends(@Request() req){
    return this.service.getFriends(req.user.id)
}

@Get('profile/:id')
async GetProfileFriend(@Param('id') id:string){
    return this.service.getProfileFriend(id)
}

@Get('search')
async searchFriend(@Query('q') q:string,@Request()req){
    return this.service.searchFriend(q,req.user.id)
}

@Get('send')
async getPendingRequest(@Request() req){
    return this.service.getFriendRequest(req.user.id)
}

@Get('received')
async getRequestReceived(@Request() req){
    return this.service.getRequestReceived(req.user.id)
}


@Get('status/:friendId')
async getStatusFriend(@Request() req,@Param('friendId') friendId:string){
    return this.service.getFriendStatus(req.user.id,friendId)
}

@Post('request/:id')
async sendRequest(@Request() req, @Param('id') targetUserId: string){
    return this.service.sendFriendRequest(targetUserId,req.user.id)
}

@Post('accept/:id')
async acceptFriendRequest(@Request() req, @Param('id') targetUserId: string){
    return this.service.acceptedFriend(targetUserId,req.user.id)
}

@Post('reject/:targetUserId')
async rejectRequest(@Request() req, @Param('targetUserId') targetUserId: string){
    return this.service.rejectRequest(targetUserId,req.user.id)
}

@Delete('remove/:friendId')
async removeFriend(@Param('FriendId') friendId:string,@Request() req){
    return this.service.removeFriend(friendId,req.user.id)
}


@Delete('cancel/:friendId')
async cancelRequest(@Param('FriendId') friendId:string,@Request() req){
    return this.service.cancelRequest(friendId,req.user.id)
}
}
