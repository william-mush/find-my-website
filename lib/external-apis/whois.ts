/**
 * WHOIS Lookup Integration
 * Fetches domain registration information using HTTP API (Vercel-compatible)
 */

export interface WhoisData {
  domain: string;
  registrar?: string;
  registrarUrl?: string;
  registrarAbuseEmail?: string;
  registrarAbusePhone?: string;
  registrarIANAId?: string;

  createdDate?: Date;
  updatedDate?: Date;
  expiryDate?: Date;

  registrant?: {
    name?: string;
    organization?: string;
    email?: string;
    phone?: string;
    country?: string;
    state?: string;
    city?: string;
    address?: string;
    postalCode?: string;
  };

  admin?: {
    name?: string;
    organization?: string;
    email?: string;
    phone?: string;
  };

  tech?: {
    name?: string;
    organization?: string;
    email?: string;
    phone?: string;
  };

  nameservers?: string[];
  status?: string[];

  privacy: {
    isPrivate: boolean;
    proxyService?: string;
  };

  dnssec?: string;

  locks: {
    transferLocked: boolean;
    updateLocked: boolean;
    deleteLocked: boolean;
  };

  transferInfo: {
    isEligible: boolean;
    daysUntilEligible?: number;
    authCodeRequired: boolean;
  };

  rawData?: string;
}

export class WhoisAPI {
  private apiUrl: string;

  constructor() {
    // Use whois.whoisxmlapi.com free tier (1000 requests/month)
    // Or fallback to jsonwhois.com
    this.apiUrl = 'https://www.whoisxmlapi.com/whoisserver/WhoisService';
  }

  /**
   * Perform WHOIS lookup using HTTP API
   */
  async lookup(domain: string): Promise<WhoisData> {
    try {
      // Try primary API first (WhoisXML API)
      if (process.env.WHOISXML_API_KEY) {
        return await this.lookupWithWhoisXML(domain);
      }

      // Fallback to free API
      return await this.lookupWithFreeAPI(domain);
    } catch (error) {
      console.error('WHOIS lookup failed:', error);

      // Return minimal data instead of throwing
      return {
        domain,
        privacy: {
          isPrivate: false,
        },
        locks: {
          transferLocked: false,
          updateLocked: false,
          deleteLocked: false,
        },
        transferInfo: {
          isEligible: false,
          authCodeRequired: true,
        },
        rawData: 'WHOIS lookup unavailable',
      };
    }
  }

  /**
   * Lookup using WhoisXML API (paid, reliable)
   */
  private async lookupWithWhoisXML(domain: string): Promise<WhoisData> {
    const url = `${this.apiUrl}?apiKey=${process.env.WHOISXML_API_KEY}&domainName=${domain}&outputFormat=JSON`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`WhoisXML API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseWhoisXMLResponse(domain, data);
  }

  /**
   * Lookup using free API (jsonwhois.com)
   */
  private async lookupWithFreeAPI(domain: string): Promise<WhoisData> {
    try {
      // Use rdap.org (free, reliable alternative)
      const rdapUrl = `https://rdap.org/domain/${domain}`;
      const response = await fetch(rdapUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`RDAP API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseRDAPResponse(domain, data);
    } catch (error) {
      console.error('Free WHOIS lookup failed:', error);

      // Return basic data
      return {
        domain,
        privacy: {
          isPrivate: false,
        },
        locks: {
          transferLocked: false,
          updateLocked: false,
          deleteLocked: false,
        },
        transferInfo: {
          isEligible: false,
          authCodeRequired: true,
        },
        rawData: 'WHOIS data temporarily unavailable',
      };
    }
  }

  /**
   * Parse WhoisXML API response
   */
  private parseWhoisXMLResponse(domain: string, data: any): WhoisData {
    const whoisRecord = data.WhoisRecord || {};
    const registryData = whoisRecord.registryData || {};
    const registrant = whoisRecord.registrant || {};

    const statuses = whoisRecord.status || [];

    return {
      domain,
      registrar: whoisRecord.registrarName,
      registrarUrl: whoisRecord.registrarUrl,
      createdDate: this.parseDate(whoisRecord.createdDate),
      updatedDate: this.parseDate(whoisRecord.updatedDate),
      expiryDate: this.parseDate(whoisRecord.expiresDate),
      registrant: {
        name: registrant.name,
        organization: registrant.organization,
        email: registrant.email,
        phone: registrant.telephone,
        country: registrant.country,
      },
      nameservers: whoisRecord.nameServers?.hostNames || [],
      status: statuses,
      privacy: {
        isPrivate: registrant.name?.toUpperCase().includes('REDACTED') || false,
      },
      locks: {
        transferLocked: statuses.some((s: string) =>
          s.toLowerCase().includes('transferprohibited')
        ),
        updateLocked: statuses.some((s: string) =>
          s.toLowerCase().includes('updateprohibited')
        ),
        deleteLocked: statuses.some((s: string) =>
          s.toLowerCase().includes('deleteprohibited')
        ),
      },
      transferInfo: {
        isEligible: true,
        authCodeRequired: true,
      },
      rawData: JSON.stringify(data, null, 2),
    };
  }

  /**
   * Parse RDAP response (free API)
   */
  private parseRDAPResponse(domain: string, data: any): WhoisData {
    const events = data.events || [];
    const entities = data.entities || [];

    // Find registrar
    const registrarEntity = entities.find((e: any) =>
      e.roles?.includes('registrar')
    );

    // Find important dates
    const createdEvent = events.find((e: any) => e.eventAction === 'registration');
    const updatedEvent = events.find((e: any) => e.eventAction === 'last changed');
    const expiryEvent = events.find((e: any) => e.eventAction === 'expiration');

    // Find registrant
    const registrantEntity = entities.find((e: any) =>
      e.roles?.includes('registrant')
    );

    // Find admin contact
    const adminEntity = entities.find((e: any) =>
      e.roles?.includes('administrative')
    );

    // Find tech contact
    const techEntity = entities.find((e: any) =>
      e.roles?.includes('technical')
    );

    // Parse vCard data
    const parseVCard = (entity: any) => {
      if (!entity?.vcardArray?.[1]) return {};

      const vcard = entity.vcardArray[1];
      return {
        name: vcard.find((v: any) => v[0] === 'fn')?.[3],
        organization: vcard.find((v: any) => v[0] === 'org')?.[3],
        email: vcard.find((v: any) => v[0] === 'email')?.[3],
        phone: vcard.find((v: any) => v[0] === 'tel')?.[3],
        address: vcard.find((v: any) => v[0] === 'adr')?.[3],
      };
    };

    const registrantData = parseVCard(registrantEntity);
    const adminData = parseVCard(adminEntity);
    const techData = parseVCard(techEntity);

    // Check for privacy/proxy
    const registrantName = registrantData.name?.toUpperCase() || '';
    const isPrivate = registrantName.includes('REDACTED') ||
                      registrantName.includes('PRIVACY') ||
                      registrantName.includes('PROXY') ||
                      registrantName.includes('WHOISGUARD');

    // Check domain locks
    const statuses = data.status || [];
    const locks = {
      transferLocked: statuses.some((s: string) =>
        s.toLowerCase().includes('clienttransferprohibited') ||
        s.toLowerCase().includes('servertransferprohibited')
      ),
      updateLocked: statuses.some((s: string) =>
        s.toLowerCase().includes('clientupdateprohibited')
      ),
      deleteLocked: statuses.some((s: string) =>
        s.toLowerCase().includes('clientdeleteprohibited')
      ),
    };

    // Calculate transfer eligibility
    const createdDate = createdEvent ? new Date(createdEvent.eventDate) : undefined;
    const daysSinceCreation = createdDate
      ? Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const transferInfo = {
      isEligible: !locks.transferLocked && daysSinceCreation >= 60,
      daysUntilEligible: daysSinceCreation < 60 ? 60 - daysSinceCreation : 0,
      authCodeRequired: true,
    };

    return {
      domain,
      registrar: registrarEntity?.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3],
      createdDate: createdEvent ? new Date(createdEvent.eventDate) : undefined,
      updatedDate: updatedEvent ? new Date(updatedEvent.eventDate) : undefined,
      expiryDate: expiryEvent ? new Date(expiryEvent.eventDate) : undefined,
      registrant: registrantEntity ? {
        name: registrantData.name,
        organization: registrantData.organization,
        email: registrantData.email,
        phone: registrantData.phone,
      } : undefined,
      admin: adminEntity ? {
        name: adminData.name,
        organization: adminData.organization,
        email: adminData.email,
        phone: adminData.phone,
      } : undefined,
      tech: techEntity ? {
        name: techData.name,
        organization: techData.organization,
        email: techData.email,
        phone: techData.phone,
      } : undefined,
      nameservers: data.nameservers?.map((ns: any) => ns.ldhName) || [],
      status: statuses,
      privacy: {
        isPrivate,
        proxyService: isPrivate ? registrantData.organization : undefined,
      },
      locks,
      transferInfo,
      rawData: JSON.stringify(data, null, 2),
    };
  }

  /**
   * Parse date from WHOIS data
   */
  private parseDate(dateStr: string | undefined): Date | undefined {
    if (!dateStr) return undefined;

    try {
      const date = new Date(dateStr);
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
