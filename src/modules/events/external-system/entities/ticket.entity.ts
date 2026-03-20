import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EventRegistration } from './event-registration.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  registrationId: string;

  @Index()
  @Column('varchar', { length: 100, unique: true })
  code: string;

  @Column({ default: false })
  isUsed: boolean;

  @Column('timestamptz', { nullable: true })
  usedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @OneToOne(() => EventRegistration, (registration) => registration.ticket, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'registrationId' })
  registration: EventRegistration;
}
