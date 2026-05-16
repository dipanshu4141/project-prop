import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

class CreateCollectionDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() emoji?: string;
}

class UpdateCollectionDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() emoji?: string;
}

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private svc: CollectionsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.svc.list(user.workspaceId, user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateCollectionDto) {
    return this.svc.create(user.workspaceId, user.sub, body.name, body.emoji);
  }

  @Get(':id')
  getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.getOne(user.workspaceId, user.sub, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: UpdateCollectionDto) {
    return this.svc.update(user.workspaceId, user.sub, id, body.name, body.emoji);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.remove(user.workspaceId, user.sub, id);
  }

  @Post(':id/items')
  addItem(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { listingId: string }) {
    return this.svc.addItem(user.workspaceId, user.sub, id, body.listingId);
  }

  @Delete(':id/items/:listingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeItem(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('listingId') listingId: string) {
    return this.svc.removeItem(user.workspaceId, user.sub, id, listingId);
  }

  @Get('saved-status/:listingId')
  savedStatus(@CurrentUser() user: JwtPayload, @Param('listingId') listingId: string) {
    return this.svc.getSavedStatus(user.workspaceId, user.sub, listingId);
  }
}