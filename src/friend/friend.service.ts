import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { StatusRequest } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FriendService {
    constructor(private prisma:PrismaService){}

    async getFriends(userId:string){

        const friends = await this.prisma.friend.findMany({
            where:{
                status:'ACCEPTED',
                OR:[
                    {userAId:userId},
                    {userBId:userId}
                ]
            },
            include:{
                userA:{select:{name:true,id:true,avatar:true,email:true}},
                userB:{select:{name:true,id:true,avatar:true,email:true}},
                
            }
        })

        return friends.map(friend=>
            friend.userAId === userId ? friend.userB : friend.userA
        )
    }

   async getFriendStatus(userId:string,targetId:string){

        const relation = await this.prisma.friend.findFirst({
        where:{
        OR:[
        {userAId:userId,userBId:targetId},
        {userAId:targetId,userBId:userId}
        ]
        }
        })

        if(!relation) return "NONE"

        if(relation.status === "ACCEPTED") return "FRIEND"

        if(relation.userAId === userId && relation.status === "PENDING"){
        return "PENDING_SENT"
        }

        if(relation.userBId === userId && relation.status === "PENDING"){
        return "PENDING_RECEIVED"
        }

        }

    async getFriendRequest(userId:string){
        return this.prisma.friend.findMany({
            where:{
                status: StatusRequest.PENDING,
                userAId:userId
            },
            select:{
                status:true,
                id:true,
                createdAt:true,
                userB:{
                    select:{
                        name:true,
                        avatar:true,
                        id:true
                    }
                }
            }
        })
    }

    async getRequestReceived(userId:string){
        return this.prisma.friend.findMany({
            where:{
                status: StatusRequest.PENDING,
                userBId:userId
            },
            select:{
                id:true,
                createdAt:true,
                userA:{
                    select:{
                        name:true,
                        avatar:true,
                        id:true
                    }
                }
            }
        })
    }

    async getProfileFriend(friendId:string){
        return this.prisma.user.findUnique({
            where:{id:friendId},
            select:{
                name:true,
                id:true,
                email:true,
                avatar:true
            }
        })
    }

    async searchFriend(q:string,userId:string){
        if(!q) return []
        return this.prisma.user.findMany({
            where:{
                NOT:{id:userId},
                OR:[
                {name:{contains:q}},
                {email:{contains:q}}
                ]
            },
             select:{
                name:true,
                id:true,
                email:true,
                avatar:true,

            }
        })
    }

    async sendFriendRequest(targetUserId:string,userId:string){
        if(userId === targetUserId) throw new BadRequestException('you cant send friend request to yourself')

           
      const existing = await this.prisma.friend.findFirst({
        where:{
           OR:[
            {userAId:userId,userBId:targetUserId},
            {userAId:targetUserId,userBId:userId}
           ]
        }
      })   
      if(existing){
        if(existing.status === 'ACCEPTED'){
            throw new BadRequestException('friend request already exists or you are already friends')
        }
        else if(existing.status === 'PENDING'){
            throw new BadRequestException('friend request already exists or you are already friends')
        }
        else{
        return this.prisma.friend.update({
            where:{id:existing.id},
            data:{status:'PENDING'}
        }) 
        }
      }
      
      return this.prisma.friend.create({
        data:{
            userAId:userId,
            userBId:targetUserId,
            status:StatusRequest.PENDING
        }
      })

    }

    async cancelRequest(friendId:string,userId:string){
        const request = await this.prisma.friend.findFirst({
            where:{
                userAId:userId,
                userBId:friendId,
                status:'PENDING'
            }
        })
        if(!request) throw new BadRequestException('request not found')

        await this.prisma.friend.delete({
            where:{id:request.id}
        })
        
        return {message:'request cancel succefully'}
    }

    async acceptedFriend(friendId:string,userId:string){
      const request = await this.prisma.friend.findUnique({
        where:{ id:friendId },include:{userB:true}
      })
      if(!request) throw new NotFoundException('request not found')
      if(request.userBId !== userId) throw new BadRequestException('you are not accepting this request')
    
        const accept= await this.prisma.friend.update({
            where:{ id:friendId },
            data:{
                status:'ACCEPTED'
            }
        })

        await this.prisma.notification.create({
            data:{
                type:'FRIEND_REQUEST_ACCEPTED',
                userId:request.userAId,
                message:`${request.userB.name} accepted your friend request`
            }
        })
        const conversation = await this.prisma.conversation.findFirst({
            where:{
                OR:[
                    {user1Id:request.userAId, user2Id:request.userBId},
                    {user1Id:request.userBId, user2Id:request.userAId}
                ]
            }
        })
        if(!conversation){
        await this.prisma.conversation.create({
            data:{
                user1Id:request.userAId,
                user2Id:request.userBId
            }
        })
        }
        

        return accept
    }

    async rejectRequest(friendId: string, userId: string) {

    const request = await this.prisma.friend.findUnique({
        where: { id: friendId },
        include: { userB: true }
    })

    if (!request) {
        throw new NotFoundException("request not found")
    }

    if (request.userBId !== userId) {
        throw new ForbiddenException("you cannot reject this request")
    }

    if (request.status !== StatusRequest.PENDING) {
        throw new BadRequestException("request is not pending")
    }

    await this.prisma.notification.create({
        data: {
        type: "FRIEND_REQUEST_REJECTED",
        userId: request.userAId,
        message: `${request.userB.name} rejected your friend request`
        }
    })

    return this.prisma.friend.update({
        where: { id: friendId },
        data: {
        status: StatusRequest.REJECTED
        }
    })
    }

    async removeFriend(friendId:string,userId:string){
        const friend = await this.prisma.friend.findFirst({
            where:{
                OR:[
                    {userAId:userId,userBId:friendId},
                    {userAId:friendId,userBId:userId}
                ]
            }
        })
        if(!friend) throw new NotFoundException()

        await this.prisma.friend.delete({
            where:{id:friend.id}
        })

        return {message:'Amigo removido com sucesso'}
    }
}
