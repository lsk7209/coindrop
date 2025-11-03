/**
 * DeFiLlama Collector
 * API에서 프로토콜 데이터 수집 및 정규화
 */

import type { Project, Airdrop, Chain } from './schema';
import { nowUTC, createIdempotencyKey, createSlug } from './utils';
import { upsertProject, upsertAirdrop } from './db';

// DeFiLlama API 타입 (실제 API 응답 형식)
export interface DeFiLlamaProtocol {
  id: string;
  name: string;
  slug: string;
  chains: string[]; // 실제로는 대문자로 시작: "Ethereum", "Bitcoin" 등
  url: string;
  twitter?: string;
  discord?: string; // 실제 API에는 없을 수 있음
  tvl: number;
  symbol?: string; // 실제 필드명은 "symbol" (tokenSymbol이 아님)
  tokenSymbol?: string; // 호환성을 위해 유지
  logo?: string;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
  mcap?: number;
  chainTvls?: Record<string, number>;
  [key: string]: unknown; // 기타 필드
}

// 실제 API는 배열을 직접 반환
type DeFiLlamaResponse = DeFiLlamaProtocol[];

/**
 * DeFiLlama API에서 프로토콜 목록 조회 (ETag 지원)
 */
export async function fetchDeFiLlamaProtocols(
  etag?: string
): Promise<{
  protocols: DeFiLlamaProtocol[];
  etag: string | null;
  hasChanges: boolean;
}> {
  const headers: HeadersInit = {
    'User-Agent': 'CoinDrop.kr/1.0',
  };

  if (etag) {
    headers['If-None-Match'] = etag;
  }

  const response = await fetch('https://api.llama.fi/protocols', {
    headers,
  });

  if (response.status === 304) {
    // 변경 없음
    return {
      protocols: [],
      etag: response.headers.get('ETag'),
      hasChanges: false,
    };
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`DeFiLlama API error: ${response.status} - ${errorText}`);
  }

  // 실제 API는 배열을 직접 반환
  const data = (await response.json()) as DeFiLlamaResponse;
  const newEtag = response.headers.get('ETag');

  // 배열이 아닌 경우 에러
  if (!Array.isArray(data)) {
    throw new Error('DeFiLlama API returned invalid format (expected array)');
  }

  return {
    protocols: data,
    etag: newEtag,
    hasChanges: true,
  };
}

/**
 * 토큰리스 후보 탐지 및 신뢰도 계산
 */
export function detectTokenlessCandidate(
  protocol: DeFiLlamaProtocol
): { isTokenless: boolean; confidence: number } {
  // 휴리스틱: tokenSymbol이 없고, TVL이 일정 이상이며, 주요 체인에 있으면 후보
  let confidence = 0;

  // 토큰 심볼 확인 (symbol 또는 tokenSymbol 필드)
  const tokenSymbol = protocol.symbol || protocol.tokenSymbol || '';
  const hasToken = tokenSymbol && tokenSymbol.trim() !== '' && tokenSymbol !== '-';
  
  if (!hasToken) {
    confidence += 0.4;
  }

  // TVL이 높을수록 신뢰도 증가
  if (protocol.tvl > 10000000) {
    // TVL 1000만 달러 이상
    confidence += 0.4;
  } else if (protocol.tvl > 1000000) {
    // TVL 100만 달러 이상
    confidence += 0.3;
  } else if (protocol.tvl > 100000) {
    // TVL 10만 달러 이상
    confidence += 0.2;
  }

  // 주요 체인에 있으면 신뢰도 증가
  const majorChains: Chain[] = [
    'ethereum',
    'bsc',
    'polygon',
    'arbitrum',
    'optimism',
    'base',
    'avalanche',
    'solana',
  ];
  const normalizedChains = protocol.chains.map((c) => c.toLowerCase());
  const hasMajorChain = normalizedChains.some((c) =>
    majorChains.includes(c as Chain)
  );
  if (hasMajorChain) {
    confidence += 0.2;
  }

  // 최소 TVL 체크 (너무 작은 프로토콜 제외)
  if (protocol.tvl < 50000) {
    confidence *= 0.5; // 작은 프로토콜은 신뢰도 감소
  }

  return {
    isTokenless: confidence >= 0.5,
    confidence: Math.min(confidence, 1.0),
  };
}

/**
 * 프로토콜을 Project로 변환
 */
export function normalizeProject(
  protocol: DeFiLlamaProtocol,
  tokenlessData: { isTokenless: boolean; confidence: number }
): Omit<Project, 'id'> {
  const slug = createSlug(protocol.slug || protocol.name);
  const now = nowUTC();

  // 체인 이름 정규화 (대문자 시작 -> 소문자)
  const normalizedChains = protocol.chains
    .map((c) => {
      // "Ethereum" -> "ethereum", "zkSync Era" -> "zksync-era"
      return c.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    })
    .filter((c) => c.length > 0) as Chain[];

  return {
    slug,
    name: protocol.name,
    chains: normalizedChains.length > 0 ? normalizedChains : ['ethereum'], // 기본값
    website: protocol.url || null,
    twitter: protocol.twitter ? `https://twitter.com/${protocol.twitter}` : null,
    discord: protocol.discord || null,
    tvl_usd: protocol.tvl || null,
    token_present: !tokenlessData.isTokenless,
    tokenless_confidence: tokenlessData.confidence,
    created_at: now,
    updated_at: now,
    schema_version: 101,
  };
}

/**
 * 프로토콜을 Airdrop 후보로 변환
 * (현재는 기본값, 실제로는 더 정교한 탐지 필요)
 */
export function normalizeAirdrop(
  protocol: DeFiLlamaProtocol,
  projectId: number
): Omit<Airdrop, 'id'> {
  const now = nowUTC();
  const sourcePayload = {
    protocol_id: protocol.id,
    slug: protocol.slug,
    timestamp: now,
  };

  return {
    project_id: projectId,
    status: 'planned', // 기본값, 실제로는 더 정교한 탐지 필요
    reward_type: null,
    snapshot_at: null,
    deadline_at: null,
    tasks_json: undefined,
    claim_links_json: undefined,
    source: 'defillama',
    source_ref: `https://defillama.com/protocol/${protocol.slug}`,
    new_flag: 1,
    updated_at: now,
    idempotency_key: '', // createIdempotencyKey로 설정 필요
  };
}

/**
 * 수집 및 DB 저장
 */
export async function collectAndSave(
  db: D1Database,
  kv: KVNamespace,
  queue: { send: (message: unknown) => Promise<void> }
): Promise<{ processed: number; newProjects: number; newAirdrops: number }> {
  // ETag 조회
  const cachedEtag = await kv.get('defillama:etag');

  // DeFiLlama API 호출
  const { protocols, etag, hasChanges } = await fetchDeFiLlamaProtocols(
    cachedEtag || undefined
  );

  if (!hasChanges || protocols.length === 0) {
    return { processed: 0, newProjects: 0, newAirdrops: 0 };
  }

  // ETag 저장
  if (etag) {
    await kv.put('defillama:etag', etag, { expirationTtl: 86400 }); // 24시간
  }

  let newProjects = 0;
  let newAirdrops = 0;
  let errorCount = 0;

  console.log(`Processing ${protocols.length} protocols...`);

  // 프로토콜 처리 (배치 처리로 성능 개선)
  for (let i = 0; i < protocols.length; i++) {
    const protocol = protocols[i];
    
    // 진행 상황 로깅 (100개마다)
    if (i % 100 === 0 && i > 0) {
      console.log(`Progress: ${i}/${protocols.length} processed`);
    }

    try {
      // 토큰리스 후보 탐지
      const tokenlessData = detectTokenlessCandidate(protocol);

      // Project 저장
      const projectData = normalizeProject(protocol, tokenlessData);
      const projectId = await upsertProject(db, projectData);

      if (projectId > 0) {
        // 신규 프로젝트 확인
        const existing = await db
          .prepare('SELECT id FROM projects WHERE slug = ?')
          .bind(projectData.slug)
          .first<{ id: number }>();

        // 신규 프로젝트 카운트 (더 정확한 로직)
        const isNew = !existing;
        if (isNew) {
          newProjects++;
        }

        // 토큰리스 후보만 Airdrop 생성
        if (tokenlessData.isTokenless && tokenlessData.confidence >= 0.6) {
          const airdropData = normalizeAirdrop(protocol, projectId);
          airdropData.idempotency_key = await createIdempotencyKey({
            protocol_id: protocol.id,
            project_id: projectId,
            timestamp: airdropData.updated_at,
          });

          const airdropId = await upsertAirdrop(db, airdropData);

          if (airdropId > 0) {
            // 신규 Airdrop 확인
            const existingAirdrop = await db
              .prepare('SELECT id FROM airdrops WHERE idempotency_key = ?')
              .bind(airdropData.idempotency_key)
              .first<{ id: number }>();

            if (!existingAirdrop || existingAirdrop.id === airdropId) {
              newAirdrops++;

              // Queue에 생성 작업 발행
              const chain = (protocol.chains[0] || 'ethereum').toLowerCase() as Chain;
              try {
                await queue.send({
                  airdrop_id: airdropId,
                  project_id: projectId,
                  project_slug: projectData.slug,
                  chain,
                  retry_count: 0,
                });
              } catch (queueError) {
                console.error(`Queue send error for ${protocol.slug}:`, queueError);
                // 계속 진행
              }
            }
          }
        }
      }
    } catch (error) {
      errorCount++;
      console.error(`Error processing protocol ${protocol.id} (${protocol.slug}):`, error);
      // 계속 진행 (일부 실패해도 전체 중단되지 않음)
    }
  }

  console.log(`Collection complete: ${newProjects} new projects, ${newAirdrops} new airdrops, ${errorCount} errors`);

  return {
    processed: protocols.length,
    newProjects,
    newAirdrops,
  };
}

