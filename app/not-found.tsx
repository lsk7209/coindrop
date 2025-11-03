import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ padding: '2rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>페이지를 찾을 수 없습니다.</p>
      <Link
        href="/"
        style={{
          padding: '0.75rem 1.5rem',
          background: '#0066cc',
          color: 'white',
          borderRadius: '4px',
          textDecoration: 'none',
        }}
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}

