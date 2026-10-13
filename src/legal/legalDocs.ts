import charter from './01-Ethical-Charter.md?raw';
import terms from './02-Terms-of-Service.md?raw';
import privacy from './03-Privacy-Policy.md?raw';
import aup from './04-Acceptable-Use-Policy.md?raw';
import aiDisclaimer from './05-AI-Output-and-Decision-Disclaimer.md?raw';
import securityNotice from './06-Preview-Demo-and-Security-Notice.md?raw';

export interface LegalDoc {
  slug: string;
  path: string;
  title: string;
  blurb: string;
  body: string;
}

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: 'terms',
    path: '/terms',
    title: 'Terms of Service',
    blurb: 'The agreement governing your use of Proteus.',
    body: terms,
  },
  {
    slug: 'privacy',
    path: '/privacy',
    title: 'Privacy Policy',
    blurb: 'How Proteus handles information.',
    body: privacy,
  },
  {
    slug: 'acceptable-use',
    path: '/acceptable-use',
    title: 'Acceptable Use Policy',
    blurb: 'What you may and may not do with Proteus.',
    body: aup,
  },
  {
    slug: 'ai-disclaimer',
    path: '/ai-disclaimer',
    title: 'AI Output & Decision-Making Disclaimer',
    blurb: 'Why Proteus output is advisory only.',
    body: aiDisclaimer,
  },
  {
    slug: 'charter',
    path: '/charter',
    title: 'Ethical Charter',
    blurb: 'The principles behind the product.',
    body: charter,
  },
  {
    slug: 'security-notice',
    path: '/security-notice',
    title: 'Preview, Demo & Security Notice',
    blurb: 'What is — and is not — secure in preview.',
    body: securityNotice,
  },
];

export function getLegalDocForPath(pathname: string): LegalDoc | undefined {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return LEGAL_DOCS.find((doc) => doc.path === normalized);
}
