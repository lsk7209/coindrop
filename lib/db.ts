/**
 * D1 데이터베이스 헬퍼 함수
 */

import type { Project, Airdrop, Content, Chain } from './schema';
import { safeJsonParse } from './utils';

export interface DBEnv {
  DB: D1Database;
}

// ========== Projects ==========

export async function upsertProject(
  db: D1Database,
  project: Omit<Project, 'id'>
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO projects (
        slug, name, chains, website, twitter, discord, 
        tvl_usd, token_present, tokenless_confidence, 
        created_at, updated_at, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        chains = excluded.chains,
        website = excluded.website,
        twitter = excluded.twitter,
        discord = excluded.discord,
        tvl_usd = excluded.tvl_usd,
        token_present = excluded.token_present,
        tokenless_confidence = excluded.tokenless_confidence,
        updated_at = excluded.updated_at,
        schema_version = excluded.schema_version
      RETURNING id`
    )
    .bind(
      project.slug,
      project.name,
      JSON.stringify(project.chains),
      project.website || null,
      project.twitter || null,
      project.discord || null,
      project.tvl_usd || null,
      project.token_present ? 1 : 0,
      project.tokenless_confidence || 0,
      project.created_at,
      project.updated_at,
      project.schema_version
    )
    .first<{ id: number }>();

  return result?.id || 0;
}

export async function getProjectBySlug(
  db: D1Database,
  slug: string
): Promise<Project | null> {
  const row = await db
    .prepare('SELECT * FROM projects WHERE slug = ?')
    .bind(slug)
    .first<{
      id: number;
      slug: string;
      name: string;
      chains: string;
      website: string | null;
      twitter: string | null;
      discord: string | null;
      tvl_usd: number | null;
      token_present: number;
      tokenless_confidence: number;
      created_at: number;
      updated_at: number;
      schema_version: number;
    }>();

  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    chains: safeJsonParse<string[]>(row.chains, []) as Chain[],
    website: row.website || undefined,
    twitter: row.twitter || undefined,
    discord: row.discord || undefined,
    tvl_usd: row.tvl_usd,
    token_present: row.token_present === 1,
    tokenless_confidence: row.tokenless_confidence,
    created_at: row.created_at,
    updated_at: row.updated_at,
    schema_version: row.schema_version,
  };
}

// ========== Airdrops ==========

export async function upsertAirdrop(
  db: D1Database,
  airdrop: Omit<Airdrop, 'id'>
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO airdrops (
        project_id, status, reward_type, snapshot_at, deadline_at,
        tasks_json, claim_links_json, source, source_ref,
        new_flag, updated_at, idempotency_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(idempotency_key) DO UPDATE SET
        project_id = excluded.project_id,
        status = excluded.status,
        reward_type = excluded.reward_type,
        snapshot_at = excluded.snapshot_at,
        deadline_at = excluded.deadline_at,
        tasks_json = excluded.tasks_json,
        claim_links_json = excluded.claim_links_json,
        source = excluded.source,
        source_ref = excluded.source_ref,
        new_flag = CASE 
          WHEN airdrops.status != excluded.status THEN 1
          ELSE airdrops.new_flag
        END,
        updated_at = excluded.updated_at
      RETURNING id`
    )
    .bind(
      airdrop.project_id,
      airdrop.status,
      airdrop.reward_type,
      airdrop.snapshot_at || null,
      airdrop.deadline_at || null,
      airdrop.tasks_json || null,
      airdrop.claim_links_json || null,
      airdrop.source,
      airdrop.source_ref || null,
      airdrop.new_flag,
      airdrop.updated_at,
      airdrop.idempotency_key
    )
    .first<{ id: number }>();

  return result?.id || 0;
}

export async function getAirdropById(
  db: D1Database,
  id: number
): Promise<Airdrop | null> {
  const row = await db
    .prepare('SELECT * FROM airdrops WHERE id = ?')
    .bind(id)
    .first<{
      id: number;
      project_id: number;
      status: string;
      reward_type: string | null;
      snapshot_at: number | null;
      deadline_at: number | null;
      tasks_json: string | null;
      claim_links_json: string | null;
      source: string;
      source_ref: string | null;
      new_flag: number;
      updated_at: number;
      idempotency_key: string;
    }>();

  if (!row) return null;

  return {
    id: row.id,
    project_id: row.project_id,
    status: row.status as Airdrop['status'],
    reward_type: (row.reward_type as Airdrop['reward_type']) || null,
    snapshot_at: row.snapshot_at,
    deadline_at: row.deadline_at,
    tasks_json: row.tasks_json || undefined,
    claim_links_json: row.claim_links_json || undefined,
    source: row.source,
    source_ref: row.source_ref || undefined,
    new_flag: row.new_flag,
    updated_at: row.updated_at,
    idempotency_key: row.idempotency_key,
  };
}

export async function getAirdrops(
  db: D1Database,
  options: {
    chain?: string;
    status?: string;
    limit?: number;
    cursor?: number;
  }
): Promise<{ data: Airdrop[]; nextCursor: number | null }> {
  const { chain, status, limit = 20, cursor = 0 } = options;

  let query = `
    SELECT a.* FROM airdrops a
    INNER JOIN projects p ON a.project_id = p.id
    WHERE 1=1
  `;
  const binds: unknown[] = [];

  if (chain) {
    query += ` AND json_extract(p.chains, '$') LIKE ?`;
    binds.push(`%"${chain}"%`);
  }

  if (status) {
    query += ` AND a.status = ?`;
    binds.push(status);
  }

  query += ` AND a.id > ? ORDER BY a.id ASC LIMIT ?`;
  binds.push(cursor, limit + 1);

  const rows = await db
    .prepare(query)
    .bind(...binds)
    .all<{
      id: number;
      project_id: number;
      status: string;
      reward_type: string | null;
      snapshot_at: number | null;
      deadline_at: number | null;
      tasks_json: string | null;
      claim_links_json: string | null;
      source: string;
      source_ref: string | null;
      new_flag: number;
      updated_at: number;
      idempotency_key: string;
    }>();

  const data = rows.results?.slice(0, limit).map((row) => ({
    id: row.id,
    project_id: row.project_id,
    status: row.status as Airdrop['status'],
    reward_type: (row.reward_type as Airdrop['reward_type']) || null,
    snapshot_at: row.snapshot_at,
    deadline_at: row.deadline_at,
    tasks_json: row.tasks_json,
    claim_links_json: row.claim_links_json,
    source: row.source,
    source_ref: row.source_ref,
    new_flag: row.new_flag,
    updated_at: row.updated_at,
    idempotency_key: row.idempotency_key,
  })) || [];

  const nextCursor =
    rows.results && rows.results.length > limit
      ? rows.results[limit].id
      : null;

  return { data, nextCursor };
}

// ========== Contents ==========

export async function upsertContent(
  db: D1Database,
  content: Omit<Content, 'id'>
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO contents (
        airdrop_id, slug, title, summary, hashtags,
        quality_scores, lint_errors, r2_key,
        published_at, updated_at, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        airdrop_id = excluded.airdrop_id,
        title = excluded.title,
        summary = excluded.summary,
        hashtags = excluded.hashtags,
        quality_scores = excluded.quality_scores,
        lint_errors = excluded.lint_errors,
        r2_key = excluded.r2_key,
        published_at = excluded.published_at,
        updated_at = excluded.updated_at,
        schema_version = excluded.schema_version
      RETURNING id`
    )
    .bind(
      content.airdrop_id,
      content.slug,
      content.title,
      content.summary,
      content.hashtags,
      content.quality_scores,
      content.lint_errors ?? null,
      content.r2_key,
      content.published_at,
      content.updated_at,
      content.schema_version
    )
    .first<{ id: number }>();

  return result?.id || 0;
}

export async function getContentBySlug(
  db: D1Database,
  slug: string
): Promise<Content | null> {
  const row = await db
    .prepare('SELECT * FROM contents WHERE slug = ?')
    .bind(slug)
    .first<{
      id: number;
      airdrop_id: number;
      slug: string;
      title: string;
      summary: string;
      hashtags: string;
      quality_scores: string;
      lint_errors: string | null;
      r2_key: string;
      published_at: number;
      updated_at: number;
      schema_version: number;
    }>();

  if (!row) return null;

  return {
    id: row.id,
    airdrop_id: row.airdrop_id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    hashtags: row.hashtags,
    quality_scores: row.quality_scores,
    lint_errors: row.lint_errors,
    r2_key: row.r2_key,
    published_at: row.published_at,
    updated_at: row.updated_at,
    schema_version: row.schema_version,
  };
}

// ========== Stats ==========

export interface Stats {
  total_projects: number;
  total_airdrops: number;
  chains: Record<string, number>;
  new_today: number;
}

export async function getStats(db: D1Database): Promise<Stats> {
  const [projectsCount, airdropsCount, chainsData, newToday] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM projects').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM airdrops').first<{ count: number }>(),
    db.prepare(`
      SELECT chains FROM projects
    `).all<{ chains: string }>(),
    db.prepare(`
      SELECT COUNT(*) as count FROM airdrops 
      WHERE new_flag = 1 AND updated_at >= ?
    `).bind(Math.floor(Date.now() / 1000) - 86400).first<{ count: number }>(),
  ]);

  // 체인별 카운트 계산
  const chains: Record<string, number> = {};
  chainsData?.results?.forEach((row) => {
    const chainList = safeJsonParse<string[]>(row.chains, []);
    chainList.forEach((chain) => {
      chains[chain] = (chains[chain] || 0) + 1;
    });
  });

  return {
    total_projects: projectsCount?.count || 0,
    total_airdrops: airdropsCount?.count || 0,
    chains,
    new_today: newToday?.count || 0,
  };
}

