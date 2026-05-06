import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

const ALLOWED_RESPOND_STATUSES = ['INTERESTED', 'NOT_INTERESTED'] as const;
type RespondStatus = (typeof ALLOWED_RESPOND_STATUSES)[number];

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getShareData(token: string) {
    const shareToken = await this.prisma.clientShareToken.findUnique({
      where: { token },
      include: {
        client:    { select: { id: true, name: true } },
        workspace: { select: { id: true, name: true } },
      },
    });

    if (!shareToken) throw new NotFoundException('Share link not found');
    if (shareToken.expiresAt < new Date()) {
      throw new NotFoundException('Share link has expired');
    }

    // Mark first view
    if (!shareToken.viewedAt) {
      await this.prisma.clientShareToken.update({
        where: { id: shareToken.id },
        data:  { viewedAt: new Date() },
      });
    }

    const clientProperties = await this.prisma.clientProperty.findMany({
      where: {
        clientId: shareToken.clientId,
        listing: {
          workspaceId: shareToken.workspaceId,
        },
      },
      include: {
        listing: {
          select: {
            id:              true,
            bhk:             true,
            propertySubType: true,
            areaSqft:        true,
            city:            true,
            area:            true,
            price:           true,
          },
        },
      },
      orderBy: { sharedAt: 'asc' },
    });

    return {
      clientName:    shareToken.client.name,
      workspaceName: shareToken.workspace.name,
      properties: clientProperties.map((cp) => ({
        id:           cp.id,
        clientStatus: cp.clientStatus,          // ← clientStatus, not status
        listing: {
          id:           cp.listing.id,
          bhk:          cp.listing.bhk,
          propertyType: cp.listing.propertySubType,
          area:         cp.listing.areaSqft,
          areaUnit:     'sq ft',
          city:         cp.listing.city,
          locality:     cp.listing.area,        // area field = locality in your schema
          price:        cp.listing.price,
          imageUrl:     null,                   // extend if Media is queried
        },
      })),
    };
  }

  async respond(
    token: string,
    clientPropertyId: string,
    status: RespondStatus,
  ) {
    if (!ALLOWED_RESPOND_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Status must be one of: ${ALLOWED_RESPOND_STATUSES.join(', ')}`,
      );
    }

    const shareToken = await this.prisma.clientShareToken.findUnique({
      where: { token },
      select: { clientId: true, workspaceId: true, expiresAt: true },
    });

    if (!shareToken) throw new NotFoundException('Share link not found');
    if (shareToken.expiresAt < new Date()) {
      throw new NotFoundException('Share link has expired');
    }

    // Validate ownership: property must belong to this token's client + workspace
    const clientProperty = await this.prisma.clientProperty.findFirst({
      where: {
        id:       clientPropertyId,
        clientId: shareToken.clientId,
        listing: {
          workspaceId: shareToken.workspaceId,
        },
      },
    });

    if (!clientProperty) {
      throw new NotFoundException('Property not found for this share link');
    }

    // Update ONLY clientStatus — LeadStage (status) is completely untouched
    const updated = await this.prisma.clientProperty.update({
      where: { id: clientPropertyId },
      data:  { clientStatus: status },
    });

    return { id: updated.id, clientStatus: updated.clientStatus };
  }
}