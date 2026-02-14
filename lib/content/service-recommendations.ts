/**
 * Static data for recommended domain recovery services, proof of ownership items,
 * and helper functions to match services to domain statuses.
 */

export interface ServiceRecommendation {
  name: string;
  url: string;
  category:
    | "registrar"
    | "backorder"
    | "broker"
    | "legal"
    | "escrow"
    | "aftermarket"
    | "hosting"
    | "recovery";
  description: string;
  pricing: string;
  bestFor: string;
}

export const SERVICES: ServiceRecommendation[] = [
  // ── Registrars ──────────────────────────────────────────────
  {
    name: "GoDaddy",
    url: "https://www.godaddy.com",
    category: "registrar",
    description:
      "The world's largest domain registrar with 24/7 phone support and domain recovery assistance.",
    pricing: "Domains from ~$12/yr; redemption fee ~$80",
    bestFor:
      "Users who want phone support and a well-known, widely used registrar.",
  },
  {
    name: "Namecheap",
    url: "https://www.namecheap.com",
    category: "registrar",
    description:
      "Popular registrar known for competitive pricing and free WHOIS privacy on all domains.",
    pricing: "Domains from ~$9/yr; redemption fee ~$80",
    bestFor:
      "Budget-conscious users who want free privacy protection included.",
  },
  {
    name: "Cloudflare Registrar",
    url: "https://www.cloudflare.com/products/registrar/",
    category: "registrar",
    description:
      "At-cost domain registration with no markup, bundled with Cloudflare's CDN and security features.",
    pricing: "Domains at wholesale cost (no markup); varies by TLD",
    bestFor:
      "Technical users who want the lowest possible renewal price and integrated CDN/security.",
  },
  {
    name: "Porkbun",
    url: "https://porkbun.com",
    category: "registrar",
    description:
      "Budget-friendly registrar with free WHOIS privacy and SSL certificates on all domains.",
    pricing: "Domains from ~$7/yr depending on TLD",
    bestFor:
      "Users looking for low prices with free privacy and SSL included.",
  },
  {
    name: "Google Domains",
    url: "https://domains.google",
    category: "registrar",
    description:
      "Google's domain registrar with clean interface, free privacy, and tight integration with Google Workspace.",
    pricing: "Domains from ~$12/yr; free WHOIS privacy",
    bestFor:
      "Users in the Google ecosystem who want seamless Google Workspace integration.",
  },

  // ── Backorder Services ──────────────────────────────────────
  {
    name: "SnapNames",
    url: "https://www.snapnames.com",
    category: "backorder",
    description:
      "One of the oldest and most established domain backorder services, now owned by Web.com.",
    pricing: "Backorder fee ~$69; auction if multiple bidders",
    bestFor:
      "Catching high-value expiring domains with professional-grade tools.",
  },
  {
    name: "DropCatch",
    url: "https://www.dropcatch.com",
    category: "backorder",
    description:
      "Competitive backorder service known for strong catch rates on expiring domains.",
    pricing: "Starting at ~$59 per backorder; auction for contested names",
    bestFor:
      "Users who want a reliable alternative to SnapNames for catching dropping domains.",
  },
  {
    name: "NameJet",
    url: "https://www.namejet.com",
    category: "backorder",
    description:
      "Backorder and auction platform with access to expiring domains from major registrars.",
    pricing: "Backorder fee ~$79; auction system for contested names",
    bestFor:
      "Accessing premium expiring domains through auction-style bidding.",
  },
  {
    name: "GoDaddy Backorders",
    url: "https://www.godaddy.com/domains/domain-backorder",
    category: "backorder",
    description:
      "GoDaddy's backorder service with integration into their large registrar platform.",
    pricing: "~$25 per backorder attempt",
    bestFor:
      "GoDaddy customers who want a simple backorder option within their existing account.",
  },

  // ── Brokers ─────────────────────────────────────────────────
  {
    name: "Sedo",
    url: "https://sedo.com",
    category: "broker",
    description:
      "The world's largest domain marketplace with professional brokerage services for premium domains.",
    pricing: "Broker commission typically 10-15% of sale price",
    bestFor:
      "Negotiating purchases of high-value domains with professional broker assistance.",
  },
  {
    name: "Afternic",
    url: "https://www.afternic.com",
    category: "broker",
    description:
      "Major domain marketplace owned by GoDaddy, with a large network of distribution partners.",
    pricing: "Commission around 15-20% depending on sale type",
    bestFor:
      "Finding domains listed across GoDaddy's extensive reseller network.",
  },
  {
    name: "DAN.com",
    url: "https://dan.com",
    category: "broker",
    description:
      "Modern domain marketplace with streamlined buying process and installment payment options.",
    pricing: "Buyer commission of 5-9%; installment plans available",
    bestFor:
      "Users who want a simple, modern purchase experience with payment plan options.",
  },

  // ── Escrow ──────────────────────────────────────────────────
  {
    name: "Escrow.com",
    url: "https://www.escrow.com",
    category: "escrow",
    description:
      "The leading online escrow service for domain transactions, licensed and regulated.",
    pricing: "Fees from 0.89% of transaction value (min ~$25)",
    bestFor:
      "Securing high-value private domain purchases with a trusted third party.",
  },

  // ── Aftermarket ─────────────────────────────────────────────
  {
    name: "GoDaddy Auctions",
    url: "https://auctions.godaddy.com",
    category: "aftermarket",
    description:
      "The largest domain auction platform with thousands of domains listed daily.",
    pricing: "Membership ~$5/yr; standard auction fees apply",
    bestFor:
      "Browsing a large selection of domains available for immediate purchase or auction.",
  },
  {
    name: "Sedo Marketplace",
    url: "https://sedo.com/search/",
    category: "aftermarket",
    description:
      "Global domain aftermarket with listings from sellers worldwide and multi-currency support.",
    pricing: "Commission varies; typically 10-15% on completed sales",
    bestFor:
      "International buyers looking for domains across global markets.",
  },
  {
    name: "Afternic Marketplace",
    url: "https://www.afternic.com/search",
    category: "aftermarket",
    description:
      "Domain aftermarket with Buy Now and Make Offer options, powered by GoDaddy.",
    pricing: "Commission 15-20%; many domains have Buy Now pricing",
    bestFor:
      "Users who prefer fixed-price listings and instant purchases.",
  },
  {
    name: "NameJet Auctions",
    url: "https://www.namejet.com",
    category: "aftermarket",
    description:
      "Auction platform specializing in expiring and pre-release domains from top registrars.",
    pricing: "Auction-based pricing; registration required to bid",
    bestFor:
      "Bidding on premium domains becoming available through registrar pre-release programs.",
  },

  // ── Hosting ───────────────────────────────────────────────────
  {
    name: "SiteGround",
    url: "https://www.siteground.com",
    category: "hosting",
    description:
      "Reliable WordPress hosting provider with excellent migration support and 24/7 customer service.",
    pricing: "Starting at ~$15/mo for managed WordPress hosting",
    bestFor:
      "WordPress users who need dependable hosting with hands-on migration assistance.",
  },
  {
    name: "Cloudways",
    url: "https://www.cloudways.com",
    category: "hosting",
    description:
      "Managed cloud hosting platform with easy site migration tools and flexible server options.",
    pricing: "Starting at ~$14/mo for managed cloud hosting",
    bestFor:
      "Users who want managed cloud infrastructure with simple migration from other hosts.",
  },
  {
    name: "Vercel",
    url: "https://vercel.com",
    category: "hosting",
    description:
      "Modern hosting platform with a generous free tier for static sites and frontend frameworks, ideal for rebuilding.",
    pricing: "Free tier available; Pro plan from $20/mo",
    bestFor:
      "Developers and users rebuilding a site from scratch with static or Next.js-based projects.",
  },

  // ── Recovery Tools ────────────────────────────────────────────
  {
    name: "Wayback Machine Downloader",
    url: "https://github.com/hartator/wayback-machine-downloader",
    category: "recovery",
    description:
      "Open-source command-line tool for bulk downloading archived copies of websites from the Internet Archive's Wayback Machine.",
    pricing: "Free and open source",
    bestFor:
      "Recovering website content by downloading archived pages, images, and files in bulk.",
  },

  // ── Legal ───────────────────────────────────────────────────
  {
    name: "WIPO Arbitration and Mediation Center",
    url: "https://www.wipo.int/amc/en/domains/",
    category: "legal",
    description:
      "The primary provider of UDRP proceedings for resolving domain name disputes based on trademark rights.",
    pricing: "Filing fee from $1,500 for single-panelist decisions",
    bestFor:
      "Trademark holders pursuing formal dispute resolution against bad-faith domain registrants.",
  },
  {
    name: "National Arbitration Forum (Forum)",
    url: "https://www.adrforum.com",
    category: "legal",
    description:
      "ICANN-accredited dispute resolution provider offering UDRP and URS proceedings.",
    pricing: "Filing fee from $1,300 for single-panelist decisions",
    bestFor:
      "US-based trademark holders who prefer a domestic dispute resolution provider.",
  },
];

/**
 * Items that can serve as proof of prior domain ownership.
 * Useful when contacting registrars, filing disputes, or negotiating purchases.
 */
export const PROOF_OF_OWNERSHIP_ITEMS: string[] = [
  "Original domain registration confirmation email from the registrar",
  "Login credentials or account access to the registrar account",
  "Payment records (credit card statements, PayPal receipts, invoices) for domain registration or renewal",
  "Previous WHOIS records showing your name and contact information as registrant",
  "Registrar account username, customer ID, or account number",
  "Copies of renewal reminder emails from the registrar",
  "Screenshots of the registrar control panel showing domain management",
  "Web hosting account records showing the domain was configured on your server",
  "Archived versions of the website from the Wayback Machine (web.archive.org) showing your content",
  "DNS zone file backups or records of DNS configurations you created",
  "SSL/TLS certificate records issued for the domain in your name",
  "Email correspondence sent from or received at email addresses on the domain",
  "Business registration documents, tax filings, or contracts referencing the domain",
  "Trademark registrations associated with the domain name",
  "Social media profiles or marketing materials that reference the domain",
  "Google Search Console or Analytics account showing verified ownership of the domain",
];

/**
 * Sources for recovering website content after losing access to a domain or hosting.
 */
export interface ContentRecoverySource {
  name: string;
  description: string;
  howTo: string;
}

export const CONTENT_RECOVERY_SOURCES: ContentRecoverySource[] = [
  {
    name: "Wayback Machine",
    description:
      "Internet Archive's free service that saves copies of websites over time.",
    howTo:
      "Visit web.archive.org and enter your old domain name. Browse through the calendar to find snapshots of your site. You can view and save individual pages, or use the Wayback Machine Downloader tool to download the entire archived site in bulk.",
  },
  {
    name: "Google Cache",
    description:
      "Google's cached copies of recently indexed web pages.",
    howTo:
      "Search for cache:yourdomain.com in Google to see the most recent cached version of your homepage. For other pages, search for cache:yourdomain.com/page-path. Note that Google cache is temporary and may only have recent snapshots.",
  },
  {
    name: "Hosting Provider Backups",
    description:
      "Most hosting companies keep backups of your website files and databases for 30-90 days.",
    howTo:
      "Contact your previous hosting provider's support team and request a backup of your site files and database. Even if your account is no longer active, they may still have backups available. Ask specifically for a full cPanel backup or a copy of your public_html directory and any associated databases.",
  },
  {
    name: "CMS Export Tools",
    description:
      "WordPress, Squarespace, Wix, and other content management systems all have built-in content export features.",
    howTo:
      "Check your CMS dashboard for an export option. In WordPress, go to Tools > Export. In Squarespace, go to Settings > Advanced > Import/Export. In Wix, you may need to copy content manually or use the Wix API. If you still have login access to your CMS, export your content before your hosting expires.",
  },
  {
    name: "Local Browser Cache",
    description:
      "Your browser may have cached copies of pages you recently visited on your own website.",
    howTo:
      "Check your browser history for visits to your old website. Some browsers allow you to view cached pages even when the site is offline. In Chrome, type chrome://cache in the address bar (on older versions) or check your browsing history for saved page content. This works best for pages you visited recently.",
  },
  {
    name: "Email Attachments",
    description:
      "Old emails may contain content, images, or documents from your website.",
    howTo:
      "Search your email inbox for messages containing your domain name, or messages from your CMS or hosting provider. Look for newsletter drafts, content review emails, image attachments, and any exported files you may have emailed to yourself or colleagues.",
  },
];

/**
 * Returns a filtered list of services relevant to a given domain status.
 *
 * Common statuses:
 *  - "active"           : domain is currently registered by someone
 *  - "expired"          : domain has expired but is still within grace period
 *  - "redemption"       : domain is in redemption period (high fee to recover)
 *  - "pendingDelete"    : domain is about to be released
 *  - "available"        : domain is not registered and can be registered now
 *  - "registered"       : same as active, owned by someone else
 *  - "unknown"          : status could not be determined
 */
export function getServicesForStatus(
  status: string
): ServiceRecommendation[] {
  const normalized = status.toLowerCase().replace(/[\s_-]/g, "");

  switch (normalized) {
    case "active":
    case "registered":
      // Domain is owned by someone else -- suggest brokers, aftermarket, escrow, legal
      return SERVICES.filter((s) =>
        ["broker", "aftermarket", "escrow", "legal"].includes(s.category)
      );

    case "expired":
    case "graceperiod":
      // Still recoverable through the registrar
      return SERVICES.filter((s) =>
        ["registrar"].includes(s.category)
      );

    case "redemption":
    case "redemptionperiod":
      // Recoverable but at a high fee; also start thinking about backorders as a backup
      return SERVICES.filter((s) =>
        ["registrar", "backorder"].includes(s.category)
      );

    case "pendingdelete":
      // About to drop -- backorder is the primary strategy
      return SERVICES.filter((s) =>
        ["backorder", "aftermarket"].includes(s.category)
      );

    case "available":
      // Register it now at any registrar
      return SERVICES.filter((s) => s.category === "registrar");

    case "activehostingissue":
      // Domain is active but hosting has a problem -- suggest hosting services
      return SERVICES.filter((s) => s.category === "hosting");

    default:
      // Unknown status -- return everything so the user can decide
      return [...SERVICES];
  }
}
