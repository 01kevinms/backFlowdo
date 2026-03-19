import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginDTO, RegisterDTO, updatePasswordDTO } from './dto/auth';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { jwtConstant } from './constant';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(private prisma:PrismaService, private jwtService: JwtService){}

    async registerUser(data:RegisterDTO){
        const userexistes = await this.prisma.user.findUnique({
            where:{
                email:data.email
            }
        })
        if(userexistes){
            throw new UnauthorizedException('User already exists');
        }
        const FirstAvatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=${data.name}`
        const hashedPassword = await bcrypt.hash(data.password, 10)
        const user = await this.prisma.user.create({
            data:{
                ...data,
                password:hashedPassword
            }
        })
        return {
            avatar: FirstAvatar,   
            email:user.email,
            name:user.name
        };
    }

    async loginUser(data:LoginDTO){
        const user = await this.prisma.user.findUnique({
            where:{
                email:data.email
            }
        })
    
        if(!user){
            throw new UnauthorizedException('Invalid credentials');
        }
        const passwordMatch = await bcrypt.compare(data.password, user!.password);

        if(!passwordMatch){
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {
            id:user.id,
            name:user.name,
            email:user.email
        }
        const accessToken = await this.jwtService.signAsync(payload,{
            expiresIn:'60s'
        })
        const refreshToken = this.jwtService.sign(payload,{
            expiresIn:'1d'
        })
        
        return{
            accessToken,
            refreshToken
        }
    }

    async refresh(refreshToken:string){
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken,{
                secret:jwtConstant.secret
            })
            const user = await this.prisma.user.findUnique({
                where:{id: payload.id}
            })
            if(!user){
                throw new UnauthorizedException()
            }
            const newAccessToken = this.jwtService.sign({
                id:user.id,
                name:user.name,
                email:user.email
            },
            {
                expiresIn:'1d'
            }
        )
        return{newAccessToken}
        } catch (error) {
            throw new UnauthorizedException()
        }
    }
    
    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where:{id:userId},
            select:{
                id:true,
                name:true,
                email:true,
                avatar:true
            },})

        if (!user) throw new NotFoundException('User not found')

        const [doingTasksCount, completedTasksCount, createdProjectsCount] = await this.prisma.$transaction([
            this.prisma.task.count({
                where: {
                    doingById: userId,
                    status: TaskStatus.DOING
                }}),
            this.prisma.task.count({
                where: {
                    requestedById: userId,
                    status: TaskStatus.DONE
                }}),
            this.prisma.project.count({
                where: {
                    ownerId: userId
                }})
        ])

        return {
            ...user,
            stats: {
                doingTasksCount,
                completedTasksCount,
                createdProjectsCount
            }
        }
    }

    async getNotification(userId:string){
    const notify=await this.prisma.notification.findMany({
      where:{userId},
      include:{
        activity:true
      },
      orderBy:{
        createdAt:'desc'
      }
    })

    await this.deleteOldNotifcation()

    return notify
   }

    async readeNotifcation(id:string){
        await this.deleteOldNotifcation()
      const readNotify= await this.prisma.notification.update({
        where:{id},
        data:{
          isRead:true,
          readAt: new Date()
        }
      })

      return readNotify
    }

    async updateAvatar(userId:string,avatar:string){
       
        return this.prisma.user.update({
            where:{id:userId},
            data:{avatar},
            select:{
                name:true,
                avatar:true
            }
        })
    }

    async updatePassword(userId:string,data:updatePasswordDTO){
        const user = await this.prisma.user.findUnique({
            where:{id:userId}
        })
        if(!user) throw new ForbiddenException()

        const passwordMatch = await bcrypt.compare(data.currentPassword, user.password)
        if(!passwordMatch) throw new BadRequestException()
        
        const hashedPassword = await bcrypt.hash(data.newPassword, 10)

        await this.prisma.user.update({
            where:{id:userId},
            data:{password:hashedPassword}
        })

        return {message:"Senha atualizada com sucesso"}
    }

    async exitProject(projectId:string,userId:string){
        const member = await this.prisma.projectMember.findFirst({
            where:{
                projectId,
                userId
               },include:{
                user:{
                    select:{name:true}
                }
               }
        })
        if(!member ) throw new NotFoundException()
        if(member.role === 'OWNER') {
            const owner = await this.prisma.projectMember.count({
                where:{
                    projectId,
                    role:'OWNER'
                }
            })
            if(owner <=1) throw new ForbiddenException('you must transfer ownership before leaving the project')

            }
            await this.prisma.projectMember.delete({
              where:{id:member.id}
            })
            await this.prisma.notification.create({
                data:{
                    type:'MEMBER_LEAVE',
                    userId:member.userId,
                    message:`o membro ${member.user.name} saiu do projeto`
                }
            })
            return {message:'you left the project'} 
    }

    async deleteOldNotifcation(){
        const hours = 24;

        const limitDate = new Date(
            Date.now() - hours * 60 * 60 * 1000
        );
        return this.prisma.notification.deleteMany({
            where:{
                isRead:true,
                readAt:{
                    lte:limitDate
                }
            }
        })
    }

    async deleteUser(userId:string){
        await this.prisma.user.delete({
            where:{id:userId}
        })
        return {message:'user deleted succesfully'}
    }
}
