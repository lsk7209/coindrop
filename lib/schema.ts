import { z } from 'zod';

// 공통 스키마
export const ChainSchema = z.enum([
  'ethereum',
  'bsc',
  'polygon',
  'avalanche',
  'arbitrum',
  'optimism',
  'base',
  'solana',
  'cosmos',
  'polkadot',
]);

export const AirdropStatusSchema = z.enum(['planned', 'ongoing', 'ended']);
export const RewardTypeSchema = z.enum(['token', 'nft', 'points']).nullable();
export const PlatformSchema = z.enum(['Twitter', 'Threads', 'Telegram']);

// Project 스키마
export const ProjectSchema = z.object({
  id: z.number().int().positive().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(60),
  name: z.string().min(1).max(200),
  chains: z.array(ChainSchema),
  website: z.string().url().nullable().optional(),
  twitter: z.string().url().nullable().optional(),
  discord: z.string().url().nullable().optional(),
  tvl_usd: z.number().nonnegative().nullable().optional(),
  token_present: z.boolean().default(false),
  tokenless_confidence: z.number().min(0).max(1).default(0),
  created_at: z.number().int().nonnegative(),
  updated_at: z.number().int().nonnegative(),
  schema_version: z.number().int().default(101),
});

// Airdrop 스키마
export const AirdropSchema = z.object({
  id: z.number().int().positive().optional(),
  project_id: z.number().int().positive(),
  status: AirdropStatusSchema,
  reward_type: RewardTypeSchema,
  snapshot_at: z.number().int().nonnegative().nullable().optional(),
  deadline_at: z.number().int().nonnegative().nullable().optional(),
  tasks_json: z.string().optional(), // JSON string
  claim_links_json: z.string().optional(), // JSON string
  source: z.string().min(1),
  source_ref: z.string().nullable().optional(),
  new_flag: z.number().int().default(1),
  updated_at: z.number().int().nonnegative(),
  idempotency_key: z.string().min(1),
});

// Content 스키마
export const ContentSchema = z.object({
  id: z.number().int().positive().optional(),
  airdrop_id: z.number().int().positive(),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(60),
  title: z.string().min(10).max(120),
  summary: z.string().min(50).max(300),
  hashtags: z.string(), // JSON string
  quality_scores: z.string(), // JSON string: {seo, aeo, geneo}
  lint_errors: z.string().optional(), // JSON string (null 대신 undefined)
  r2_key: z.string().min(1),
  published_at: z.number().int().nonnegative(),
  updated_at: z.number().int().nonnegative(),
  schema_version: z.number().int().default(101),
});

// R2 Content JSON 스키마
export const R2ContentSchema = z.object({
  project: z.object({
    slug: z.string(),
    name: z.string(),
    chains: z.array(z.string()),
    tvl_usd: z.number().nullable().optional(),
  }),
  airdrop: z.object({
    status: AirdropStatusSchema,
    reward_type: RewardTypeSchema,
    snapshot_at: z.number().nullable().optional(),
    deadline_at: z.number().nullable().optional(),
    tasks: z.array(z.any()).optional(),
  }),
  generated: z.object({
    title: z.string(),
    summary: z.string(),
    howto: z.array(z.any()),
    tips: z.array(z.any()).optional(),
    faq: z.array(z.any()),
    viral: z.string().optional(),
    hashtags: z.array(z.string()),
  }),
  jsonld: z.array(z.any()),
  meta: z.object({
    lang: z.literal('ko'),
    created_at: z.string(),
    updated_at: z.string(),
    schema_version: z.number(),
  }),
});

// Queue 메시지 스키마
export const QueueGenerateMessageSchema = z.object({
  airdrop_id: z.number().int().positive(),
  project_id: z.number().int().positive(),
  project_slug: z.string(),
  chain: ChainSchema,
  retry_count: z.number().int().nonnegative().default(0),
});

// 타입 추출
export type Chain = z.infer<typeof ChainSchema>;
export type AirdropStatus = z.infer<typeof AirdropStatusSchema>;
export type RewardType = z.infer<typeof RewardTypeSchema>;
export type Platform = z.infer<typeof PlatformSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Airdrop = z.infer<typeof AirdropSchema>;
export type Content = z.infer<typeof ContentSchema>;
export type R2Content = z.infer<typeof R2ContentSchema>;
export type QueueGenerateMessage = z.infer<typeof QueueGenerateMessageSchema>;

