import { supabase } from './supabase';

export type ContactCategory = 'general' | 'billing' | 'privacy' | 'ip' | 'bug';

export type ContactPayload = {
  name: string;
  email: string;
  category: ContactCategory;
  subject: string;
  message: string;
};

export async function submitContactMessage(payload: ContactPayload): Promise<void> {
  const { error } = await supabase.from('contact_messages').insert({
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    category: payload.category,
    subject: payload.subject.trim(),
    message: payload.message.trim(),
  });

  if (error) {
    if (error.message.includes('contact_messages') || error.code === 'PGRST205') {
      throw new Error(
        'ยังไม่มีตาราง contact_messages — รัน supabase/migrations/002_terms_and_contact.sql',
      );
    }
    throw new Error(error.message || 'ส่งข้อความไม่สำเร็จ');
  }
}
