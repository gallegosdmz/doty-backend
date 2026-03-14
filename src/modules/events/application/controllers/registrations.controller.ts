import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RegistrationsService } from '../../business/services/registrations.service';
import { FilterRegistrationsDto } from '../dto/filter-registrations.dto';
import { PaginationDto } from '../../../../shared/dtos/pagination.dto';
import { Auth } from '../../../users/application/decorators/auth.decorator';
import { GetUser } from '../../../users/application/decorators/get-user.decorator';
import type { IUser } from '../../../users/business/entities';

@ApiBearerAuth()
@Controller('events/:eventId/registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  @Auth()
  register(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser() user: IUser,
  ) {
    return this.registrationsService.register(eventId, user);
  }

  @Get()
  @Auth()
  findByEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query() filterDto: FilterRegistrationsDto,
  ) {
    const { limit = 10, offset = 0, status } = filterDto;
    return this.registrationsService.findByEvent(eventId, status, limit, offset);
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationsService.findOne(id);
  }

  @Patch(':id/approve')
  @Auth()
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: IUser,
  ) {
    return this.registrationsService.approve(id, user);
  }

  @Patch(':id/reject')
  @Auth()
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: IUser,
  ) {
    return this.registrationsService.reject(id, user);
  }

  @Patch(':id/cancel')
  @Auth()
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: IUser,
  ) {
    return this.registrationsService.cancel(id, user);
  }

  @Delete(':id')
  @Auth()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: IUser,
  ) {
    return this.registrationsService.remove(id, user);
  }
}
