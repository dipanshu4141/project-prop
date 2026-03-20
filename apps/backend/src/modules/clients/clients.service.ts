import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ClientPropertyStatus, LeadStage } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService, 
    private readonly config: ConfigService,
  ) {}

  /* ================================================================
   * HELPERS
   * ================================================================ */

  private followUpRank(date: Date | null): number {
    if (!date) return 4;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d     = new Date(date); d.setHours(0, 0, 0, 0);
    if (d < today)                       return 1; // overdue
    if (d.getTime() === today.getTime()) return 2; // today
    return 3;                                       // upcoming
  }

  private buildRequirementLabel(properties: any[]): string {
    if (properties.length === 0) return '—';
    const latest = properties[0]?.listing;
    if (!latest) return '—';
    const base = [latest.bhk, latest.propertySubType, latest.city]
      .filter(Boolean)
      .join(' ');
    return properties.length === 1 ? base : `${base} +${properties.length - 1} more`;
  }

  /* ================================================================
   * CLIENT CORE
   * ================================================================ */

  /**
   * Find or create a client scoped to a workspace.
   * Same phone can exist in multiple workspaces — always filter by workspaceId.
   */
  async getOrCreateClient(
    workspaceId: string,
    phone:       string,
    name?:       string,
  ) {
    // Lookup by workspace + phone (unique per schema)
    const existing = await this.prisma.client.findFirst({
      where: { workspaceId, phones: { some: { phone } } },
    });

    if (existing) return existing;

    return this.prisma.client.create({
      data: {
        workspaceId,
        name,
        phones: {
          create: { phone, primary: true },
        },
      },
    });
  }

  async getClient(workspaceId: string, clientId: string) {
    return this.prisma.client.findFirst({
      where: { id: clientId, workspaceId },   // ← workspace guard
      include: {
        phones: true,
        properties: {
          include: { listing: true },
          orderBy: { sharedAt: 'desc' },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /* ================================================================
   * LEADS INBOX — client-centric, no duplicates
   * ================================================================ */

  async getLeadsInbox(workspaceId: string) {
    const clients = await this.prisma.client.findMany({
      where: { workspaceId },          // ← workspace guard
      include: {
        phones: true,
        properties: {
          orderBy: { sharedAt: 'desc' },
          include: { listing: true },
        },
      },
    });

    const rows = clients.map((client) => {
      const followUps = client.properties
        .map((cp) => cp.followUpAt)
        .filter(Boolean) as Date[];

      const nearestFollowUpAt =
        followUps.length > 0
          ? new Date(Math.min(...followUps.map((d) => d.getTime())))
          : null;

      const primaryPhone = client.phones.find((p) => p.primary)?.phone
        ?? client.phones[0]?.phone
        ?? '';

      return {
        clientId:           client.id,
        name:               client.name,
        phone:              primaryPhone,
        propertiesCount:    client.properties.length,
        requirementLabel:   this.buildRequirementLabel(client.properties),
        nearestFollowUpAt,
      };
    });

    rows.sort(
      (a, b) =>
        this.followUpRank(a.nearestFollowUpAt) -
        this.followUpRank(b.nearestFollowUpAt),
    );

    return rows;
  }

  /* ================================================================
   * CLIENT ↔ LISTING
   * ================================================================ */

  async shareProperty(
    workspaceId: string,
    clientId:    string,
    listingId:   string,   // was propertyId — now WorkspaceListing.id
  ) {
    // Guard: client must belong to this workspace
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, workspaceId },
    });
    if (!client) throw new Error('Client not found in workspace');

    const cp = await this.prisma.clientProperty.upsert({
      where: {
        clientId_listingId: { clientId, listingId },
      },
      update: { lastActionAt: new Date() },
      create:  { clientId, listingId },
    });

    await this.createEvent(clientId, 'PROPERTY_SHARED', { listingId });
    return cp;
  }

  async updateClientPropertyStatus(
    workspaceId:       string,
    clientPropertyId:  string,
    status:            LeadStage,
  ) {
    // Resolve and guard
    const cp = await this.prisma.clientProperty.findFirst({
      where: {
        id: clientPropertyId,
        client: { workspaceId },     // ← workspace guard via relation
      },
    });
    if (!cp) throw new Error('ClientProperty not found');

    const updated = await this.prisma.clientProperty.update({
      where: { id: clientPropertyId },
      data:  { status, lastActionAt: new Date() },
    });

    await this.createEvent(updated.clientId, 'STATUS_CHANGED', {
      listingId: updated.listingId,
      status,
    });

    return updated;
  }

  async updateClientPropertyClientStatus(
    clientPropertyId: string,
    clientStatus: ClientPropertyStatus,
    workspaceId: string,
  ) {
    const cp = await this.prisma.clientProperty.findFirst({
      where: {
        id: clientPropertyId,
        listing: { workspaceId },
      },
    });
    if (!cp) throw new NotFoundException('ClientProperty not found');

    return this.prisma.clientProperty.update({
      where: { id: clientPropertyId },
      data:  { clientStatus },
    });
  }

  async updateClientPropertyFollowUp(
    workspaceId:      string,
    clientPropertyId: string,
    followUpAt:       string,
  ) {
    const cp = await this.prisma.clientProperty.findFirst({
      where: { id: clientPropertyId, client: { workspaceId } },
    });
    if (!cp) throw new Error('ClientProperty not found');

    const date = new Date(followUpAt);

    const updated = await this.prisma.clientProperty.update({
      where: { id: clientPropertyId },
      data:  { followUpAt: date, lastActionAt: new Date() },
    });

    await this.createEvent(updated.clientId, 'FOLLOW_UP_SET', {
      listingId: updated.listingId,
      followUpAt: date,
    });

    return updated;
  }

  /* ================================================================
   * NOTES
   * ================================================================ */

  async addNote(workspaceId: string, clientId: string, note: string) {
    // Guard
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, workspaceId },
    });
    if (!client) throw new Error('Client not found');
    return this.createEvent(clientId, 'NOTE_ADDED', { note });
  }

  /* ================================================================
   * FOLLOW-UPS (dashboard)
   * ================================================================ */

  async getFollowUpsToday(workspaceId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const rows = await this.prisma.clientProperty.findMany({
      where: {
        followUpAt: { lte: today },
        client: { workspaceId },          // ← workspace guard
      },
      include: {
        client:  true,
        listing: true,
      },
      orderBy: { followUpAt: 'asc' },
    });

    return this.mapFollowUps(rows);
  }

  async getUpcomingFollowUps(workspaceId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end   = new Date(today);
    end.setDate(end.getDate() + 7);

    const rows = await this.prisma.clientProperty.findMany({
      where: {
        followUpAt: { gt: today, lte: end },
        client: { workspaceId },          // ← workspace guard
      },
      include: {
        client:  true,
        listing: true,
      },
      orderBy: { followUpAt: 'asc' },
    });

    return this.mapFollowUps(rows);
  }

  private mapFollowUps(rows: any[]) {
    return rows.map((r) => ({
      clientId:    r.clientId,
      clientName:  r.client.name,
      followUpAt:  r.followUpAt,
      property:    r.listing,           // frontend key kept as 'property' for compat
    }));
  }

  /* ================================================================
   * WHATSAPP
   * ================================================================ */

  async getWhatsappOptions(workspaceId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, workspaceId },
    });
    if (!client) throw new Error('Client not found');

    const cps = await this.prisma.clientProperty.findMany({
      where: {
        clientId,
        status: { notIn: [LeadStage.CLOSED, LeadStage.LOST] },
      },
      include: { listing: true },
      orderBy: { sharedAt: 'desc' },
    });

    return cps.map((cp) => ({
      clientPropertyId: cp.id,
      label: [cp.listing.bhk, cp.listing.propertySubType, cp.listing.area, cp.listing.city]
        .filter(Boolean)
        .join(' '),
      price:      cp.listing.price,
      followUpAt: cp.followUpAt,
      status:     cp.status,
    }));
  }

  async getWhatsappDraft(workspaceId: string, clientPropertyId: string) {
    const cp = await this.prisma.clientProperty.findFirst({
      where: {
        id: clientPropertyId,
        client: { workspaceId },
      },
      include: { client: true, listing: true },
    });

    if (!cp) throw new Error('ClientProperty not found');

    return { message: this.generateWhatsappDraft(cp.client, cp) };
  }

  async markWhatsappSent(workspaceId: string, clientPropertyId: string) {
    const now = new Date();

    const cp = await this.prisma.clientProperty.findFirst({
      where: { id: clientPropertyId, client: { workspaceId } },
    });
    if (!cp) throw new Error('ClientProperty not found');

    let followUpAt = cp.followUpAt;
    if (!followUpAt || followUpAt <= now) {
      followUpAt = new Date(now);
      followUpAt.setDate(followUpAt.getDate() + 2);
    }

    const updated = await this.prisma.clientProperty.update({
      where: { id: clientPropertyId },
      data: {
        status:         LeadStage.CONTACTED,
        lastContactedAt: now,
        followUpAt,
        lastActionAt:   now,
      },
    });

    await this.createEvent(updated.clientId, 'WHATSAPP_SENT', {
      listingId: updated.listingId,
    });

    return updated;
  }

  generateWhatsappDraft(client: any, cp: any) {
    const name    = client.name || 'there';
    const listing = cp.listing;
    const label   = `${listing.bhk ?? ''} ${listing.propertySubType ?? 'property'} in ${
      listing.area ?? listing.city ?? 'your area'
    }`;
    return `Hi ${name}, following up regarding the ${label}. Let me know how you'd like to proceed.`;
  }

  /* ================================================================
   * EVENTS (internal)
   * ================================================================ */

  private async createEvent(
    clientId: string,
    type:     string,
    metadata?: Record<string, any>,
  ) {
    return this.prisma.clientEvent.create({
      data: { clientId, type, metadata: metadata ?? {} },
    });
  }

  async createShareToken(
    clientId: string,
    workspaceId: string,
  ): Promise<{ url: string; expiresAt: Date }> {
    // Verify the client exists and belongs to this workspace
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, workspaceId },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Client not found');
  
    // Replace any existing token for this client+workspace (refresh)
    await this.prisma.clientShareToken.deleteMany({
      where: { clientId, workspaceId },
    });
  
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry
  
    const shareToken = await this.prisma.clientShareToken.create({
      data: { clientId, workspaceId, expiresAt },
    });
  
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';
  
    return {
      url: `${frontendUrl}/share/${shareToken.token}`,
      expiresAt,
    };
  }

}