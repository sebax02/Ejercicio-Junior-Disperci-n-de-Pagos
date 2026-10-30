import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { throwSupabaseError } from '../common/supabase-error.js';
import {
  resolveBatchStatus,
  simulateItemOutcome,
  sumAmounts,
} from '../common/money.js';
import type {
  DisbursementBatch,
  DisbursementItem,
} from '../common/types.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateBatchDto } from './dto/create-batch.dto.js';

@Injectable()
export class BatchesService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(dto: CreateBatchDto): Promise<DisbursementBatch> {
    const { data, error } = await this.supabase.client
      .from('disbursement_batches')
      .insert({
        name: dto.name,
        status: 'DRAFT',
        total_amount: '0.00',
      })
      .select()
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    return data as DisbursementBatch;
  }

  async findAll(): Promise<DisbursementBatch[]> {
    const { data, error } = await this.supabase.client
      .from('disbursement_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throwSupabaseError(error);
    }

    return (data ?? []) as DisbursementBatch[];
  }

  async findOne(id: string): Promise<
    DisbursementBatch & { items: DisbursementItem[] }
  > {
    const batch = await this.getBatch(id);

    const { data, error } = await this.supabase.client
      .from('disbursement_items')
      .select('*, beneficiary:beneficiaries(*)')
      .eq('batch_id', id)
      .order('id', { ascending: true });

    if (error) {
      throwSupabaseError(error);
    }

    return {
      ...batch,
      items: (data ?? []) as DisbursementItem[],
    };
  }

  async getBatch(id: string): Promise<DisbursementBatch> {
    const { data, error } = await this.supabase.client
      .from('disbursement_batches')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }
    if (!data) {
      throw new NotFoundException('Lote no encontrado');
    }

    return data as DisbursementBatch;
  }

  async assertDraft(id: string): Promise<DisbursementBatch> {
    const batch = await this.getBatch(id);
    if (batch.status !== 'DRAFT') {
      throw new BadRequestException('No se puede editar un lote ya procesado');
    }
    return batch;
  }

  async refreshTotal(batchId: string): Promise<string> {
    const { data, error } = await this.supabase.client
      .from('disbursement_items')
      .select('amount')
      .eq('batch_id', batchId);

    if (error) {
      throwSupabaseError(error);
    }

    const total = sumAmounts(
      ((data ?? []) as Array<{ amount: string | number }>).map((item) =>
        String(item.amount),
      ),
    );

    const { error: updateError } = await this.supabase.client
      .from('disbursement_batches')
      .update({ total_amount: total })
      .eq('id', batchId);

    if (updateError) {
      throwSupabaseError(updateError);
    }

    return total;
  }

  async process(id: string): Promise<
    DisbursementBatch & { items: DisbursementItem[] }
  > {
    const batch = await this.getBatch(id);
    if (batch.status !== 'DRAFT') {
      throw new BadRequestException('El lote ya fue procesado');
    }

    const { data: items, error } = await this.supabase.client
      .from('disbursement_items')
      .select('*')
      .eq('batch_id', id);

    if (error) {
      throwSupabaseError(error);
    }

    const currentItems = (items ?? []) as DisbursementItem[];
    if (currentItems.length === 0) {
      throw new BadRequestException('No se puede procesar un lote sin ítems');
    }

    const processedAt = new Date().toISOString();
    const outcomes = currentItems.map((item) => ({
      id: item.id,
      ...simulateItemOutcome(String(item.amount)),
      processed_at: processedAt,
    }));

    for (const outcome of outcomes) {
      const { error: itemError } = await this.supabase.client
        .from('disbursement_items')
        .update({
          status: outcome.status,
          failure_reason: outcome.failure_reason,
          processed_at: outcome.processed_at,
        })
        .eq('id', outcome.id);

      if (itemError) {
        throwSupabaseError(itemError);
      }
    }

    const status = resolveBatchStatus(outcomes.map((item) => item.status));
    const { error: batchError } = await this.supabase.client
      .from('disbursement_batches')
      .update({
        status,
        processed_at: processedAt,
      })
      .eq('id', id);

    if (batchError) {
      throwSupabaseError(batchError);
    }

    return this.findOne(id);
  }
}
