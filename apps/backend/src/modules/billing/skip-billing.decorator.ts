// apps/backend/src/modules/billing/skip-billing.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const SkipBilling = () => SetMetadata('skipBilling', true);