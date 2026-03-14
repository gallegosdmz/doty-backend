import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { AccessMode, AdmissionType, EventStatus, EventType } from '../../../../shared/enums';
import { User } from '../../../users/external-system/entities/user.entity';
import { EventRegistration } from './event-registration.entity';

@Entity('events')
@Index(['type'])
@Index(['status'])
@Index(['latitude', 'longitude'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  organizerId: string;

  @Column('varchar', { length: 200 })
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: EventType })
  type: EventType;

  @Column({ type: 'enum', enum: AccessMode })
  accessMode: AccessMode;

  @Column({ type: 'enum', enum: AdmissionType, default: AdmissionType.DIRECT })
  admissionType: AdmissionType;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price: number | null;

  @Column('varchar', { length: 3, nullable: true })
  currency: string | null;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column('varchar', { length: 500 })
  address: string;

  @Column('int')
  capacity: number;

  @Column({ default: false })
  waitlistEnabled: boolean;

  @Column('timestamptz')
  startsAt: Date;

  @Column('timestamptz')
  endsAt: Date;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.DRAFT })
  status: EventStatus;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizerId' })
  organizer: User;

  @OneToMany(() => EventRegistration, (registration) => registration.event)
  registrations: EventRegistration[];
}
