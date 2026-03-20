import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from '../../business/services/events.service';
import {
  AccessMode,
  AdmissionType,
  EventStatus,
  EventType,
} from '../../../../shared/enums';
import { IEvent } from '../../business/entities';
import { IUser } from '../../../users/business/entities';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  const mockUser: IUser = {
    id: 'user-uuid-1',
    phone: '+5211234567890',
    firstName: 'Juan',
    lastName: 'Perez',
  };

  const mockEvent: IEvent = {
    id: 'event-uuid-1',
    organizerId: 'user-uuid-1',
    title: 'Partido Futbol 7',
    description: 'Partido amistoso',
    type: EventType.SPORTS,
    accessMode: AccessMode.PAID,
    admissionType: AdmissionType.DIRECT,
    price: 100,
    currency: 'MXN',
    latitude: 19.4326077,
    longitude: -99.133208,
    address: 'Cancha deportiva CDMX',
    capacity: 14,
    waitlistEnabled: false,
    startsAt: new Date('2026-04-01T10:00:00Z'),
    endsAt: new Date('2026-04-01T12:00:00Z'),
    status: EventStatus.DRAFT,
  };

  const mockMeta = { total: 1, limit: 10, offset: 0, totalPages: 1 };

  const mockEventsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findNearby: jest.fn(),
    findByOrganizer: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    publish: jest.fn(),
    cancel: jest.fn(),
    complete: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: mockEventsService }],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── CREATE ──────────────────────────────────────────────

  describe('create', () => {
    it('should create an event and convert date strings to Date objects', async () => {
      mockEventsService.create.mockResolvedValue(mockEvent);

      const dto = {
        title: 'Partido Futbol 7',
        description: 'Partido amistoso',
        type: EventType.SPORTS,
        accessMode: AccessMode.PAID,
        price: 100,
        currency: 'MXN',
        latitude: 19.4326077,
        longitude: -99.133208,
        address: 'Cancha deportiva CDMX',
        capacity: 14,
        startsAt: '2026-04-01T10:00:00Z',
        endsAt: '2026-04-01T12:00:00Z',
      };

      const result = await controller.create(dto as any, mockUser);

      expect(result).toEqual(mockEvent);
      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: dto.title,
          startsAt: expect.any(Date),
          endsAt: expect.any(Date),
        }),
        mockUser,
      );
    });

    it('should propagate service error when validation fails', async () => {
      mockEventsService.create.mockRejectedValue(
        new BadRequestException(
          'La fecha de inicio debe ser anterior a la fecha de fin',
        ),
      );

      await expect(
        controller.create(
          {
            title: 'Evento',
            description: 'Desc',
            type: EventType.SPORTS,
            accessMode: AccessMode.FREE,
            latitude: 19,
            longitude: -99,
            address: 'Dir',
            capacity: 10,
            startsAt: '2026-04-02T12:00:00Z',
            endsAt: '2026-04-01T10:00:00Z',
          } as any,
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── FIND ALL ────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated events with default pagination', async () => {
      mockEventsService.findAll.mockResolvedValue({
        events: [mockEvent],
        meta: mockMeta,
      });

      const result = await controller.findAll({});

      expect(result).toEqual({ events: [mockEvent], meta: mockMeta });
      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: undefined, endDate: undefined }),
        10,
        0,
      );
    });

    it('should pass filters including type and date range', async () => {
      mockEventsService.findAll.mockResolvedValue({
        events: [],
        meta: { ...mockMeta, total: 0 },
      });

      await controller.findAll({
        type: EventType.SOCIAL,
        startDate: '2026-04-01T00:00:00Z',
        endDate: '2026-04-30T23:59:59Z',
        limit: 5,
        offset: 0,
      });

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.SOCIAL,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
        5,
        0,
      );
    });

    it('should filter by price range', async () => {
      mockEventsService.findAll.mockResolvedValue({
        events: [],
        meta: { ...mockMeta, total: 0 },
      });

      await controller.findAll({ minPrice: 50, maxPrice: 200 });

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 50, maxPrice: 200 }),
        10,
        0,
      );
    });

    it('should pass search text filter', async () => {
      mockEventsService.findAll.mockResolvedValue({
        events: [],
        meta: { ...mockMeta, total: 0 },
      });

      await controller.findAll({ search: 'futbol' });

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'futbol' }),
        10,
        0,
      );
    });
  });

  // ─── FIND NEARBY ─────────────────────────────────────────

  describe('findNearby', () => {
    it('should search nearby events with coordinates and default radius', async () => {
      mockEventsService.findNearby.mockResolvedValue({
        events: [mockEvent],
        meta: mockMeta,
      });

      const result = await controller.findNearby({
        latitude: 19.43,
        longitude: -99.13,
      } as any);

      expect(result).toEqual({ events: [mockEvent], meta: mockMeta });
      expect(service.findNearby).toHaveBeenCalledWith(
        19.43,
        -99.13,
        10,
        expect.any(Object),
        10,
        0,
      );
    });

    it('should pass custom radius and filters', async () => {
      mockEventsService.findNearby.mockResolvedValue({
        events: [],
        meta: { ...mockMeta, total: 0 },
      });

      await controller.findNearby({
        latitude: 19.43,
        longitude: -99.13,
        radiusKm: 5,
        type: EventType.SOCIAL,
        limit: 20,
        offset: 0,
      } as any);

      expect(service.findNearby).toHaveBeenCalledWith(
        19.43,
        -99.13,
        5,
        expect.objectContaining({ type: EventType.SOCIAL }),
        20,
        0,
      );
    });
  });

  // ─── FIND MY EVENTS ──────────────────────────────────────

  describe('findMyEvents', () => {
    it('should return events organized by the authenticated user', async () => {
      mockEventsService.findByOrganizer.mockResolvedValue({
        events: [mockEvent],
        meta: mockMeta,
      });

      const result = await controller.findMyEvents(mockUser, {});

      expect(result).toEqual({ events: [mockEvent], meta: mockMeta });
      expect(service.findByOrganizer).toHaveBeenCalledWith(
        'user-uuid-1',
        10,
        0,
      );
    });

    it('should respect custom pagination', async () => {
      mockEventsService.findByOrganizer.mockResolvedValue({
        events: [],
        meta: { ...mockMeta, total: 0 },
      });

      await controller.findMyEvents(mockUser, { limit: 5, offset: 10 });

      expect(service.findByOrganizer).toHaveBeenCalledWith(
        'user-uuid-1',
        5,
        10,
      );
    });
  });

  // ─── FIND ONE ─────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a single event by id', async () => {
      mockEventsService.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOne('event-uuid-1');

      expect(result).toEqual(mockEvent);
      expect(service.findOne).toHaveBeenCalledWith('event-uuid-1');
    });

    it('should throw NotFoundException when event does not exist', async () => {
      mockEventsService.findOne.mockRejectedValue(
        new NotFoundException('El evento no fue encontrado'),
      );

      await expect(controller.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────

  describe('update', () => {
    it('should update event fields and convert dates', async () => {
      const updated = { ...mockEvent, title: 'Partido actualizado' };
      mockEventsService.update.mockResolvedValue(updated);

      const result = await controller.update(
        'event-uuid-1',
        {
          title: 'Partido actualizado',
          startsAt: '2026-05-01T10:00:00Z',
          endsAt: '2026-05-01T12:00:00Z',
        } as any,
        mockUser,
      );

      expect(result).toEqual(updated);
      expect(service.update).toHaveBeenCalledWith(
        'event-uuid-1',
        expect.objectContaining({
          title: 'Partido actualizado',
          startsAt: expect.any(Date),
          endsAt: expect.any(Date),
        }),
        mockUser,
      );
    });

    it('should propagate ForbiddenException when user is not the organizer', async () => {
      mockEventsService.update.mockRejectedValue(
        new ForbiddenException('No eres el organizador de este evento'),
      );

      await expect(
        controller.update('event-uuid-1', { title: 'Hack' } as any, {
          ...mockUser,
          id: 'other-user',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle partial updates without dates', async () => {
      mockEventsService.update.mockResolvedValue({
        ...mockEvent,
        capacity: 20,
      });

      await controller.update(
        'event-uuid-1',
        { capacity: 20 } as any,
        mockUser,
      );

      expect(service.update).toHaveBeenCalledWith(
        'event-uuid-1',
        expect.objectContaining({
          capacity: 20,
          startsAt: undefined,
          endsAt: undefined,
        }),
        mockUser,
      );
    });
  });

  // ─── PUBLISH ──────────────────────────────────────────────

  describe('publish', () => {
    it('should publish a draft event', async () => {
      const published = { ...mockEvent, status: EventStatus.PUBLISHED };
      mockEventsService.publish.mockResolvedValue(published);

      const result = await controller.publish('event-uuid-1', mockUser);

      expect(result.status).toBe(EventStatus.PUBLISHED);
      expect(service.publish).toHaveBeenCalledWith('event-uuid-1', mockUser);
    });

    it('should fail when event is already cancelled', async () => {
      mockEventsService.publish.mockRejectedValue(
        new BadRequestException('El evento esta cancelado'),
      );

      await expect(
        controller.publish('event-uuid-1', mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── CANCEL ───────────────────────────────────────────────

  describe('cancel', () => {
    it('should cancel a published event', async () => {
      const cancelled = { ...mockEvent, status: EventStatus.CANCELLED };
      mockEventsService.cancel.mockResolvedValue(cancelled);

      const result = await controller.cancel('event-uuid-1', mockUser);

      expect(result.status).toBe(EventStatus.CANCELLED);
      expect(service.cancel).toHaveBeenCalledWith('event-uuid-1', mockUser);
    });

    it('should fail when non-organizer tries to cancel', async () => {
      mockEventsService.cancel.mockRejectedValue(
        new ForbiddenException('No eres el organizador de este evento'),
      );

      await expect(
        controller.cancel('event-uuid-1', { ...mockUser, id: 'other-user' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── COMPLETE ─────────────────────────────────────────────

  describe('complete', () => {
    it('should complete a published event', async () => {
      const completed = { ...mockEvent, status: EventStatus.COMPLETED };
      mockEventsService.complete.mockResolvedValue(completed);

      const result = await controller.complete('event-uuid-1', mockUser);

      expect(result.status).toBe(EventStatus.COMPLETED);
      expect(service.complete).toHaveBeenCalledWith('event-uuid-1', mockUser);
    });

    it('should fail when event is not published', async () => {
      mockEventsService.complete.mockRejectedValue(
        new BadRequestException('El evento no esta publicado'),
      );

      await expect(
        controller.complete('event-uuid-1', mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── REMOVE ───────────────────────────────────────────────

  describe('remove', () => {
    it('should soft-delete an event', async () => {
      mockEventsService.remove.mockResolvedValue({
        message: 'El evento fue eliminado exitosamente',
      });

      const result = await controller.remove('event-uuid-1', mockUser);

      expect(result).toEqual({
        message: 'El evento fue eliminado exitosamente',
      });
      expect(service.remove).toHaveBeenCalledWith('event-uuid-1', mockUser);
    });

    it('should fail when non-organizer tries to remove', async () => {
      mockEventsService.remove.mockRejectedValue(
        new ForbiddenException('No eres el organizador de este evento'),
      );

      await expect(
        controller.remove('event-uuid-1', { ...mockUser, id: 'other-user' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
