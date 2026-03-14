import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Event } from '../entities/event.entity';
import { EventsRepository, EventsFilters } from '../../business/repositories/events.repository';
import { IEvent } from '../../business/entities';
import { EventStatus } from '../../../../shared/enums';
import { IMeta } from 'src/shared/interfaces/Meta';

@Injectable()
export class EventsRepositoryImpl implements EventsRepository {
  private readonly logger = new Logger(EventsRepositoryImpl.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async create(event: IEvent): Promise<IEvent> {
    try {
      const entity = this.eventRepo.create(event);
      return await this.eventRepo.save(entity);
    } catch (e) {
      this.logger.error('Error en create event', e);
      throw new InternalServerErrorException('Error al intentar crear el evento');
    }
  }

  async findAll(
    filters?: EventsFilters,
    limit?: number,
    offset?: number,
  ): Promise<{ events: IEvent[]; meta: IMeta }> {
    try {
      const qb = this.eventRepo.createQueryBuilder('event');
      qb.where('event.isDeleted = :isDeleted', { isDeleted: false });

      this.applyFilters(qb, filters);

      qb.orderBy('event.startsAt', 'ASC');
      if (limit) qb.take(limit);
      if (offset) qb.skip(offset);

      const [events, total] = await qb.getManyAndCount();

      return {
        events,
        meta: {
          total,
          limit: limit ?? 0,
          offset: offset ?? 0,
          totalPages: limit ? Math.ceil(total / limit) : 0,
        },
      };
    } catch (e) {
      this.logger.error('Error en findAll events', e);
      throw new InternalServerErrorException('Error al intentar obtener los eventos');
    }
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    filters?: EventsFilters,
    limit?: number,
    offset?: number,
  ): Promise<{ events: IEvent[]; meta: IMeta }> {
    try {
      const qb = this.eventRepo.createQueryBuilder('event');
      qb.where('event.isDeleted = :isDeleted', { isDeleted: false });

      // Haversine formula para distancia en km
      qb.addSelect(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(event.latitude)) * cos(radians(event.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(event.latitude))))`,
        'distance',
      );
      qb.setParameters({ lat: latitude, lng: longitude });
      qb.andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(event.latitude)) * cos(radians(event.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(event.latitude)))) <= :radius`,
        { radius: radiusKm },
      );

      this.applyFilters(qb, filters);

      qb.orderBy('distance', 'ASC');
      if (limit) qb.take(limit);
      if (offset) qb.skip(offset);

      const [events, total] = await qb.getManyAndCount();

      return {
        events,
        meta: {
          total,
          limit: limit ?? 0,
          offset: offset ?? 0,
          totalPages: limit ? Math.ceil(total / limit) : 0,
        },
      };
    } catch (e) {
      this.logger.error('Error en findNearby events', e);
      throw new InternalServerErrorException('Error al intentar obtener eventos cercanos');
    }
  }

  async findOne(id: string): Promise<IEvent> {
    const event = await this.eventRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['organizer'],
    });
    if (!event) throw new NotFoundException('El evento no fue encontrado');

    return event;
  }

  async findByOrganizer(
    organizerId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ events: IEvent[]; meta: IMeta }> {
    try {
      const [events, total] = await this.eventRepo.findAndCount({
        where: { organizerId, isDeleted: false },
        order: { startsAt: 'ASC' },
        take: limit,
        skip: offset,
      });

      return {
        events,
        meta: {
          total,
          limit: limit ?? 0,
          offset: offset ?? 0,
          totalPages: limit ? Math.ceil(total / limit) : 0,
        },
      };
    } catch (e) {
      this.logger.error('Error en findByOrganizer events', e);
      throw new InternalServerErrorException('Error al intentar obtener los eventos del organizador');
    }
  }

  async update(id: string, data: Partial<IEvent>): Promise<IEvent> {
    const event = await this.eventRepo.preload({ id, ...data });
    if (!event) throw new NotFoundException('El evento no fue encontrado');

    try {
      return await this.eventRepo.save(event);
    } catch (e) {
      this.logger.error('Error en update event', e);
      throw new InternalServerErrorException('Error al intentar actualizar el evento');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    try {
      await this.eventRepo.update(id, { isDeleted: true });
      return { message: 'El evento fue eliminado exitosamente' };
    } catch (e) {
      this.logger.error('Error en remove event', e);
      throw new InternalServerErrorException('Error al intentar eliminar el evento');
    }
  }

  async updateStatus(id: string, status: EventStatus): Promise<IEvent> {
    return this.update(id, { status } as Partial<IEvent>);
  }

  private applyFilters(qb: SelectQueryBuilder<Event>, filters?: EventsFilters): void {
    if (!filters) return;

    if (filters.type) {
      qb.andWhere('event.type = :type', { type: filters.type });
    }
    if (filters.status) {
      qb.andWhere('event.status = :status', { status: filters.status });
    }
    if (filters.startDate) {
      qb.andWhere('event.startsAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      qb.andWhere('event.endsAt <= :endDate', { endDate: filters.endDate });
    }
    if (filters.minPrice !== undefined) {
      qb.andWhere('event.price >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters.maxPrice !== undefined) {
      qb.andWhere('event.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }
    if (filters.search) {
      qb.andWhere('(event.title ILIKE :search OR event.description ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }
  }
}
