import { BadRequestException } from '@nestjs/common';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
export const PAYMENT_LIMIT_CENTS = 5000n * 100n;

export function parseAmountToCents(value: string): bigint {
  const normalized = value.trim();
  if (!AMOUNT_PATTERN.test(normalized)) {
    throw new BadRequestException(
      'El monto debe ser un número positivo con máximo 2 decimales',
    );
  }

  const [intPart, frac = ''] = normalized.split('.');
  const cents = BigInt(intPart) * 100n + BigInt(frac.padEnd(2, '0'));
  if (cents <= 0n) {
    throw new BadRequestException('El monto debe ser mayor a 0');
  }

  return cents;
}

export function centsToAmount(cents: bigint): string {
  const intPart = cents / 100n;
  const frac = (cents % 100n).toString().padStart(2, '0');
  return `${intPart.toString()}.${frac}`;
}

export function sumAmounts(amounts: string[]): string {
  const total = amounts.reduce(
    (acc, amount) => acc + parseAmountToCents(String(amount)),
    0n,
  );
  return centsToAmount(total);
}

export function simulateItemOutcome(amount: string): {
  status: 'PAID' | 'FAILED';
  failure_reason: string | null;
} {
  if (parseAmountToCents(String(amount)) > PAYMENT_LIMIT_CENTS) {
    return {
      status: 'FAILED',
      failure_reason: 'Monto excede el límite permitido',
    };
  }

  return { status: 'PAID', failure_reason: null };
}

export function resolveBatchStatus(
  statuses: Array<'PAID' | 'FAILED'>,
): 'COMPLETED' | 'PARTIAL' | 'FAILED' {
  const paid = statuses.filter((status) => status === 'PAID').length;
  const failed = statuses.length - paid;

  if (failed === 0) {
    return 'COMPLETED';
  }
  if (paid === 0) {
    return 'FAILED';
  }
  return 'PARTIAL';
}
