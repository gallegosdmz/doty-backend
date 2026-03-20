import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from '../../business/services/registrations.service';
import { RegistrationStatus } from '../../../../shared/enums';
import { IEventRegistration } from '../../business/entities';
import { IUser } from '../../../users/business/entities';

describe('RegistrationsController', () => {
  let controller: RegistrationsController;
  let service: RegistrationsService;

  const mockUser: IUser = {
    id: 'user-uuid-1',
    phone: '+5211234567890',
    firstName: 'Juan',
    lastName: 'Perez',
  };

  const mockOrganizer: IUser = {
    id: 'organizer-uuid-1',
    phone: '+5219876543210',
    firstName: 'Carlos',
    lastName: 'Lopez',
  };

  const mockRegistration: IEventRegistration = {
    id: 'reg-uuid-1',
    eventId: 'event-uuid-1',
    userId: 'user-uuid-1',
    status: RegistrationStatus.PENDING,
    registeredAt: new Date('2026-03-15T10:00:00Z'),
    resolvedAt: null,
  };

  const mockMeta = { total: 1, limit: 10, offset: 0, totalPages: 1 };

  const mockRegistrationsService = {
    register: jest.fn(),
    findByEvent: jest.fn(),
    findByUser: jest.fn(),
    findOne: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    cancel: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationsController],
      providers: [
        { provide: RegistrationsService, useValue: mockRegistrationsService },
      ],
    }).compile();

    controller = module.get<RegistrationsController>(RegistrationsController);
    service = module.get<RegistrationsService>(RegistrationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── REGISTER ─────────────────────────────────────────────

  describe('register', () => {
    it('should register user to an event', async () => {
      const approved = {
        ...mockRegistration,
        status: RegistrationStatus.APPROVED,
      };
      mockRegistrationsService.register.mockResolvedValue(approved);

      const result = await controller.register('event-uuid-1', mockUser);

      expect(result.status).toBe(RegistrationStatus.APPROVED);
      expect(service.register).toHaveBeenCalledWith('event-uuid-1', mockUser);
    });

    it('should return pending status for request-based admission events', async () => {
      mockRegistrationsService.register.mockResolvedValue(mockRegistration);

      const result = await controller.register('event-uuid-1', mockUser);

      expect(result.status).toBe(RegistrationStatus.PENDING);
    });

    it('should fail when event is not published', async () => {
      mockRegistrationsService.register.mockRejectedValue(
        new BadRequestException('El evento no esta publicado'),
      );

      await expect(
        controller.register('event-uuid-1', mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail when event is at full capacity', async () => {
      mockRegistrationsService.register.mockRejectedValue(
        new BadRequestException('El evento esta lleno'),
      );

      await expect(
        controller.register('event-uuid-1', mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail when user is already registered', async () => {
      mockRegistrationsService.register.mockRejectedValue(
        new BadRequestException('Ya estas inscrito en este evento'),
      );

      await expect(
        controller.register('event-uuid-1', mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── FIND BY EVENT ────────────────────────────────────────

  describe('findByEvent', () => {
    it('should return registrations for an event with default pagination', async () => {
      mockRegistrationsService.findByEvent.mockResolvedValue({
        registrations: [mockRegistration],
        meta: mockMeta,
      });

      const result = await controller.findByEvent('event-uuid-1', {});

      expect(result.registrations).toHaveLength(1);
      expect(service.findByEvent).toHaveBeenCalledWith(
        'event-uuid-1',
        undefined,
        10,
        0,
      );
    });

    it('should filter registrations by status', async () => {
      mockRegistrationsService.findByEvent.mockResolvedValue({
        registrations: [],
        meta: { ...mockMeta, total: 0 },
      });

      await controller.findByEvent('event-uuid-1', {
        status: RegistrationStatus.APPROVED,
      });

      expect(service.findByEvent).toHaveBeenCalledWith(
        'event-uuid-1',
        RegistrationStatus.APPROVED,
        10,
        0,
      );
    });

    it('should respect custom pagination', async () => {
      mockRegistrationsService.findByEvent.mockResolvedValue({
        registrations: [],
        meta: { ...mockMeta, total: 0 },
      });

      await controller.findByEvent('event-uuid-1', { limit: 5, offset: 10 });

      expect(service.findByEvent).toHaveBeenCalledWith(
        'event-uuid-1',
        undefined,
        5,
        10,
      );
    });
  });

  // ─── FIND ONE ─────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a single registration', async () => {
      mockRegistrationsService.findOne.mockResolvedValue(mockRegistration);

      const result = await controller.findOne('reg-uuid-1');

      expect(result).toEqual(mockRegistration);
      expect(service.findOne).toHaveBeenCalledWith('reg-uuid-1');
    });

    it('should throw NotFoundException when registration does not exist', async () => {
      mockRegistrationsService.findOne.mockRejectedValue(
        new NotFoundException('La inscripcion no fue encontrada'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── APPROVE ──────────────────────────────────────────────

  describe('approve', () => {
    it('should approve a pending registration', async () => {
      const approved = {
        ...mockRegistration,
        status: RegistrationStatus.APPROVED,
        resolvedAt: new Date(),
      };
      mockRegistrationsService.approve.mockResolvedValue(approved);

      const result = await controller.approve('reg-uuid-1', mockOrganizer);

      expect(result.status).toBe(RegistrationStatus.APPROVED);
      expect(result.resolvedAt).toBeDefined();
      expect(service.approve).toHaveBeenCalledWith('reg-uuid-1', mockOrganizer);
    });

    it('should fail when non-organizer tries to approve', async () => {
      mockRegistrationsService.approve.mockRejectedValue(
        new ForbiddenException('No eres el organizador de este evento'),
      );

      await expect(controller.approve('reg-uuid-1', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should fail when event capacity is full', async () => {
      mockRegistrationsService.approve.mockRejectedValue(
        new BadRequestException('El evento esta lleno'),
      );

      await expect(
        controller.approve('reg-uuid-1', mockOrganizer),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── REJECT ───────────────────────────────────────────────

  describe('reject', () => {
    it('should reject a pending registration', async () => {
      const rejected = {
        ...mockRegistration,
        status: RegistrationStatus.REJECTED,
        resolvedAt: new Date(),
      };
      mockRegistrationsService.reject.mockResolvedValue(rejected);

      const result = await controller.reject('reg-uuid-1', mockOrganizer);

      expect(result.status).toBe(RegistrationStatus.REJECTED);
      expect(service.reject).toHaveBeenCalledWith('reg-uuid-1', mockOrganizer);
    });

    it('should fail when non-organizer tries to reject', async () => {
      mockRegistrationsService.reject.mockRejectedValue(
        new ForbiddenException('No eres el organizador de este evento'),
      );

      await expect(controller.reject('reg-uuid-1', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── CANCEL ───────────────────────────────────────────────

  describe('cancel', () => {
    it('should allow user to cancel their own registration', async () => {
      const cancelled = {
        ...mockRegistration,
        status: RegistrationStatus.CANCELLED,
      };
      mockRegistrationsService.cancel.mockResolvedValue(cancelled);

      const result = await controller.cancel('reg-uuid-1', mockUser);

      expect(result.status).toBe(RegistrationStatus.CANCELLED);
      expect(service.cancel).toHaveBeenCalledWith('reg-uuid-1', mockUser);
    });

    it('should fail when another user tries to cancel', async () => {
      mockRegistrationsService.cancel.mockRejectedValue(
        new ForbiddenException('No eres el dueño de esta inscripcion'),
      );

      await expect(
        controller.cancel('reg-uuid-1', { ...mockUser, id: 'other-user' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should fail when registration is already cancelled', async () => {
      mockRegistrationsService.cancel.mockRejectedValue(
        new BadRequestException('La inscripcion ya esta cancelada'),
      );

      await expect(controller.cancel('reg-uuid-1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── REMOVE ───────────────────────────────────────────────

  describe('remove', () => {
    it('should soft-delete a registration', async () => {
      mockRegistrationsService.remove.mockResolvedValue({
        message: 'La inscripcion fue eliminada exitosamente',
      });

      const result = await controller.remove('reg-uuid-1', mockUser);

      expect(result).toEqual({
        message: 'La inscripcion fue eliminada exitosamente',
      });
      expect(service.remove).toHaveBeenCalledWith('reg-uuid-1', mockUser);
    });
  });
});
