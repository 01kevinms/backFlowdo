import 'reflect-metadata';
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  const app = await NestFactory.create(AppModule,{
    cors:{
      origin:['https://interface-flowdo.vercel.app'],
      credentials:true,
      allowedHeaders:'Content-Type, Authorization',
      methods:'GET,POST,PUT,DELETE,PATCH',
    }
  });

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    transform:true,
    whitelist:true,
    forbidNonWhitelisted:true,
    transformOptions:{
      enableImplicitConversion:true
    }
  }))
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
