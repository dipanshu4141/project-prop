import { Injectable } from '@nestjs/common';

@Injectable()
export class BillingService {
    constructor() {}

    findAll() {
        return `This action returns all billing`;
    }

    findOne(id: number) {
        return `This action returns a #${id} billing`;
    }

    create(createBillingDto: any) {
        return `This action adds a new billing`;
    }

    update(id: number, updateBillingDto: any) {
        return `This action updates a #${id} billing`;
    }

    remove(id: number) {
        return `This action removes a #${id} billing`;
    }
}