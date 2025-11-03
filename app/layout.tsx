import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CoinDrop.kr - 코인 에어드랍 자동 수집·생성·발행 플랫폼',
  description: 'DeFiLlama 기반 에어드랍 정보를 자동으로 수집하고 한국어 가이드를 생성합니다.',
  keywords: ['에어드랍', 'airdrop', 'DeFi', '크립토', '블록체인'],
  authors: [{ name: 'CoinDrop.kr' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://coindrop.kr',
    siteName: 'CoinDrop.kr',
    title: 'CoinDrop.kr - 코인 에어드랍 플랫폼',
    description: '에어드랍 정보를 한눈에 확인하고 가이드를 받아보세요.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoinDrop.kr',
    description: '코인 에어드랍 자동 수집·생성·발행 플랫폼',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

