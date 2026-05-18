import { LegalDocument } from '../components/LegalDocument';
import { TERMS_DOCUMENT_EN } from '../content/legal-en';

export function TermsEnPage() {
  return <LegalDocument document={TERMS_DOCUMENT_EN} />;
}
