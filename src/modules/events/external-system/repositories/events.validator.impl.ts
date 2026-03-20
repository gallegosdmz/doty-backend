import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { EventRegistration } from '../entities/event-registration.entity';
import { EventsValidator } from '../../business/repositories/events.validator';
import { IEvent } from '../../business/entities';
import {
  AccessMode,
  EventStatus,
  RegistrationStatus,
} from '../../../../shared/enums';

@Injectable()
export class EventsValidatorImpl implements EventsValidator {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,

    @InjectRepository(EventRegistration)
    private readonly registrationRepo: Repository<EventRegistration>,
  ) {}

  async validateOrganizer(
    eventId: string,
    organizerId: string,
  ): Promise<boolean> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId, isDeleted: false },
    });
    if (!event) throw new NotFoundException('El evento no fue encontrado');
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este evento',
      );
    }

    return true;
  }

  async validateCapacity(eventId: string): Promise<boolean> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId, isDeleted: false },
    });
    if (!event) throw new NotFoundException('El evento no fue encontrado');

    const approvedCount = await this.registrationRepo.count({
      where: { eventId, status: RegistrationStatus.APPROVED, isDeleted: false },
    });

    if (approvedCount >= event.capacity) {
      if (!event.waitlistEnabled) {
        throw new BadRequestException(
          'El evento ha alcanzado su capacidad máxima',
        );
      }
    }

    return true;
  }

  validateEventDates(startsAt: Date, endsAt: Date): boolean {
    const now = new Date();

    if (startsAt <= now) {
      throw new BadRequestException(
        'La fecha de inicio debe ser posterior a la fecha actual',
      );
    }
    if (endsAt <= startsAt) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    return true;
  }

  async validateEventIsPublished(eventId: string): Promise<boolean> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId, isDeleted: false },
    });
    if (!event) throw new NotFoundException('El evento no fue encontrado');
    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('El evento no está publicado');
    }

    return true;
  }

  async validateEventNotCancelled(eventId: string): Promise<boolean> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId, isDeleted: false },
    });
    if (!event) throw new NotFoundException('El evento no fue encontrado');
    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('El evento ha sido cancelado');
    }

    return true;
  }

  validatePriceForPaidEvent(event: Partial<IEvent>): boolean {
    if (event.accessMode === AccessMode.PAID) {
      if (!event.price || event.price <= 0) {
        throw new BadRequestException(
          'Un evento de pago debe tener un precio mayor a 0',
        );
      }
      if (!event.currency) {
        throw new BadRequestException(
          'Un evento de pago debe especificar la moneda',
        );
      }
    }

    return true;
  }
}
