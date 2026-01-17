import { NextRequest, NextResponse } from 'next/server';
import { whoisAPI } from '@/lib/external-apis/whois';
import { waybackAPI } from '@/lib/external-apis/wayback';
import { dnsAPI } from '@/lib/external-apis/dns';
import { websiteAnalyzer } from '@/lib/external-apis/website-analyzer';
import { securityAPI } from '@/lib/external-apis/security';
import { seoAPI } from '@/lib/external-apis/seo';
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

    console.log(`[Analysis] Starting comprehensive analysis for: ${cleanDomain}`);

    // Fetch all data in parallel for maximum speed
    const [
      whoisResult,
      waybackResult,
      dnsResult,
      websiteResult,
    ] = await Promise.allSettled([
      whoisAPI.lookup(cleanDomain),
      waybackAPI.getRecoveryInfo(cleanDomain),
      dnsAPI.analyze(cleanDomain),
      websiteAnalyzer.analyze(cleanDomain),
    ]);

    // Extract data from results
    const whoisData = whoisResult.status === 'fulfilled' ? whoisResult.value : undefined;
    const waybackData = waybackResult.status === 'fulfilled' ? waybackResult.value : undefined;
    const dnsData = dnsResult.status === 'fulfilled' ? dnsResult.value : undefined;
    const websiteData = websiteResult.status === 'fulfilled' ? websiteResult.value : undefined;

    console.log(`[Analysis] WHOIS: ${whoisData ? 'OK' : 'FAIL'}, Wayback: ${waybackData ? 'OK' : 'FAIL'}, DNS: ${dnsData ? 'OK' : 'FAIL'}, Website: ${websiteData ? 'OK' : 'FAIL'}`);

    // Perform additional analyses that depend on the initial data
    const [
      securityResult,
      seoResult,
      statusResult,
    ] = await Promise.allSettled([
      securityAPI.analyze(cleanDomain, whoisData),
      seoAPI.analyze(cleanDomain, waybackData, whoisData),
      domainStatusAnalyzer.analyze(
        cleanDomain,
        whoisData,
        waybackData?.hasContent,
        websiteData?.isOnline
      ),
    ]);

    const securityData = securityResult.status === 'fulfilled' ? securityResult.value : undefined;
    const seoData = seoResult.status === 'fulfilled' ? seoResult.value : undefined;
    const statusReport = statusResult.status === 'fulfilled' ? statusResult.value : undefined;

    console.log(`[Analysis] Security: ${securityData ? 'OK' : 'FAIL'}, SEO: ${seoData ? 'OK' : 'FAIL'}, Status: ${statusReport ? 'OK' : 'FAIL'}`);

    // Build comprehensive response
    return NextResponse.json({
      domain: cleanDomain,

      // WHOIS Information (Enhanced)
      whois: whoisData ? {
        registrar: whoisData.registrar,
        registrarUrl: whoisData.registrarUrl,
        createdDate: whoisData.createdDate,
        updatedDate: whoisData.updatedDate,
        expiryDate: whoisData.expiryDate,
        registrant: whoisData.registrant,
        admin: whoisData.admin,
        tech: whoisData.tech,
        nameservers: whoisData.nameservers,
        status: whoisData.status,
        privacy: whoisData.privacy,
        locks: whoisData.locks,
        transferInfo: whoisData.transferInfo,
        dnssec: whoisData.dnssec,
      } : null,

      // DNS Records (New!)
      dns: dnsData ? {
        records: dnsData.records,
        emailSecurity: dnsData.emailSecurity,
        security: dnsData.security,
        ipAddresses: dnsData.ipAddresses,
        mailServers: dnsData.mailServers,
        nameservers: dnsData.nameservers,
        emailScore: dnsAPI.getEmailScore(dnsData),
      } : null,

      // Website Analysis (New!)
      website: websiteData ? {
        isOnline: websiteData.isOnline,
        httpStatus: websiteData.httpStatus,
        responseTime: websiteData.responseTime,
        ssl: websiteData.ssl,
        server: websiteData.server,
        technologies: websiteData.technologies,
        hosting: websiteData.hosting,
        security: websiteData.security,
        performance: websiteData.performance,
        techStack: websiteAnalyzer.getTechStack(websiteData),
      } : null,

      // Wayback Machine
      wayback: waybackData || null,

      // Security Analysis (New!)
      security: securityData ? {
        reputation: securityData.reputation,
        blacklists: securityData.blacklists,
        domainAge: securityData.domainAge,
        ownership: securityData.ownership,
        ssl: securityData.ssl,
        malware: securityData.malware,
        spam: securityData.spam,
        phishing: securityData.phishing,
        summary: securityAPI.getSecuritySummary(securityData),
      } : null,

      // SEO Analysis (New!)
      seo: seoData ? {
        domainAuthority: seoData.domainAuthority,
        backlinks: seoData.backlinks,
        content: seoData.content,
        traffic: seoData.traffic,
        keywords: seoData.keywords,
        history: seoData.history,
        seoHealth: seoData.seoHealth,
      } : null,

      // Domain Status Report
      statusReport,

      // Metadata
      analyzedAt: new Date().toISOString(),
      analysisVersion: '2.0',
    });
  } catch (error: any) {
    console.error('Domain analysis failed:', error);
    return NextResponse.json(
      { error: 'Analysis failed', message: error.message },
      { status: 500 }
    );
  }
}
