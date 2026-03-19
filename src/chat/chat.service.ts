import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma:PrismaService){}

async getConversations(userId:string,friendId:string){

  const conversation = await this.prisma.conversation.findFirst({
    where:{
      OR:[
        {user1Id:userId,user2Id:friendId},
        {user1Id:friendId,user2Id:userId}
      ]
    },
    include:{
      messages:{
        include:{
          sender:{
            select:{
              id:true,
              name:true,
              avatar:true
            }
          }
        },
        orderBy:{
          createdAt:'asc'
        }
      }
    }
  })
  return conversation?.messages ?? []
}   

async getUserConversations(userId:string){
    const conversations=await  this.prisma.conversation.findMany({
        where:{
            OR:[
                {user1Id:userId},
                {user2Id:userId}
            ]
        },
        include:{
            user1:{
                 select:{id:true,name:true,avatar:true}
            },
            user2:{
                 select:{id:true,name:true,avatar:true}
            },
           
        },
         orderBy:{
       lastMessageAt:'desc'
    }
    })

     const map = new Map()

  for (const conv of conversations) {
    const key =
      conv.user1Id < conv.user2Id
        ? `${conv.user1Id}-${conv.user2Id}`
        : `${conv.user2Id}-${conv.user1Id}`

    const existing = map.get(key)

    // prioriza conversa que tem mensagem
    if (!existing || conv.lastMessageAt) {
      map.set(key, conv)
    }
  }

  return Array.from(map.values())

}

async sendMensage(friendId: string,senderId: string ,content: string) {

  if (senderId === friendId)
    throw new BadRequestException("you cant send message to yourself")

  const [user1Id, user2Id] =
    senderId < friendId
      ? [senderId, friendId]
      : [friendId, senderId]

  const conversation = await this.prisma.conversation.upsert({
    where: {
      user1Id_user2Id:{
        user1Id,
        user2Id
      }
    },
    update:{},
    create:{
      user1Id,
      user2Id
    }
  })


return  await this.prisma.$transaction(async(tx)=>{
    const message = await tx.message.create({
      data:{
        content,
        conversationId:conversation.id,
        senderId
      }
    })
     await tx.notification.create({
    data:{
      userId: friendId,
      type:'NEW_MESSAGE',
      message:'Nova mensagem recebida'
    }
  })
    await tx.conversation.update({
      where:{id:conversation.id},
      data:{
        lastMessage:content,
        lastMessageAt:new Date()
      }
    })
    return message
  })
 

}

async markAsRead(conversationId:string,userId:string){
return this.prisma.message.updateMany({
    where:{
        conversationId,
        senderId:{not:userId},
        read:false
    },
    data:{read:true}
})
}

async deleteChat(conversationId:string,userId:string){

  const conversation = await this.prisma.conversation.findUnique({
    where: { id: conversationId }
  })
  if(!conversation) throw new BadRequestException()

  const isParticipant = conversation?.user1Id ===userId || conversation?.user2Id === userId
  if(!isParticipant) throw new ForbiddenException()

  await this.prisma.conversation.delete({
  where:{id:conversationId}
})
return {message:`chat deleted`}
}
}
