import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from '../../business/services/users.service';
import { IUser } from '../../business/entities';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser: IUser = {
    id: 'user-uuid-1',
    phone: '+5211234567890',
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan@test.com',
    isVerified: false,
    isPhoneVerified: false,
  };

  const mockUsersService = {
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── GET PROFILE ───────────────────────────────────────────

  describe('getProfile', () => {
    it('should return the authenticated user profile', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockUser);

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('user-uuid-1');
    });
  });

  // ─── FIND ONE ──────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-uuid-1');

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('user-uuid-1');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersService.findOne.mockRejectedValue(
        new NotFoundException('This user is not register'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── UPDATE ────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return updated user', async () => {
      const updated = { ...mockUser, firstName: 'Carlos' };
      mockUsersService.update.mockResolvedValue(updated);

      const dto = { firstName: 'Carlos' };
      const result = await controller.update('user-uuid-1', dto, mockUser);

      expect(result.firstName).toBe('Carlos');
      expect(service.update).toHaveBeenCalledWith('user-uuid-1', dto, mockUser);
    });

    it('should fail when user tries to update another user', async () => {
      mockUsersService.update.mockRejectedValue(
        new UnauthorizedException(
          'No estás autorizado para editar este usuario',
        ),
      );

      const otherUser = { ...mockUser, id: 'other-user' };

      await expect(
        controller.update('user-uuid-1', { firstName: 'Hacker' }, otherUser),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── REMOVE ────────────────────────────────────────────────

  describe('remove', () => {
    it('should soft-delete a user', async () => {
      mockUsersService.remove.mockResolvedValue({
        message: 'This user is removed successfully',
      });

      const result = await controller.remove('user-uuid-1', mockUser);

      expect(result).toEqual({ message: 'This user is removed successfully' });
      expect(service.remove).toHaveBeenCalledWith('user-uuid-1', mockUser);
    });

    it('should fail when user tries to delete another user', async () => {
      mockUsersService.remove.mockRejectedValue(
        new UnauthorizedException(
          'No estás autorizado para editar este usuario',
        ),
      );

      const otherUser = { ...mockUser, id: 'other-user' };

      await expect(controller.remove('user-uuid-1', otherUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
