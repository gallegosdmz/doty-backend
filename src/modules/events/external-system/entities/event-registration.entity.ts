import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { RegistrationStatus } from '../../../../shared/enums';
import { User } from '../../../users/external-system/entities/user.entity';
import { Event } from './event.entity';
import { Payment } from './payment.entity';
import { Ticket } from './ticket.entity';

@Entity('event_registrations')
@Index(['eventId', 'status'])
export class EventRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  eventId: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'enum', enum: RegistrationStatus, default: RegistrationStatus.PENDING })
  status: RegistrationStatus;

  @CreateDateColumn()
  registeredAt: Date;

  @Column('timestamptz', { nullable: true })
  resolvedAt: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @ManyToOne(() => Event, (event) => event.registrations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => Payment, (payment) => payment.registration)
  payment: Payment;

  @OneToOne(() => Ticket, (ticket) => ticket.registration)
  ticket: Ticket;
}
