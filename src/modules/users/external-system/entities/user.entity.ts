import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 254, unique: true, nullable: true })
  email?: string;

  @Column('varchar', { length: 20, unique: true })
  phone: string;
  
  @Column('varchar', { length: 254, select: false })
  password: string;

  @Column('varchar', { length: 100 })
  firstName: string;

  @Column('varchar', { length: 150 })
  lastName: string;

  @Column('varchar', { length: 254, nullable: true })
  avatarUrl?: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ default: false })
  isDeleted: boolean;
}