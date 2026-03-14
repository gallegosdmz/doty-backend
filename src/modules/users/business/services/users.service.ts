import {
  Injectable,
  Inject,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { UsersRepository } from '../repositories/users.repository';
import type { UsersValidator } from '../repositories/users.validator';
import { CreateUserDto } from '../../application/dto/create-user.dto';
import { PaginationDto } from 'src/shared/dtos/pagination.dto';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { IAuth, IUser } from '../entities';
import { IMeta } from 'src/shared/interfaces/Meta';

@Injectable()
export class UsersService {
  constructor(
    @Inject('UsersRepository')
    private readonly userRepo: UsersRepository,
    @Inject('UsersValidator')
    private readonly userValidator: UsersValidator,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<IAuth> {
    const { password, ...user } = createUserDto;

    if (user.email)
      await this.userValidator.validateEmailUniqueness(user.email);

    await this.userValidator.validatePhoneUniqueness(user.phone);

    return this.userRepo.create({ ...user, password: bcrypt.hashSync(password, 10) });
  }

  async createFirstAdmin(createUserDto: CreateUserDto): Promise<IAuth> {
    await this.userValidator.validateExistFirstAdmin();

    const { password, ...user } = createUserDto;
    return this.userRepo.createFirstAdmin({ ...user, password: bcrypt.hashSync(password, 10) });
  }

  async findAll(paginationDto: PaginationDto): Promise<{ users: IUser[], meta: IMeta }> {
    const { limit = 10, offset = 0 } = paginationDto;
    return this.userRepo.findAll(limit, offset);
  }

  async findOne(userId: string): Promise<IUser> {
    return this.userRepo.findOne(userId);
  }

  async update(userId: string, updateUserDto: UpdateUserDto, userEditor: IUser): Promise<IUser> {
    await this.userValidator.validateOwnerToUserUpdate(userId, userEditor);

    const { password, ...user } = updateUserDto;

    if (user.email) await this.userValidator.validateEmailUniqueness(user.email, userId);
    if (user.phone) await this.userValidator.validatePhoneUniqueness(user.phone, userId);

    const allowedFields: (keyof IUser)[] = ["firstName", "lastName", "avatarUrl", "email", "phone"];

    const userUpdate = Object.fromEntries(
      Object.entries(user).filter(([key, value]) =>
        allowedFields.includes(key as keyof IUser) && value !== undefined
      )
    ) as Partial<IUser>;

    return this.userRepo.update(userId, userUpdate as IUser);
  }

  async remove(userId: string, userEditor: IUser): Promise<{ message: string }> {
    await this.userValidator.validateOwnerToUserUpdate(userId, userEditor);
    return this.userRepo.remove(userId);
  }
}
