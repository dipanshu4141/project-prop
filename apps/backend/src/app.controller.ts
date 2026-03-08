// import { Controller, Get } from '@nestjs/common';
// import { AppService } from './app.service';

// @Controller()
// export class AppController {
//   constructor(private readonly appService: AppService) {}

//   @Get()
//   getHello(): string {
//     return this.appService.getHello();
//   }
// }

import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get()
  getHello() {
    return { ok: true, service: 'backend-running' };
  }

  // @Get('/health/db')
  // async healthDb() {
  //   const count = await this.prisma.message.count();
  //   return { ok: true, messageCount: count };
  // }
}

