import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  getAll() {
    return this.prisma.teamMember.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: { name: string; phone: string }) {
    return this.prisma.teamMember.create({ data });
  }

  delete(id: string) {
    return this.prisma.teamMember.delete({ where: { id } });
  }
}
