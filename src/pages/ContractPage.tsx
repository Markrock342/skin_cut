import { LegalDocument } from '../components/LegalDocument';
import { CONTRACT_DOCUMENT } from '../content/legal';

export function ContractPage() {
  return <LegalDocument document={CONTRACT_DOCUMENT} />;
}
