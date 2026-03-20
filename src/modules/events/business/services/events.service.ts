import { Inject, Injectable } from '@nestjs/common';
import type {
  EventsFilters,
  EventsRepository,
} from '../repositories/events.repository';
import type { EventsValidator } from '../repositories/events.validator';
import { IEvent } from '../entities';
import { IUser } from 'src/modules/users/business/entities';
import { AdmissionType, EventStatus } from 'src/shared/enums';
import { IMeta } from 'src/shared/interfaces/Meta';

@Injectable()
export class EventsService {
  constructor(
    @Inject('EventsRepository')
    private readonly eventRepo: EventsRepository,

    @Inject('EventsValidator')
    private readonly eventValidator: EventsValidator,
  ) {}

  async create(eventData: Partial<IEvent>, organizer: IUser): Promise<IEvent> {
    this.eventValidator.validateEventDates(
      eventData.startsAt!,
      eventData.endsAt!,
    );
    this.eventValidator.validatePriceForPaidEvent(eventData);

    const event: IEvent = {
      ...(eventData as IEvent),
      organizerId: organizer.id!,
      status: EventStatus.DRAFT,
      admissionType: eventData.admissionType ?? AdmissionType.DIRECT,
      waitlistEnabled: eventData.waitlistEnabled ?? false,
    };

    return await this.eventRepo.create(event);
  }

  async findAll(
    filters?: EventsFilters,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ events: IEvent[]; meta: IMeta }> {
    return await this.eventRepo.findAll(filters, limit, offset);
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    filters?: EventsFilters,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ events: IEvent[]; meta: IMeta }> {
    return await this.eventRepo.findNearby(
      latitude,
      longitude,
      radiusKm,
      filters,
      limit,
      offset,
    );
  }

  async findOne(id: string): Promise<IEvent> {
    return this.eventRepo.findOne(id);
  }

  async findByOrganizer(
    organizerId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ events: IEvent[]; meta: IMeta }> {
    return this.eventRepo.findByOrganizer(organizerId, limit, offset);
  }

  async update(
    id: string,
    data: Partial<IEvent>,
    organizer: IUser,
  ): Promise<IEvent> {
    await this.eventValidator.validateOrganizer(id, organizer.id!);
    await this.eventValidator.validateEventNotCancelled(id);

    if (data.startsAt && data.endsAt)
      this.eventValidator.validateEventDates(data.startsAt, data.endsAt);

    if (data.accessMode || data.price !== undefined)
      this.eventValidator.validatePriceForPaidEvent(data);

    return await this.eventRepo.update(id, data);
  }

  async publish(id: string, organizer: IUser): Promise<IEvent> {
    await this.eventValidator.validateOrganizer(id, organizer.id!);
    await this.eventValidator.validateEventNotCancelled(id);

    return this.eventRepo.updateStatus(id, EventStatus.PUBLISHED);
  }

  async cancel(id: string, organizer: IUser): Promise<IEvent> {
    await this.eventValidator.validateOrganizer(id, organizer.id!);
    await this.eventValidator.validateEventNotCancelled(id);

    return this.eventRepo.updateStatus(id, EventStatus.CANCELLED);
  }

  async complete(id: string, organizer: IUser): Promise<IEvent> {
    await this.eventValidator.validateOrganizer(id, organizer.id!);
    await this.eventValidator.validateEventIsPublished(id);

    return this.eventRepo.updateStatus(id, EventStatus.COMPLETED);
  }

  async remove(id: string, organizer: IUser): Promise<{ message: string }> {
    await this.eventValidator.validateOrganizer(id, organizer.id!);

    return this.eventRepo.remove(id);
  }

  async updateCover(
    id: string,
    coverImageUrl: string,
    organizer: IUser,
  ): Promise<IEvent> {
    await this.eventValidator.validateOrganizer(id, organizer.id!);
    return await this.eventRepo.update(id, { coverImageUrl });
  }
}
