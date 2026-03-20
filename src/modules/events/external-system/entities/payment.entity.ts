import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { PaymentStatus } from '../../../../shared/enums';
import { User } from '../../../users/external-system/entities/user.entity';
import { Event } from './event.entity';
import { EventRegistration } from './event-registration.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  registrationId: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  eventId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('varchar', { length: 3 })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column('varchar', { length: 50, nullable: true })
  paymentMethod: string | null;

  @Column('varchar', { length: 254, nullable: true })
  transactionRef: string | null;

  @Column('timestamptz', { nullable: true })
  paidAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @OneToOne(() => EventRegistration, (registration) => registration.payment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'registrationId' })
  registration: EventRegistration;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;
}
