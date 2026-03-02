import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterDTO{
    @IsNotEmpty()
    username: string;

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