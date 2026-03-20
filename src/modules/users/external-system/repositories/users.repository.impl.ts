import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersRepository } from '../../business/repositories/users.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { IUser, IAuth } from '../../business/entities';
import { AuthRepositoryImpl } from './auth.repository.impl';
import { IMeta } from 'src/shared/interfaces/Meta';

@Injectable()
export class UsersRepositoryImpl implements UsersRepository {
  private readonly logger = new Logger(UsersRepositoryImpl.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @Inject('AuthRepository')
    private readonly authOrmRepository: AuthRepositoryImpl,
  ) {}

  async create(user: IUser): Promise<IAuth> {
    try {
      const res = this.userRepo.create(user);
      await this.userRepo.save(res);

      return {
        id: res.id,
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email ?? null,
        phone: res.phone,
        isVerified: res.isVerified,
        isPhoneVerified: res.isPhoneVerified,
        token: this.authOrmRepository.getJwtToken({ id: res.id }),
      };
    } catch (e) {
      this.logger.error('Error en create user');
      throw new InternalServerErrorException(
        'Error al intentar crear el usuario',
      );
    }
  }

  async createFirstAdmin(user: IUser): Promise<IAuth> {
    try {
      const res = this.userRepo.create(user);
      await this.userRepo.save(res);

      return {
        id: res.id,
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email ?? null,
        phone: res.phone,
        isVerified: res.isVerified,
        isPhoneVerified: res.isPhoneVerified,
        token: this.authOrmRepository.getJwtToken({ id: res.id }),
      };
    } catch (e) {
      this.logger.error('Error en create first admin user');
      throw new InternalServerErrorException(
        'Error al intentar crear el usuario',
      );
    }
  }

  async findAll(
    limit?: number,
    offset?: number,
  ): Promise<{ users: IUser[]; meta: IMeta }> {
    try {
      const [users, total] = await this.userRepo.findAndCount({
        where: { isDeleted: false },
        take: limit,
        skip: offset,
      });

      return {
        users,
        meta: {
          total,
          limit: limit ?? 0,
          offset: offset ?? 0,
          totalPages: limit ? Math.ceil(total / limit) : 0,
        },
      };
    } catch (e) {
      this.logger.error('Error en find all users');
      throw new InternalServerErrorException(
        'Error al intentar obtener usuarios',
      );
    }
  }

  async findOne(id: string): Promise<IUser> {
    const user = await this.userRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!user) throw new NotFoundException('This user is not register');

    return user;
  }

  async update(id: string, userUpdate: IUser): Promise<IUser> {
    const userToUpdate = await this.userRepo.preload({
      id,
      ...userUpdate,
    });
    if (!userToUpdate) throw new NotFoundException('This user is not register');

    try {
      await this.userRepo.save(userToUpdate);

      return userToUpdate;
    } catch (e) {
      this.logger.error('Error en update user');
      throw new InternalServerErrorException(
        'Error al intentar editar el usuario',
      );
    }
  }

  async verifyPhone(phone: string): Promise<void> {
    try {
      await this.userRepo.update({ phone }, { isPhoneVerified: true });
    } catch (error) {
      this.logger.error('Error en verify phone');
      throw new InternalServerErrorException(
        'Error al intentar verificar el telefono',
      );
    }
  }

  async remove(userId: string): Promise<{ message: string }> {
    await this.findOne(userId);

    try {
      await this.userRepo.update(userId, { isDeleted: true });
      return { message: 'This user is removed successfully' };
    } catch (e) {
      this.logger.error('Error en remove user');
      throw new InternalServerErrorException(
        'Error al intentar eliminar el usuario',
      );
    }
  }
}
