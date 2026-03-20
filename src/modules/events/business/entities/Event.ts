import {
  AccessMode,
  AdmissionType,
  EventStatus,
  EventType,
} from '../../../../shared/enums';

export interface IEvent {
  id?: string;
  organizerId: string;
  title: string;
  description: string;
  type: EventType;
  accessMode: AccessMode;
  admissionType: AdmissionType;
  price?: number | null;
  currency?: string | null;
  latitude: number;
  longitude: number;
  address: string;
  capacity: number;
  waitlistEnabled?: boolean;
  startsAt: Date;
  endsAt: Date;
  status?: EventStatus;
  coverImageUrl?: string | null;
  metadata?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}
