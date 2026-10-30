import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SupabaseService } from '../supabase/supabase.service.js';
import { BatchesService } from './batches.service.js';

type QueryResult = { data: unknown; error: unknown };

function createQuery(
  result: QueryResult,
  onUpdate?: (payload: Record<string, unknown>) => void,
) {
  const query: Record<string, unknown> = {};
  const self = () => query;
  query.select = self;
  query.insert = self;
  query.update = (payload: Record<string, unknown>) => {
    onUpdate?.(payload);
    return query;
  };
  query.delete = self;
  query.eq = self;
  query.order = self;
  query.single = () => Promise.resolve(result);
  query.maybeSingle = () => Promise.resolve(result);
  query.then = (
    resolve: (value: QueryResult) => unknown,
    reject: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject);
  return query;
}

describe('BatchesService', () => {
  let service: BatchesService;
  let from: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    from = vi.fn();
    const module = await Test.createTestingModule({
      providers: [
        BatchesService,
        {
          provide: SupabaseService,
          useValue: { client: { from } },
        },
      ],
    }).compile();

    service = module.get(BatchesService);
  });

  it('recalcula el total del lote en el servidor', async () => {
    from.mockImplementation((table: string) => {
      if (table === 'disbursement_items') {
        return createQuery({
          data: [{ amount: '100.00' }, { amount: '50.50' }],
          error: null,
        });
      }
      return createQuery({ data: null, error: null });
    });

    await expect(service.refreshTotal('batch-1')).resolves.toBe('150.50');
  });

  it('rechaza un monto inválido al recalcular el total', async () => {
    from.mockImplementation((table: string) => {
      if (table === 'disbursement_items') {
        return createQuery({
          data: [{ amount: '0' }],
          error: null,
        });
      }
      return createQuery({ data: null, error: null });
    });

    await expect(service.refreshTotal('batch-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('deja el lote en PARTIAL cuando hay un pago de 100 y otro de 6000', async () => {
    const batch = {
      id: 'batch-1',
      name: 'Nómina',
      status: 'DRAFT',
      total_amount: '6100.00',
      created_at: '2026-01-01',
      processed_at: null,
    };
    const items = [
      {
        id: 'item-1',
        batch_id: 'batch-1',
        beneficiary_id: 'b-1',
        amount: '100.00',
        status: 'PENDING',
        failure_reason: null,
        processed_at: null,
      },
      {
        id: 'item-2',
        batch_id: 'batch-1',
        beneficiary_id: 'b-2',
        amount: '6000.00',
        status: 'PENDING',
        failure_reason: null,
        processed_at: null,
      },
    ];
    const itemUpdates: Array<Record<string, unknown>> = [];
    let batchUpdate: Record<string, unknown> | undefined;

    from.mockImplementation((table: string) => {
      if (table === 'disbursement_batches') {
        return createQuery({ data: batch, error: null }, (payload) => {
          batchUpdate = payload;
        });
      }
      return createQuery({ data: items, error: null }, (payload) => {
        itemUpdates.push(payload);
      });
    });

    await service.process('batch-1');

    expect(itemUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'PAID', failure_reason: null }),
        expect.objectContaining({
          status: 'FAILED',
          failure_reason: 'Monto excede el límite permitido',
        }),
      ]),
    );
    expect(batchUpdate).toEqual(
      expect.objectContaining({ status: 'PARTIAL' }),
    );
  });

  it('no permite procesar un lote dos veces', async () => {
    from.mockReturnValue(
      createQuery({
        data: {
          id: 'batch-1',
          name: 'Nómina',
          status: 'COMPLETED',
          total_amount: '100.00',
          created_at: '2026-01-01',
          processed_at: '2026-01-02',
        },
        error: null,
      }),
    );

    await expect(service.process('batch-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('no permite procesar un lote sin ítems', async () => {
    from.mockImplementation((table: string) => {
      if (table === 'disbursement_batches') {
        return createQuery({
          data: {
            id: 'batch-1',
            name: 'Nómina vacía',
            status: 'DRAFT',
            total_amount: '0.00',
            created_at: '2026-01-01',
            processed_at: null,
          },
          error: null,
        });
      }
      return createQuery({ data: [], error: null });
    });

    await expect(service.process('batch-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('deja el lote en COMPLETED cuando todos los pagos son aprobados', async () => {
    const batch = {
      id: 'batch-1',
      name: 'Nómina Aprobada',
      status: 'DRAFT',
      total_amount: '200.00',
      created_at: '2026-01-01',
      processed_at: null,
    };
    const items = [
      {
        id: 'item-1',
        batch_id: 'batch-1',
        beneficiary_id: 'b-1',
        amount: '100.00',
        status: 'PENDING',
        failure_reason: null,
        processed_at: null,
      },
      {
        id: 'item-2',
        batch_id: 'batch-1',
        beneficiary_id: 'b-2',
        amount: '100.00',
        status: 'PENDING',
        failure_reason: null,
        processed_at: null,
      },
    ];
    let batchUpdate: Record<string, unknown> | undefined;

    from.mockImplementation((table: string) => {
      if (table === 'disbursement_batches') {
        return createQuery({ data: batch, error: null }, (payload) => {
          batchUpdate = payload;
        });
      }
      return createQuery({ data: items, error: null });
    });

    await service.process('batch-1');

    expect(batchUpdate).toEqual(
      expect.objectContaining({ status: 'COMPLETED' }),
    );
  });

  it('deja el lote en FAILED cuando todos los pagos exceden el límite', async () => {
    const batch = {
      id: 'batch-1',
      name: 'Nómina Fallida',
      status: 'DRAFT',
      total_amount: '12000.00',
      created_at: '2026-01-01',
      processed_at: null,
    };
    const items = [
      {
        id: 'item-1',
        batch_id: 'batch-1',
        beneficiary_id: 'b-1',
        amount: '6000.00',
        status: 'PENDING',
        failure_reason: null,
        processed_at: null,
      },
      {
        id: 'item-2',
        batch_id: 'batch-1',
        beneficiary_id: 'b-2',
        amount: '6000.00',
        status: 'PENDING',
        failure_reason: null,
        processed_at: null,
      },
    ];
    let batchUpdate: Record<string, unknown> | undefined;

    from.mockImplementation((table: string) => {
      if (table === 'disbursement_batches') {
        return createQuery({ data: batch, error: null }, (payload) => {
          batchUpdate = payload;
        });
      }
      return createQuery({ data: items, error: null });
    });

    await service.process('batch-1');

    expect(batchUpdate).toEqual(
      expect.objectContaining({ status: 'FAILED' }),
    );
  });

  it('no permite editar o asertar DRAFT si el lote ya fue procesado', async () => {
    from.mockReturnValue(
      createQuery({
        data: {
          id: 'batch-1',
          name: 'Nómina',
          status: 'COMPLETED',
          total_amount: '100.00',
          created_at: '2026-01-01',
          processed_at: '2026-01-02',
        },
        error: null,
      }),
    );

    await expect(service.assertDraft('batch-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
