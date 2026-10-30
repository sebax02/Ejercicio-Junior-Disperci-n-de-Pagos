import { Injectable, NotFoundException } from '@nestjs/common';
import { parseAmountToCents, centsToAmount } from '../common/money.js';
import { throwSupabaseError } from '../common/supabase-error.js';
import type { DisbursementItem } from '../common/types.js';
import { BatchesService } from '../batches/batches.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateItemDto } from './dto/create-item.dto.js';

@Injectable()
export class ItemsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly batchesService: BatchesService,
  ) {}

  async add(batchId: string, dto: CreateItemDto): Promise<DisbursementItem> {
    await this.batchesService.assertDraft(batchId);
    const amount = centsToAmount(parseAmountToCents(dto.amount));

    const { data, error } = await this.supabase.client
      .from('disbursement_items')
      .insert({
        batch_id: batchId,
        beneficiary_id: dto.beneficiary_id,
        amount,
        status: 'PENDING',
      })
      .select('*, beneficiary:beneficiaries(*)')
      .single();

    if (error) {
      throwSupabaseError(
        error,
        'El beneficiario ya está incluido en este lote',
      );
    }

    await this.batchesService.refreshTotal(batchId);
    return data as DisbursementItem;
  }

  async remove(batchId: string, itemId: string): Promise<void> {
    await this.batchesService.assertDraft(batchId);

    const { data, error } = await this.supabase.client
      .from('disbursement_items')
      .delete()
      .eq('id', itemId)
      .eq('batch_id', batchId)
      .select('id')
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }
    if (!data) {
      throw new NotFoundException('Ítem no encontrado en el lote');
    }

    await this.batchesService.refreshTotal(batchId);
  }
}
