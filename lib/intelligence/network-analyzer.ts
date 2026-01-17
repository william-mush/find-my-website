/**
 * Network Analyzer
 * Aggregates network intelligence from multiple sources
 */

import { reverseIPAPI, ReverseIPResult } from '../external-apis/reverse-ip';
import { asnLookupAPI, NetworkInfo, ASNInfo, IPGeolocation } from '../external-apis/asn-lookup';

export interface NetworkIntelligence {
  input: string;
  inputType: 'ip' | 'domain';
  primaryIP: string;
  reverseIP: ReverseIPResult;
  networkInfo: NetworkInfo;
  relatedIPs: string[];
  infrastructure: {
    hostingProvider: string;
    networkType: string;
    isDatacenter: boolean;
    location: string;
    asn: string;
  };
  analysis: {
    sharedHosting: boolean;
    estimatedDomainCount: number;
    hostingEnvironment: 'Shared' | 'VPS' | 'Dedicated' | 'Cloud' | 'Unknown';
    securityRisk: 'Low' | 'Medium' | 'High';
    recommendations: string[];
  };
  analyzedAt: string;
}

export class NetworkAnalyzer {
  /**
   * Analyze network infrastructure for a domain or IP
   */
  async analyze(input: string, options?: { limit?: number }): Promise<NetworkIntelligence> {
    console.log(`[NetworkAnalyzer] Analyzing: ${input}`);
    const startTime = Date.now();

    const isIP = reverseIPAPI.isIPAddress(input);
    let primaryIP: string;

    // Step 1: Get primary IP address
    if (isIP) {
      if (!reverseIPAPI.isValidIPv4(input)) {
        throw new Error('Invalid IP address');
      }
      if (reverseIPAPI.isPrivateIP(input)) {
        throw new Error('Private IP addresses cannot be analyzed');
      }
      primaryIP = input;
    } else {
      // Resolve domain to IP
      const reverseIPResult = await reverseIPAPI.lookupByDomain(input);
      if (!reverseIPResult) {
        throw new Error('Could not resolve domain to IP address');
      }
      primaryIP = reverseIPResult.ip;
    }

    console.log(`[NetworkAnalyzer] Primary IP: ${primaryIP}`);

    // Step 2: Get reverse IP lookup (domains on same IP)
    const reverseIP = await reverseIPAPI.lookup(primaryIP);

    // Apply limit if specified
    if (options?.limit && reverseIP.domains.length > options.limit) {
      reverseIP.domains = reverseIP.domains.slice(0, options.limit);
      console.log(`[NetworkAnalyzer] Limited to ${options.limit} domains`);
    }

    // Step 3: Get ASN and network information
    const networkInfo = await asnLookupAPI.lookup(primaryIP);

    // Step 4: Get related IPs (from other domains on same IP)
    const relatedIPs = await this.getRelatedIPs(reverseIP.domains.slice(0, 5)); // Sample first 5

    // Step 5: Build infrastructure summary
    const infrastructure = this.buildInfrastructure(networkInfo);

    // Step 6: Analyze hosting environment
    const analysis = this.analyzeEnvironment(reverseIP, networkInfo);

    console.log(`[NetworkAnalyzer] Analysis complete in ${Date.now() - startTime}ms`);

    return {
      input,
      inputType: isIP ? 'ip' : 'domain',
      primaryIP,
      reverseIP,
      networkInfo,
      relatedIPs,
      infrastructure,
      analysis,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Get related IP addresses from domain list
   */
  private async getRelatedIPs(domains: { domain: string }[]): Promise<string[]> {
    const ips = new Set<string>();

    for (const { domain } of domains.slice(0, 3)) {
      try {
        const dnsResponse = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
          { signal: AbortSignal.timeout(2000) }
        );

        if (dnsResponse.ok) {
          const dnsData = await dnsResponse.json();
          if (dnsData.Answer) {
            dnsData.Answer.forEach((answer: any) => {
              if (answer.type === 1) {
                // A record
                ips.add(answer.data);
              }
            });
          }
        }
      } catch (error) {
        // Ignore errors, continue with next domain
      }
    }

    return Array.from(ips);
  }

  /**
   * Build infrastructure summary
   */
  private buildInfrastructure(networkInfo: NetworkInfo) {
    const hostingProvider = asnLookupAPI.getHostingProviderName(networkInfo.asn);
    const networkType = networkInfo.asn?.networkType || 'Unknown';
    const isDatacenter = networkInfo.asn?.isDatacenter || false;

    let location = 'Unknown';
    if (networkInfo.geolocation) {
      const parts = [
        networkInfo.geolocation.city,
        networkInfo.geolocation.region,
        networkInfo.geolocation.country,
      ].filter(Boolean);
      location = parts.join(', ');
    }

    const asn = networkInfo.asn
      ? `AS${networkInfo.asn.asn} (${networkInfo.asn.asnOrganization})`
      : 'Unknown';

    return {
      hostingProvider,
      networkType,
      isDatacenter,
      location,
      asn,
    };
  }

  /**
   * Analyze hosting environment and security
   */
  private analyzeEnvironment(
    reverseIP: ReverseIPResult,
    networkInfo: NetworkInfo
  ) {
    const domainCount = reverseIP.totalDomains;
    const isDatacenter = networkInfo.asn?.isDatacenter || false;

    // Determine hosting environment
    let hostingEnvironment: 'Shared' | 'VPS' | 'Dedicated' | 'Cloud' | 'Unknown' = 'Unknown';
    let sharedHosting = false;

    if (domainCount === 1) {
      hostingEnvironment = isDatacenter ? 'Dedicated' : 'VPS';
      sharedHosting = false;
    } else if (domainCount >= 2 && domainCount <= 10) {
      hostingEnvironment = isDatacenter ? 'Cloud' : 'VPS';
      sharedHosting = true;
    } else if (domainCount > 10) {
      hostingEnvironment = 'Shared';
      sharedHosting = true;
    }

    // Determine security risk
    let securityRisk: 'Low' | 'Medium' | 'High' = 'Low';

    if (domainCount > 100) {
      securityRisk = 'High'; // Many domains = higher risk of bad neighbors
    } else if (domainCount > 20) {
      securityRisk = 'Medium';
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (sharedHosting && domainCount > 50) {
      recommendations.push('Consider upgrading to VPS or dedicated server for better isolation');
    }

    if (securityRisk === 'High') {
      recommendations.push('High number of domains on same IP may affect email deliverability');
      recommendations.push('Monitor for malicious activity from neighboring sites');
    }

    if (hostingEnvironment === 'Cloud' || hostingEnvironment === 'Dedicated') {
      recommendations.push('Good hosting environment for production workloads');
    }

    if (!isDatacenter && domainCount > 1) {
      recommendations.push('Non-datacenter hosting may indicate residential or business network');
    }

    return {
      sharedHosting,
      estimatedDomainCount: domainCount,
      hostingEnvironment,
      securityRisk,
      recommendations,
    };
  }
}

export const networkAnalyzer = new NetworkAnalyzer();
