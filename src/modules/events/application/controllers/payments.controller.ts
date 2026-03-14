import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from '../../business/services/payments.service';
import { MarkPaidDto } from '../dto/mark-paid.dto';
import { PaginationDto } from '../../../../shared/dtos/pagination.dto';
import { Auth } from '../../../users/application/decorators/auth.decorator';
import { GetUser } from '../../../users/application/decorators/get-user.decorator';
import type { IUser } from '../../../users/business/entities';

@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('registration/:registrationId')
  @Auth()
  create(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @GetUser() user: IUser,
  ) {
    return this.paymentsService.create(registrationId, user);
  }

  @Get('my-payments')
  @Auth()
  findMyPayments(
    @GetUser() user: IUser,
    @Query() paginationDto: PaginationDto,
  ) {
    const { limit = 10, offset = 0 } = paginationDto;
    return this.paymentsService.findByUser(user.id!, limit, offset);
  }

  @Get('event/:eventId')
  @Auth()
  findByEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser() user: IUser,
    @Query() paginationDto: PaginationDto,
  ) {
    const { limit = 10, offset = 0 } = paginationDto;
    return this.paymentsService.findByEvent(eventId, user, limit, offset);
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id/mark-paid')
  @Auth()
  markAsPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() markPaidDto: MarkPaidDto,
    @GetUser() user: IUser,
  ) {
    return this.paymentsService.markAsPaid(id, markPaidDto.transactionRef, user);
  }

  @Patch(':id/cancel')
  @Auth()
  cancelPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: IUser,
  ) {
    return this.paymentsService.cancelPayment(id, user);
  }

  @Patch(':id/refund')
  @Auth()
  refund(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: IUser,
  ) {
    return this.paymentsService.refund(id, user);
  }

  @Delete(':id')
  @Auth()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: IUser,
  ) {
    return this.paymentsService.remove(id, user);
  }
}
