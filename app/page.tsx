import Link from 'next/link';

async function getHomeStats() {
  try {
    // 서버 컴포넌트에서는 API 라우트를 통해 접근
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/stats`, {
      next: { revalidate: 300 }, // 5분 캐시
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const stats = await getHomeStats();

  return (
    <main style={{ padding: '2rem', minHeight: '100vh', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          CoinDrop.kr
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>
          코인 에어드랍 자동 수집·생성·발행 플랫폼
        </p>
      </header>

      {stats && (
        <section style={{ marginBottom: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1.5rem', background: '#f5f5f5', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>전체 프로젝트</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
              {stats.total_projects.toLocaleString()}
            </p>
          </div>
          <div style={{ padding: '1.5rem', background: '#f5f5f5', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>전체 에어드랍</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
              {stats.total_airdrops.toLocaleString()}
            </p>
          </div>
          <div style={{ padding: '1.5rem', background: '#f5f5f5', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>오늘 신규</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#0066cc' }}>
              {stats.new_today.toLocaleString()}
            </p>
          </div>
        </section>
      )}

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>오늘의 신규 에어드랍</h2>
        <div style={{ padding: '2rem', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
          <p>새로운 에어드랍이 수집되면 여기에 표시됩니다.</p>
          <Link href="/airdrops" style={{ color: '#0066cc', textDecoration: 'underline' }}>
            전체 목록 보기 →
          </Link>
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>인기 체인</h2>
        {stats?.chains && Object.keys(stats.chains).length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {Object.entries(stats.chains)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 10)
              .map(([chain, count]) => (
                <Link
                  key={chain}
                  href={`/airdrops?chain=${chain}`}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#0066cc',
                    color: 'white',
                    borderRadius: '4px',
                    textDecoration: 'none',
                  }}
                >
                  {chain} ({count as number})
                </Link>
              ))}
          </div>
        ) : (
          <p>체인 데이터를 불러오는 중...</p>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>뉴스레터 구독</h2>
        <div style={{ padding: '2rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <p style={{ marginBottom: '1rem' }}>
            새로운 에어드랍 정보를 이메일로 받아보세요.
          </p>
          <Link
            href="/newsletter"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#0066cc',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            구독하기
          </Link>
        </div>
      </section>
    </main>
  );
}
