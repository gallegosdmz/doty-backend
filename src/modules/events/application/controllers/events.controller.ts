import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { EventsService } from '../../business/services/events.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { FilterEventsDto, NearbyEventsDto } from '../dto/filter-events.dto';
import { Auth } from '../../../users/application/decorators/auth.decorator';
import { GetUser } from '../../../users/application/decorators/get-user.decorator';
import type { IUser } from '../../../users/business/entities';

@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @Auth()
  create(@Body() createEventDto: CreateEventDto, @GetUser() user: IUser) {
    const { startsAt, endsAt, ...rest } = createEventDto;
    return this.eventsService.create(
      { ...rest, startsAt: new Date(startsAt), endsAt: new Date(endsAt) },
      user,
    );
  }

  @Get()
  findAll(@Query() filterDto: FilterEventsDto) {
    const {
      limit = 10,
      offset = 0,
      search,
      startDate,
      endDate,
      ...filters
    } = filterDto;
    return this.eventsService.findAll(
      {
        ...filters,
        search,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      limit,
      offset,
    );
  }

  @Get('nearby')
  findNearby(@Query() nearbyDto: NearbyEventsDto) {
    const {
      latitude,
      longitude,
      radiusKm = 10,
      limit = 10,
      offset = 0,
      search,
      startDate,
      endDate,
      ...filters
    } = nearbyDto;
    return this.eventsService.findNearby(
      latitude,
      longitude,
      radiusKm,
      {
        ...filters,
        search,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      limit,
      offset,
    );
  }

  @Get('my-events')
  @Auth()
  findMyEvents(@GetUser() user: IUser, @Query() filterDto: FilterEventsDto) {
    const { limit = 10, offset = 0 } = filterDto;
    return this.eventsService.findByOrganizer(user.id!, limit, offset);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    try {
      console.log(`[API_DEBUG] Fetching event: ${id}`);
      const event = await this.eventsService.findOne(id);
      console.log(`[API_DEBUG] Event found: ${event?.title}`);
      return event;
    } catch (error) {
      console.error(`[API_DEBUG] Fatal error fetching event ${id}:`, error);
      throw error;
    }
  }

  @Patch(':id')
  @Auth()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
    @GetUser() user: IUser,
  ) {
    const { startsAt, endsAt, ...rest } = updateEventDto;
    return this.eventsService.update(
      id,
      {
        ...rest,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : undefined,
      },
      user,
    );
  }

  @Patch(':id/publish')
  @Auth()
  publish(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: IUser) {
    return this.eventsService.publish(id, user);
  }

  @Patch(':id/cancel')
  @Auth()
  cancel(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: IUser) {
    return this.eventsService.cancel(id, user);
  }

  @Patch(':id/complete')
  @Auth()
  complete(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: IUser) {
    return this.eventsService.complete(id, user);
  }

  @Delete(':id')
  @Auth()
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: IUser) {
    return this.eventsService.remove(id, user);
  }

  @Patch(':id/cover')
  @Auth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadCover(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: IUser,
  ) {
    const port = this.configService.get<number>('PORT') || 3000;
    // For development, we return a local URL. In production, this would be an S3/Cloudinary URL.
    // We use the relative path so the frontend can prepend the base API URL.
    return this.eventsService.updateCover(
      id,
      `/uploads/${file.filename}`,
      user,
    );
  }
}
