import { IEvent } from '../entities';

export interface EventsValidator {
  validateOrganizer(eventId: string, organizerId: string): Promise<boolean>;
  validateCapacity(eventId: string): Promise<boolean>;
  validateEventDates(startsAt: Date, endsAt: Date): boolean;
  validateEventIsPublished(eventId: string): Promise<boolean>;
  validateEventNotCancelled(eventId: string): Promise<boolean>;
  validatePriceForPaidEvent(event: Partial<IEvent>): boolean;
}
