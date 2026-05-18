import { LegalDocument } from '../components/LegalDocument';
import { TERMS_DOCUMENT } from '../content/legal';

export function TermsPage() {
  return <LegalDocument document={TERMS_DOCUMENT} />;
}
