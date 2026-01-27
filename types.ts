
export enum DebtType {
  BORROWED = 'BORROWED', // Nợ mình đi vay
  LENT = 'LENT'          // Nợ mình cho vay
}

export enum DebtStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Debt {
  id: string;
  title: string;
  person: string;
  amount: number;
  remainingAmount: number;
  type: DebtType;
  interestRate: number; // Annual %
  startDate: string;
  dueDate: string | null; // null means indefinite
  status: DebtStatus;
  payments: Payment[];
  description?: string;
}

export interface DashboardStats {
  totalBorrowed: number;
  totalLent: number;
  upcomingDueCount: number;
  totalPaidThisMonth: number;
}
