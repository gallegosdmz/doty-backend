import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AuthService } from '../../business/services/auth.service';
import { UsersService } from '../../business/services/users.service';
import { LoginUserDto } from '../dto/login-user.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { Auth } from '../decorators/auth.decorator';
import { GetUser } from '../decorators/get-user.decorator';
import { User } from '../../external-system/entities/user.entity';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @ApiBearerAuth()
  @Get('refresh')
  @Auth()
  checkAuthStatus(@GetUser() user: User) {
    return this.authService.checkAuthStatus(user);
  }

  @ApiBearerAuth()
  @Patch('change-password/:id')
  @Auth()
  changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @GetUser() user: User,
  ) {
    return this.authService.changePassword(id, changePasswordDto, user);
  }

  @Post('send-otp')
  sendOtp(@Body('phone') phone: string) {
    return this.authService.sendOtp(phone);
  }

  @Post('verify-otp')
  verifyOtp(@Body('phone') phone: string, @Body('code') code: string) {
    return this.authService.verifyOtp(phone, code);
  }

  @Post('send-email-otp')
  sendEmailOtp(@Body('email') email: string) {
    return this.authService.sendEmailOtp(email);
  }

  @Post('verify-email-otp')
  verifyEmailOtp(@Body('email') email: string, @Body('code') code: string) {
    return this.authService.verifyEmailOtp(email, code);
  }
}
