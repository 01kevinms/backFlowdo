import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProjectRoleGuard implements CanActivate{
constructor (private prisma:PrismaService){}
 async   canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const userId =request.user?.id
        const projectId= request.params?.projectId

  if (!userId || !projectId) {
    throw new ForbiddenException('Invalid request context');
  }
        const member = await this.prisma.projectMember.findFirst({
            where:{
                projectId,
                userId,
                role:{in:['OWNER', 'ADMIN']}
            }
        })
        if(!member){
            throw new ForbiddenException('you do not have permission to manage this project')
        }
        return true
    }}