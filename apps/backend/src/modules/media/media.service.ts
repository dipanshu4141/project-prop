import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { ConfirmUploadDto, RequestPresignedUrlDto, ShareTocommunityDto } from './media.dto';
import { MediaSource } from '@prisma/client';

// Free quota for base plan — 500MB in bytes
const FREE_QUOTA_BYTES = 500 * 1024 * 1024;

// Storage tier limits in bytes
const TIER_LIMITS: Record<string, number> = {
  GB_50: 50 * 1024 * 1024 * 1024,
  GB_100: 100 * 1024 * 1024 * 1024,
};

// WhatsApp ingested media silent cap per workspace — 500MB
const WA_INGESTED_CAP_BYTES = 500 * 1024 * 1024;

@Injectable()
export class MediaService {
  private r2: S3Client;
  private bucket: string;

  constructor(private prisma: PrismaService) {
    this.bucket = process.env.R2_BUCKET_NAME!;
    this.r2 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT!, // https://<accountid>.r2.cloudflarestorage.com
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  // ─── QUOTA ───────────────────────────────────────────────

  async getQuotaLimitBytes(workspaceId: string): Promise<number> {
    const sub = await this.prisma.workspaceStorageSubscription.findUnique({
      where: { workspaceId },
    });

    if (!sub || sub.status !== 'ACTIVE') return FREE_QUOTA_BYTES;
    return TIER_LIMITS[sub.tier] ?? FREE_QUOTA_BYTES;
  }

  async getUsedBytes(workspaceId: string): Promise<number> {
    const result = await this.prisma.media.aggregate({
      where: {
        workspaceId,
        countedInQuota: true,
        deletedAt: null,
      },
      _sum: { sizeBytes: true },
    });

    return Number(result._sum.sizeBytes ?? 0);
  }

  async checkQuota(workspaceId: string, incomingBytes: number): Promise<void> {
    const [used, limit] = await Promise.all([
      this.getUsedBytes(workspaceId),
      this.getQuotaLimitBytes(workspaceId),
    ]);

    if (used + incomingBytes > limit) {
      const usedGb = (used / 1024 ** 3).toFixed(2);
      const limitGb = (limit / 1024 ** 3).toFixed(2);
      throw new BadRequestException(
        `Storage full. Used ${usedGb} GB of ${limitGb} GB. Upgrade your storage plan to continue uploading.`,
      );
    }
  }

  // ─── STORAGE USAGE (for dashboard meter) ─────────────────

  async getStorageUsage(workspaceId: string) {
    const [limitBytes, sub] = await Promise.all([
      this.getQuotaLimitBytes(workspaceId),
      this.prisma.workspaceStorageSubscription.findUnique({
        where: { workspaceId },
      }),
    ]);

    // Broker uploads — counted toward quota
    const brokerAgg = await this.prisma.media.aggregate({
      where: { workspaceId, countedInQuota: true, deletedAt: null },
      _sum: { sizeBytes: true },
      _count: { id: true },
    });

    // WhatsApp ingested — free, shown separately
    const waAgg = await this.prisma.media.aggregate({
      where: {
        workspaceId,
        countedInQuota: false,
        source: MediaSource.WHATSAPP_INGESTED,
        deletedAt: null,
      },
      _sum: { sizeBytes: true },
      _count: { id: true },
    });

    // Per-type breakdown for broker uploads
    const byType = await this.prisma.media.groupBy({
      by: ['type'],
      where: { workspaceId, countedInQuota: true, deletedAt: null },
      _sum: { sizeBytes: true },
      _count: { id: true },
    });

    const usedBytes = Number(brokerAgg._sum.sizeBytes ?? 0);

    return {
      plan: sub?.tier ?? 'FREE',
      limitBytes,
      usedBytes,
      freeBytes: Math.max(0, limitBytes - usedBytes),
      percentUsed: Math.min(100, Math.round((usedBytes / limitBytes) * 100)),
      breakdown: {
        brokerUploads: {
          bytes: usedBytes,
          count: brokerAgg._count.id,
        },
        whatsappIngested: {
          bytes: Number(waAgg._sum.sizeBytes ?? 0),
          count: waAgg._count.id,
          note: 'Free — does not count toward quota',
        },
        byType: byType.map((t) => ({
          type: t.type,
          bytes: Number(t._sum.sizeBytes ?? 0),
          count: t._count.id,
        })),
      },
    };
  }

  // ─── PRESIGNED URL ────────────────────────────────────────

  async requestPresignedUrl(workspaceId: string, dto: RequestPresignedUrlDto) {
    // 1. Quota check before issuing URL
    await this.checkQuota(workspaceId, dto.sizeBytes);

    // 2. Validate listing belongs to this workspace
    const listing = await this.prisma.workspaceListing.findFirst({
      where: { id: dto.listingId, workspaceId },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    // 3. Build R2 key
    const ext = this.mimeToExt(dto.mimeType);
    const r2Key = `${workspaceId}/${dto.listingId}/${uuidv4()}${ext}`;

    // 4. Generate presigned PUT URL — expires in 10 minutes
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: r2Key,
      ContentType: dto.mimeType,
      ContentLength: dto.sizeBytes,
    });

    const presignedUrl = await getSignedUrl(this.r2, command, { expiresIn: 600 });

    return { presignedUrl, r2Key };
  }

  // ─── CONFIRM UPLOAD ───────────────────────────────────────
  // Called by frontend AFTER successful PUT to R2

  async confirmUpload(workspaceId: string, userId: string, dto: ConfirmUploadDto) {
    // Re-check quota with exact size (presign check used frontend-reported size)
    await this.checkQuota(workspaceId, dto.sizeBytes);

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${dto.r2Key}`;

    const media = await this.prisma.media.create({
      data: {
        listingId: dto.listingId,
        workspaceId,
        uploadedById: userId,
        r2Key: dto.r2Key,
        url: publicUrl,
        type: dto.type as any,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        isCompressed: dto.isCompressed ?? false,
        source: MediaSource.BROKER_UPLOAD,
        countedInQuota: true,
      },
    });

    return media;
  }

  // ─── GET LISTING MEDIA ────────────────────────────────────

  async getListingMedia(workspaceId: string, listingId: string) {
    const listing = await this.prisma.workspaceListing.findFirst({
      where: { id: listingId, workspaceId },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    return this.prisma.media.findMany({
      where: { listingId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        url: true,
        type: true,
        mimeType: true,
        sizeBytes: true,
        isCompressed: true,
        isShared: true,
        source: true,
        countedInQuota: true,
        createdAt: true,
      },
    });
  }

  // ─── DELETE MEDIA ─────────────────────────────────────────

  async deleteMedia(workspaceId: string, mediaId: string) {
    const media = await this.prisma.media.findFirst({
      where: { id: mediaId, workspaceId, deletedAt: null },
    });
    if (!media) throw new NotFoundException('Media not found');

    // Soft delete in DB — quota instantly freed
    await this.prisma.media.update({
      where: { id: mediaId },
      data: { deletedAt: new Date() },
    });

    // Hard delete from R2 — fire and forget, cron will catch failures
    this.r2
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: media.r2Key }))
      .catch((err) => console.error(`R2 delete failed for ${media.r2Key}:`, err));

    return { deleted: true };
  }

  // ─── COMMUNITY SHARE ──────────────────────────────────────

  async shareToСommunity(workspaceId: string, dto: ShareTocommunityDto) {
    const media = await this.prisma.media.findFirst({
      where: { id: dto.mediaId, workspaceId, deletedAt: null },
    });
    if (!media) throw new NotFoundException('Media not found');
    if (!media.countedInQuota) {
      throw new ForbiddenException('WhatsApp ingested media cannot be shared to community');
    }

    // Verify canonical property exists
    const canonical = await this.prisma.canonicalProperty.findUnique({
      where: { id: dto.canonicalPropertyId },
    });
    if (!canonical) throw new NotFoundException('Canonical property not found');

    return this.prisma.media.update({
      where: { id: dto.mediaId },
      data: {
        isShared: true,
        canonicalPropertyId: dto.canonicalPropertyId,
      },
    });
  }

  // ─── INGEST WHATSAPP MEDIA (called from ingestion pipeline) ──

  async ingestWhatsappMedia(
    workspaceId: string,
    listingId: string,
    r2Key: string,
    mimeType: string,
    sizeBytes: number,
  ) {
    // Check WA silent cap — if exceeded, delete oldest WA media first
    const waUsed = await this.prisma.media.aggregate({
      where: {
        workspaceId,
        source: MediaSource.WHATSAPP_INGESTED,
        deletedAt: null,
      },
      _sum: { sizeBytes: true },
    });

    const waUsedBytes = Number(waUsed._sum.sizeBytes ?? 0);

    if (waUsedBytes + sizeBytes > WA_INGESTED_CAP_BYTES) {
      // Delete oldest WA media for this workspace
      const oldest = await this.prisma.media.findFirst({
        where: {
          workspaceId,
          source: MediaSource.WHATSAPP_INGESTED,
          deletedAt: null,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (oldest) {
        await this.prisma.media.update({
          where: { id: oldest.id },
          data: { deletedAt: new Date() },
        });
        this.r2
          .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: oldest.r2Key }))
          .catch(() => {});
      }
    }

    const type = mimeType.startsWith('video') ? 'VIDEO' : 'IMAGE';
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${r2Key}`;

    return this.prisma.media.create({
      data: {
        listingId,
        workspaceId,
        r2Key,
        url: publicUrl,
        type: type as any,
        mimeType,
        sizeBytes,
        source: MediaSource.WHATSAPP_INGESTED,
        countedInQuota: false, // never counts toward broker quota
      },
    });
  }

  // ─── CRON — cleanup deleted media older than 7 days from R2 ──
  // Call this from a @Cron job in a separate scheduler module

  async purgeDeletedMedia() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const toDelete = await this.prisma.media.findMany({
      where: {
        deletedAt: { lte: cutoff },
        r2Key: { not: '' },
      },
      take: 100, // batch — run cron every hour
    });

    for (const media of toDelete) {
      try {
        await this.r2.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: media.r2Key }),
        );
        // Clear r2Key so we don't retry on next cron run
        await this.prisma.media.update({
          where: { id: media.id },
          data: { r2Key: '' },
        });
      } catch (err) {
        console.error(`Purge failed for ${media.r2Key}:`, err);
      }
    }

    return { purged: toDelete.length };
  }

  // ─── HELPERS ─────────────────────────────────────────────

  private mimeToExt(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/heic': '.heic',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'video/webm': '.webm',
      'application/pdf': '.pdf',
    };
    return map[mime] ?? '';
  }
}