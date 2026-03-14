import { IMeta } from 'src/shared/interfaces/Meta';
import { IEvent } from '../entities';
import { EventStatus, EventType } from '../../../../shared/enums';

export interface EventsRepository {
  create(event: IEvent): Promise<IEvent>;
  findAll(filters?: EventsFilters, limit?: number, offset?: number): Promise<{ events: IEvent[]; meta: IMeta }>;
  findNearby(latitude: number, longitude: number, radiusKm: number, filters?: EventsFilters, limit?: number, offset?: number): Promise<{ events: IEvent[]; meta: IMeta }>;
  findOne(id: string): Promise<IEvent>;
  findByOrganizer(organizerId: string, limit?: number, offset?: number): Promise<{ events: IEvent[]; meta: IMeta }>;
  update(id: string, data: Partial<IEvent>): Promise<IEvent>;
  remove(id: string): Promise<{ message: string }>;
  updateStatus(id: string, status: EventStatus): Promise<IEvent>;
}

export interface EventsFilters {
  type?: EventType;
  status?: EventStatus;
  startDate?: Date;
  endDate?: Date;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}
