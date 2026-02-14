/**
 * Glossary of domain and web infrastructure terms.
 * Each entry has a short (1-sentence) and detailed (2-4 sentence) explanation
 * written in plain English for non-technical users.
 */

export interface GlossaryEntry {
  short: string;
  detailed: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  registrar: {
    short:
      "A company authorized to sell and manage domain name registrations.",
    detailed:
      "A registrar is like a real estate agency for internet addresses. You pay them a yearly fee to reserve your domain name so nobody else can use it. Examples include GoDaddy, Namecheap, and Cloudflare. If you stop paying, the registrar eventually releases your domain back to the open market.",
  },

  whois: {
    short:
      "A public directory that shows who owns a domain name and when it expires.",
    detailed:
      "WHOIS is like a phone book for websites. When someone registers a domain, their contact information is recorded in this database. You can look up any domain to see its owner, registrar, creation date, and expiration date. Many owners use privacy services to hide their personal details, but the registrar and dates are always visible.",
  },

  dns: {
    short:
      "The system that translates human-readable domain names into numeric IP addresses that computers use.",
    detailed:
      "DNS (Domain Name System) works like a giant phone book for the internet. When you type 'example.com' into your browser, DNS looks up the numeric address (like 93.184.216.34) where that website actually lives. Without DNS, you would have to memorize long strings of numbers for every website you visit. Changes to DNS records can take minutes to hours to spread across the internet.",
  },

  nameserver: {
    short:
      "A server that holds DNS records and answers questions about where to find a domain's website and email.",
    detailed:
      "Nameservers are like the directory assistance operators of the internet. When someone asks 'where is example.com?', the nameserver looks through its records and provides the answer. Your domain's nameservers are usually provided by your registrar or hosting company. If nameservers are misconfigured or missing, your website and email will stop working.",
  },

  aRecord: {
    short:
      "A DNS record that points a domain name directly to the IP address of a web server.",
    detailed:
      "An A record is the most basic type of DNS mapping -- it connects your domain name to the specific server where your website is hosted. Think of it as the street address on a building. If the A record points to the wrong server or is deleted, visitors will see an error instead of your website. You can have multiple A records if your site is hosted on multiple servers.",
  },

  mxRecord: {
    short:
      "A DNS record that tells the internet which server handles email for your domain.",
    detailed:
      "MX (Mail Exchange) records are like forwarding instructions at a post office. They tell the internet where to deliver emails sent to addresses at your domain. If your MX records are wrong or missing, you will not receive emails. Most email services like Google Workspace or Microsoft 365 provide specific MX records you need to add to your DNS.",
  },

  spf: {
    short:
      "An email authentication record that lists which servers are allowed to send email on behalf of your domain.",
    detailed:
      "SPF (Sender Policy Framework) is like a guest list for your email. It tells receiving mail servers which servers are authorized to send emails from your domain. Without SPF, spammers can more easily forge emails that appear to come from your address. SPF is set up as a TXT record in your DNS and helps prevent your legitimate emails from being marked as spam.",
  },

  dmarc: {
    short:
      "An email policy that tells receiving servers what to do with emails that fail authentication checks.",
    detailed:
      "DMARC (Domain-based Message Authentication, Reporting, and Conformance) builds on SPF and DKIM to protect your domain from email spoofing. Think of it as a bouncer policy: it tells email servers whether to reject, quarantine, or allow suspicious messages claiming to come from your domain. DMARC also sends you reports so you can see who is trying to send email as you. Setting up DMARC properly is important for email deliverability and brand protection.",
  },

  ssl: {
    short:
      "A security certificate that encrypts the connection between a visitor's browser and your website.",
    detailed:
      "SSL (Secure Sockets Layer, now technically TLS) is like a sealed envelope for internet traffic. When a website has SSL, the data traveling between you and the site is encrypted so nobody can read it in transit. Websites with SSL show a padlock icon and use 'https://' instead of 'http://'. Most browsers now warn visitors when a site does not have SSL, which can scare away potential customers.",
  },

  gracePeriod: {
    short:
      "A window of time after a domain expires when the original owner can still renew it at the normal price.",
    detailed:
      "The grace period is like a library book's overdue window before they charge you a replacement fee. After your domain expires, most registrars give you roughly 0 to 45 days to renew at the standard price. During this time, your website and email may already be down, but you have not lost the domain yet. The exact length depends on your registrar, so check their policy as soon as possible.",
  },

  redemptionPeriod: {
    short:
      "A phase after the grace period when you can still recover your domain, but only by paying a substantial fee.",
    detailed:
      "The redemption period is your last chance to get your domain back before it is released to the public. Think of it as paying an impound fee to get your car back. This period typically lasts 30 days and the fee can range from $80 to $200 or more depending on the registrar. During redemption, the domain is frozen and cannot be transferred to another registrar.",
  },

  pendingDelete: {
    short:
      "The final phase before an expired domain is released back to the public for anyone to register.",
    detailed:
      "Pending delete is the point of no return. The domain sits in this state for about 5 days while the registry prepares to release it. During this time, the original owner can no longer recover it. Domain investors and backorder services watch for domains in this phase because once released, the domain becomes available on a first-come, first-served basis.",
  },

  backorder: {
    short:
      "A service that tries to register a domain for you the instant it becomes available after expiring.",
    detailed:
      "Backordering is like hiring someone to stand in line at a store opening so you get the item first. You pay a backorder service to monitor an expiring domain and attempt to register it the moment it drops. Multiple services may compete for the same domain, and there is no guarantee of success. If the backorder fails, most services refund your fee.",
  },

  udrp: {
    short:
      "A legal process for recovering a domain name that was registered in bad faith, especially to exploit your trademark.",
    detailed:
      "UDRP (Uniform Domain-Name Dispute-Resolution Policy) is an international arbitration process managed by WIPO and other providers. It is designed for cases where someone registered a domain that infringes on your trademark, especially if they are trying to sell it to you at a profit or use it to mislead your customers. The process typically costs $1,500 to $5,000 and takes about 2 months. You must prove you have trademark rights, that the domain was registered in bad faith, and that the registrant has no legitimate interest in it.",
  },

  domainPrivacy: {
    short:
      "A service that hides your personal contact information from the public WHOIS directory.",
    detailed:
      "Domain privacy (also called WHOIS privacy) replaces your name, address, phone, and email in the public WHOIS database with the privacy service's information. It is like having a P.O. box instead of listing your home address. This helps reduce spam, unwanted sales calls, and identity theft. Most registrars offer it for free or a small fee, and it does not affect your ownership of the domain.",
  },

  dnssec: {
    short:
      "A security extension that adds a digital signature to DNS records to prevent tampering.",
    detailed:
      "DNSSEC (DNS Security Extensions) is like a tamper-evident seal on DNS responses. It uses cryptographic signatures to prove that the DNS information you receive has not been altered by an attacker. Without DNSSEC, a hacker could redirect your visitors to a fake website without anyone knowing. Setting it up requires coordination between your registrar and DNS provider.",
  },

  transferLock: {
    short:
      "A safety setting that prevents your domain from being transferred to another registrar without your explicit approval.",
    detailed:
      "Transfer lock (also called registrar lock or client transfer prohibited) is like a deadbolt on your domain. When enabled, nobody can move your domain to a different registrar, even if they somehow get your authorization code. You must log in and manually disable the lock before initiating a transfer. It is one of the simplest and most effective protections against domain theft.",
  },

  authCode: {
    short:
      "A secret password required to transfer a domain from one registrar to another.",
    detailed:
      "An auth code (also called EPP code or transfer key) is a randomly generated password that proves you authorize a domain transfer. Think of it like the PIN for a bank transfer. You get it from your current registrar and provide it to the new registrar to start the move. Auth codes typically expire after a few days for security. Without this code, a transfer cannot proceed.",
  },

  cname: {
    short:
      "A DNS record that makes one domain name an alias for another domain name.",
    detailed:
      "A CNAME (Canonical Name) record is like call forwarding for domains. Instead of pointing directly to an IP address, it points one domain name to another. For example, you might set 'www.example.com' as a CNAME for 'example.com'. This is useful when a service gives you their own domain to point to. You cannot use a CNAME on the root domain itself (like example.com) -- only on subdomains.",
  },

  txtRecord: {
    short:
      "A DNS record that holds text information, often used for email authentication and domain ownership verification.",
    detailed:
      "TXT records are flexible DNS entries that store arbitrary text data. They are the Swiss Army knife of DNS records. Services like Google, Microsoft, and various email providers ask you to add TXT records to prove you own the domain. They are also used for SPF and DMARC email security. A single domain can have many TXT records for different purposes.",
  },

  hosting: {
    short:
      "A service that stores your website files on a server and makes them accessible to visitors on the internet.",
    detailed:
      "Web hosting is like renting space in a shopping mall for your store. The hosting company provides the physical server, internet connection, and infrastructure to keep your website available 24/7. Hosting is separate from your domain registration -- the domain is your address, and hosting is the building. If your hosting expires or goes down, your website disappears even if you still own the domain.",
  },

  cdn: {
    short:
      "A network of servers around the world that delivers copies of your website from the location closest to each visitor.",
    detailed:
      "A CDN (Content Delivery Network) is like a chain of local warehouses instead of one central warehouse. Instead of every visitor loading your website from a single server, copies are cached on servers worldwide. A visitor in Tokyo gets served from a nearby Asian server instead of waiting for data to travel from a US server. This makes websites faster, more reliable, and better able to handle traffic spikes.",
  },

  httpStatus: {
    short:
      "A three-digit code that a web server sends back to indicate whether a request was successful, redirected, or failed.",
    detailed:
      "HTTP status codes are like return receipts for web requests. A 200 means everything is fine, a 301 means the page has permanently moved, a 404 means the page was not found, and a 500 means the server had an internal error. When diagnosing website problems, these codes tell you exactly what is going wrong. For example, seeing a 403 means access is forbidden, while a 503 means the server is temporarily unavailable.",
  },

  ipAddress: {
    short:
      "A unique numeric label assigned to every device connected to the internet, like a home address for computers.",
    detailed:
      "An IP (Internet Protocol) address is the real location of a server on the internet. Domain names are just human-friendly labels that map to these numeric addresses. IPv4 addresses look like 192.168.1.1, while newer IPv6 addresses are longer and use letters and numbers. When you type a domain into your browser, DNS translates it to an IP address so your computer knows which server to contact.",
  },

  irtd: {
    short:
      "A formal ICANN complaint process for when a domain is transferred to another registrar without the owner's authorization.",
    detailed:
      "IRTD (ICANN Registrar Transfer Dispute) is like filing a police report after someone moves your belongings without your permission. If your domain was transferred to a different registrar and you never approved it, you can file an IRTD complaint with ICANN. The losing registrar is required to investigate and, if the transfer was unauthorized, reverse it. This process is separate from UDRP and is specifically about unauthorized transfers between registrars, not about trademark disputes.",
  },

  urs: {
    short:
      "A faster, cheaper alternative to UDRP that suspends an infringing domain name but does not transfer it to you.",
    detailed:
      "URS (Uniform Rapid Suspension) is like getting a court to freeze someone's bank account while you sort out a dispute. For a filing fee of about $375, you can get an infringing domain suspended within days rather than the months a UDRP takes. The catch is that URS only suspends the domain -- it does not transfer it to you. The domain's DNS is redirected to an informational page, and the registrant cannot use it. URS is best for clear-cut cases of trademark abuse where you want fast action.",
  },

  acpa: {
    short:
      "A US federal law that allows trademark owners to sue cybersquatters in court for up to $100,000 per domain.",
    detailed:
      "The ACPA (Anticybersquatting Consumer Protection Act) is like having a federal law that specifically targets people who steal your parking spot and try to sell it back to you. Unlike UDRP, which is an arbitration process, ACPA lets you file a real lawsuit in US federal court. If you win, the court can order the domain transferred to you and award statutory damages of up to $100,000 per domain name. ACPA is more expensive and time-consuming than UDRP, but it is the stronger remedy for serious cybersquatting cases, especially when the squatter is based in the United States.",
  },

  cybersquatting: {
    short:
      "When someone registers a domain name that matches a brand or trademark they do not own, hoping to profit from it.",
    detailed:
      "Cybersquatting is like someone buying a plot of land right next to a famous business and putting up a sign with the business's name to confuse customers or hold it hostage. The cybersquatter registers a domain containing a well-known brand name (or a confusingly similar variation) with the intent to sell it to the trademark owner at an inflated price, redirect traffic, or profit from the brand's reputation. Laws like ACPA and processes like UDRP exist specifically to combat cybersquatting.",
  },

  domainHijacking: {
    short:
      "When someone gains unauthorized access to a domain registrar account and transfers or modifies a domain without permission.",
    detailed:
      "Domain hijacking is like someone breaking into your house, changing the locks, and putting the deed in their name. The attacker gains access to your registrar account -- through phishing, social engineering, or exploiting weak security -- and then transfers the domain to a different registrar or changes the DNS records. This can take your website and email offline instantly. To protect yourself, enable two-factor authentication, use a strong unique password, and keep the registrar transfer lock enabled on your domains.",
  },

  eppCode: {
    short:
      "A secret password (also called auth code or transfer code) required to transfer a domain from one registrar to another.",
    detailed:
      "An EPP code (Extensible Provisioning Protocol code) is like the combination to a safe that holds your domain. When you want to move your domain to a new registrar, the new registrar asks for this code to prove you authorized the transfer. You get the EPP code from your current registrar, usually through your account dashboard or by contacting support. The code typically expires after a few days for security. Without this code, a domain transfer cannot proceed, which is why it is important to keep your registrar account access secure.",
  },
};

/**
 * Look up a glossary term by key. Returns undefined if not found.
 */
export function getGlossaryEntry(term: string): GlossaryEntry | undefined {
  return GLOSSARY[term];
}

/**
 * Get all glossary term keys sorted alphabetically.
 */
export function getGlossaryTerms(): string[] {
  return Object.keys(GLOSSARY).sort();
}
