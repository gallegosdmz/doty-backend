import { Inject, Injectable } from '@nestjs/common';
import type { RegistrationsRepository } from '../repositories/registrations.repository';
import type { RegistrationsValidator } from '../repositories/registrations.validator';
import type { EventsRepository } from '../repositories/events.repository';
import type { EventsValidator } from '../repositories/events.validator';
import { IUser } from 'src/modules/users/business/entities';
import { IEventRegistration } from '../entities';
import { AdmissionType, RegistrationStatus } from 'src/shared/enums';
import { IMeta } from 'src/shared/interfaces/Meta';

@Injectable()
export class RegistrationsService {
  constructor(
    @Inject('RegistrationsRepository')
    private readonly registrationRepo: RegistrationsRepository,

    @Inject('RegistrationsValidator')
    private readonly registrationValidator: RegistrationsValidator,

    @Inject('EventsRepository')
    private readonly eventRepo: EventsRepository,

    @Inject('EventsValidator')
    private readonly eventValidator: EventsValidator,
  ) {}

  async register(eventId: string, user: IUser): Promise<IEventRegistration> {
    await this.eventValidator.validateEventIsPublished(eventId);
    await this.eventValidator.validateCapacity(eventId);
    await this.registrationValidator.validateNotAlreadyRegistered(
      eventId,
      user.id!,
    );

    const event = await this.eventRepo.findOne(eventId);

    const status =
      event.admissionType === AdmissionType.DIRECT
        ? RegistrationStatus.APPROVED
        : RegistrationStatus.PENDING;

    return this.registrationRepo.create({
      eventId,
      userId: user.id!,
      status,
    } as IEventRegistration);
  }

  async findByEvent(
    eventId: string,
    status?: RegistrationStatus,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ registrations: IEventRegistration[]; meta: IMeta }> {
    return this.registrationRepo.findByEvent(eventId, status, limit, offset);
  }

  async findByUser(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ registrations: IEventRegistration[]; meta: IMeta }> {
    return this.registrationRepo.findByUser(userId, limit, offset);
  }

  async findOne(id: string): Promise<IEventRegistration> {
    return this.registrationRepo.findOne(id);
  }

  async approve(id: string, organizer: IUser): Promise<IEventRegistration> {
    const registration = await this.registrationRepo.findOne(id);
    await this.eventValidator.validateOrganizer(
      registration.eventId,
      organizer.id!,
    );
    await this.eventValidator.validateCapacity(registration.eventId);

    return this.registrationRepo.updateStatus(id, RegistrationStatus.APPROVED);
  }

  async reject(id: string, organizer: IUser): Promise<IEventRegistration> {
    const registration = await this.registrationRepo.findOne(id);
    await this.eventValidator.validateOrganizer(
      registration.eventId,
      organizer.id!,
    );

    return this.registrationRepo.updateStatus(id, RegistrationStatus.REJECTED);
  }

  async cancel(id: string, user: IUser): Promise<IEventRegistration> {
    await this.registrationValidator.validateRegistrationOwner(id, user.id!);
    await this.registrationValidator.validateCanCancel(id);

    return this.registrationRepo.updateStatus(id, RegistrationStatus.CANCELLED);
  }

  async remove(id: string, user: IUser): Promise<{ message: string }> {
    await this.registrationValidator.validateRegistrationOwner(id, user.id!);

    return this.registrationRepo.remove(id);
  }
}
