
export type OperatorId = 'vodacom' | 'movitel' | 'tmcel';
export type PaymentMethodId = 'mpesa' | 'emola' | 'usdt';
export type Language = 'pt' | 'en';
export type Theme = 'light' | 'dark';

export interface Operator {
  id: OperatorId;
  name: string;
  color: string;
  logoText: string;
  logoUrl: string;
}

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  discountPercent: number;
  icon: string;
}

export interface Transaction {
  id: string;
  date: string;
  operator: OperatorId;
  phoneNumber: string;
  amount: number;
  finalAmount: number;
  paymentMethod: PaymentMethodId;
  paymentFrom?: string; // Number or ID used to pay
  hasProof: boolean;
  status: 'pending' | 'completed' | 'rejected';
  adminNotes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}