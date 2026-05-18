import type { LegalDocument } from './legal';
import {
  CONTACT_EMAIL,
  IP_EMAIL,
  LEGAL_DRAFT_NOTICE_EN,
  LEGAL_ENTITY,
  SERVICE_NAME,
  UPDATED_EN,
} from './legal-meta';

const entityBlock = [
  `${LEGAL_ENTITY.nameEn} — ${LEGAL_ENTITY.operatorEn}`,
  LEGAL_ENTITY.addressEn,
  `Tax ID / registration: ${LEGAL_ENTITY.taxId}`,
  `Privacy & general: ${CONTACT_EMAIL}`,
  `IP / copyright notices: ${IP_EMAIL}`,
];

export const TERMS_DOCUMENT_EN: LegalDocument = {
  slug: 'terms',
  locale: 'en',
  title: 'Terms of Service',
  subtitle: `Conditions for using ${SERVICE_NAME}`,
  updatedAt: UPDATED_EN,
  draftNotice: LEGAL_DRAFT_NOTICE_EN,
  sections: [
    {
      id: 'acceptance',
      title: '1. Acceptance',
      paragraphs: [
        `By accessing or using ${SERVICE_NAME} ("the Service"), you agree to these Terms, our Privacy Policy, and Service Agreement.`,
        'If you do not agree, stop using the Service.',
      ],
    },
    {
      id: 'service',
      title: '2. Nature of the Service',
      paragraphs: [
        `${SERVICE_NAME} is a fan-made web app to sort, rank, and export skin grid images for entertainment and community sharing.`,
        'It is not made, endorsed, or affiliated with any game publisher. Game names, characters, skins, and logos belong to their rights holders.',
      ],
    },
    {
      id: 'coins',
      title: '3. Virtual coins & payments',
      paragraphs: [
        'Virtual "coins" unlock features. They are not cash, not transferable off-platform, and generally non-refundable except where required by law or for billing errors.',
        'Prices and payment methods are shown at checkout. Third-party payment providers have their own terms.',
      ],
    },
    {
      id: 'dmca',
      title: '4. Copyright & takedown (IP)',
      paragraphs: [
        'If you believe content on the Service infringes your copyright or trademark, send a notice to ' +
          IP_EMAIL +
          ' including: (1) your contact details, (2) identification of the work, (3) the infringing URL or description, (4) a good-faith statement, (5) a statement under penalty of perjury that your notice is accurate, and (6) your physical or electronic signature.',
        'We may remove or disable access to disputed material and notify the uploader where appropriate. Repeat infringers may have accounts terminated.',
        'Counter-notices may be sent to the same address if you believe content was removed by mistake.',
      ],
    },
    {
      id: 'disclaimer',
      title: '5. Disclaimer & liability',
      paragraphs: [
        'The Service is provided "as is" without warranties. To the extent permitted by law, we are not liable for indirect or consequential damages.',
        'Our total liability is limited to fees you paid in the 3 months before the claim (or THB 500 if none).',
      ],
    },
    {
      id: 'law',
      title: '6. Governing law',
      paragraphs: [
        'These Terms are governed by the laws of Thailand, subject to mandatory consumer protections in your country.',
        'Contact: ' + CONTACT_EMAIL,
      ],
    },
  ],
};

export const PRIVACY_DOCUMENT_EN: LegalDocument = {
  slug: 'privacy',
  locale: 'en',
  title: 'Privacy Policy',
  subtitle: `How ${SERVICE_NAME} handles your personal data`,
  updatedAt: UPDATED_EN,
  draftNotice: LEGAL_DRAFT_NOTICE_EN,
  sections: [
    {
      id: 'controller',
      title: '1. Data controller',
      paragraphs: [
        'The data controller for personal data under Thailand’s PDPA is:',
        ...entityBlock,
      ],
    },
    {
      id: 'collect',
      title: '2. Data we collect',
      paragraphs: ['Depending on features used, we may process:'],
      list: [
        'Account: email, display name, user ID',
        'Usage: pages visited, game/studio settings, top-up history',
        'Payments: transaction status and package (card data handled by payment providers)',
        'Technical: IP, browser, device, timestamps',
        'Cookies/local storage: session tokens, preferences, consent choices',
      ],
    },
    {
      id: 'cookies',
      title: '3. Cookies & analytics',
      paragraphs: [
        'Essential cookies are required for login and security.',
        'Analytics (e.g. Plausible, Google Analytics) load only if you opt in via the cookie banner and VITE_ENABLE_ANALYTICS is enabled.',
        'You can change consent anytime by clearing site data or using browser settings.',
      ],
    },
    {
      id: 'rights',
      title: '4. Your rights',
      paragraphs: [
        'You may request access, correction, deletion, restriction, objection, or withdrawal of consent where applicable. Contact ' +
          CONTACT_EMAIL +
          '. You may complain to Thailand’s PDPC (สคส.).',
      ],
    },
  ],
};

export const CONTRACT_DOCUMENT_EN: LegalDocument = {
  slug: 'contract',
  locale: 'en',
  title: 'Service Agreement',
  subtitle: `Digital service agreement between you and ${SERVICE_NAME}`,
  updatedAt: UPDATED_EN,
  draftNotice: LEGAL_DRAFT_NOTICE_EN,
  sections: [
    {
      id: 'parties',
      title: '1. Parties',
      paragraphs: [
        'This Agreement is between the Service operator and the user who registers or uses the Service.',
        'Clicking accept, registering, or using the Service constitutes acceptance.',
      ],
    },
    {
      id: 'fees',
      title: '2. Fees & refunds',
      paragraphs: [
        'Premium features and coins are priced as displayed. Digital goods delivered are generally non-refundable.',
        'Billing errors or missing coins will be investigated; refunds or credits may be issued at our discretion.',
      ],
    },
    {
      id: 'entire',
      title: '3. Entire agreement',
      paragraphs: [
        'This Agreement together with the Terms and Privacy Policy is the entire agreement. Thai version prevails in case of conflict unless mandatory law requires otherwise.',
        'Contact: ' + CONTACT_EMAIL,
      ],
    },
  ],
};

export const LEGAL_PAGES_EN = [
  { path: '/en/terms', label: 'Terms', doc: TERMS_DOCUMENT_EN },
  { path: '/en/privacy', label: 'Privacy', doc: PRIVACY_DOCUMENT_EN },
  { path: '/en/contract', label: 'Agreement', doc: CONTRACT_DOCUMENT_EN },
] as const;
