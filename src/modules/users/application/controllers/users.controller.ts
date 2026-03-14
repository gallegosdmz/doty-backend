import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from '../../business/services/users.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Auth } from '../decorators/auth.decorator';
import { GetUser } from '../decorators/get-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { IUser } from '../../business/entities';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Auth()
  getProfile(@GetUser() user: IUser) {
    return this.usersService.findOne(user.id!);
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Auth()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: IUser,
  ) {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @Auth()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: IUser,
  ) {
    return this.usersService.remove(id, user);
  }
}
