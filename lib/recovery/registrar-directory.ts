/**
 * Directory of major domain registrars with contact information,
 * recovery URLs, and policies. Used to help users reach the right
 * support team when recovering a domain.
 */

export interface RegistrarContactInfo {
  name: string;
  alternatenames: string[];
  supportPhone?: string;
  supportEmail?: string;
  supportUrl: string;
  recoveryUrl?: string;
  redemptionFee?: string;
  gracePeriodDays?: number;
  notes?: string;
}

export const REGISTRAR_DIRECTORY: RegistrarContactInfo[] = [
  {
    name: "GoDaddy",
    alternatenames: [
      "GoDaddy.com, LLC",
      "GoDaddy.com LLC",
      "GoDaddy Operating Company, LLC",
      "Wild West Domains",
      "Wild West Domains, LLC",
    ],
    supportPhone: "+1-480-505-8877",
    supportUrl: "https://www.godaddy.com/help",
    recoveryUrl: "https://www.godaddy.com/help/recovering-expired-domain-names-6700",
    redemptionFee: "$80",
    gracePeriodDays: 18,
    notes:
      "GoDaddy has an 18-day grace period followed by a 12-day auction period, then a 30-day redemption period. Domains may be auctioned during the post-expiration period.",
  },
  {
    name: "Namecheap",
    alternatenames: [
      "Namecheap, Inc.",
      "Namecheap Inc",
      "NAMECHEAP INC",
      "NameCheap",
    ],
    supportEmail: "support@namecheap.com",
    supportUrl: "https://www.namecheap.com/support/",
    recoveryUrl: "https://www.namecheap.com/support/knowledgebase/article.aspx/816/2210/what-happens-when-a-domain-expires/",
    redemptionFee: "$80 (varies by TLD)",
    gracePeriodDays: 30,
    notes:
      "Namecheap provides a 30-day grace period for most TLDs. Auto-renewal is available and recommended. Live chat support is available 24/7.",
  },
  {
    name: "Cloudflare Registrar",
    alternatenames: [
      "Cloudflare, Inc.",
      "Cloudflare Inc",
      "CLOUDFLARE",
      "Cloudflare Registrar",
    ],
    supportUrl: "https://support.cloudflare.com",
    recoveryUrl: "https://developers.cloudflare.com/registrar/",
    gracePeriodDays: 40,
    notes:
      "Cloudflare sells domains at wholesale cost with no markup. Support is primarily through their online portal and community forums. Grace period is typically 40 days for most TLDs.",
  },
  {
    name: "Google Domains",
    alternatenames: [
      "Google LLC",
      "Google Domains",
      "Google Inc.",
      "MarkMonitor Inc.",
      "MarkMonitor, Inc.",
    ],
    supportUrl: "https://domains.google/support/",
    recoveryUrl: "https://support.google.com/domains/answer/6339340",
    redemptionFee: "Varies by TLD",
    gracePeriodDays: 30,
    notes:
      "Google Domains was partially transitioned to Squarespace in 2023-2024. Some domains may now be managed through Squarespace Domains. Check both platforms if you cannot locate your domain.",
  },
  {
    name: "Network Solutions",
    alternatenames: [
      "Network Solutions, LLC",
      "Network Solutions LLC",
      "NetSol",
      "NETWORK SOLUTIONS",
    ],
    supportPhone: "+1-866-391-4357",
    supportUrl: "https://www.networksolutions.com/support/",
    recoveryUrl: "https://www.networksolutions.com/support/what-happens-when-a-domain-name-expires/",
    redemptionFee: "$150-$200",
    gracePeriodDays: 30,
    notes:
      "Network Solutions is one of the oldest registrars. Redemption fees tend to be higher than competitors. Phone support is available during business hours.",
  },
  {
    name: "Tucows / Hover",
    alternatenames: [
      "Tucows Domains Inc.",
      "Tucows Domains Inc",
      "Tucows, Inc.",
      "TUCOWS",
      "Hover",
      "Hover.com",
      "OpenSRS",
      "Tucows (Hover)",
    ],
    supportPhone: "+1-416-535-0123",
    supportEmail: "help@hover.com",
    supportUrl: "https://help.hover.com",
    recoveryUrl: "https://help.hover.com/hc/en-us/articles/217282457",
    redemptionFee: "$80-$100",
    gracePeriodDays: 40,
    notes:
      "Tucows operates the Hover retail brand and OpenSRS wholesale platform. Many smaller registrars use Tucows/OpenSRS as their backend. If your WHOIS shows Tucows, your retail registrar may be Hover or another reseller.",
  },
  {
    name: "Name.com",
    alternatenames: [
      "Name.com, Inc.",
      "Name.com Inc",
      "Name.com LLC",
      "NAME.COM",
      "Donuts (Name.com)",
    ],
    supportPhone: "+1-720-249-2374",
    supportEmail: "support@name.com",
    supportUrl: "https://www.name.com/support",
    recoveryUrl: "https://www.name.com/support/articles/205188488",
    redemptionFee: "$100",
    gracePeriodDays: 26,
    notes:
      "Name.com is now part of the Identity Digital (formerly Donuts) family. They offer a 26-day grace period for most gTLDs.",
  },
  {
    name: "Dynadot",
    alternatenames: [
      "Dynadot, LLC",
      "Dynadot LLC",
      "Dynadot Inc",
      "DYNADOT",
    ],
    supportEmail: "support@dynadot.com",
    supportUrl: "https://www.dynadot.com/community/help",
    recoveryUrl: "https://www.dynadot.com/community/help/question/grace-period",
    redemptionFee: "$80",
    gracePeriodDays: 30,
    notes:
      "Dynadot is a smaller registrar popular with domain investors due to competitive pricing and a clean interface. Support is primarily via email and help center.",
  },
  {
    name: "Porkbun",
    alternatenames: [
      "Porkbun LLC",
      "Porkbun, LLC",
      "PORKBUN",
      "Porkbun.com",
    ],
    supportEmail: "support@porkbun.com",
    supportUrl: "https://kb.porkbun.com",
    recoveryUrl: "https://kb.porkbun.com/article/7-what-happens-when-my-domain-expires",
    redemptionFee: "Varies by TLD",
    gracePeriodDays: 30,
    notes:
      "Porkbun is known for competitive pricing, free WHOIS privacy, and free SSL certificates. They have responsive email support and an active knowledge base.",
  },
  {
    name: "1&1 IONOS",
    alternatenames: [
      "1&1 IONOS SE",
      "1&1 IONOS Inc.",
      "IONOS SE",
      "IONOS",
      "1&1 Internet AG",
      "1&1",
      "United Internet",
      "IONOS Inc",
    ],
    supportPhone: "+1-484-254-5555",
    supportUrl: "https://www.ionos.com/help",
    recoveryUrl: "https://www.ionos.com/help/domains/domain-expiration/",
    redemptionFee: "$100-$150",
    gracePeriodDays: 30,
    notes:
      "1&1 IONOS is a large European registrar and hosting provider. They offer phone support and have bundled hosting and domain packages. Domain management can be found in their control panel.",
  },
  {
    name: "Gandi",
    alternatenames: [
      "Gandi SAS",
      "GANDI SAS",
      "Gandi.net",
      "GANDI",
    ],
    supportEmail: "support@gandi.net",
    supportUrl: "https://docs.gandi.net",
    recoveryUrl: "https://docs.gandi.net/en/domain_names/renew/",
    redemptionFee: "Varies by TLD (typically included in renewal cost)",
    gracePeriodDays: 30,
    notes:
      "Gandi is a French registrar known for its 'No Bullshit' philosophy. They include WHOIS privacy free with all domains. Support is available via email and their documentation is thorough.",
  },
  {
    name: "OVH / OVHcloud",
    alternatenames: [
      "OVH SAS",
      "OVH",
      "OVHcloud",
      "OVH Hosting",
      "OVH, SAS",
    ],
    supportPhone: "+1-855-684-5463",
    supportUrl: "https://help.ovhcloud.com",
    recoveryUrl: "https://help.ovhcloud.com/csm/en-gb-documentation-domains?id=kb_browse_cat&kb_id=3789e24cd4fd1858f7e86da6ce19717a",
    redemptionFee: "Varies by TLD",
    gracePeriodDays: 30,
    notes:
      "OVH is a major European hosting and domain provider. They have data centers worldwide and offer competitive domain pricing. Support is available via phone and their help center.",
  },
  {
    name: "eNom",
    alternatenames: [
      "eNom, LLC",
      "eNom LLC",
      "eNom, Inc.",
      "ENOM",
      "eNom Inc",
      "Tucows (eNom)",
    ],
    supportUrl: "https://www.enom.com/help",
    recoveryUrl: "https://www.enom.com/help/domain-renewals",
    redemptionFee: "$80-$160",
    gracePeriodDays: 30,
    notes:
      "eNom was acquired by Tucows in 2017. Many resellers and web hosting companies use eNom as their backend registrar. If WHOIS shows eNom, your actual provider may be a hosting company or reseller.",
  },
  {
    name: "NameSilo",
    alternatenames: [
      "NameSilo, LLC",
      "NameSilo LLC",
      "NAMESILO",
      "NameSilo.com",
    ],
    supportEmail: "support@namesilo.com",
    supportUrl: "https://www.namesilo.com/support",
    recoveryUrl: "https://www.namesilo.com/support/v2/articles/domain-manager/renew-domain",
    redemptionFee: "$80",
    gracePeriodDays: 30,
    notes:
      "NameSilo is popular with domain investors for low prices and free WHOIS privacy. They offer no-frills service with competitive renewal rates. Support is primarily via email.",
  },
  {
    name: "Bluehost / HostGator",
    alternatenames: [
      "Bluehost Inc.",
      "Bluehost",
      "BLUEHOST",
      "HostGator",
      "HostGator.com",
      "HostGator.com LLC",
      "Endurance International Group",
      "Newfold Digital",
      "Newfold Digital, Inc.",
      "BLUEHOST.COM",
      "HOSTGATOR.COM",
    ],
    supportPhone: "+1-888-401-4678",
    supportUrl: "https://www.bluehost.com/help",
    recoveryUrl: "https://www.bluehost.com/help/article/domain-renew",
    redemptionFee: "$80-$150",
    gracePeriodDays: 30,
    notes:
      "Bluehost and HostGator are both owned by Newfold Digital (formerly Endurance International Group) and share the same backend domain infrastructure. If your domain was registered through either, you can contact the same parent company. Phone support is available 24/7.",
  },
  {
    name: "Squarespace Domains",
    alternatenames: [
      "Squarespace Domains LLC",
      "Squarespace",
      "SQUARESPACE",
      "Squarespace Domains II LLC",
    ],
    supportUrl: "https://support.squarespace.com/hc/en-us/categories/200337877-Domains",
    recoveryUrl: "https://support.squarespace.com/hc/en-us/articles/205812378",
    gracePeriodDays: 30,
    notes:
      "Squarespace acquired Google Domains assets in 2023-2024. If your domain was originally on Google Domains, it may now be managed through Squarespace. Support is available via live chat and email.",
  },
];

/**
 * Find a registrar by matching a WHOIS registrar name string.
 * Performs case-insensitive substring matching against both the
 * primary name and all alternate names.
 *
 * @param whoisRegistrarName - The registrar name string from a WHOIS lookup
 * @returns The matching RegistrarContactInfo, or null if no match is found
 */
export function findRegistrar(
  whoisRegistrarName: string
): RegistrarContactInfo | null {
  if (!whoisRegistrarName || whoisRegistrarName.trim() === "") {
    return null;
  }

  const query = whoisRegistrarName.toLowerCase().trim();

  // First pass: look for exact match on primary name (case-insensitive)
  for (const registrar of REGISTRAR_DIRECTORY) {
    if (registrar.name.toLowerCase() === query) {
      return registrar;
    }
  }

  // Second pass: look for exact match on any alternate name
  for (const registrar of REGISTRAR_DIRECTORY) {
    for (const altName of registrar.alternatenames) {
      if (altName.toLowerCase() === query) {
        return registrar;
      }
    }
  }

  // Third pass: check if the query is a substring of any name, or vice versa
  // Score by how closely the lengths match (prefer tighter matches)
  let bestMatch: RegistrarContactInfo | null = null;
  let bestScore = Infinity;

  for (const registrar of REGISTRAR_DIRECTORY) {
    const allNames = [registrar.name, ...registrar.alternatenames];

    for (const name of allNames) {
      const nameLower = name.toLowerCase();

      if (nameLower.includes(query) || query.includes(nameLower)) {
        // Score: difference in length -- smaller difference means better match
        const score = Math.abs(nameLower.length - query.length);
        if (score < bestScore) {
          bestScore = score;
          bestMatch = registrar;
        }
      }
    }
  }

  return bestMatch;
}
