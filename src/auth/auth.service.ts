import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import bcrypt from 'bcrypt';
import { Request } from 'express';
import { PayloadDto } from './dto/payload.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string }> {
    if (registerDto.password !== registerDto.password_confirmation) {
      throw new HttpException('Passwords do not match', 400);
    }

    const user = await this.usersService.create({ ...registerDto });

    const payload = { sub: user._id.toString(), username: user.username };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.usersService.findByUsername(loginDto.username);

    if (!user) {
      throw new UnauthorizedException();
    }

    const passwordVerification = await bcrypt.compare(
      loginDto.password,
      user?.password,
    );

    if (!passwordVerification) {
      throw new UnauthorizedException();
    }

    const payload = { id: user._id.toString(), username: user.username };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async me(req: Request & { user: PayloadDto }) {
    const user = await this.usersService.findOne(req.user['id']);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
