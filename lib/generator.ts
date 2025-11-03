/**
 * 콘텐츠 Generator
 * ChatGPT API를 사용한 한국어 콘텐츠 생성 및 품질 검증
 */

import OpenAI from 'openai';
import type { R2Content, Airdrop, Project, Chain } from './schema';
import { createSlug, nowUTC, safeJsonParse } from './utils';
import {
  createBlogPostingLD,
  createHowToLD,
  createFAQPageLD,
} from './jsonld';

export interface QualityScores {
  seo: number; // 0-100
  aeo: number; // 0-100
  geneo: number; // 0-100
}

export interface LintErrors {
  type: 'length' | 'keyword' | 'link' | 'jsonld' | 'format';
  message: string;
  severity: 'error' | 'warning';
}

/**
 * ChatGPT 프롬프트 생성
 */
function createPrompt(
  project: Project,
  airdrop: Airdrop,
  sourceRef: string
): string {
  return `당신은 코인 에어드랍 전문가입니다. 다음 프로토콜의 에어드랍 가이드를 한국어로 작성해주세요.

프로토콜 정보:
- 이름: ${project.name}
- 체인: ${project.chains.join(', ')}
- TVL: ${project.tvl_usd ? `$${project.tvl_usd.toLocaleString()}` : '정보 없음'}
- 웹사이트: ${project.website || '정보 없음'}
- 출처: ${sourceRef}

요구사항:
1. 직답(Summary): 50-110자로 에어드랍 핵심 요약
2. HowTo: 3-5단계로 참여 방법 설명
3. FAQ: 최소 3개 질문-답변 (Claim-Evidence 포함, 수치/날짜 명시)
4. Tips: 유용한 팁 2-3개
5. 바이럴 요소: 트위터/소셜미디어 공유용 한 줄 요약

JSON 형식으로 응답:
{
  "summary": "직답 50-110자",
  "howto": [
    {"title": "단계 제목", "description": "상세 설명"},
    ...
  ],
  "faq": [
    {"question": "질문", "answer": "수치와 날짜 포함한 답변"},
    ...
  ],
  "tips": ["팁 1", "팁 2", ..."],
  "viral": "바이럴 요약",
  "hashtags": ["#에어드랍", "#체인명", ...]
}`;
}

/**
 * ChatGPT API로 콘텐츠 생성
 */
export async function generateContent(
  openai: OpenAI,
  project: Project,
  airdrop: Airdrop,
  sourceRef: string
): Promise<{
  title: string;
  summary: string;
  howto: Array<{ title: string; description: string }>;
  faq: Array<{ question: string; answer: string }>;
  tips: string[];
  viral: string;
  hashtags: string[];
}> {
  const prompt = createPrompt(project, airdrop, sourceRef);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content:
          '당신은 코인 에어드랍 전문가입니다. 정확하고 신뢰할 수 있는 정보만 제공하세요. 근거가 불확실한 내용은 언급하지 마세요.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  const parsed = JSON.parse(content);

  // 제목 생성 (프로토콜명 + "에어드랍 참여 가이드")
  const title = `${project.name} 에어드랍 참여 가이드 2025`;

  return {
    title,
    summary: parsed.summary || '',
    howto: parsed.howto || [],
    faq: parsed.faq || [],
    tips: parsed.tips || [],
    viral: parsed.viral || '',
    hashtags: parsed.hashtags || ['#에어드랍'],
  };
}

/**
 * 콘텐츠 Lint 검사
 */
export function lintContent(content: {
  title: string;
  summary: string;
  howto: Array<{ title: string; description: string }>;
  faq: Array<{ question: string; answer: string }>;
  tips: string[];
  viral: string;
  hashtags: string[];
}): LintErrors[] {
  const errors: LintErrors[] = [];

  // 직답 길이 검사
  if (content.summary.length < 50 || content.summary.length > 110) {
    errors.push({
      type: 'length',
      message: `Summary 길이: ${content.summary.length}자 (요구: 50-110자)`,
      severity: content.summary.length < 30 ? 'error' : 'warning',
    });
  }

  // HowTo 단계 수 검사
  if (content.howto.length < 3 || content.howto.length > 5) {
    errors.push({
      type: 'format',
      message: `HowTo 단계 수: ${content.howto.length}개 (요구: 3-5개)`,
      severity: 'warning',
    });
  }

  // FAQ 수 검사
  if (content.faq.length < 3) {
    errors.push({
      type: 'format',
      message: `FAQ 수: ${content.faq.length}개 (요구: 최소 3개)`,
      severity: 'error',
    });
  }

  // 금칙어 검사 (예시)
  const bannedWords = ['스캠', '사기', '피싱'];
  const allText = JSON.stringify(content);
  bannedWords.forEach((word) => {
    if (allText.includes(word)) {
      errors.push({
        type: 'keyword',
        message: `금칙어 발견: ${word}`,
        severity: 'error',
      });
    }
  });

  // JSON-LD 필수 필드 검사 (나중에 검증)
  // 여기서는 기본 구조만 확인

  return errors;
}

/**
 * 품질 점수 계산
 */
export function calculateQualityScores(
  content: {
    title: string;
    summary: string;
    howto: Array<{ title: string; description: string }>;
    faq: Array<{ question: string; answer: string }>;
    tips: string[];
    viral: string;
    hashtags: string[];
  },
  lintErrors: LintErrors[]
): QualityScores {
  let seo = 100;
  let aeo = 100;
  let geneo = 100;

  // SEO 점수
  if (content.title.length < 10 || content.title.length > 120) {
    seo -= 20;
  }
  if (content.summary.length < 50 || content.summary.length > 110) {
    seo -= 15;
  }
  if (content.hashtags.length < 2) {
    seo -= 10;
  }

  // AEO 점수 (직답 품질)
  if (content.summary.length < 50) {
    aeo -= 30;
  }
  if (content.howto.length < 3) {
    aeo -= 20;
  }
  // Claim-Evidence 체크 (FAQ에 수치/날짜 포함 여부)
  const hasEvidence = content.faq.some(
    (faq) =>
      /\d+/.test(faq.answer) || // 수치 포함
      /(\d{4}|\d{1,2}월|\d{1,2}일)/.test(faq.answer) // 날짜 포함
  );
  if (!hasEvidence) {
    aeo -= 25;
  }

  // GenEO 점수 (생성 검색 최적화)
  if (content.howto.length < 3 || content.howto.length > 5) {
    geneo -= 20;
  }
  if (content.faq.length < 3) {
    geneo -= 25;
  }
  if (!content.viral || content.viral.length < 20) {
    geneo -= 15;
  }

  // Lint 에러로 인한 감점
  const errorCount = lintErrors.filter((e) => e.severity === 'error').length;
  const warningCount = lintErrors.filter((e) => e.severity === 'warning')
    .length;
  seo -= errorCount * 10 + warningCount * 5;
  aeo -= errorCount * 10 + warningCount * 5;
  geneo -= errorCount * 10 + warningCount * 5;

  return {
    seo: Math.max(0, Math.min(100, seo)),
    aeo: Math.max(0, Math.min(100, aeo)),
    geneo: Math.max(0, Math.min(100, geneo)),
  };
}

/**
 * R2Content 생성
 */
export function createR2Content(
  project: Project,
  airdrop: Airdrop,
  generated: {
    title: string;
    summary: string;
    howto: Array<{ title: string; description: string }>;
    faq: Array<{ question: string; answer: string }>;
    tips: string[];
    viral: string;
    hashtags: string[];
  },
  baseUrl: string
): R2Content {
  const now = nowUTC();
  const chain = project.chains[0] || 'ethereum';

  // JSON-LD 생성
  const blogPosting = createBlogPostingLD(
    {
      project: {
        slug: project.slug,
        name: project.name,
        chains: project.chains,
        tvl_usd: project.tvl_usd,
      },
      airdrop: {
        status: airdrop.status,
        reward_type: airdrop.reward_type,
        snapshot_at: airdrop.snapshot_at,
        deadline_at: airdrop.deadline_at,
        tasks: [],
      },
      generated: {
        title: generated.title,
        summary: generated.summary,
        howto: generated.howto,
        tips: generated.tips,
        faq: generated.faq,
        viral: generated.viral,
        hashtags: generated.hashtags,
      },
      jsonld: [],
      meta: {
        lang: 'ko',
        created_at: new Date(now * 1000).toISOString(),
        updated_at: new Date(now * 1000).toISOString(),
        schema_version: 101,
      },
    },
    baseUrl
  );

  const howTo = createHowToLD({
    project: {
      slug: project.slug,
      name: project.name,
      chains: project.chains,
      tvl_usd: project.tvl_usd,
    },
    airdrop: {
      status: airdrop.status,
      reward_type: airdrop.reward_type,
      snapshot_at: airdrop.snapshot_at,
      deadline_at: airdrop.deadline_at,
      tasks: [],
    },
    generated: {
      title: generated.title,
      summary: generated.summary,
      howto: generated.howto,
      tips: generated.tips,
      faq: generated.faq,
      viral: generated.viral,
      hashtags: generated.hashtags,
    },
    jsonld: [],
    meta: {
      lang: 'ko',
      created_at: new Date(now * 1000).toISOString(),
      updated_at: new Date(now * 1000).toISOString(),
      schema_version: 101,
    },
  });

  const faqPage = createFAQPageLD({
    project: {
      slug: project.slug,
      name: project.name,
      chains: project.chains,
      tvl_usd: project.tvl_usd,
    },
    airdrop: {
      status: airdrop.status,
      reward_type: airdrop.reward_type,
      snapshot_at: airdrop.snapshot_at,
      deadline_at: airdrop.deadline_at,
      tasks: [],
    },
    generated: {
      title: generated.title,
      summary: generated.summary,
      howto: generated.howto,
      tips: generated.tips,
      faq: generated.faq,
      viral: generated.viral,
      hashtags: generated.hashtags,
    },
    jsonld: [],
    meta: {
      lang: 'ko',
      created_at: new Date(now * 1000).toISOString(),
      updated_at: new Date(now * 1000).toISOString(),
      schema_version: 101,
    },
  });

  return {
    project: {
      slug: project.slug,
      name: project.name,
      chains: project.chains,
      tvl_usd: project.tvl_usd,
    },
    airdrop: {
      status: airdrop.status,
      reward_type: airdrop.reward_type,
      snapshot_at: airdrop.snapshot_at,
      deadline_at: airdrop.deadline_at,
      tasks: safeJsonParse(airdrop.tasks_json || '[]', []),
    },
    generated: {
      title: generated.title,
      summary: generated.summary,
      howto: generated.howto,
      tips: generated.tips,
      faq: generated.faq,
      viral: generated.viral,
      hashtags: generated.hashtags,
    },
    jsonld: [blogPosting, howTo, faqPage],
    meta: {
      lang: 'ko',
      created_at: new Date(now * 1000).toISOString(),
      updated_at: new Date(now * 1000).toISOString(),
      schema_version: 101,
    },
  };
}

