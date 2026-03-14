import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '../../business/services/auth.service';
import { UsersService } from '../../business/services/users.service';
import { IAuth } from '../../business/entities';

describe('AuthController', () => {
  let controller: AuthController;

  const mockToken = 'jwt-test-token';

  const mockAuthResponse: IAuth = {
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan@test.com',
    phone: '+5211234567890',
    isVerified: false,
    isPhoneVerified: false,
    token: mockToken,
  };

  const mockAuthService = {
    login: jest.fn(),
    checkAuthStatus: jest.fn(),
    changePassword: jest.fn(),
    sendOtp: jest.fn(),
    verifyOtp: jest.fn(),
  };

  const mockUsersService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── REGISTER ──────────────────────────────────────────────

  describe('register', () => {
    it('should register a new user and return auth data', async () => {
      mockUsersService.create.mockResolvedValue(mockAuthResponse);

      const dto = {
        firstName: 'Juan',
        lastName: 'Perez',
        email: 'juan@test.com',
        password: 'password123',
        phone: '+5211234567890',
      };

      const result = await controller.register(dto);

      expect(result.token).toBe(mockToken);
      expect(result.phone).toBe('+5211234567890');
      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
    });

    it('should fail when phone is already registered', async () => {
      mockUsersService.create.mockRejectedValue(
        new BadRequestException('El teléfono ya está registrado'),
      );

      await expect(
        controller.register({
          firstName: 'Juan',
          lastName: 'Perez',
          password: 'password123',
          phone: '+5211234567890',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── LOGIN ─────────────────────────────────────────────────

  describe('login', () => {
    it('should login and return auth data with token', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const dto = { phone: '+5211234567890', password: 'password123' };
      const result = await controller.login(dto);

      expect(result.token).toBe(mockToken);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });

    it('should fail with wrong credentials', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Contraseña incorrecta'),
      );

      await expect(
        controller.login({ phone: '+5211234567890', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── CHECK AUTH STATUS ─────────────────────────────────────

  describe('checkAuthStatus', () => {
    it('should return refreshed auth data', async () => {
      mockAuthService.checkAuthStatus.mockResolvedValue(mockAuthResponse);

      const user = { id: 'user-uuid-1', firstName: 'Juan', lastName: 'Perez', phone: '+5211234567890' } as any;
      const result = await controller.checkAuthStatus(user);

      expect(result.token).toBeDefined();
      expect(mockAuthService.checkAuthStatus).toHaveBeenCalledWith(user);
    });
  });

  // ─── CHANGE PASSWORD ───────────────────────────────────────

  describe('changePassword', () => {
    it('should change password and return new token', async () => {
      mockAuthService.changePassword.mockResolvedValue({ token: 'new-token' });

      const user = { id: 'user-uuid-1', firstName: 'Juan', lastName: 'Perez', phone: '+5211234567890' } as any;
      const dto = { password: 'newPassword123' };
      const result = await controller.changePassword('user-uuid-1', dto, user);

      expect(result.token).toBe('new-token');
      expect(mockAuthService.changePassword).toHaveBeenCalledWith('user-uuid-1', dto, user);
    });
  });

  // ─── SEND OTP ──────────────────────────────────────────────

  describe('sendOtp', () => {
    it('should send OTP to phone number', async () => {
      mockAuthService.sendOtp.mockResolvedValue({ message: 'OTP enviado' });

      const result = await controller.sendOtp('+5211234567890');

      expect(result.message).toBe('OTP enviado');
      expect(mockAuthService.sendOtp).toHaveBeenCalledWith('+5211234567890');
    });
  });

  // ─── VERIFY OTP ────────────────────────────────────────────

  describe('verifyOtp', () => {
    it('should verify OTP code', async () => {
      mockAuthService.verifyOtp.mockResolvedValue({ message: 'Teléfono verificado correctamente' });

      const result = await controller.verifyOtp('+5211234567890', '123456');

      expect(result.message).toBe('Teléfono verificado correctamente');
      expect(mockAuthService.verifyOtp).toHaveBeenCalledWith('+5211234567890', '123456');
    });

    it('should fail with invalid OTP code', async () => {
      mockAuthService.verifyOtp.mockRejectedValue(
        new BadRequestException('Código de verificación inválido'),
      );

      await expect(
        controller.verifyOtp('+5211234567890', '000000'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
