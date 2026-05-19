export type AdminStats = {
  user_count: number;
  total_coins: number;
  history_count: number;
  pending_topups: number;
  new_contacts: number;
  signups_7d: number;
};

export type AdminProfile = {
  id: string;
  email: string | null;
  displayName: string;
  coins: number;
  isAdmin: boolean;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  createdAt: string;
};

export type AdminHistoryRow = {
  id: string;
  userId: string;
  userDisplayName: string | null;
  title: string;
  kind: 'studio' | 'topup';
  status: 'done' | 'pending' | 'failed';
  createdAt: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  category: 'general' | 'billing' | 'privacy' | 'ip' | 'bug';
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SiteSettingKey =
  | 'maintenance_mode'
  | 'signup_bonus_coins'
  | 'announcement'
  | 'arena_poster_cost'
  | 'compose_poster_cost';

export type SiteSettings = Record<SiteSettingKey, unknown>;
