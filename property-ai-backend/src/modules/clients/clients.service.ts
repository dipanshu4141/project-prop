import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeadStage } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  /* =====================================================
   * 🧠 INTERNAL HELPERS
   * ===================================================== */

  private followUpRank(date: Date | null) {
    if (!date) return 4; // lowest priority

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    if (d < today) return 1; // overdue
    if (d.getTime() === today.getTime()) return 2; // today
    return 3; // upcoming
  }

  private buildRequirementLabel(properties: any[]) {
    if (properties.length === 0) return '—';

    const latest = properties[0]?.property;
    if (!latest) return '—';

    const base = [
      latest.bhk,
      latest.propertySubType,
      latest.city,
    ]
      .filter(Boolean)
      .join(' ');

    return properties.length === 1
      ? base
      : `${base} +${properties.length - 1} more`;
  }

  /* =====================================================
   * 👤 CLIENT CORE
   * ===================================================== */

  async getOrCreateClient(phone: string, name?: string) {
    const existing = await this.prisma.client.findUnique({
      where: { phone },
    });
  
    // ✅ If client already exists, DO NOT overwrite name
    if (existing) {
      return existing;
    }
  
    // ✅ Create only once
    return this.prisma.client.create({
      data: {
        phone,
        name,
      },
    });
  }  
  

  async getClient(clientId: string) {
    return this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        properties: {
          include: { property: true },
          orderBy: { sharedAt: 'desc' },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /* =====================================================
   * 📥 LEADS INBOX (CLIENT-CENTRIC, NO DUPLICATES)
   * ===================================================== */

  async getLeadsInbox() {
    const clients = await this.prisma.client.findMany({
      include: {
        properties: {
          orderBy: { sharedAt: 'desc' },
          include: {
            property: true,
          },
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

      return {
        clientId: client.id,
        name: client.name,
        phone: client.phone,
        propertiesCount: client.properties.length,
        requirementLabel: this.buildRequirementLabel(client.properties),
        nearestFollowUpAt,
      };
    });

    // 🔥 CRM-style priority sorting
    rows.sort(
      (a, b) =>
        this.followUpRank(a.nearestFollowUpAt) -
        this.followUpRank(b.nearestFollowUpAt),
    );

    return rows;
  }

  /* =====================================================
   * 🏠 CLIENT ↔ PROPERTY
   * ===================================================== */

  async shareProperty(clientId: string, propertyId: string) {
    const cp = await this.prisma.clientProperty.upsert({
      where: {
        clientId_propertyId: { clientId, propertyId },
      },
      update: { lastActionAt: new Date() },
      create: { clientId, propertyId },
    });

    await this.createEvent(clientId, 'PROPERTY_SHARED', { propertyId });
    return cp;
  }

  async updateClientPropertyStatus(
    clientPropertyId: string,
    status: LeadStage,
  ) {
    const updated = await this.prisma.clientProperty.update({
      where: { id: clientPropertyId },
      data: {
        status,
        lastActionAt: new Date(),
      },
    });

    await this.createEvent(updated.clientId, 'STATUS_CHANGED', {
      propertyId: updated.propertyId,
      status,
    });

    return updated;
  }

  async updateClientPropertyFollowUp(
    clientPropertyId: string,
    followUpAt: string,
  ) {
    const date = new Date(followUpAt);

    const updated = await this.prisma.clientProperty.update({
      where: { id: clientPropertyId },
      data: {
        followUpAt: date,
        lastActionAt: new Date(),
      },
    });

    await this.createEvent(updated.clientId, 'FOLLOW_UP_SET', {
      propertyId: updated.propertyId,
      followUpAt: date,
      auto: false,
    });

    return updated;
  }

  /* =====================================================
   * 📝 NOTES
   * ===================================================== */

  async addNote(clientId: string, note: string) {
    return this.createEvent(clientId, 'NOTE_ADDED', { note });
  }

  /* =====================================================
   * 📅 FOLLOW-UPS (DASHBOARD)
   * ===================================================== */

  async getFollowUpsToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = await this.prisma.clientProperty.findMany({
      where: {
        followUpAt: { lte: today },
      },
      include: {
        client: true,
        property: true,
      },
      orderBy: { followUpAt: 'asc' },
    });

    return this.mapFollowUps(rows);
  }

  async getUpcomingFollowUps() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(today);
    end.setDate(end.getDate() + 7);

    const rows = await this.prisma.clientProperty.findMany({
      where: {
        followUpAt: {
          gt: today,
          lte: end,
        },
      },
      include: {
        client: true,
        property: true,
      },
      orderBy: { followUpAt: 'asc' },
    });

    return this.mapFollowUps(rows);
  }

  private mapFollowUps(rows: any[]) {
    return rows.map((r) => ({
      clientId: r.clientId,
      clientName: r.client.name,
      clientPhone: r.client.phone,
      followUpAt: r.followUpAt,
      property: r.property,
    }));
  }

  /* =====================================================
   * 📲 WHATSAPP
   * ===================================================== */

  async getWhatsappOptions(clientId: string) {
    const cps = await this.prisma.clientProperty.findMany({
      where: {
        clientId,
        status: { notIn: [LeadStage.CLOSED, LeadStage.LOST] },
      },
      include: {
        property: true,
      },
      orderBy: { sharedAt: 'desc' },
    });

    return cps.map((cp) => ({
      clientPropertyId: cp.id,
      label: [
        cp.property.bhk,
        cp.property.propertySubType,
        cp.property.area,
        cp.property.city,
      ]
        .filter(Boolean)
        .join(' '),
      price: cp.property.price,
      followUpAt: cp.followUpAt,
      status: cp.status,
    }));
  }

  async getWhatsappDraft(clientPropertyId: string) {
    const cp = await this.prisma.clientProperty.findUnique({
      where: { id: clientPropertyId },
      include: {
        client: true,
        property: true,
      },
    });

    if (!cp) throw new Error('ClientProperty not found');

    return {
      message: this.generateWhatsappDraft(cp.client, cp),
    };
  }

  async markWhatsappSent(clientPropertyId: string) {
    const now = new Date();

    const cp = await this.prisma.clientProperty.findUnique({
      where: { id: clientPropertyId },
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
        status: LeadStage.CONTACTED,
        lastContactedAt: now,
        followUpAt,
        lastActionAt: now,
      },
    });

    await this.createEvent(updated.clientId, 'WHATSAPP_SENT', {
      propertyId: updated.propertyId,
    });

    return updated;
  }

  generateWhatsappDraft(client: any, cp: any) {
    const name = client.name || 'there';
    const p = cp.property;

    const label = `${p.bhk ?? ''} ${p.propertySubType ?? 'property'} in ${
      p.area ?? p.city ?? 'your area'
    }`;

    return `Hi ${name}, following up regarding the ${label}. Let me know how you'd like to proceed.`;
  }

  /* =====================================================
   * 🔁 EVENTS
   * ===================================================== */

  private async createEvent(
    clientId: string,
    type: string,
    metadata?: Record<string, any>,
  ) {
    return this.prisma.clientEvent.create({
      data: {
        clientId,
        type,
        metadata: metadata ?? {},
      },
    });
  }
}
