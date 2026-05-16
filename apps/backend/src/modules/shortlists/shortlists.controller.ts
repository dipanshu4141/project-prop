import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ShortlistsService } from './shortlists.service';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import { IsOptional, IsString, IsArray, IsNotEmpty } from 'class-validator';

class CreateShortlistDto {
  @IsString() @IsNotEmpty() clientId!: string;
  @IsArray() listingIds!: string[];
  @IsOptional() @IsString() name?: string;
}

class AddItemsDto {
  @IsArray() listingIds!: string[];
}

class UpdateItemDto {
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() sentAt?: string;
}

class UpdateShortlistDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() status?: string;
}

@Controller('shortlists')
@UseGuards(JwtAuthGuard)
export class ShortlistsController {
  constructor(private svc: ShortlistsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.svc.listForBroker(user.workspaceId, user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateShortlistDto) {
    return this.svc.create(user.workspaceId, user.sub, body.clientId, body.listingIds, body.name);
  }

  @Get(':id')
  getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.getOne(user.workspaceId, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: UpdateShortlistDto) {
    return this.svc.update(user.workspaceId, id, body.name, body.status);
  }

  @Post(':id/items')
  addItems(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: AddItemsDto) {
    return this.svc.addItems(user.workspaceId, id, body.listingIds);
  }

  @Delete(':id/items/:listingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeItem(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('listingId') listingId: string) {
    return this.svc.removeItem(user.workspaceId, id, listingId);
  }

  @Patch(':id/items/:listingId')
  updateItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('listingId') listingId: string,
    @Body() body: UpdateItemDto,
  ) {
    return this.svc.updateItem(user.workspaceId, id, listingId, body.notes, body.sentAt);
  }
}