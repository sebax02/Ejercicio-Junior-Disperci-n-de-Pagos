import { Injectable } from '@nestjs/common';
import { throwSupabaseError } from '../common/supabase-error.js';
import type { Beneficiary } from '../common/types.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto.js';

@Injectable()
export class BeneficiariesService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(dto: CreateBeneficiaryDto): Promise<Beneficiary> {
    const { data, error } = await this.supabase.client
      .from('beneficiaries')
      .insert({
        name: dto.name,
        document_id: dto.document_id,
        bank: dto.bank,
        account_number: dto.account_number,
        email: dto.email ?? null,
      })
      .select()
      .single();

    if (error) {
      throwSupabaseError(error, 'Ya existe un beneficiario con ese document_id');
    }

    return data as Beneficiary;
  }

  async findAll(): Promise<Beneficiary[]> {
    const { data, error } = await this.supabase.client
      .from('beneficiaries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throwSupabaseError(error);
    }

    return (data ?? []) as Beneficiary[];
  }
}
