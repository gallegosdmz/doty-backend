import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
  IsPositive,
} from 'class-validator';
import { EventType, EventStatus } from '../../../../shared/enums';
import { PaginationDto } from '../../../../shared/dtos/pagination.dto';

export class FilterEventsDto extends PaginationDto {
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;
}

export class NearbyEventsDto extends FilterEventsDto {
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  radiusKm?: number;
}
