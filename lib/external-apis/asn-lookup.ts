/**
 * ASN (Autonomous System Number) Lookup API
 * Get hosting provider, organization, and network information for an IP
 */

import { fetchWithTimeout } from '../utils/fetch-with-timeout';

export interface ASNInfo {
  asn: number;
  asnOrganization: string;
  asnCountry: string;
  asnRegistry: string;
  networkType?: 'ISP' | 'Hosting' | 'Education' | 'Business' | 'Government' | 'Unknown';
  isHosting: boolean;
  isDatacenter: boolean;
  hostingProvider?: string;
  routes?: string[];
}

export interface IPGeolocation {
  ip: string;
  city?: string;
  region?: string;
  country: string;
  countryCode: string;
  continent?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  organization?: string;
}

export interface NetworkInfo {
  ip: string;
  asn: ASNInfo | null;
  geolocation: IPGeolocation | null;
  source: string;
}

class ASNLookupAPI {
  /**
   * Get ASN and network information for an IP address
   * Uses ipapi.is API (free tier with excellent hosting detection)
   */
  async lookup(ip: string): Promise<NetworkInfo> {
    console.log(`[ASN] Looking up network info for IP: ${ip}`);
    const startTime = Date.now();

    try {
      // ipapi.is - Free tier with accurate hosting detection
      const url = `https://api.ipapi.is/?q=${encodeURIComponent(ip)}`;

      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'FindMyWebsite/1.0',
        },
      }, 3000); // 3 second timeout

      if (!response.ok) {
        console.error(`[ASN] API error: ${response.status}`);
        return this.getEmptyResult(ip);
      }

      const data = await response.json();

      // Parse ASN information
      const asn: ASNInfo | null = data.asn ? {
        asn: data.asn.asn || 0,
        asnOrganization: data.asn.org || data.asn.name || 'Unknown',
        asnCountry: data.asn.country || data.location?.country || 'Unknown',
        asnRegistry: data.asn.registry || 'Unknown',
        networkType: this.detectNetworkType(data),
        isHosting: data.company?.type === 'hosting' || data.is_datacenter === true,
        isDatacenter: data.is_datacenter === true,
        hostingProvider: data.company?.name || undefined,
        routes: data.asn.routes || [],
      } : null;

      // Parse geolocation
      const geolocation: IPGeolocation | null = data.location ? {
        ip,
        city: data.location.city || undefined,
        region: data.location.state || undefined,
        country: data.location.country || 'Unknown',
        countryCode: data.location.country_code || 'XX',
        continent: data.location.continent || undefined,
        latitude: data.location.latitude || undefined,
        longitude: data.location.longitude || undefined,
        timezone: data.location.timezone || undefined,
        organization: data.company?.name || data.asn?.org || undefined,
      } : null;

      console.log(`[ASN] Network info retrieved in ${Date.now() - startTime}ms`);

      return {
        ip,
        asn,
        geolocation,
        source: 'ipapi.is',
      };
    } catch (error) {
      console.error('[ASN] Lookup failed:', error);
      return this.getEmptyResult(ip);
    }
  }

  /**
   * Detect network type based on API response
   */
  private detectNetworkType(data: any): ASNInfo['networkType'] {
    if (data.company?.type === 'hosting' || data.is_datacenter) {
      return 'Hosting';
    }
    if (data.company?.type === 'isp') {
      return 'ISP';
    }
    if (data.company?.type === 'education' || data.asn?.type === 'education') {
      return 'Education';
    }
    if (data.company?.type === 'business') {
      return 'Business';
    }
    if (data.company?.type === 'government') {
      return 'Government';
    }
    return 'Unknown';
  }

  /**
   * Fallback ASN lookup using HackerTarget (if ipapi.is fails)
   */
  async lookupFallback(ip: string): Promise<NetworkInfo> {
    console.log(`[ASN] Fallback lookup for IP: ${ip}`);

    try {
      const url = `https://api.hackertarget.com/aslookup/?q=${encodeURIComponent(ip)}`;

      const response = await fetchWithTimeout(url, {}, 2000);

      if (!response.ok) {
        return this.getEmptyResult(ip);
      }

      const text = await response.text();

      // Parse response format: "AS15169" or "AS15169 GOOGLE, US"
      const match = text.match(/AS(\d+)\s*(.*)/);

      if (!match) {
        return this.getEmptyResult(ip);
      }

      const asnNumber = parseInt(match[1], 10);
      const orgInfo = match[2] || '';
      const parts = orgInfo.split(',').map(p => p.trim());

      const asn: ASNInfo = {
        asn: asnNumber,
        asnOrganization: parts[0] || 'Unknown',
        asnCountry: parts[1] || 'Unknown',
        asnRegistry: 'Unknown',
        isHosting: false,
        isDatacenter: false,
      };

      return {
        ip,
        asn,
        geolocation: null,
        source: 'hackertarget-fallback',
      };
    } catch (error) {
      console.error('[ASN] Fallback lookup failed:', error);
      return this.getEmptyResult(ip);
    }
  }

  /**
   * Get empty result structure
   */
  private getEmptyResult(ip: string): NetworkInfo {
    return {
      ip,
      asn: null,
      geolocation: null,
      source: 'none',
    };
  }

  /**
   * Get hosting provider name from ASN data
   */
  getHostingProviderName(asn: ASNInfo | null): string {
    if (!asn) return 'Unknown';

    if (asn.hostingProvider) {
      return asn.hostingProvider;
    }

    // Common hosting providers by ASN organization name
    const org = asn.asnOrganization.toLowerCase();

    if (org.includes('amazon') || org.includes('aws')) return 'Amazon Web Services (AWS)';
    if (org.includes('google') || org.includes('gcp')) return 'Google Cloud Platform';
    if (org.includes('microsoft') || org.includes('azure')) return 'Microsoft Azure';
    if (org.includes('digitalocean')) return 'DigitalOcean';
    if (org.includes('linode') || org.includes('akamai')) return 'Linode (Akamai)';
    if (org.includes('ovh')) return 'OVH';
    if (org.includes('hetzner')) return 'Hetzner';
    if (org.includes('cloudflare')) return 'Cloudflare';
    if (org.includes('fastly')) return 'Fastly';
    if (org.includes('vultr')) return 'Vultr';

    return asn.asnOrganization;
  }
}

export const asnLookupAPI = new ASNLookupAPI();
