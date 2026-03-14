import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from '../../business/services/tickets.service';
import { ITicket } from '../../business/entities';
import { IUser } from '../../../users/business/entities';

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: TicketsService;

  const mockOrganizer: IUser = {
    id: 'organizer-uuid-1',
    phone: '+5219876543210',
    firstName: 'Carlos',
    lastName: 'Lopez',
  };

  const mockTicket: ITicket = {
    id: 'ticket-uuid-1',
    registrationId: 'reg-uuid-1',
    code: 'ABC123DEF456',
    isUsed: false,
    usedAt: null,
    createdAt: new Date('2026-03-15T10:00:00Z'),
  };

  const mockTicketsService = {
    generate: jest.fn(),
    findOne: jest.fn(),
    findByCode: jest.fn(),
    validate: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        { provide: TicketsService, useValue: mockTicketsService },
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get<TicketsService>(TicketsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── GENERATE ─────────────────────────────────────────────

  describe('generate', () => {
    it('should generate a ticket for an approved registration', async () => {
      mockTicketsService.generate.mockResolvedValue(mockTicket);

      const result = await controller.generate('reg-uuid-1');

      expect(result).toEqual(mockTicket);
      expect(result.code).toBeDefined();
      expect(result.isUsed).toBe(false);
      expect(service.generate).toHaveBeenCalledWith('reg-uuid-1');
    });

    it('should return existing ticket if already generated (idempotent)', async () => {
      mockTicketsService.generate.mockResolvedValue(mockTicket);

      const result1 = await controller.generate('reg-uuid-1');
      const result2 = await controller.generate('reg-uuid-1');

      expect(result1.code).toBe(result2.code);
    });

    it('should fail when registration is not approved', async () => {
      mockTicketsService.generate.mockRejectedValue(
        new BadRequestException('Solo se pueden generar tickets para inscripciones aprobadas'),
      );

      await expect(controller.generate('reg-uuid-1')).rejects.toThrow(BadRequestException);
    });

    it('should fail when registration does not exist', async () => {
      mockTicketsService.generate.mockRejectedValue(
        new NotFoundException('La inscripcion no fue encontrada'),
      );

      await expect(controller.generate('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── FIND ONE ─────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a ticket by id', async () => {
      mockTicketsService.findOne.mockResolvedValue(mockTicket);

      const result = await controller.findOne('ticket-uuid-1');

      expect(result).toEqual(mockTicket);
      expect(service.findOne).toHaveBeenCalledWith('ticket-uuid-1');
    });

    it('should throw NotFoundException when ticket does not exist', async () => {
      mockTicketsService.findOne.mockRejectedValue(
        new NotFoundException('El ticket no fue encontrado'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── FIND BY CODE ────────────────────────────────────────

  describe('findByCode', () => {
    it('should return a ticket by its unique code', async () => {
      mockTicketsService.findByCode.mockResolvedValue(mockTicket);

      const result = await controller.findByCode('ABC123DEF456');

      expect(result).toEqual(mockTicket);
      expect(result.code).toBe('ABC123DEF456');
      expect(service.findByCode).toHaveBeenCalledWith('ABC123DEF456');
    });

    it('should throw NotFoundException for invalid code', async () => {
      mockTicketsService.findByCode.mockRejectedValue(
        new NotFoundException('El ticket no fue encontrado'),
      );

      await expect(controller.findByCode('INVALID-CODE')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── VALIDATE (at the door) ──────────────────────────────

  describe('validate', () => {
    it('should validate ticket and mark as used', async () => {
      const validated = {
        ...mockTicket,
        isUsed: true,
        usedAt: new Date('2026-04-01T10:30:00Z'),
      };
      mockTicketsService.validate.mockResolvedValue(validated);

      const result = await controller.validate('ABC123DEF456', mockOrganizer);

      expect(result.isUsed).toBe(true);
      expect(result.usedAt).toBeDefined();
      expect(service.validate).toHaveBeenCalledWith('ABC123DEF456', mockOrganizer);
    });

    it('should fail when ticket was already used', async () => {
      mockTicketsService.validate.mockRejectedValue(
        new BadRequestException('El ticket ya fue utilizado'),
      );

      await expect(
        controller.validate('ABC123DEF456', mockOrganizer),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail when user is not the event organizer', async () => {
      mockTicketsService.validate.mockRejectedValue(
        new ForbiddenException('No eres el organizador de este evento'),
      );

      const nonOrganizer: IUser = { ...mockOrganizer, id: 'random-user' };

      await expect(
        controller.validate('ABC123DEF456', nonOrganizer),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should fail when ticket code does not exist', async () => {
      mockTicketsService.validate.mockRejectedValue(
        new NotFoundException('El ticket no fue encontrado'),
      );

      await expect(
        controller.validate('NON-EXISTENT', mockOrganizer),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── REMOVE ───────────────────────────────────────────────

  describe('remove', () => {
    it('should soft-delete a ticket', async () => {
      mockTicketsService.remove.mockResolvedValue({ message: 'El ticket fue eliminado exitosamente' });

      const result = await controller.remove('ticket-uuid-1', mockOrganizer);

      expect(result).toEqual({ message: 'El ticket fue eliminado exitosamente' });
      expect(service.remove).toHaveBeenCalledWith('ticket-uuid-1', mockOrganizer);
    });

    it('should fail when ticket does not exist', async () => {
      mockTicketsService.remove.mockRejectedValue(
        new NotFoundException('El ticket no fue encontrado'),
      );

      await expect(controller.remove('non-existent', mockOrganizer)).rejects.toThrow(NotFoundException);
    });
  });
});
