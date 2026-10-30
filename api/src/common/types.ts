export type BatchStatus = 'DRAFT' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
export type ItemStatus = 'PENDING' | 'PAID' | 'FAILED';

export type Beneficiary = {
  id: string;
  name: string;
  document_id: string;
  bank: string;
  account_number: string;
  email: string | null;
  created_at: string;
};

export type DisbursementBatch = {
  id: string;
  name: string;
  status: BatchStatus;
  total_amount: string | number;
  created_at: string;
  processed_at: string | null;
};

export type DisbursementItem = {
  id: string;
  batch_id: string;
  beneficiary_id: string;
  amount: string | number;
  status: ItemStatus;
  failure_reason: string | null;
  processed_at: string | null;
  beneficiary?: Beneficiary | null;
};
