import { notFound } from 'next/navigation';
import Link from 'next/link';

interface ContentData {
  content: {
    id: number;
    slug: string;
    title: string;
    summary: string;
    hashtags: string[];
    quality_scores: { seo: number; aeo: number; geneo: number };
  };
  airdrop: {
    status: string;
    reward_type: string | null;
    snapshot_at: number | null;
    deadline_at: number | null;
    tasks: unknown[];
    claim_links: unknown[];
  } | null;
  project: {
    slug: string;
    name: string;
    chains: string[];
    website: string | null;
    twitter: string | null;
    discord: string | null;
    tvl_usd: number | null;
  } | null;
  generated: {
    title: string;
    summary: string;
    howto: Array<{ title: string; description: string }>;
    faq: Array<{ question: string; answer: string }>;
    tips: string[];
    viral: string;
    hashtags: string[];
  };
  jsonld: unknown[];
}

async function getAirdropDetail(chain: string, slug: string): Promise<ContentData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/airdrops/${chain}/${slug}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    return await res.json() as ContentData;
  } catch {
    return null;
  }
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return '-';
  return new Date(timestamp * 1000).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AirdropGuidePage({
  params,
}: {
  params: { chain: string; slug: string };
}) {
  const data = await getAirdropDetail(params.chain, params.slug);

  if (!data) {
    notFound();
  }

  const { content, airdrop, project, generated, jsonld } = data;

  return (
    <>
      {/* JSON-LD 스키마 */}
      {jsonld.map((ld, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      <main style={{ padding: '2rem', minHeight: '100vh', maxWidth: '900px', margin: '0 auto' }}>
        {/* Hero 섹션 */}
        <header style={{ marginBottom: '3rem' }}>
          <Link
            href="/airdrops"
            style={{ color: '#0066cc', textDecoration: 'underline', marginBottom: '1rem', display: 'inline-block' }}
          >
            ← 목록으로
          </Link>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{generated.title}</h1>
          <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '1.5rem' }}>
            {generated.summary}
          </p>

          {project && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ padding: '0.5rem 1rem', background: '#f5f5f5', borderRadius: '4px' }}>
                체인: {project.chains.join(', ')}
              </span>
              {project.tvl_usd && (
                <span style={{ padding: '0.5rem 1rem', background: '#f5f5f5', borderRadius: '4px' }}>
                  TVL: ${project.tvl_usd.toLocaleString()}
                </span>
              )}
              {airdrop?.status && (
                <span
                  style={{
                    padding: '0.5rem 1rem',
                    background:
                      airdrop.status === 'ongoing'
                        ? '#4caf50'
                        : airdrop.status === 'ended'
                        ? '#999'
                        : '#ff9800',
                    color: 'white',
                    borderRadius: '4px',
                  }}
                >
                  {airdrop.status === 'ongoing'
                    ? '진행중'
                    : airdrop.status === 'ended'
                    ? '종료'
                    : '예정'}
                </span>
              )}
            </div>
          )}

          {airdrop?.deadline_at && (
            <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>
              마감: {formatDate(airdrop.deadline_at)}
            </p>
          )}
        </header>

        {/* HowTo 섹션 */}
        {generated.howto && generated.howto.length > 0 && (
          <section style={{ marginBottom: '3rem' }} aria-label="참여 방법">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>참여 방법</h2>
            <ol style={{ listStyle: 'none', padding: 0, counterReset: 'step' }}>
              {generated.howto.map((step, idx) => (
                <li
                  key={idx}
                  style={{
                    counterIncrement: 'step',
                    marginBottom: '1.5rem',
                    paddingLeft: '2rem',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      width: '1.5rem',
                      height: '1.5rem',
                      background: '#0066cc',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <h3 style={{ marginBottom: '0.5rem' }}>{step.title}</h3>
                  <p style={{ color: '#666' }}>{step.description}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* FAQ 섹션 */}
        {generated.faq && generated.faq.length > 0 && (
          <section style={{ marginBottom: '3rem' }} aria-label="자주 묻는 질문">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>자주 묻는 질문</h2>
            <dl style={{ margin: 0 }}>
              {generated.faq.map((faq, idx) => (
                <div key={idx} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #eee' }}>
                  <dt style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{faq.question}</dt>
                  <dd style={{ margin: 0, color: '#666', lineHeight: '1.6' }}>{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Tips 섹션 */}
        {generated.tips && generated.tips.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>유용한 팁</h2>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
              {generated.tips.map((tip, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 프로젝트 링크 */}
        {project && (
          <section style={{ marginBottom: '3rem', padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>프로젝트 정보</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {project.website && (
                <a
                  href={project.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#0066cc',
                    color: 'white',
                    borderRadius: '4px',
                    textDecoration: 'none',
                  }}
                >
                  웹사이트
                </a>
              )}
              {project.twitter && (
                <a
                  href={project.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#1da1f2',
                    color: 'white',
                    borderRadius: '4px',
                    textDecoration: 'none',
                  }}
                >
                  Twitter
                </a>
              )}
              {project.discord && (
                <a
                  href={project.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#5865f2',
                    color: 'white',
                    borderRadius: '4px',
                    textDecoration: 'none',
                  }}
                >
                  Discord
                </a>
              )}
            </div>
          </section>
        )}

        {/* CTA 섹션 */}
        <section style={{ padding: '2rem', background: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>더 많은 에어드랍 정보 받기</h2>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
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
            뉴스레터 구독하기
          </Link>
        </section>
      </main>
    </>
  );
}

