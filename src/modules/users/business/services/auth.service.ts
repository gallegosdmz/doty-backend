import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { AuthRepository } from "../../business/repositories/auth.repository";
import { IAuth, IUser } from "../../business/entities";
import type { OtpRepository } from '../repositories/otp.repository';
import type { UsersRepository } from '../repositories/users.repository';

import * as bcrypt from 'bcrypt';
import type { UsersValidator } from "../repositories/users.validator";
import { LoginUserDto } from "../../application/dto/login-user.dto";
import { ChangePasswordDto } from "../../application/dto/change-password.dto";

@Injectable()
export class AuthService {
  constructor(
    @Inject('AuthRepository')
    private readonly authRepo: AuthRepository,

    @Inject('UsersValidator')
    private readonly userValidator: UsersValidator,

    @Inject('OtpRepository')
    private readonly otpRepo: OtpRepository,

    @Inject('UsersRepository')
    private readonly usersRepo: UsersRepository,
  ) { }

  async login(loginUserDto: LoginUserDto): Promise<IAuth> {
    const { phone, password } = loginUserDto;
    return this.authRepo.login(phone, password);
  }

  async checkAuthStatus(user: IUser): Promise<IAuth> {
    if (!user) throw new BadRequestException('User is required');
    return this.authRepo.checkAuthStatus(user);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto, user: IUser): Promise<{ token: string }> {
    this.userValidator.validateOwnerToUserUpdate(userId, user);

    const password = bcrypt.hashSync(changePasswordDto.password, 10);
    return this.authRepo.changePassword(userId, password);
  }

  async sendOtp(phone: string): Promise<{ message: string }> {
    return this.otpRepo.sendOtp(phone);
  }

  async verifyOtp(phone: string, code: string): Promise<{ message: string }> {
    const { verified } = await this.otpRepo.verifyOtp(phone, code);

    if (!verified)
      throw new BadRequestException('Código de verificación inválido');

    await this.usersRepo.verifyPhone(phone);

    return { message: 'Teléfono verificado correctamente' };
  }
}
