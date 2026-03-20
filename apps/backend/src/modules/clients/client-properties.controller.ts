import { Controller, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { ClientsService } from './clients.service';
import { ClientPropertyStatus } from '@prisma/client';
 
@Controller('client-properties')
export class ClientPropertiesController {
  constructor(private readonly clientsService: ClientsService) {}
 
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { clientStatus: ClientPropertyStatus },
    @Request() req: any,
  ) {
    return this.clientsService.updateClientPropertyStatus(
      id,
      body.clientStatus,
      req.user.workspaceId,
    );
  }
}