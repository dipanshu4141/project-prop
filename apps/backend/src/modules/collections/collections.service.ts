import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async list(workspaceId: string, userId: string) {
    const collections = await this.prisma.savedCollection.findMany({
      where: { workspaceId, createdById: userId },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return collections.map((c) => ({ ...c, itemCount: c._count.items, _count: undefined }));
  }

  async create(workspaceId: string, userId: string, name: string, emoji?: string) {
    return this.prisma.savedCollection.create({
      data: { workspaceId, createdById: userId, name, emoji },
    });
  }

  async getOne(workspaceId: string, userId: string, id: string) {
    const col = await this.prisma.savedCollection.findFirst({
      where: { id, workspaceId, createdById: userId },
      include: {
        items: {
          include: {
            listing: {
              select: {
                id: true, refCode: true, bhk: true, propertySubType: true,
                area: true, city: true, price: true, listingType: true,
                areaSqft: true, availability: true, urgencyLevel: true,
                media: { where: { type: 'IMAGE' }, take: 1, select: { url: true } },
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
      },
    });
    if (!col) throw new NotFoundException('Collection not found');
    return col;
  }

  async update(workspaceId: string, userId: string, id: string, name?: string, emoji?: string) {
    const col = await this.prisma.savedCollection.findFirst({
      where: { id, workspaceId, createdById: userId },
    });
    if (!col) throw new NotFoundException('Collection not found');
    return this.prisma.savedCollection.update({
      where: { id },
      data: { ...(name !== undefined && { name }), ...(emoji !== undefined && { emoji }) },
    });
  }

  async remove(workspaceId: string, userId: string, id: string) {
    const col = await this.prisma.savedCollection.findFirst({
      where: { id, workspaceId, createdById: userId },
    });
    if (!col) throw new NotFoundException('Collection not found');
    await this.prisma.savedCollection.delete({ where: { id } });
  }

  async addItem(workspaceId: string, userId: string, collectionId: string, listingId: string) {
    const col = await this.prisma.savedCollection.findFirst({
      where: { id: collectionId, workspaceId, createdById: userId },
    });
    if (!col) throw new NotFoundException('Collection not found');
    return this.prisma.savedCollectionItem.upsert({
      where: { collectionId_listingId: { collectionId, listingId } },
      update: {},
      create: { collectionId, listingId },
    });
  }

  async removeItem(workspaceId: string, userId: string, collectionId: string, listingId: string) {
    const col = await this.prisma.savedCollection.findFirst({
      where: { id: collectionId, workspaceId, createdById: userId },
    });
    if (!col) throw new NotFoundException('Collection not found');
    await this.prisma.savedCollectionItem.delete({
      where: { collectionId_listingId: { collectionId, listingId } },
    }).catch(() => {});
  }

  // Returns which collectionIds contain a given listingId (for bookmark state)
  async getSavedStatus(workspaceId: string, userId: string, listingId: string) {
    const items = await this.prisma.savedCollectionItem.findMany({
      where: { listingId, collection: { workspaceId, createdById: userId } },
      select: { collectionId: true },
    });
    return { savedInCollections: items.map((i) => i.collectionId) };
  }
}