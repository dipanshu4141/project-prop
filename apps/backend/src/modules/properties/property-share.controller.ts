import {
    Controller,
    Get,
    Param,
    Patch,
    Delete,
    Body,
    Query,
    Post,
  } from '@nestjs/common';
import { create } from 'domain';
import { PropertyShareService } from './property-share.service';

@Controller('property-share')
export class PropertyShareController {
  constructor(private readonly propertyShareService: PropertyShareService) {}

    @Post()
    create(@Body() body) {
    return this.propertyShareService.createShare(body);
    }
}
