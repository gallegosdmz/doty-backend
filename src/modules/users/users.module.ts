import { Module } from '@nestjs/common';
import { UsersService } from './business/services/users.service';
import { UsersController } from './application/controllers/users.controller';
import { AuthController } from './application/controllers/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './external-system/entities/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './business/services/auth.service';
import { JwtStrategy } from './external-system/strategies/jwt.strategy';
import { UsersValidatorImpl } from './external-system/repositories/users.validator.impl';
import { AuthRepositoryImpl } from './external-system/repositories/auth.repository.impl';
import { UsersRepositoryImpl } from './external-system/repositories/users.repository.impl';
import { OtpRepositoryImpl } from './external-system/repositories/otp.repository.impl';

@Module({
  controllers: [UsersController, AuthController],
  providers: [
    UsersService,
    AuthService,
    JwtStrategy,
    {
      provide: 'AuthRepository',
      useClass: AuthRepositoryImpl,
    },
    {
      provide: 'UsersValidator',
      useClass: UsersValidatorImpl,
    },
    {
      provide: 'UsersRepository',
      useClass: UsersRepositoryImpl,
    },
    {
      provide: 'OtpRepository',
      useClass: OtpRepositoryImpl,
    },
  ],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '24h',
          },
        };
      },
    }),
  ],
  exports: [PassportModule, JwtModule, JwtStrategy, UsersService, AuthService],
})
export class UsersModule {}
