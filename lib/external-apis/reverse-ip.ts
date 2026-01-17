/**
 * Reverse IP Lookup API
 * Find all domains hosted on the same IP address
 */

import { fetchWithTimeout } from '../utils/fetch-with-timeout';

export interface ReverseIPDomain {
  domain: string;
  lastSeen?: string;
}

export interface ReverseIPResult {
  ip: string;
  domains: ReverseIPDomain[];
  totalDomains: number;
  source: string;
  cached: boolean;
}

class ReverseIPAPI {
  /**
   * Get all domains hosted on the same IP address
   * Uses HackerTarget.com free API (50 queries/day)
   */
  async lookup(ip: string): Promise<ReverseIPResult> {
    console.log(`[ReverseIP] Looking up domains for IP: ${ip}`);
    const startTime = Date.now();

    try {
      // HackerTarget.com API - Free tier: 50/day, max 500 results
      const url = `https://api.hackertarget.com/reverseiplookup/?q=${encodeURIComponent(ip)}`;

      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'FindMyWebsite/1.0',
        },
      }, 3000); // 3 second timeout

      if (!response.ok) {
        console.error(`[ReverseIP] API error: ${response.status}`);
        return {
          ip,
          domains: [],
          totalDomains: 0,
          source: 'hackertarget',
          cached: false,
        };
      }

      const text = await response.text();

      // Check for error messages
      if (text.includes('error') || text.includes('API count exceeded')) {
        console.error(`[ReverseIP] API limit or error: ${text}`);
        return {
          ip,
          domains: [],
          totalDomains: 0,
          source: 'hackertarget',
          cached: false,
        };
      }

      // Parse response - domains are separated by newlines
      const domainList = text
        .split('\n')
        .map(d => d.trim())
        .filter(d => d.length > 0 && !d.startsWith('#'));

      const domains: ReverseIPDomain[] = domainList.map(domain => ({
        domain,
      }));

      console.log(`[ReverseIP] Found ${domains.length} domains in ${Date.now() - startTime}ms`);

      return {
        ip,
        domains,
        totalDomains: domains.length,
        source: 'hackertarget',
        cached: false,
      };
    } catch (error) {
      console.error('[ReverseIP] Lookup failed:', error);
      return {
        ip,
        domains: [],
        totalDomains: 0,
        source: 'hackertarget',
        cached: false,
      };
    }
  }

  /**
   * Get reverse IP lookup for a domain
   * First resolves domain to IP, then does reverse lookup
   */
  async lookupByDomain(domain: string): Promise<ReverseIPResult | null> {
    try {
      // Resolve domain to IP using DNS
      const dnsResponse = await fetchWithTimeout(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
        {},
        2000
      );

      if (!dnsResponse.ok) {
        console.error('[ReverseIP] DNS resolution failed');
        return null;
      }

      const dnsData = await dnsResponse.json();

      if (!dnsData.Answer || dnsData.Answer.length === 0) {
        console.error('[ReverseIP] No A records found');
        return null;
      }

      // Get first IP address
      const ip = dnsData.Answer[0].data;

      // Do reverse IP lookup
      return await this.lookup(ip);
    } catch (error) {
      console.error('[ReverseIP] Domain lookup failed:', error);
      return null;
    }
  }

  /**
   * Check if input is an IP address
   */
  isIPAddress(input: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(input) || ipv6Regex.test(input);
  }

  /**
   * Validate IPv4 address
   */
  isValidIPv4(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;

    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  /**
   * Check if IP is private/internal
   */
  isPrivateIP(ip: string): boolean {
    const parts = ip.split('.').map(Number);

    // Check for private ranges
    if (parts[0] === 10) return true; // 10.0.0.0/8
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 127) return true; // 127.0.0.0/8 (localhost)
    if (parts[0] === 0) return true; // 0.0.0.0/8
    if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.0.0/16 (link-local)

    return false;
  }
}

export const reverseIPAPI = new ReverseIPAPI();
