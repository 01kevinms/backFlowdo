import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterDTO{
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsEmail()
    email: string;
}

export class LoginDTO{
    @IsEmail()
    email: string

    @IsString()
    @MinLength(6)
    password: string;
}

export class avatarDTO{
    @IsString()
    avatar:string
}

export class updatePasswordDTO{
    @IsString()
    currentPassword: string;
    
    @IsString()
    @MinLength(6)
    newPassword: string;
}