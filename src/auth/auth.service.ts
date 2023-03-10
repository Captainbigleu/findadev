import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from "bcrypt";

const usersService = new UsersService();

@Injectable()
export class AuthService {

    constructor
        (private usersService: UsersService,
            private jwtService: JwtService) { }

    async validateUser(pseudo: string, password: string): Promise<any> {
        const user = await this.usersService.findUserByPseudo(pseudo);
        
        const encodePassword = await bcrypt.compare(password, user.password)//comparer password hashe avec celui du user
        
        if (user && encodePassword) {// remplacer user.password avec le nom de la const de hashage
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async login(user: any) {
        const targetUser = await this.usersService.findUserByPseudo(user.pseudo);
        const payload = { username: targetUser.pseudo, sub: targetUser.id };

        return {
            access_token: this.jwtService.sign(payload),
        }
    }

}
