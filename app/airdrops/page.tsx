import { Suspense } from 'react';
import Link from 'next/link';

interface Airdrop {
  id: number;
  status: string;
  reward_type: string | null;
  snapshot_at: number | null;
  deadline_at: number | null;
  updated_at: number;
  project: {
    slug: string;
    name: string;
    chains: string[];
    tvl_usd: number | null;
  } | null;
}

async function getAirdrops(searchParams: { chain?: string; status?: string; cursor?: string }) {
  const params = new URLSearchParams();
  if (searchParams.chain) params.set('chain', searchParams.chain);
  if (searchParams.status) params.set('status', searchParams.status);
  if (searchParams.cursor) params.set('cursor', searchParams.cursor);

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/airdrops?${params.toString()}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json() as { data: Airdrop[]; nextCursor: number | null; hasMore: boolean };
  } catch {
    return null;
  }
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return '-';
  return new Date(timestamp * 1000).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

async function AirdropList({ searchParams }: { searchParams: { chain?: string; status?: string; cursor?: string } }) {
  const data = await getAirdrops(searchParams);

  if (!data || data.data.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p>에어드랍이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        {data.data.map((airdrop) => {
          const chain = airdrop.project?.chains[0] || 'unknown';
          const slug = airdrop.project?.slug || 'unknown';
          return (
            <Link
              key={airdrop.id}
              href={`/airdrops/${chain}/${slug}/airdrop-guide`}
              style={{
                display: 'block',
                padding: '1.5rem',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                  {airdrop.project?.name || 'Unknown'}
                </h3>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    background:
                      airdrop.status === 'ongoing'
                        ? '#4caf50'
                        : airdrop.status === 'ended'
                        ? '#999'
                        : '#ff9800',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}
                >
                  {airdrop.status === 'ongoing'
                    ? '진행중'
                    : airdrop.status === 'ended'
                    ? '종료'
                    : '예정'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#666' }}>
                {airdrop.project?.chains && (
                  <span>체인: {airdrop.project.chains.join(', ')}</span>
                )}
                {airdrop.project?.tvl_usd && (
                  <span>TVL: ${airdrop.project.tvl_usd.toLocaleString()}</span>
                )}
                {airdrop.deadline_at && (
                  <span>마감: {formatDate(airdrop.deadline_at)}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {data.hasMore && (
        <div style={{ textAlign: 'center' }}>
          <Link
            href={`/airdrops?cursor=${data.nextCursor}`}
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#0066cc',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            더보기
          </Link>
        </div>
      )}
    </>
  );
}

export default function AirdropsPage({
  searchParams,
}: {
  searchParams: { chain?: string; status?: string; cursor?: string };
}) {
  return (
    <main style={{ padding: '2rem', minHeight: '100vh', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>에어드랍 목록</h1>
        <p style={{ color: '#666' }}>최신 에어드랍 정보를 확인하세요</p>
      </header>

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link
          href="/airdrops"
          style={{
            padding: '0.5rem 1rem',
            background: '#0066cc',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          전체
        </Link>
        <Link
          href="/airdrops?status=ongoing"
          style={{
            padding: '0.5rem 1rem',
            background: '#4caf50',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          진행중
        </Link>
        <Link
          href="/airdrops?status=planned"
          style={{
            padding: '0.5rem 1rem',
            background: '#ff9800',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          예정
        </Link>
      </div>

      <Suspense fallback={<div>로딩 중...</div>}>
        <AirdropList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

