/**
 * Comprehensive DNS Lookup Integration
 * Fetches all DNS records for a domain using DNS over HTTPS (DoH)
 */

import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';
import { cacheService, CacheTTL, CacheNamespace } from '@/lib/cache/cache-service';

export interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl?: number;
  priority?: number;
}

export interface DNSAnalysis {
  domain: string;
  records: {
    A: DNSRecord[];
    AAAA: DNSRecord[];
    MX: DNSRecord[];
    TXT: DNSRecord[];
    CNAME: DNSRecord[];
    NS: DNSRecord[];
    SOA: DNSRecord[];
    CAA: DNSRecord[];
  };
  emailSecurity: {
    hasSPF: boolean;
    spfRecord?: string;
    hasDMARC: boolean;
    dmarcRecord?: string;
    hasDKIM: boolean;
  };
  security: {
    hasCAA: boolean;
    caaRecords: string[];
    dnssec: boolean;
  };
  ipAddresses: {
    ipv4: string[];
    ipv6: string[];
  };
  mailServers: Array<{
    hostname: string;
    priority: number;
    ip?: string;
  }>;
  nameservers: string[];
  timestamp: Date;
}

export class DNSAPI {
  private dohUrl = 'https://cloudflare-dns.com/dns-query';

  /**
   * Perform comprehensive DNS analysis (with caching)
   */
  async analyze(domain: string): Promise<DNSAnalysis> {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Try cache first
    return await cacheService.getOrSet(
      cleanDomain,
      async () => {
        const [
          aRecords,
          aaaaRecords,
          mxRecords,
          txtRecords,
          cnameRecords,
          nsRecords,
          soaRecords,
          caaRecords,
        ] = await Promise.allSettled([
          this.lookup(cleanDomain, 'A'),
          this.lookup(cleanDomain, 'AAAA'),
          this.lookup(cleanDomain, 'MX'),
          this.lookup(cleanDomain, 'TXT'),
          this.lookup(cleanDomain, 'CNAME'),
          this.lookup(cleanDomain, 'NS'),
          this.lookup(cleanDomain, 'SOA'),
          this.lookup(cleanDomain, 'CAA'),
        ]);

        const txtValues = txtRecords.status === 'fulfilled' ? txtRecords.value : [];
        const emailSecurity = this.analyzeEmailSecurity(txtValues);
        const caaValues = caaRecords.status === 'fulfilled' ? caaRecords.value : [];

        return {
          domain: cleanDomain,
          records: {
            A: aRecords.status === 'fulfilled' ? aRecords.value : [],
            AAAA: aaaaRecords.status === 'fulfilled' ? aaaaRecords.value : [],
            MX: mxRecords.status === 'fulfilled' ? mxRecords.value : [],
            TXT: txtValues,
            CNAME: cnameRecords.status === 'fulfilled' ? cnameRecords.value : [],
            NS: nsRecords.status === 'fulfilled' ? nsRecords.value : [],
            SOA: soaRecords.status === 'fulfilled' ? soaRecords.value : [],
            CAA: caaValues,
          },
          emailSecurity,
          security: {
            hasCAA: caaValues.length > 0,
        caaRecords: caaValues.map(r => r.value),
        dnssec: false, // Would need DNSSEC validation
      },
      ipAddresses: {
        ipv4: aRecords.status === 'fulfilled' ? aRecords.value.map(r => r.value) : [],
        ipv6: aaaaRecords.status === 'fulfilled' ? aaaaRecords.value.map(r => r.value) : [],
      },
          mailServers: mxRecords.status === 'fulfilled'
            ? mxRecords.value.map(r => ({
                hostname: r.value,
                priority: r.priority || 0,
              }))
            : [],
          nameservers: nsRecords.status === 'fulfilled' ? nsRecords.value.map(r => r.value) : [],
          timestamp: new Date(),
        };
      },
      { ttl: CacheTTL.DNS, namespace: CacheNamespace.DNS }
    );
  }

  /**
   * Lookup DNS records using Cloudflare DNS over HTTPS
   */
  private async lookup(domain: string, type: string): Promise<DNSRecord[]> {
    try {
      const url = `${this.dohUrl}?name=${encodeURIComponent(domain)}&type=${type}`;
      const response = await fetchWithTimeout(
        url,
        {
          headers: {
            Accept: 'application/dns-json',
          },
        },
        2000 // 2s timeout per DNS query
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      if (!data.Answer) {
        return [];
      }

      return data.Answer.map((record: any) => ({
        type: this.getRecordTypeName(record.type),
        name: record.name,
        value: this.formatRecordValue(record.data, type),
        ttl: record.TTL,
        priority: type === 'MX' ? this.extractMXPriority(record.data) : undefined,
      }));
    } catch (error) {
      console.error(`DNS lookup failed for ${domain} ${type}:`, error);
      return [];
    }
  }

  /**
   * Analyze email security records (SPF, DMARC, DKIM)
   */
  private analyzeEmailSecurity(txtRecords: DNSRecord[]): DNSAnalysis['emailSecurity'] {
    const txtValues = txtRecords.map(r => r.value);

    const spfRecord = txtValues.find(v => v.toLowerCase().startsWith('v=spf1'));
    const dmarcRecord = txtValues.find(v => v.toLowerCase().startsWith('v=dmarc1'));

    return {
      hasSPF: !!spfRecord,
      spfRecord,
      hasDMARC: !!dmarcRecord,
      dmarcRecord,
      hasDKIM: false, // DKIM requires checking _domainkey subdomain
    };
  }

  /**
   * Format record value based on type
   */
  private formatRecordValue(data: string, type: string): string {
    if (type === 'MX') {
      // MX records come as "priority hostname"
      const parts = data.split(' ');
      return parts.length > 1 ? parts.slice(1).join(' ') : data;
    }

    if (type === 'TXT') {
      // Remove quotes from TXT records
      return data.replace(/^"|"$/g, '');
    }

    return data;
  }

  /**
   * Extract MX priority from record data
   */
  private extractMXPriority(data: string): number {
    const parts = data.split(' ');
    return parts.length > 0 ? parseInt(parts[0], 10) : 0;
  }

  /**
   * Convert DNS record type number to name
   */
  private getRecordTypeName(type: number): string {
    const types: { [key: number]: string } = {
      1: 'A',
      2: 'NS',
      5: 'CNAME',
      6: 'SOA',
      15: 'MX',
      16: 'TXT',
      28: 'AAAA',
      257: 'CAA',
    };
    return types[type] || `TYPE${type}`;
  }

  /**
   * Check if domain has proper email configuration
   */
  hasEmailConfig(analysis: DNSAnalysis): boolean {
    return analysis.records.MX.length > 0 && analysis.emailSecurity.hasSPF;
  }

  /**
   * Get email deliverability score
   */
  getEmailScore(analysis: DNSAnalysis): number {
    let score = 0;
    if (analysis.records.MX.length > 0) score += 40;
    if (analysis.emailSecurity.hasSPF) score += 30;
    if (analysis.emailSecurity.hasDMARC) score += 20;
    if (analysis.emailSecurity.hasDKIM) score += 10;
    return score;
  }
}

// Export singleton instance
export const dnsAPI = new DNSAPI();
