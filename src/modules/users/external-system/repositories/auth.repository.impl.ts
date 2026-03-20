import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from '../../business/repositories/auth.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { IAuth, IUser } from '../../business/entities';

import * as bcrypt from 'bcrypt';
import { JwtPayload } from 'src/shared/interfaces/Jwt-payload.interface';

@Injectable()
export class AuthRepositoryImpl implements AuthRepository {
  private readonly logger = new Logger(AuthRepositoryImpl.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(phone: string, password: string): Promise<IAuth> {
    const user = await this.userRepo.findOne({
      where: { phone },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        password: true,
        isVerified: true,
        isPhoneVerified: true,
        isDeleted: true,
      },
    });

    if (!user) throw new UnauthorizedException('No existe el correo');

    if (user.isDeleted)
      throw new NotFoundException('El user no está registrado');

    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('Contraseña incorrecta');

    const { password: _, ...data } = user;

    return {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? '',
      phone: data.phone,
      isVerified: data.isVerified,
      isPhoneVerified: data.isPhoneVerified,
      id: user.id,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  async checkAuthStatus(user: IUser): Promise<IAuth> {
    if (!user.id) throw new BadRequestException('User Id is required');

    return {
      ...user,
      id: user.id,
      token: this.getJwtToken({ id: user.id }),
    } as IAuth;
  }

  async changePassword(
    userId: string,
    password: string,
  ): Promise<{ token: string }> {
    try {
      await this.userRepo.update(userId, { password });

      return {
        token: this.getJwtToken({ id: userId }),
      };
    } catch (e) {
      this.logger.error(`Error en changePassword`);
      throw new InternalServerErrorException(
        'Error al intentar cambiar la password',
      );
    }
  }

  getJwtToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }
}
