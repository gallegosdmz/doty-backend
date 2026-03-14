import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from '../../business/services/tickets.service';
import { Auth } from '../../../users/application/decorators/auth.decorator';
import { GetUser } from '../../../users/application/decorators/get-user.decorator';
import type { IUser } from '../../../users/business/entities';

@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('registration/:registrationId')
  @Auth()
  generate(@Param('registrationId', ParseUUIDPipe) registrationId: string) {
    return this.ticketsService.generate(registrationId);
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findOne(id);
  }

  @Get('code/:code')
  @Auth()
  findByCode(@Param('code') code: string) {
    return this.ticketsService.findByCode(code);
  }

  @Patch('validate/:code')
  @Auth()
  validate(
    @Param('code') code: string,
    @GetUser() user: IUser,
  ) {
    return this.ticketsService.validate(code, user);
  }

  @Delete(':id')
  @Auth()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: IUser,
  ) {
    return this.ticketsService.remove(id, user);
  }
}
