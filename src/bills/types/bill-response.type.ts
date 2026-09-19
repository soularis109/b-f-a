import type { BillStatus } from '../../generated/prisma/client.js';

export interface BillResponse {
  id: string;
  amount: number;
  payee: string;
  status: BillStatus;
  createdAt: Date;
  updatedAt: Date;
}
