import { IsEnum, IsOptional } from 'class-validator';
import { RegistrationStatus } from '../../../../shared/enums';
import { PaginationDto } from '../../../../shared/dtos/pagination.dto';

export class FilterRegistrationsDto extends PaginationDto {
  @IsEnum(RegistrationStatus)
  @IsOptional()
  status?: RegistrationStatus;
}
