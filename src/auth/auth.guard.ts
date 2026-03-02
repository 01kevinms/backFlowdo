import { JwtService } from '@nestjs/jwt';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { jwtConstant } from './constant';

@Injectable()
export class AuthGuard implements CanActivate{
    constructor(private jwtservice:JwtService){}

async canActivate(context: ExecutionContext):Promise< boolean> {
    // acesso ao request
    const request = context.switchToHttp().getRequest()

    // extrair o token do header
    const token = this.extractTokenFromHeader(request);
    if(!token){
        throw new UnauthorizedException('Unauthorized');
    }
    try {
        // verificar se o token é válido
        const payload = await this.jwtservice.verifyAsync(token,{
            // secret para validar o token
            secret:jwtConstant.secret
        })

        // anexar o payload ao request
        request['user'] = payload;
    } catch (error) {
        throw new UnauthorizedException('Unauthorized');
    }
    return true;
}
// método para extrair o token do header
private extractTokenFromHeader(request: Request):string | undefined {
    // Bearer <token>
    const [type,token]=request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
}
}