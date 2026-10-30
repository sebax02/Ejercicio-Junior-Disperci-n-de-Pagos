import { Body, Controller, Get, Post } from '@nestjs/common';
import { BeneficiariesService } from './beneficiaries.service.js';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto.js';

@Controller('beneficiaries')
export class BeneficiariesController {
  constructor(private readonly beneficiariesService: BeneficiariesService) {}

  @Post()
  create(@Body() dto: CreateBeneficiaryDto) {
    return this.beneficiariesService.create(dto);
  }

  @Get()
  findAll() {
    return this.beneficiariesService.findAll();
  }
}
