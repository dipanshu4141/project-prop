import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class PropertyShareService {
  constructor(private prisma: PrismaService) {}

  async createShare(data: {
    listingId:      string;   // was propertyId — renamed to match new schema
    workspaceId:    string;   // required for workspace isolation
    platform:       string;
    targetType:     string;
    targetName?:    string;
    targetContact?: string;
    clientId?:      string;   // replaces leadId — links to actual Client record
  }) {
    return this.prisma.propertyShare.create({
      data: {
        listingId:     data.listingId,
        workspaceId:   data.workspaceId,
        platform:      data.platform,
        targetType:    data.targetType,
        targetName:    data.targetName,
        targetContact: data.targetContact,
        clientId:      data.clientId,
      },
    });
  }
}