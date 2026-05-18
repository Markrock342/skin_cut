import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, FileText } from 'lucide-react';
import type { LegalDocument as LegalDoc, LegalLocale } from '../content/legal';
import { LEGAL_PAGES } from '../content/legal';
import { LEGAL_PAGES_EN } from '../content/legal-en';
import { fadeUp, springSnappy } from '../lib/motion';

type Props = {
  document: LegalDoc;
};

function otherLocalePath(locale: LegalLocale | undefined, slug: string) {
  return locale === 'en' ? `/${slug}` : `/en/${slug}`;
}

export function LegalDocument({ document: doc }: Props) {
  const locale = doc.locale ?? 'th';
  const related = locale === 'en' ? LEGAL_PAGES_EN : LEGAL_PAGES;
  const others = related.filter((p) => p.doc.slug !== doc.slug);
  const otherPath = otherLocalePath(locale, doc.slug);

  return (
    <article className="legal-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        {locale === 'en' ? 'Home' : 'กลับหน้าแรก'}
      </Link>

      {doc.draftNotice && (
        <motion.div
          className="legal-draft-banner"
          role="note"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertTriangle size={18} aria-hidden />
          <p>{doc.draftNotice}</p>
        </motion.div>
      )}

      <motion.header
        className="legal-header page-title-block"
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={springSnappy}
      >
        <div className="legal-header-row">
          <span className="legal-badge">
            <FileText size={14} />
            {locale === 'en' ? 'Updated' : 'อัปเดต'} {doc.updatedAt}
          </span>
          <Link to={otherPath} className="legal-lang-toggle">
            {locale === 'en' ? 'ภาษาไทย' : 'English'}
          </Link>
        </div>
        <h1>{doc.title}</h1>
        <p className="legal-subtitle">{doc.subtitle}</p>
      </motion.header>

      <motion.nav
        className="legal-toc"
        aria-label={locale === 'en' ? 'Table of contents' : 'สารบัญ'}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springSnappy, delay: 0.05 }}
      >
        <strong>{locale === 'en' ? 'Contents' : 'สารบัญ'}</strong>
        <ol>
          {doc.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.title}</a>
            </li>
          ))}
        </ol>
      </motion.nav>

      <motion.div
        className="legal-body"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springSnappy, delay: 0.1 }}
      >
        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} className="legal-section">
            <h2>{section.title}</h2>
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
            {section.list && (
              <ul>
                {section.list.map((item) => (
                  <li key={item.slice(0, 40)}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </motion.div>

      <footer className="legal-related">
        <p>{locale === 'en' ? 'Related' : 'เอกสารที่เกี่ยวข้อง'}</p>
        <motion.div
          className="legal-related-links"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {others.map((p) => (
            <Link key={p.path} to={p.path}>
              {p.label}
            </Link>
          ))}
          <Link to="/contact">{locale === 'en' ? 'Contact' : 'ติดต่อ'}</Link>
        </motion.div>
      </footer>
    </article>
  );
}
