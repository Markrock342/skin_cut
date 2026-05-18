export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  coins: number;
  createdAt: string;
  isAdmin: boolean;
};

export type ActivityHistoryItem = {
  id: string;
  title: string;
  kind: 'studio' | 'topup';
  status: 'done' | 'pending' | 'failed';
  createdAt: string;
};
