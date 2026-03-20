import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { AuthRepository } from '../../business/repositories/auth.repository';
import { IAuth, IUser } from '../../business/entities';
import type { OtpRepository } from '../repositories/otp.repository';
import type { UsersRepository } from '../repositories/users.repository';

import * as bcrypt from 'bcrypt';
import type { UsersValidator } from '../repositories/users.validator';
import { LoginUserDto } from '../../application/dto/login-user.dto';
import { ChangePasswordDto } from '../../application/dto/change-password.dto';
import { MailService } from '../../../mail/mail.service';

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

    private readonly mailService: MailService,
  ) {}

  // Simple in-memory cache for OTP development
  private emailOtps = new Map<string, string>();

  async login(loginUserDto: LoginUserDto): Promise<IAuth> {
    const { phone, password } = loginUserDto;
    return this.authRepo.login(phone, password);
  }

  async checkAuthStatus(user: IUser): Promise<IAuth> {
    if (!user) throw new BadRequestException('User is required');
    return this.authRepo.checkAuthStatus(user);
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    user: IUser,
  ): Promise<{ token: string }> {
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

  async sendEmailOtp(email: string): Promise<{ message: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.emailOtps.set(email, code);

    // Expire OTP roughly after 10 minutes (garbage collected naturally or overwritten)
    setTimeout(
      () => {
        if (this.emailOtps.get(email) === code) {
          this.emailOtps.delete(email);
        }
      },
      10 * 60 * 1000,
    );

    await this.mailService.sendVerificationEmail(email, code);
    return { message: 'Correo de verificación enviado' };
  }

  async verifyEmailOtp(
    email: string,
    code: string,
  ): Promise<{ message: string }> {
    const storedCode = this.emailOtps.get(email);
    if (!storedCode || storedCode !== code) {
      throw new BadRequestException(
        'Código de verificación inválido o expirado',
      );
    }

    this.emailOtps.delete(email);
    return { message: 'Correo verificado correctamente' };
  }
}
