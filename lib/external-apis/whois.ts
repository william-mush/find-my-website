/**
 * WHOIS Lookup Integration
 * Fetches domain registration information
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface WhoisData {
  domain: string;
  registrar?: string;
  registrarUrl?: string;
  registrarAbuseEmail?: string;
  registrarAbusePhone?: string;

  createdDate?: Date;
  updatedDate?: Date;
  expiryDate?: Date;

  registrant?: {
    name?: string;
    organization?: string;
    email?: string;
    phone?: string;
    country?: string;
  };

  nameservers?: string[];
  status?: string[];

  dnssec?: string;
  rawData?: string;
}

export class WhoisAPI {
  /**
   * Perform WHOIS lookup using system whois command
   */
  async lookup(domain: string): Promise<WhoisData> {
    try {
      const { stdout } = await execAsync(`whois ${domain}`);
      return this.parseWhoisData(domain, stdout);
    } catch (error) {
      console.error('WHOIS lookup failed:', error);
      throw new Error(`WHOIS lookup failed for ${domain}`);
    }
  }

  /**
   * Parse raw WHOIS data
   */
  private parseWhoisData(domain: string, rawData: string): WhoisData {
    const data: WhoisData = {
      domain,
      rawData,
    };

    const lines = rawData.split('\n');

    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      if (!key || !value) continue;

      const lowerKey = key.trim().toLowerCase();

      // Registrar info
      if (lowerKey.includes('registrar') && !lowerKey.includes('abuse')) {
        if (lowerKey === 'registrar') {
          data.registrar = value;
        } else if (lowerKey.includes('url') || lowerKey.includes('website')) {
          data.registrarUrl = value;
        }
      }

      // Abuse contacts
      if (lowerKey.includes('abuse')) {
        if (lowerKey.includes('email')) {
          data.registrarAbuseEmail = value;
        } else if (lowerKey.includes('phone')) {
          data.registrarAbusePhone = value;
        }
      }

      // Dates
      if (lowerKey.includes('creation date') || lowerKey.includes('created')) {
        data.createdDate = this.parseDate(value);
      }
      if (lowerKey.includes('updated date') || lowerKey.includes('last updated')) {
        data.updatedDate = this.parseDate(value);
      }
      if (
        lowerKey.includes('expir') ||
        lowerKey.includes('registry expiry date')
      ) {
        data.expiryDate = this.parseDate(value);
      }

      // Nameservers
      if (lowerKey.includes('name server')) {
        if (!data.nameservers) data.nameservers = [];
        data.nameservers.push(value.toLowerCase());
      }

      // Status
      if (lowerKey.includes('domain status') || lowerKey.includes('status')) {
        if (!data.status) data.status = [];
        data.status.push(value);
      }

      // Registrant info
      if (lowerKey.includes('registrant')) {
        if (!data.registrant) data.registrant = {};

        if (lowerKey.includes('name')) {
          data.registrant.name = value;
        } else if (lowerKey.includes('organization')) {
          data.registrant.organization = value;
        } else if (lowerKey.includes('email')) {
          data.registrant.email = value;
        } else if (lowerKey.includes('phone')) {
          data.registrant.phone = value;
        } else if (lowerKey.includes('country')) {
          data.registrant.country = value;
        }
      }

      // DNSSEC
      if (lowerKey.includes('dnssec')) {
        data.dnssec = value;
      }
    }

    return data;
  }

  /**
   * Parse date from WHOIS data
   */
  private parseDate(dateStr: string): Date | undefined {
    try {
      // Remove any trailing information like "(YYYY-MM-DD)"
      const cleaned = dateStr.split('(')[0].trim();
      const date = new Date(cleaned);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  /**
   * Determine if domain is expired
   */
  isExpired(whoisData: WhoisData): boolean {
    if (!whoisData.expiryDate) return false;
    return whoisData.expiryDate < new Date();
  }

  /**
   * Get days until expiry
   */
  getDaysUntilExpiry(whoisData: WhoisData): number | null {
    if (!whoisData.expiryDate) return null;

    const now = new Date();
    const diff = whoisData.expiryDate.getTime() - now.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if domain is in redemption period
   * (typically 30 days after expiry)
   */
  isInRedemptionPeriod(whoisData: WhoisData): boolean {
    if (!whoisData.expiryDate) return false;

    const now = new Date();
    const expiryTime = whoisData.expiryDate.getTime();
    const nowTime = now.getTime();

    const daysSinceExpiry = Math.floor(
      (nowTime - expiryTime) / (1000 * 60 * 60 * 24)
    );

    return daysSinceExpiry > 0 && daysSinceExpiry <= 30;
  }

  /**
   * Check if domain is in grace period
   * (typically 0-45 days after expiry, varies by registrar)
   */
  isInGracePeriod(whoisData: WhoisData): boolean {
    if (!whoisData.expiryDate) return false;

    const now = new Date();
    const expiryTime = whoisData.expiryDate.getTime();
    const nowTime = now.getTime();

    const daysSinceExpiry = Math.floor(
      (nowTime - expiryTime) / (1000 * 60 * 60 * 24)
    );

    return daysSinceExpiry > 0 && daysSinceExpiry <= 45;
  }
}

// Export singleton instance
export const whoisAPI = new WhoisAPI();
