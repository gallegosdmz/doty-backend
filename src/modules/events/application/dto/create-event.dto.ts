import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  IsBoolean,
  IsDateString,
  IsObject,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { AccessMode, AdmissionType, EventType } from '../../../../shared/enums';

export class CreateEventDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(EventType)
  type: EventType;

  @IsEnum(AccessMode)
  accessMode: AccessMode;

  @IsEnum(AdmissionType)
  @IsOptional()
  admissionType?: AdmissionType;

  @ValidateIf((o) => o.accessMode === AccessMode.PAID)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price?: number;

  @ValidateIf((o) => o.accessMode === AccessMode.PAID)
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsNumber({ maxDecimalPlaces: 7 })
  latitude: number;

  @IsNumber({ maxDecimalPlaces: 7 })
  longitude: number;

  @IsString()
  @MaxLength(500)
  address: string;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  capacity: number;

  @IsBoolean()
  @IsOptional()
  waitlistEnabled?: boolean;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
