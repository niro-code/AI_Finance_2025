export type BasiqEnvironment = 'sandbox' | 'production';

export interface BasiqConfig {
  apiKey: string;
  applicationId: string;
  environment: BasiqEnvironment;
}

export interface BasiqUser {
  id: string;
  email: string;
  mobile?: string;
  connections?: BasiqConnection[];
}

export interface BasiqConnection {
  id: string;
  status: string;
  institution: {
    id: string;
    name: string;
    logo?: string;
  };
}

export interface BasiqAccount {
  id: string;
  name: string;
  accountNo: string;
  balance: number;
  currency: string;
  type: string;
  status: string;
}

export interface BasiqTransaction {
  id: string;
  amount: number;
  direction: 'credit' | 'debit';
  status: string;
  description: string;
  postDate: string;
  balance: number;
  account: string;
}
