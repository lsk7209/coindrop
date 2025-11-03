import type { R2Content } from './schema';

/**
 * JSON-LD 스키마 생성
 */

export interface BlogPostingLD {
  '@context': 'https://schema.org';
  '@type': 'BlogPosting';
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  author: {
    '@type': 'Person';
    name: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
}

export interface HowToLD {
  '@context': 'https://schema.org';
  '@type': 'HowTo';
  name: string;
  description: string;
  step: Array<{
    '@type': 'HowToStep';
    position: number;
    name: string;
    text: string;
  }>;
}

export interface FAQPageLD {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

/**
 * BlogPosting JSON-LD 생성
 */
export function createBlogPostingLD(
  content: R2Content,
  baseUrl: string
): BlogPostingLD {
  const url = `${baseUrl}/airdrops/${content.project.chains[0]}/${content.meta.schema_version}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: content.generated.title,
    description: content.generated.summary,
    datePublished: content.meta.created_at,
    dateModified: content.meta.updated_at,
    author: {
      '@type': 'Person',
      name: 'CoinDrop.kr',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CoinDrop.kr',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

/**
 * HowTo JSON-LD 생성
 */
export function createHowToLD(content: R2Content): HowToLD {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `${content.generated.title} - 참여 방법`,
    description: content.generated.summary,
    step: content.generated.howto.map((step: any, index: number) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title || `단계 ${index + 1}`,
      text: step.description || step,
    })),
  };
}

/**
 * FAQPage JSON-LD 생성
 */
export function createFAQPageLD(content: R2Content): FAQPageLD {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.generated.faq.map((faq: any) => ({
      '@type': 'Question',
      name: faq.question || faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer || faq.a,
      },
    })),
  };
}

