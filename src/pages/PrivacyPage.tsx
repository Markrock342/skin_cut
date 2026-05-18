import { LegalDocument } from '../components/LegalDocument';
import { PRIVACY_DOCUMENT } from '../content/legal';

export function PrivacyPage() {
  return <LegalDocument document={PRIVACY_DOCUMENT} />;
}
