import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventRegistration } from '../entities/event-registration.entity';
import { RegistrationsRepository } from '../../business/repositories/registrations.repository';
import { IEventRegistration } from '../../business/entities';
import { RegistrationStatus } from '../../../../shared/enums';
import { IMeta } from 'src/shared/interfaces/Meta';

@Injectable()
export class RegistrationsRepositoryImpl implements RegistrationsRepository {
  private readonly logger = new Logger(RegistrationsRepositoryImpl.name);

  constructor(
    @InjectRepository(EventRegistration)
    private readonly registrationRepo: Repository<EventRegistration>,
  ) {}

  async create(registration: IEventRegistration): Promise<IEventRegistration> {
    try {
      const entity = this.registrationRepo.create(registration);
      return await this.registrationRepo.save(entity);
    } catch (e) {
      this.logger.error('Error en create registration', e);
      throw new InternalServerErrorException('Error al intentar crear la inscripción');
    }
  }

  async findByEvent(
    eventId: string,
    status?: RegistrationStatus,
    limit?: number,
    offset?: number,
  ): Promise<{ registrations: IEventRegistration[]; meta: IMeta }> {
    try {
      const where: Record<string, any> = { eventId, isDeleted: false };
      if (status) where.status = status;

      const [registrations, total] = await this.registrationRepo.findAndCount({
        where,
        relations: ['user'],
        order: { registeredAt: 'ASC' },
        take: limit,
        skip: offset,
      });

      return {
        registrations,
        meta: {
          total,
          limit: limit ?? 0,
          offset: offset ?? 0,
          totalPages: limit ? Math.ceil(total / limit) : 0,
        },
      };
    } catch (e) {
      this.logger.error('Error en findByEvent registrations', e);
      throw new InternalServerErrorException('Error al intentar obtener las inscripciones del evento');
    }
  }

  async findByUser(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ registrations: IEventRegistration[]; meta: IMeta }> {
    try {
      const [registrations, total] = await this.registrationRepo.findAndCount({
        where: { userId, isDeleted: false },
        relations: ['event'],
        order: { registeredAt: 'DESC' },
        take: limit,
        skip: offset,
      });

      return {
        registrations,
        meta: {
          total,
          limit: limit ?? 0,
          offset: offset ?? 0,
          totalPages: limit ? Math.ceil(total / limit) : 0,
        },
      };
    } catch (e) {
      this.logger.error('Error en findByUser registrations', e);
      throw new InternalServerErrorException('Error al intentar obtener las inscripciones del usuario');
    }
  }

  async findOne(id: string): Promise<IEventRegistration> {
    const registration = await this.registrationRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['event', 'user', 'payment', 'ticket'],
    });
    if (!registration) throw new NotFoundException('La inscripción no fue encontrada');

    return registration;
  }

  async findByEventAndUser(eventId: string, userId: string): Promise<IEventRegistration | null> {
    return this.registrationRepo.findOne({
      where: { eventId, userId, isDeleted: false },
    });
  }

  async updateStatus(id: string, status: RegistrationStatus): Promise<IEventRegistration> {
    const registration = await this.registrationRepo.preload({
      id,
      status,
      resolvedAt: [RegistrationStatus.APPROVED, RegistrationStatus.REJECTED].includes(status)
        ? new Date()
        : undefined,
    });
    if (!registration) throw new NotFoundException('La inscripción no fue encontrada');

    try {
      return await this.registrationRepo.save(registration);
    } catch (e) {
      this.logger.error('Error en updateStatus registration', e);
      throw new InternalServerErrorException('Error al intentar actualizar la inscripción');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    try {
      await this.registrationRepo.update(id, { isDeleted: true });
      return { message: 'La inscripción fue eliminada exitosamente' };
    } catch (e) {
      this.logger.error('Error en remove registration', e);
      throw new InternalServerErrorException('Error al intentar eliminar la inscripción');
    }
  }

  async countByEvent(eventId: string, status?: RegistrationStatus): Promise<number> {
    const where: Record<string, any> = { eventId, isDeleted: false };
    if (status) where.status = status;

    return this.registrationRepo.count({ where });
  }
}
