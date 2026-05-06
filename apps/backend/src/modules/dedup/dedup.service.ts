// apps/backend/src/modules/dedup/dedup.service.ts
//
// Shared deduplication logic used by:
//   - PropertiesService (WhatsApp ingestion)
//   - ListingsService (manual creation)
//   - AdminDedupService (backfill)

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class DedupService {
  private readonly logger = new Logger(DedupService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Build fingerprint from listing fields ─────────────────────────────────
  // Deterministic — same real property always produces same fingerprint.
  // Sorted agent phones so order doesn't matter.

  buildFingerprint(opts: {
    city?:            string | null;
    area?:            string | null;
    building?:        string | null;
    bhk?:             string | null;
    propertySubType?: string | null;
    areaSqft?:        number | null;
    listingType?:     string | null;
    agentPhones?:     string[];
  }): string | null {
    const sortedPhones = [...(opts.agentPhones ?? [])].sort().join('+');

    const parts = [
      (opts.city            ?? '').toLowerCase().trim(),
      (opts.area            ?? '').toLowerCase().trim(),
      (opts.building        ?? '').toLowerCase().trim(),
      (opts.bhk             ?? '').toLowerCase().trim(),
      (opts.propertySubType ?? '').toLowerCase().trim(),
      String(opts.areaSqft  ?? ''),
      (opts.listingType     ?? '').toLowerCase(),
      sortedPhones,
    ].join('|').replace(/\s+/g, '-');

    // If all parts are empty/pipes, fingerprint is meaningless
    if (!parts.replace(/[\|\-\+]/g, '').trim()) return null;

    return parts;
  }

  // ── Resolve or create canonical for a given fingerprint ──────────────────

  async resolveOrCreate(opts: {
    fingerprint:  string | null;
    globalRefCode?: string;   // only needed when creating new
  }): Promise<string> {
    if (!opts.fingerprint) {
      // No fingerprint — create a standalone canonical
      const cp = await this.prisma.canonicalProperty.create({
        data: { globalRefCode: await this.nextGlobalRefCode() },
      });
      return cp.id;
    }

    const existing = await this.prisma.canonicalProperty.findUnique({
      where: { fingerprint: opts.fingerprint },
    });

    if (existing) {
      return existing.id;
      // listingCount is now computed from _count.listings — no manual increment needed
    }

    const created = await this.prisma.canonicalProperty.create({
      data: {
        fingerprint:   opts.fingerprint,
        globalRefCode: opts.globalRefCode ?? await this.nextGlobalRefCode(),
        listingCount:  1,
      },
    });
    return created.id;
  }

  // ── Backfill: re-run dedup on all WorkspaceListings ──────────────────────
  // For each listing:
  //   1. Compute its fingerprint from current field values + agent phones
  //   2. Find or create the right CanonicalProperty
  //   3. If the listing is pointing to the wrong canonical, re-link it
  //   4. Update listingCount on all affected canonicals

  async runBackfill(): Promise<{
    total:     number;
    merged:    number;
    unchanged: number;
    errors:    number;
    details:   { listingId: string; action: string; canonicalId: string }[];
  }> {
    this.logger.log('🔄 Dedup backfill started');

    const listings = await this.prisma.workspaceListing.findMany({
      select: {
        id:               true,
        city:             true,
        area:             true,
        building:         true,
        bhk:              true,
        propertySubType:  true,
        areaSqft:         true,
        listingType:      true,
        canonicalPropertyId: true,
        workspaceId:      true,
        listingAgents: {
          include: {
            agent: { include: { phones: true } },
          },
        },
      },
    });

    let merged    = 0;
    let unchanged = 0;
    let errors    = 0;
    const details: { listingId: string; action: string; canonicalId: string }[] = [];

    for (const listing of listings) {
      try {
        const agentPhones = listing.listingAgents
          .flatMap((la) => la.agent.phones.map((p) => p.phone))
          .filter(Boolean);

        const fingerprint = this.buildFingerprint({
          city:            listing.city,
          area:            listing.area,
          building:        listing.building,
          bhk:             listing.bhk,
          propertySubType: listing.propertySubType as string | null,
          areaSqft:        listing.areaSqft,
          listingType:     listing.listingType as string | null,
          agentPhones,
        });

        if (!fingerprint) {
          // Can't deduplicate without a fingerprint — leave as-is
          unchanged++;
          details.push({ listingId: listing.id, action: 'skipped_no_fingerprint', canonicalId: listing.canonicalPropertyId });
          continue;
        }

        // Find or create canonical by fingerprint
        let targetCanonical = await this.prisma.canonicalProperty.findUnique({
          where: { fingerprint },
        });

        if (!targetCanonical) {
          // No canonical with this fingerprint — update the existing one
          targetCanonical = await this.prisma.canonicalProperty.update({
            where: { id: listing.canonicalPropertyId },
            data:  { fingerprint },
          });
          unchanged++;
          details.push({ listingId: listing.id, action: 'fingerprint_set', canonicalId: targetCanonical.id });
          continue;
        }

        if (targetCanonical.id === listing.canonicalPropertyId) {
          // Already pointing to the right canonical
          unchanged++;
          details.push({ listingId: listing.id, action: 'already_correct', canonicalId: targetCanonical.id });
          continue;
        }

        // Check if this workspace already has a listing for the target canonical
        const conflicting = await this.prisma.workspaceListing.findFirst({
        where: {
            workspaceId:         listing.workspaceId,
            canonicalPropertyId: targetCanonical.id,
            id:                  { not: listing.id },
        },
        select: { id: true, createdAt: true },
        });

        if (conflicting) {
        // Same workspace already has a listing for this canonical.
        // Keep the older one, mark this as duplicate — don't delete, just log.
        merged++;
        details.push({
            listingId: listing.id,
            action:    `same_workspace_duplicate_of_${conflicting.id}`,
            canonicalId: targetCanonical.id,
        });
        continue;
        }

        // Safe to relink — no conflict
        const oldCanonicalId = listing.canonicalPropertyId;

        await this.prisma.workspaceListing.update({
        where: { id: listing.id },
        data:  { canonicalPropertyId: targetCanonical.id },
        });

        merged++;
        details.push({ listingId: listing.id, action: 'relinked', canonicalId: targetCanonical.id });

        // Clean up the old canonical if it now has no listings
        const orphanCount = await this.prisma.workspaceListing.count({
          where: { canonicalPropertyId: oldCanonicalId },
        });

        if (orphanCount === 0) {
          // Safe to delete the orphaned canonical
          await this.prisma.canonicalProperty.delete({
            where: { id: oldCanonicalId },
          }).catch(() => {
            // If it has deals/duplicateLinks, can't delete — leave it
            this.logger.warn(`Could not delete orphaned canonical ${oldCanonicalId} — likely has related records`);
          });
        }

      } catch (err: any) {
        errors++;
        this.logger.error(`Error processing listing ${listing.id}: ${err?.message}`);
        details.push({ listingId: listing.id, action: `error: ${err?.message}`, canonicalId: listing.canonicalPropertyId });
      }
    }

    // Recompute listingCount for all canonicals
    await this.recomputeListingCounts();

    this.logger.log(`✅ Backfill complete — merged: ${merged}, unchanged: ${unchanged}, errors: ${errors}`);

    return { total: listings.length, merged, unchanged, errors, details };
  }

  // ── Recompute listingCount for every CanonicalProperty ───────────────────

  async recomputeListingCounts(): Promise<void> {
    const counts = await this.prisma.workspaceListing.groupBy({
      by:     ['canonicalPropertyId'],
      _count: { id: true },
    });

    await Promise.all(
      counts.map((row) =>
        this.prisma.canonicalProperty.update({
          where: { id: row.canonicalPropertyId },
          data:  { listingCount: row._count.id },
        })
      )
    );

    this.logger.log(`Recomputed listingCount for ${counts.length} canonical properties`);
  }

  // ── Global ref code generator ─────────────────────────────────────────────

  async nextGlobalRefCode(): Promise<string> {
    const count = await this.prisma.canonicalProperty.count();
    const year  = new Date().getFullYear();
    return `PROP-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}