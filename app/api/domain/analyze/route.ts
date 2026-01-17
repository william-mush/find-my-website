import { NextRequest, NextResponse } from 'next/server';
import { whoisAPI } from '@/lib/external-apis/whois';
import { waybackAPI } from '@/lib/external-apis/wayback';
import { domainStatusAnalyzer } from '@/lib/recovery/domain-status-analyzer';

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Clean domain input
    const cleanDomain = domain.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '');

    // Fetch data in parallel
    const [whoisData, waybackInfo] = await Promise.allSettled([
      whoisAPI.lookup(cleanDomain),
      waybackAPI.getRecoveryInfo(cleanDomain),
    ]);

    // Get WHOIS data if available
    const whois = whoisData.status === 'fulfilled' ? whoisData.value : undefined;
    const wayback = waybackInfo.status === 'fulfilled' ? waybackInfo.value : undefined;

    // Analyze domain status
    const statusReport = await domainStatusAnalyzer.analyze(
      cleanDomain,
      whois,
      wayback?.hasContent,
      wayback?.hasContent
    );

    return NextResponse.json({
      domain: cleanDomain,
      whois: whois ? {
        registrar: whois.registrar,
        createdDate: whois.createdDate,
        expiryDate: whois.expiryDate,
        nameservers: whois.nameservers,
        status: whois.status,
      } : null,
      wayback: wayback || null,
      statusReport,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Domain analysis failed:', error);
    return NextResponse.json(
      { error: 'Analysis failed', message: error.message },
      { status: 500 }
    );
  }
}
