import { Body, Controller, Delete, Get, Param, Post, Put, Req, Request, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
    constructor(private service:ChatService) {}

@Get(':friendId')
async getConversations(@Request()req,@Param('friendId') friendId:string){
return this.service.getConversations(req.user.id,friendId)
}

@Get()
async getUserChat(@Request()req){
    return this.service.getUserConversations(req.user.id)
}

@Post(':friendId')
  sendMessage(
    @Param('friendId') friendId: string,
    @Req() req,
    @Body('content') content: string
  ) {
    return this.service.sendMensage(friendId, req.user.id, content)
  }

@Put(':conversationId/user')
async markRead(@Param('conversationId') conversationId:string,@Request()req){
  return this.service.markAsRead(conversationId,req.user.id)
}

@Delete('delete/:conversationId')
async deleteChat(@Param('conversationId') conversationId:string,@Request() req){
return this.service.deleteChat(conversationId,req.user.id)
}
}
