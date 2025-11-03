/**
 * DeFiLlama API 테스트 스크립트
 * 실제 API 응답 형식 확인 및 수집 테스트
 */

async function testDeFiLlamaAPI() {
  console.log('🔍 DeFiLlama API 테스트 시작...\n');

  try {
    // API 호출
    const response = await fetch('https://api.llama.fi/protocols', {
      headers: {
        'User-Agent': 'CoinDrop.kr/1.0',
      },
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`📦 Headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`🔄 ETag:`, response.headers.get('ETag'));
    console.log('');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // 응답 구조 확인
    console.log('📊 응답 구조:');
    console.log(`- 타입: ${Array.isArray(data) ? '배열' : typeof data}`);
    console.log(`- 항목 수: ${Array.isArray(data) ? data.length : 'N/A'}`);
    console.log('');

    if (Array.isArray(data) && data.length > 0) {
      const firstProtocol = data[0];
      console.log('📋 첫 번째 프로토콜 샘플:');
      console.log(JSON.stringify(firstProtocol, null, 2));
      console.log('');

      // 필드 확인
      console.log('🔑 주요 필드:');
      console.log(`- id: ${firstProtocol.id || 'N/A'}`);
      console.log(`- name: ${firstProtocol.name || 'N/A'}`);
      console.log(`- slug: ${firstProtocol.slug || 'N/A'}`);
      console.log(`- chains: ${JSON.stringify(firstProtocol.chains || [])}`);
      console.log(`- tvl: ${firstProtocol.tvl || 'N/A'}`);
      console.log(`- tokenSymbol: ${firstProtocol.tokenSymbol || 'N/A'}`);
      console.log(`- url: ${firstProtocol.url || 'N/A'}`);
      console.log(`- twitter: ${firstProtocol.twitter || 'N/A'}`);
      console.log(`- discord: ${firstProtocol.discord || 'N/A'}`);
      console.log('');

      // 토큰리스 후보 분석
      const tokenlessCount = data.filter((p: any) => !p.tokenSymbol && p.tvl > 1000000).length;
      console.log(`🎯 토큰리스 후보 (TVL > 100만 달러): ${tokenlessCount}개`);
      console.log('');

      // 상위 10개 프로토콜 (TVL 기준)
      const topProtocols = data
        .filter((p: any) => p.tvl > 0)
        .sort((a: any, b: any) => b.tvl - a.tvl)
        .slice(0, 10);
      
      console.log('🏆 상위 10개 프로토콜 (TVL 기준):');
      topProtocols.forEach((p: any, idx: number) => {
        const tokenless = !p.tokenSymbol ? '🚀 토큰리스' : '💰 토큰 있음';
        console.log(`${idx + 1}. ${p.name} (${p.slug}) - TVL: $${p.tvl.toLocaleString()} ${tokenless}`);
      });
    }
  } catch (error) {
    console.error('❌ 에러:', error);
    process.exit(1);
  }
}

// 실행
testDeFiLlamaAPI();

