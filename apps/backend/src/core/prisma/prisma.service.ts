import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { prisma } from "./prisma.client";

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    // console.log("DATABASE_URL =", process.env.DATABASE_URL);
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const adapter = new PrismaPg(pool);

    super({ adapter });
  }
  
}