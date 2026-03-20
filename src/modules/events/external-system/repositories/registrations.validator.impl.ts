import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventRegistration } from '../entities/event-registration.entity';
import { RegistrationsValidator } from '../../business/repositories/registrations.validator';
import { RegistrationStatus } from '../../../../shared/enums';

@Injectable()
export class RegistrationsValidatorImpl implements RegistrationsValidator {
  constructor(
    @InjectRepository(EventRegistration)
    private readonly registrationRepo: Repository<EventRegistration>,
  ) {}

  async validateNotAlreadyRegistered(
    eventId: string,
    userId: string,
  ): Promise<boolean> {
    const existing = await this.registrationRepo.findOne({
      where: { eventId, userId, isDeleted: false },
    });

    if (existing && existing.status !== RegistrationStatus.CANCELLED) {
      throw new BadRequestException('Ya estás inscrito en este evento');
    }

    return true;
  }

  async validateRegistrationOwner(
    registrationId: string,
    userId: string,
  ): Promise<boolean> {
    const registration = await this.registrationRepo.findOne({
      where: { id: registrationId, isDeleted: false },
    });
    if (!registration)
      throw new NotFoundException('La inscripción no fue encontrada');
    if (registration.userId !== userId) {
      throw new ForbiddenException('No tienes permisos sobre esta inscripción');
    }

    return true;
  }

  async validateCanCancel(registrationId: string): Promise<boolean> {
    const registration = await this.registrationRepo.findOne({
      where: { id: registrationId, isDeleted: false },
    });
    if (!registration)
      throw new NotFoundException('La inscripción no fue encontrada');
    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('La inscripción ya fue cancelada');
    }

    return true;
  }
}
