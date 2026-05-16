import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

const LISTING_SELECT = {
  id: true, refCode: true, bhk: true, propertySubType: true,
  area: true, city: true, price: true, listingType: true,
  areaSqft: true, availability: true, urgencyLevel: true, building: true,
  listingAgents: { include: { agent: { include: { phones: true } } } },
  media: { where: { type: 'IMAGE' as const }, take: 1, select: { url: true } },
};

@Injectable()
export class ShortlistsService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, userId: string, clientId: string, listingIds: string[], name?: string) {
    // Verify client belongs to workspace
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, workspaceId },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Client not found');

    return this.prisma.clientShortlist.create({
      data: {
        workspaceId,
        clientId,
        createdById: userId,
        name: name ?? null,
        items: {
          create: listingIds.map((listingId) => ({ listingId })),
        },
      },
      include: { items: true },
    });
  }

  async listForBroker(workspaceId: string, userId: string) {
    const shortlists = await this.prisma.clientShortlist.findMany({
      where: { workspaceId, createdById: userId },
      include: {
        client: { select: { id: true, name: true, phones: { where: { primary: true }, take: 1 } } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return shortlists.map((s) => ({ ...s, itemCount: s._count.items, _count: undefined }));
  }

  async listForClient(workspaceId: string, clientId: string) {
    return this.prisma.clientShortlist.findMany({
      where: { workspaceId, clientId },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(workspaceId: string, id: string) {
    const shortlist = await this.prisma.clientShortlist.findFirst({
      where: { id, workspaceId },
      include: {
        client: {
          select: {
            id: true, name: true,
            phones: { where: { primary: true }, take: 1 },
          },
        },
        items: {
          include: { listing: { select: LISTING_SELECT } },
          orderBy: { addedAt: 'desc' },
        },
      },
    });
    if (!shortlist) throw new NotFoundException('Shortlist not found');
    return shortlist;
  }

  async addItems(workspaceId: string, id: string, listingIds: string[]) {
    const shortlist = await this.prisma.clientShortlist.findFirst({
      where: { id, workspaceId },
    });
    if (!shortlist) throw new NotFoundException('Shortlist not found');

    // Upsert each — skip duplicates
    await Promise.all(
      listingIds.map((listingId) =>
        this.prisma.clientShortlistItem.upsert({
          where: { shortlistId_listingId: { shortlistId: id, listingId } },
          update: {},
          create: { shortlistId: id, listingId },
        }),
      ),
    );

    return this.getOne(workspaceId, id);
  }

  async removeItem(workspaceId: string, shortlistId: string, listingId: string) {
    const shortlist = await this.prisma.clientShortlist.findFirst({
      where: { id: shortlistId, workspaceId },
    });
    if (!shortlist) throw new NotFoundException('Shortlist not found');
    await this.prisma.clientShortlistItem.delete({
      where: { shortlistId_listingId: { shortlistId, listingId } },
    }).catch(() => {});
  }

  async updateItem(workspaceId: string, shortlistId: string, listingId: string, notes?: string, sentAt?: string) {
    const shortlist = await this.prisma.clientShortlist.findFirst({
      where: { id: shortlistId, workspaceId },
    });
    if (!shortlist) throw new NotFoundException('Shortlist not found');
    return this.prisma.clientShortlistItem.update({
      where: { shortlistId_listingId: { shortlistId, listingId } },
      data: {
        ...(notes !== undefined && { notes }),
        ...(sentAt !== undefined && { sentAt: new Date(sentAt) }),
      },
    });
  }

  async update(workspaceId: string, id: string, name?: string, status?: string) {
    const shortlist = await this.prisma.clientShortlist.findFirst({
      where: { id, workspaceId },
    });
    if (!shortlist) throw new NotFoundException('Shortlist not found');
    return this.prisma.clientShortlist.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status: status as any }),
      },
    });
  }
}