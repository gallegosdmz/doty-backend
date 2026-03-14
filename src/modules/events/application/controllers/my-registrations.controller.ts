import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RegistrationsService } from '../../business/services/registrations.service';
import { PaginationDto } from '../../../../shared/dtos/pagination.dto';
import { Auth } from '../../../users/application/decorators/auth.decorator';
import { GetUser } from '../../../users/application/decorators/get-user.decorator';
import type { IUser } from '../../../users/business/entities';

@ApiBearerAuth()
@Controller('registrations')
export class MyRegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get('mine')
  @Auth()
  findMyRegistrations(
    @GetUser() user: IUser,
    @Query() paginationDto: PaginationDto,
  ) {
    const { limit = 10, offset = 0 } = paginationDto;
    return this.registrationsService.findByUser(user.id!, limit, offset);
  }
}
