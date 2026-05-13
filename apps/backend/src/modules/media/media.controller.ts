import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import {
  ConfirmUploadDto,
  RequestPresignedUrlDto,
  ShareTocommunityDto,
} from './media.dto';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // GET /api/media/usage
  // Dashboard storage meter
  @Get('usage')
  getUsage(@CurrentUser() user: JwtPayload) {
    return this.mediaService.getStorageUsage(user.workspaceId);
  }

  // POST /api/media/presign
  // Step 1 — get a presigned PUT URL before uploading
  @Post('presign')
  requestPresignedUrl(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RequestPresignedUrlDto,
  ) {
    return this.mediaService.requestPresignedUrl(user.workspaceId, dto);
  }

  // POST /api/media/confirm
  // Step 2 — tell backend upload succeeded, create Media row
  @Post('confirm')
  confirmUpload(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConfirmUploadDto,
  ) {
    return this.mediaService.confirmUpload(user.workspaceId, user.sub, dto);
  }

  // GET /api/media/listing/:listingId
  // All media for a listing
  @Get('listing/:listingId')
  getListingMedia(
    @CurrentUser() user: JwtPayload,
    @Param('listingId') listingId: string,
  ) {
    return this.mediaService.getListingMedia(user.workspaceId, listingId);
  }

  // DELETE /api/media/:mediaId
  // Soft delete — quota freed instantly, R2 purged by cron
  @Delete(':mediaId')
  deleteMedia(
    @CurrentUser() user: JwtPayload,
    @Param('mediaId') mediaId: string,
  ) {
    return this.mediaService.deleteMedia(user.workspaceId, mediaId);
  }

  // POST /api/media/share-community
  // Broker marks their photo as shared to community pool
  @Post('share-community')
  shareToCommunity(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ShareTocommunityDto,
  ) {
    return this.mediaService.shareToСommunity(user.workspaceId, dto);
  }
}