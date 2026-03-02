import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { jwtConstant } from './constant';

@Module({
  imports:[JwtModule.register({
    global:true,
    secret:jwtConstant.secret,
    signOptions:{expiresIn:'60s'}
  })],
  controllers: [AuthController],
  providers: [AuthService,PrismaService]
})
export class AuthModule {}
