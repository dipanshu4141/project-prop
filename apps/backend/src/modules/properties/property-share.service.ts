import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiParseResult } from '../ai-parser/ai-parser.service';

@Injectable()
export class PropertyShareService {
  constructor(private prisma: PrismaService) {}

async createShare(data: {
    propertyId: string;
    platform: string;
    targetType: string;
    targetName?: string;
    targetContact?: string;
    leadId?: string;
  }) {
    return this.prisma.propertyShare.create({ data });
  }
}