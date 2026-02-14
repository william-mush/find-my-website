/**
 * Recovery Guide Generator
 *
 * Takes domain analysis results and produces a structured, personalized
 * recovery guide with plain-English steps, cost estimates, and actionable advice.
 *
 * This module is pure: no side effects, no imports from other project files.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecoveryStep {
  stepNumber: number;
  title: string;
  description: string;
  details: string[];
  urgency: 'immediate' | 'soon' | 'when-ready';
  estimatedTime?: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  helpText?: string;
  links?: Array<{ label: string; url: string }>;
  emailTemplateKey?: string;
  phoneScript?: string;
}

export interface RecoveryContext {
  lostCredentials?: boolean;
  stolenOrHijacked?: boolean;
  contractualDispute?: boolean;
  emergencyMode?: boolean;
  contentRecoveryPriority?: boolean;
}

export interface RecoveryGuideData {
  headline: string;
  headlineColor: 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray';
  summary: string;
  statusExplanation: string;

  timelinePhase: string;

  steps: RecoveryStep[];
  alternativeOptions?: RecoveryStep[];

  proofOfOwnership?: boolean;
  showScriptDownloads?: boolean;
  isEmergencyMode?: boolean;

  costSummary: {
    min: number;
    max: number;
    currency: string;
    breakdown?: string;
  };
  timeSummary: string;
  successLikelihood: string;

  registrarName?: string;
  registrarPhone?: string;
  registrarEmail?: string;
  registrarUrl?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a registrar-specific URL for the registrar support page.
 * Returns undefined when the registrar is unknown.
 */
function inferRegistrarUrl(registrar?: string): string | undefined {
  if (!registrar) return undefined;

  const lower = registrar.toLowerCase();

  const known: Record<string, string> = {
    godaddy: 'https://www.godaddy.com/help',
    namecheap: 'https://www.namecheap.com/support/',
    'google domains': 'https://domains.google.com',
    cloudflare: 'https://www.cloudflare.com/products/registrar/',
    'name.com': 'https://www.name.com/support',
    enom: 'https://www.enom.com/help',
    tucows: 'https://www.tucows.com',
    'network solutions': 'https://www.networksolutions.com/support/',
    '1&1': 'https://www.ionos.com/help',
    ionos: 'https://www.ionos.com/help',
    dynadot: 'https://www.dynadot.com/community/help',
    hover: 'https://help.hover.com',
    gandi: 'https://www.gandi.net/en/contact',
    porkbun: 'https://porkbun.com/support',
  };

  for (const [key, url] of Object.entries(known)) {
    if (lower.includes(key)) return url;
  }

  return undefined;
}

/**
 * Compute how many days remain in the grace period (typically 45 days total).
 */
function gracePeriodDaysRemaining(daysSinceExpiry?: number): number {
  if (daysSinceExpiry === undefined) return 45;
  return Math.max(0, 45 - daysSinceExpiry);
}

/**
 * Compute how many days remain in the redemption period (typically 45-75 days,
 * so 75 - daysSinceExpiry).
 */
function redemptionDaysRemaining(daysSinceExpiry?: number): number {
  if (daysSinceExpiry === undefined) return 30;
  return Math.max(0, 75 - daysSinceExpiry);
}

/**
 * Popular registrar links used in the AVAILABLE guide.
 */
const POPULAR_REGISTRARS: Array<{ label: string; url: string }> = [
  { label: 'Namecheap', url: 'https://www.namecheap.com' },
  { label: 'Cloudflare Registrar', url: 'https://www.cloudflare.com/products/registrar/' },
  { label: 'Porkbun', url: 'https://porkbun.com' },
  { label: 'Google Domains', url: 'https://domains.google.com' },
  { label: 'GoDaddy', url: 'https://www.godaddy.com' },
];

/**
 * Backorder service links.
 */
const BACKORDER_SERVICES: Array<{ label: string; url: string }> = [
  { label: 'SnapNames', url: 'https://www.snapnames.com' },
  { label: 'DropCatch', url: 'https://www.dropcatch.com' },
  { label: 'NameJet', url: 'https://www.namejet.com' },
  { label: 'GoDaddy Auctions', url: 'https://auctions.godaddy.com' },
];

/**
 * Escrow service links.
 */
const ESCROW_SERVICES: Array<{ label: string; url: string }> = [
  { label: 'Escrow.com', url: 'https://www.escrow.com' },
  { label: 'Payoneer Escrow', url: 'https://www.payoneer.com/solutions/escrow/' },
];

/**
 * WHOIS lookup tools for manual checks.
 */
const WHOIS_TOOLS: Array<{ label: string; url: string }> = [
  { label: 'ICANN WHOIS Lookup', url: 'https://lookup.icann.org' },
  { label: 'Whois.com', url: 'https://www.whois.com/whois/' },
  { label: 'who.is', url: 'https://who.is' },
];

// ---------------------------------------------------------------------------
// Status-specific guide builders
// ---------------------------------------------------------------------------

function buildAvailableGuide(domain: string): RecoveryGuideData {
  return {
    headline: 'Great News! This Domain is Available',
    headlineColor: 'green',
    summary:
      `The domain ${domain} is not currently registered by anyone. ` +
      'This means you can register it right now through any domain registrar. ' +
      'This is the best possible outcome -- no negotiation or waiting required.',
    statusExplanation:
      'An available domain is one that nobody currently owns. ' +
      'You can register it just like buying a new product from a store. ' +
      'Once you register it, it is yours for as long as you keep renewing it (usually yearly).',
    timelinePhase: 'available',
    steps: [
      {
        stepNumber: 1,
        title: 'Choose a Domain Registrar',
        description:
          'A registrar is the company where you purchase and manage your domain name. ' +
          'Pick one from the list below -- they are all reputable and widely used.',
        details: [
          'Compare prices -- most .com domains cost $10-15 per year.',
          'Look for included features like free WHOIS privacy, DNS management, and email forwarding.',
          'Consider using the same company where you plan to host your website for simplicity.',
        ],
        urgency: 'when-ready',
        estimatedTime: '5 minutes',
        difficulty: 'easy',
        helpText:
          'A domain registrar is like a phone company for website addresses. ' +
          'They let you "rent" a domain name so nobody else can use it.',
        links: POPULAR_REGISTRARS,
      },
      {
        stepNumber: 2,
        title: `Search for ${domain}`,
        description:
          `Go to your chosen registrar's website and type "${domain}" into their search bar. ` +
          'It should show up as available for purchase.',
        details: [
          `Type "${domain}" in the registrar's domain search.`,
          'Confirm the domain is available and check the price.',
          'Avoid unnecessary add-ons (you can always add them later).',
        ],
        urgency: 'when-ready',
        estimatedTime: '2 minutes',
        difficulty: 'easy',
        helpText:
          'Most registrars have a prominent search bar on their homepage. ' +
          'Just type in the domain exactly as shown and click search.',
      },
      {
        stepNumber: 3,
        title: 'Complete Your Purchase',
        description:
          'Add the domain to your cart, create an account if needed, and complete the checkout. ' +
          'Typical cost is $10-15 per year for a .com domain.',
        details: [
          'Enable WHOIS privacy protection (often free) to keep your personal information private.',
          'Enable auto-renewal so you do not accidentally lose the domain later.',
          'Use a valid email address -- you will need it to verify ownership.',
          'Consider registering for multiple years if you plan to keep the domain long-term.',
        ],
        urgency: 'when-ready',
        estimatedTime: '5 minutes',
        difficulty: 'easy',
        helpText:
          'WHOIS privacy hides your name, address, and phone number from public WHOIS records. ' +
          'It is strongly recommended for personal domains.',
      },
      {
        stepNumber: 4,
        title: 'Set Up Your Website',
        description:
          'Once the domain is registered, you can point it to a website. ' +
          'You will need hosting (a place for your website files) and to update the domain\'s DNS settings.',
        details: [
          'Choose a hosting provider (Vercel, Netlify, and GitHub Pages offer free tiers).',
          'Update your domain\'s nameservers or DNS records to point to your hosting.',
          'Upload or deploy your website content.',
          'Test that everything works by visiting the domain in your browser.',
        ],
        urgency: 'when-ready',
        estimatedTime: '30 minutes to a few hours',
        difficulty: 'moderate',
        helpText:
          'DNS (Domain Name System) is like a phone book for the internet. ' +
          'It tells browsers which server to connect to when someone types your domain.',
      },
    ],
    costSummary: {
      min: 10,
      max: 15,
      currency: 'USD',
      breakdown: 'Standard .com registration fee, paid yearly.',
    },
    timeSummary: 'About 15 minutes to register, plus additional time to set up a website.',
    successLikelihood: 'Almost guaranteed -- the domain is available right now.',
  };
}

function buildExpiredGraceGuide(
  domain: string,
  registrar?: string,
  registrarContact?: { email?: string; phone?: string },
  daysSinceExpiry?: number,
  hasWaybackContent?: boolean,
): RecoveryGuideData {
  const daysLeft = gracePeriodDaysRemaining(daysSinceExpiry);
  const daysExpiredText =
    daysSinceExpiry !== undefined ? `${daysSinceExpiry} days ago` : 'recently';
  const daysLeftText = daysLeft > 0 ? `approximately ${daysLeft} days` : 'very little time';
  const registrarName = registrar || 'the registrar';

  const phoneScript =
    `Hi, I'm calling about the domain ${domain}. ` +
    `It recently expired and I'd like to renew it. ` +
    `Can you help me with the renewal process? ` +
    `I may need to verify my identity as the domain owner.`;

  const steps: RecoveryStep[] = [
    {
      stepNumber: 1,
      title: 'Log Into Your Registrar Account',
      description:
        `If you are the previous owner of ${domain}, log into your account at ${registrarName}. ` +
        'The domain should appear in your account with an "expired" status.',
      details: [
        `Go to ${registrar ? registrarName + "'s website" : 'your registrar\'s website'} and sign in.`,
        'Navigate to your domains list or dashboard.',
        `Look for ${domain} -- it may be in an "expired" or "grace period" section.`,
        'If you forgot your password, use the password reset option.',
      ],
      urgency: 'immediate',
      estimatedTime: '5 minutes',
      difficulty: 'easy',
      helpText:
        'The registrar is the company where the domain was originally purchased. ' +
        'Check old emails for registration confirmations if you are unsure which registrar was used.',
      links: registrar ? [{ label: `${registrarName} Website`, url: inferRegistrarUrl(registrar) || `https://www.google.com/search?q=${encodeURIComponent(registrar)}+login` }] : [],
    },
    {
      stepNumber: 2,
      title: 'Renew the Domain',
      description:
        'Once logged in, look for a "Renew" button next to the domain. ' +
        'Most registrars make this straightforward during the grace period.',
      details: [
        'Click the renew or restore option for the domain.',
        'The renewal fee is typically $10-50, though some registrars charge a late fee.',
        'Pay with a credit card or other accepted payment method.',
        'Confirm the renewal was successful -- the domain status should change to "Active".',
      ],
      urgency: 'immediate',
      estimatedTime: '10 minutes',
      difficulty: 'easy',
      helpText:
        'During the grace period, the original owner can renew the domain at or near the regular price. ' +
        'This is the cheapest and easiest way to recover an expired domain.',
    },
    {
      stepNumber: 3,
      title: 'If It Is Not Your Account -- Contact the Registrar',
      description:
        `If you do not have access to the registrar account, call ${registrarName} directly. ` +
        'Phone is usually faster than email for urgent domain issues.',
      details: [
        registrarContact?.phone
          ? `Call ${registrarName} at ${registrarContact.phone}.`
          : `Find ${registrarName}'s phone number on their website.`,
        'Explain that you are the owner of an expired domain and need help renewing it.',
        'Be ready to provide proof of ownership (see the checklist below).',
        registrarContact?.email
          ? `You can also email ${registrarContact.email} but phone is faster.`
          : 'Email support is available but phone is recommended for time-sensitive issues.',
      ],
      urgency: 'immediate',
      estimatedTime: '15-30 minutes',
      difficulty: 'moderate',
      phoneScript,
      helpText:
        'Registrars have support teams that handle expired domain recovery regularly. ' +
        'They can verify your identity and process the renewal on your behalf.',
    },
    {
      stepNumber: 4,
      title: 'Set Up a Backorder as a Backup Plan',
      description:
        'While working on renewal, set up a domain backorder with one or more services. ' +
        'This way, if the grace period expires before you can renew, you still have a chance.',
      details: [
        'Sign up for a backorder at SnapNames, DropCatch, or NameJet.',
        `Enter ${domain} and place a backorder (typically $69-99).`,
        'You are only charged if the backorder is successful.',
        'Using multiple services increases your chances.',
      ],
      urgency: 'soon',
      estimatedTime: '10 minutes',
      difficulty: 'easy',
      helpText:
        'A backorder service automatically tries to register the domain the moment it becomes available. ' +
        'Think of it like setting an alarm so you do not miss the opportunity.',
      links: BACKORDER_SERVICES,
    },
    {
      stepNumber: 5,
      title: 'Enable Auto-Renew After Recovery',
      description:
        'Once you have recovered the domain, immediately enable automatic renewal ' +
        'so this does not happen again.',
      details: [
        'Go to your domain settings in your registrar account.',
        'Turn on automatic renewal.',
        'Make sure your payment method on file is up to date.',
        'Consider registering for multiple years for extra protection.',
        'Set a calendar reminder to check your domain status every few months.',
      ],
      urgency: 'when-ready',
      estimatedTime: '5 minutes',
      difficulty: 'easy',
      helpText:
        'Auto-renewal means the registrar will automatically charge your payment method ' +
        'before the domain expires, so you never accidentally lose it.',
    },
  ];

  return {
    headline: 'Time-Sensitive: Domain is in Grace Period',
    headlineColor: 'yellow',
    summary:
      `The domain ${domain} expired ${daysExpiredText} and is currently in the grace period. ` +
      `You have ${daysLeftText} left to renew it at or near the normal price before it moves ` +
      'to the more expensive redemption phase. Act quickly for the best chance of recovery.',
    statusExplanation:
      'When a domain expires, it does not disappear immediately. Instead, it enters a "grace period" ' +
      '(typically 0-45 days) during which the previous owner can still renew it. ' +
      'Think of it like a library book -- even after the due date, there is a window before you get charged a big late fee.',
    timelinePhase: 'grace-period',
    steps,
    proofOfOwnership: true,
    showScriptDownloads: hasWaybackContent === true,
    costSummary: {
      min: 10,
      max: 400,
      currency: 'USD',
      breakdown:
        'Standard renewal: $10-50. Late renewal fee (some registrars): $50-150. ' +
        'If escalated to redemption: $150-400+.',
    },
    timeSummary:
      `You have roughly ${daysLeftText} left in the grace period. ` +
      'Renewal itself takes only a few minutes once you are logged in.',
    successLikelihood: 'Very likely if you act quickly -- grace period renewals have a high success rate.',
    registrarName: registrar,
    registrarPhone: registrarContact?.phone,
    registrarEmail: registrarContact?.email,
    registrarUrl: inferRegistrarUrl(registrar),
  };
}

function buildExpiredRedemptionGuide(
  domain: string,
  registrar?: string,
  registrarContact?: { email?: string; phone?: string },
  daysSinceExpiry?: number,
  hasWaybackContent?: boolean,
): RecoveryGuideData {
  const daysLeft = redemptionDaysRemaining(daysSinceExpiry);
  const daysExpiredText =
    daysSinceExpiry !== undefined ? `${daysSinceExpiry} days ago` : 'some time ago';
  const registrarName = registrar || 'the registrar';

  const phoneScript =
    `Hi, I'm calling about the domain ${domain}. ` +
    `It has expired and is now in the redemption period. ` +
    `I need to restore it and understand it may involve a redemption fee. ` +
    `Can you walk me through the process and let me know the total cost?`;

  const steps: RecoveryStep[] = [
    {
      stepNumber: 1,
      title: 'Contact the Registrar by Phone Immediately',
      description:
        `Call ${registrarName} as soon as possible. The redemption period has a hard deadline ` +
        `and phone support is the fastest way to start the recovery process.`,
      details: [
        registrarContact?.phone
          ? `Call ${registrarName} at ${registrarContact.phone}.`
          : `Find ${registrarName}'s phone number on their support page.`,
        'Ask to speak with the domain recovery or renewals team.',
        'Have your account information ready (email, domain name, any order numbers).',
        'Be prepared to verify your identity.',
      ],
      urgency: 'immediate',
      estimatedTime: '15-30 minutes',
      difficulty: 'moderate',
      phoneScript,
      helpText:
        'The redemption period is a last-chance window after the grace period ends. ' +
        'Recovery is still possible but involves additional fees from the domain registry.',
      links: registrar ? [{ label: `${registrarName} Support`, url: inferRegistrarUrl(registrar) || `https://www.google.com/search?q=${encodeURIComponent(registrar)}+support` }] : [],
    },
    {
      stepNumber: 2,
      title: 'Ask About Redemption Process and Fees',
      description:
        'During your call, ask the registrar to explain the exact redemption process, timeline, and fees. ' +
        'Get a clear total cost before proceeding.',
      details: [
        'Ask for the total cost including redemption fee, renewal fee, and any other charges.',
        'Redemption fees typically range from $150 to $400 or more, depending on the registrar and domain extension.',
        'Ask how long the restoration will take (usually 1-7 business days).',
        'Get confirmation in writing (email) of the agreed terms.',
        `Ask about the deadline -- you have roughly ${daysLeft} days remaining.`,
      ],
      urgency: 'immediate',
      estimatedTime: '10 minutes',
      difficulty: 'moderate',
      helpText:
        'The redemption fee is charged by the domain registry (the organization that manages the domain extension, ' +
        'like Verisign for .com). The registrar passes this cost on to you and may add their own fee.',
    },
    {
      stepNumber: 3,
      title: 'Prepare Proof of Ownership',
      description:
        'The registrar will likely need you to prove you are the rightful owner of the domain. ' +
        'Gather as much documentation as you can.',
      details: [
        'Previous registration confirmation emails.',
        'Access to the email address associated with the domain registration.',
        'Government-issued ID matching the WHOIS registrant name.',
        'Business documents if the domain was registered to a company.',
        'Historical billing records or receipts for the domain.',
        'Screenshots of the website when it was active.',
      ],
      urgency: 'immediate',
      estimatedTime: '30 minutes',
      difficulty: 'moderate',
      emailTemplateKey: 'redemption-request',
      helpText:
        'Proof of ownership helps the registrar confirm you are the legitimate owner and not someone ' +
        'trying to hijack the domain. The more documentation you have, the smoother the process.',
    },
    {
      stepNumber: 4,
      title: 'Set Up a Backorder as a Backup Plan',
      description:
        'In case the redemption fails or is too expensive, set up backorders so you can try to grab ' +
        'the domain when it becomes publicly available.',
      details: [
        'Sign up for backorder services at multiple providers for the best chance.',
        `Enter ${domain} and place a backorder at each service.`,
        'Typical backorder cost is $69-99 per service, charged only if successful.',
        'If multiple people backorder the same domain, it may go to auction.',
      ],
      urgency: 'soon',
      estimatedTime: '15 minutes',
      difficulty: 'easy',
      helpText:
        'Backorder services watch for the domain to be released and automatically try to register it for you. ' +
        'Using multiple services increases your chances because each one has its own system.',
      links: BACKORDER_SERVICES,
    },
    {
      stepNumber: 5,
      title: 'Consider Alternative Domain Names',
      description:
        'While pursuing recovery, it is wise to think about backup domain names in case the original ' +
        'cannot be recovered or the cost is too high.',
      details: [
        'Try variations like adding a word (e.g., "get" or "my" before the name).',
        'Consider different extensions (.net, .org, .co, .io).',
        'Check if a slightly different spelling is available.',
        'Use a domain name generator tool for ideas.',
      ],
      urgency: 'when-ready',
      estimatedTime: '15 minutes',
      difficulty: 'easy',
      helpText:
        'Having a backup plan reduces stress and gives you options if the recovery does not work out.',
    },
  ];

  return {
    headline: 'Urgent: Domain is in Redemption Period',
    headlineColor: 'orange',
    summary:
      `The domain ${domain} expired ${daysExpiredText} and has moved past the grace period into the redemption period. ` +
      `You have approximately ${daysLeft} days left to recover it, but the process will involve a significant fee ` +
      '(typically $150-$400 or more). After the redemption period ends, the domain will be deleted and released to the public.',
    statusExplanation:
      'The redemption period is a last-chance phase after the grace period. ' +
      'The domain registry (the organization that manages .com, .net, etc.) holds the domain for a final window ' +
      'before deleting it. Recovery is still possible but requires paying a redemption fee on top of the regular renewal cost. ' +
      'Think of it as paying a significant penalty to reclaim something before it is permanently given up.',
    timelinePhase: 'redemption-period',
    steps,
    proofOfOwnership: true,
    showScriptDownloads: hasWaybackContent === true,
    costSummary: {
      min: 150,
      max: 400,
      currency: 'USD',
      breakdown:
        'Redemption fee: $80-300 (paid to the registry). ' +
        'Registrar service fee: $50-100. ' +
        'Domain renewal: $10-50. ' +
        'Total typically $150-400+.',
    },
    timeSummary:
      `Approximately ${daysLeft} days remain in the redemption period. ` +
      'The restoration process itself takes 1-7 business days after payment.',
    successLikelihood:
      'Possible but expensive -- success depends on being able to prove ownership ' +
      'and paying the redemption fee before the deadline.',
    registrarName: registrar,
    registrarPhone: registrarContact?.phone,
    registrarEmail: registrarContact?.email,
    registrarUrl: inferRegistrarUrl(registrar),
  };
}

function buildPendingDeleteGuide(
  domain: string,
  hasWaybackContent?: boolean,
): RecoveryGuideData {
  const steps: RecoveryStep[] = [
    {
      stepNumber: 1,
      title: 'Sign Up for Backorder Services Immediately',
      description:
        `The domain ${domain} is about to be deleted and released to the public. ` +
        'Backorder services are your best chance of grabbing it the moment it becomes available.',
      details: [
        'Create accounts at SnapNames, DropCatch, and NameJet.',
        `Search for ${domain} on each service and place a backorder.`,
        'Most services charge $69-99 and only charge you if they successfully get the domain.',
        'Submit your backorders as soon as possible -- timing matters.',
      ],
      urgency: 'immediate',
      estimatedTime: '15 minutes',
      difficulty: 'easy',
      helpText:
        'When a domain is deleted, it becomes available for anyone to register. ' +
        'Backorder services have automated systems that try to register it within milliseconds of release. ' +
        'Without one, you are unlikely to be fast enough.',
      links: BACKORDER_SERVICES,
    },
    {
      stepNumber: 2,
      title: 'Use Multiple Backorder Services',
      description:
        'Each backorder service has its own connection to the domain registries. ' +
        'Using several at once gives you the best possible chance.',
      details: [
        'Place backorders with at least 2-3 different services.',
        'Each operates independently, so you are not paying twice for the same chance.',
        'You only pay the one that successfully registers the domain.',
        'If two or more services catch the same domain, they may hold a private auction.',
      ],
      urgency: 'immediate',
      estimatedTime: '10 minutes',
      difficulty: 'easy',
      helpText:
        'Think of backorder services like hiring multiple people to wait in line at a store for a limited item. ' +
        'The more people you have in line, the better your odds.',
    },
    {
      stepNumber: 3,
      title: 'Set a Budget for Auction',
      description:
        'If the domain is popular, it may go to auction after being caught by a backorder service. ' +
        'Decide in advance how much you are willing to spend.',
      details: [
        'Research the domain\'s value based on length, keywords, and extension.',
        'Set a maximum bid you are comfortable with before the auction starts.',
        'Auctions typically last 3-7 days.',
        'Do not get caught up in bidding wars -- stick to your budget.',
        'Remember you will also pay the annual registration fee on top of the auction price.',
      ],
      urgency: 'soon',
      estimatedTime: '15 minutes',
      difficulty: 'moderate',
      helpText:
        'Domain auctions work like eBay -- the highest bidder wins. ' +
        'Some desirable domains can attract many bidders and sell for thousands of dollars.',
    },
    {
      stepNumber: 4,
      title: 'Prepare an Alternative Domain Name',
      description:
        'There is no guarantee you will win the domain, especially if other people also want it. ' +
        'Have a backup ready so you are not left without options.',
      details: [
        'Brainstorm 3-5 alternative domain names.',
        'Check if they are available for registration now.',
        'Consider registering your best alternative immediately as a safety net.',
        'Think about different extensions (.net, .org, .co, .io) of the same name.',
      ],
      urgency: 'when-ready',
      estimatedTime: '15 minutes',
      difficulty: 'easy',
      helpText:
        'Having a backup domain ready means you can move forward with your project ' +
        'even if the primary domain goes to someone else.',
    },
  ];

  return {
    headline: 'Domain Will Be Deleted Soon',
    headlineColor: 'red',
    summary:
      `The domain ${domain} has passed through both the grace and redemption periods and is scheduled for deletion. ` +
      'Once deleted, it will become available for anyone to register on a first-come, first-served basis. ' +
      'Your best strategy is to use backorder services to automatically grab it the moment it is released.',
    statusExplanation:
      'After a domain expires and the grace and redemption periods pass, the registry schedules it for deletion. ' +
      'This usually happens within 1-5 days. Once deleted, the domain goes back into the public pool and anyone can register it. ' +
      'Backorder services are automated tools that compete to register the domain the instant it becomes available.',
    timelinePhase: 'pending-delete',
    steps,
    showScriptDownloads: hasWaybackContent === true,
    costSummary: {
      min: 69,
      max: 500,
      currency: 'USD',
      breakdown:
        'Backorder fee: $69-99 per service (only charged on success). ' +
        'Auction price: varies widely ($69-$500+ depending on demand). ' +
        'Annual registration: $10-15/year after acquisition.',
    },
    timeSummary:
      'The domain could be deleted and released any day. ' +
      'Set up backorders immediately -- the sooner the better.',
    successLikelihood:
      'Depends on competition for this domain. Common words or short domains attract more bidders ' +
      'and are harder to win. Unique or longer domains may have less competition.',
  };
}

function buildActiveInUseGuide(
  domain: string,
  registrar?: string,
  registrarContact?: { email?: string; phone?: string },
  hasWaybackContent?: boolean,
  estimatedCost?: { min: number; max: number; currency: string },
): RecoveryGuideData {
  const cost = estimatedCost || { min: 500, max: 100000, currency: 'USD' };

  const steps: RecoveryStep[] = [
    {
      stepNumber: 1,
      title: 'Check WHOIS for Owner Information',
      description:
        'The first step is to find out who currently owns the domain. ' +
        'WHOIS records sometimes include contact details for the owner.',
      details: [
        'Use the ICANN WHOIS lookup tool to search for the domain.',
        'Look for the registrant (owner) name, email, or organization.',
        'Note that many owners use privacy protection, which hides their real contact info.',
        'If privacy is enabled, look for a forwarding email address provided by the privacy service.',
      ],
      urgency: 'when-ready',
      estimatedTime: '10 minutes',
      difficulty: 'easy',
      helpText:
        'WHOIS is a public database that stores information about who registered a domain. ' +
        'Privacy protection replaces the owner\'s real information with the registrar\'s details, ' +
        'but most privacy services still forward messages to the owner.',
      links: WHOIS_TOOLS,
    },
    {
      stepNumber: 2,
      title: 'Contact the Owner with a Purchase Offer',
      description:
        'Reach out to the domain owner to see if they would be willing to sell. ' +
        'Be polite, professional, and prepared for them to say no.',
      details: [
        'Send a brief, professional email expressing your interest in purchasing the domain.',
        'Do not reveal how badly you want it or share your maximum budget.',
        'Start with a reasonable offer -- not so low that it is insulting, but leave room to negotiate.',
        'If the WHOIS email bounces, try the website\'s contact page or social media.',
        'Be patient -- it may take days or weeks to get a response.',
      ],
      urgency: 'when-ready',
      estimatedTime: '15 minutes',
      difficulty: 'moderate',
      emailTemplateKey: 'purchase-offer',
      helpText:
        'Many domain owners receive purchase inquiries and ignore lowball offers. ' +
        'A well-written, respectful message has a much better chance of getting a response.',
    },
    {
      stepNumber: 3,
      title: 'Use a Domain Broker If No Response',
      description:
        'If you cannot reach the owner directly, a domain broker can negotiate on your behalf. ' +
        'Brokers have experience and tools for contacting domain owners.',
      details: [
        'Domain brokers typically charge 10-15% of the final sale price.',
        'Reputable brokers include Sedo, GoDaddy Broker Service, and MediaOptions.',
        'The broker will contact the owner and negotiate a price without revealing who you are.',
        'This keeps your identity private and can lead to a better price.',
      ],
      urgency: 'when-ready',
      estimatedTime: '30 minutes to set up',
      difficulty: 'moderate',
      helpText:
        'A domain broker is like a real estate agent for domain names. ' +
        'They handle the negotiation so you do not have to.',
      links: [
        { label: 'Sedo Broker Service', url: 'https://sedo.com/us/buy-domains/domain-brokerage/' },
        { label: 'GoDaddy Domain Broker', url: 'https://www.godaddy.com/domain-broker' },
      ],
    },
    {
      stepNumber: 4,
      title: 'Explore Legal Options If You Have Trademark Rights',
      description:
        'If you own a trademark that matches the domain and the current owner is using it in bad faith, ' +
        'there are several legal processes available -- from quick suspensions to federal lawsuits.',
      details: [
        'RECOMMENDED FIRST STEP: Send a cease-and-desist letter. This is free, and many cybersquatters will release the domain rather than face legal action. Use the template provided.',
        'UDRP (Uniform Domain-Name Dispute-Resolution Policy): The standard process. Costs $1,500-5,000, takes about 2 months. You must prove: (1) you have trademark rights, (2) the domain was registered in bad faith, and (3) the registrant has no legitimate interest. Can result in domain transfer.',
        'URS (Uniform Rapid Suspension): A faster, cheaper alternative. Costs about $375, resolves in days. However, it only SUSPENDS the domain -- it does not transfer it to you. Best for clear-cut trademark abuse where you want fast action.',
        'ACPA (Anticybersquatting Consumer Protection Act): A US federal law that lets you sue in court. Can award up to $100,000 per domain in statutory damages. More expensive ($5,000-20,000+ in legal fees) but the strongest remedy for serious cases.',
        'IMPORTANT: You do NOT need a registered trademark to have rights. Common-law trademark rights from using a name in commerce can be sufficient for UDRP and ACPA.',
        'Consult a domain name attorney -- many offer free initial consultations and can advise on which path is best for your situation.',
      ],
      urgency: 'when-ready',
      estimatedTime: 'URS: days. UDRP: 2 months. ACPA: 3-12 months.',
      difficulty: 'hard',
      emailTemplateKey: 'cease-and-desist',
      helpText:
        'These legal options exist specifically to combat cybersquatting -- when someone registers a domain ' +
        'containing your trademark to profit from your brand. They are not for general disputes about who should own a domain. ' +
        'Start with a cease-and-desist letter before escalating to formal proceedings.',
      links: [
        { label: 'WIPO UDRP Overview', url: 'https://www.wipo.int/amc/en/domains/guide/' },
        { label: 'ICANN UDRP Policy', url: 'https://www.icann.org/resources/pages/help/dndr/udrp-en' },
        { label: 'WIPO URS Information', url: 'https://www.wipo.int/amc/en/domains/urs/' },
      ],
    },
    {
      stepNumber: 5,
      title: 'Explore Alternative Domains',
      description:
        'If the owner is not willing to sell or the price is too high, consider registering ' +
        'a similar domain that works for your needs.',
      details: [
        'Try different extensions: .net, .org, .co, .io, .app.',
        'Add a word: "get", "my", "use", "the", or "go" before or after the name.',
        'Use a domain name generator for creative alternatives.',
        'Check social media handles for consistency with your chosen domain.',
      ],
      urgency: 'when-ready',
      estimatedTime: '15-30 minutes',
      difficulty: 'easy',
      helpText:
        'Many successful companies use creative domain names that are not exact matches ' +
        'of their brand name. Focus on something memorable and easy to spell.',
    },
  ];

  return {
    headline: 'This Domain is Currently Owned',
    headlineColor: 'gray',
    summary:
      `The domain ${domain} is currently registered and actively in use by its owner. ` +
      'Acquiring it will require negotiating with the current owner, which may not be possible or may be expensive. ' +
      'There are several approaches you can try, starting with the simplest.',
    statusExplanation:
      'An active, in-use domain means someone owns it and is using it for a website, email, or other services. ' +
      'Unlike expired domains, there is no automatic process to acquire it. ' +
      'The owner would need to agree to sell it to you voluntarily.',
    timelinePhase: 'active',
    steps,
    showScriptDownloads: false,
    costSummary: {
      min: cost.min,
      max: cost.max,
      currency: cost.currency,
      breakdown:
        'Costs vary enormously depending on the domain\'s value and the owner\'s asking price. ' +
        'Short, common-word .com domains can cost tens of thousands. ' +
        'Less desirable domains may sell for a few hundred dollars.',
    },
    timeSummary:
      'This process can take anywhere from days to months, depending on how quickly the owner responds ' +
      'and whether negotiations are successful.',
    successLikelihood:
      'Depends on the owner\'s willingness to sell. Many active domain owners are not interested ' +
      'in selling, especially if they are using the domain for their business.',
    registrarName: registrar,
    registrarPhone: registrarContact?.phone,
    registrarEmail: registrarContact?.email,
    registrarUrl: inferRegistrarUrl(registrar),
  };
}

function buildActiveParkedGuide(
  domain: string,
  registrar?: string,
  registrarContact?: { email?: string; phone?: string },
  hasWaybackContent?: boolean,
  estimatedCost?: { min: number; max: number; currency: string },
): RecoveryGuideData {
  const cost = estimatedCost || { min: 100, max: 10000, currency: 'USD' };

  const steps: RecoveryStep[] = [
    {
      stepNumber: 1,
      title: 'Check Aftermarket Listings',
      description:
        `Parked domains are often listed for sale on aftermarket platforms. ` +
        `Search for ${domain} on popular domain marketplaces to see if it has a listed price.`,
      details: [
        'Search on Sedo, Afternic, GoDaddy Auctions, and Dan.com.',
        'Check if the domain\'s parking page itself has a "Buy" or "Make Offer" button.',
        'Note the asking price if one is listed -- this is often negotiable.',
        'Look at comparable domain sales to understand fair market value.',
      ],
      urgency: 'soon',
      estimatedTime: '15 minutes',
      difficulty: 'easy',
      helpText:
        'Domain aftermarkets are like used car lots for domain names. ' +
        'Owners list their domains for sale, and buyers can purchase or make offers.',
      links: [
        { label: 'Sedo', url: 'https://sedo.com' },
        { label: 'Afternic', url: 'https://www.afternic.com' },
        { label: 'Dan.com', url: 'https://dan.com' },
        { label: 'GoDaddy Auctions', url: 'https://auctions.godaddy.com' },
      ],
    },
    {
      stepNumber: 2,
      title: 'Contact the Owner',
      description:
        'If the domain is not listed for sale, reach out to the owner directly. ' +
        'Parked domain owners are often more willing to sell than active website owners.',
      details: [
        'Check the WHOIS record for contact information.',
        'If privacy-protected, use the proxy email address to reach the owner.',
        'Try visiting the parked page -- it may have a contact form or email.',
        'Send a professional, concise message expressing interest.',
        'Do not mention how much you are willing to pay in the first message.',
      ],
      urgency: 'soon',
      estimatedTime: '15 minutes',
      difficulty: 'moderate',
      emailTemplateKey: 'purchase-offer',
      helpText:
        'Parked domains are not being used for a website, which often means the owner is open to offers. ' +
        'They may have registered it as an investment specifically to sell later.',
      links: WHOIS_TOOLS,
    },
    {
      stepNumber: 3,
      title: 'Make a Reasonable Offer',
      description:
        'When you hear back from the owner (or if there is a "Make Offer" option), ' +
        'submit a reasonable offer based on the domain\'s market value.',
      details: [
        'Research comparable domain sales using NameBio or DNJournal.',
        'Start with an offer below your maximum budget to leave room for negotiation.',
        'Be prepared for a counter-offer -- negotiation is normal.',
        'Consider the domain\'s length, keywords, extension, and brandability in your valuation.',
        'If the price is too high, politely decline and explore alternatives.',
      ],
      urgency: 'when-ready',
      estimatedTime: '10 minutes for the offer, days to weeks for negotiation',
      difficulty: 'moderate',
      helpText:
        'Domain pricing is subjective. Short, memorable .com domains command premium prices. ' +
        'Longer or less common domains are usually more affordable.',
      links: [
        { label: 'NameBio (recent sales data)', url: 'https://namebio.com' },
      ],
    },
    {
      stepNumber: 4,
      title: 'Use an Escrow Service for Safe Payment',
      description:
        'Once you agree on a price, always use an escrow service to protect both parties. ' +
        'Never send money directly to a stranger for a domain purchase.',
      details: [
        'Escrow.com is the industry standard for domain transactions.',
        'The buyer sends payment to escrow, the seller transfers the domain, then escrow releases the payment.',
        'Escrow fees are typically 3-5% of the sale price (often split between buyer and seller).',
        'The entire escrow process usually takes 3-7 business days.',
        'Verify the domain has been transferred to your registrar account before escrow releases funds.',
      ],
      urgency: 'when-ready',
      estimatedTime: '3-7 days for the full transaction',
      difficulty: 'moderate',
      helpText:
        'An escrow service acts as a trusted middleman. They hold the buyer\'s money until the seller ' +
        'delivers the domain, protecting both sides from fraud.',
      links: ESCROW_SERVICES,
    },
  ];

  return {
    headline: 'Domain is Registered but Not in Use',
    headlineColor: 'blue',
    summary:
      `The domain ${domain} is registered but does not appear to have an active website. ` +
      'This is often a positive sign -- parked domains are frequently held as investments ' +
      'and their owners are more likely to be open to selling.',
    statusExplanation:
      'A "parked" domain is one that is registered but not being used for a real website. ' +
      'Instead, the owner has it sitting with a placeholder page, often showing ads. ' +
      'People park domains for various reasons: as investments, future projects, or simply because they have not set them up yet.',
    timelinePhase: 'active-parked',
    steps,
    showScriptDownloads: false,
    costSummary: {
      min: cost.min,
      max: cost.max,
      currency: cost.currency,
      breakdown:
        'Parked domain prices vary widely. Basic domains: $100-500. ' +
        'Decent keyword domains: $500-5,000. Premium or short domains: $5,000-10,000+.',
    },
    timeSummary:
      'The process typically takes 1-4 weeks from first contact to owning the domain, ' +
      'depending on how quickly the owner responds and negotiation time.',
    successLikelihood:
      'Moderate -- parked domains are more likely to be for sale than active websites. ' +
      'Many parked domain owners are specifically waiting for a buyer.',
    registrarName: registrar,
    registrarPhone: registrarContact?.phone,
    registrarEmail: registrarContact?.email,
    registrarUrl: inferRegistrarUrl(registrar),
  };
}

function buildActiveForSaleGuide(
  domain: string,
  registrar?: string,
  registrarContact?: { email?: string; phone?: string },
  estimatedCost?: { min: number; max: number; currency: string },
): RecoveryGuideData {
  const cost = estimatedCost || { min: 100, max: 50000, currency: 'USD' };

  const steps: RecoveryStep[] = [
    {
      stepNumber: 1,
      title: 'Check the Listing Price',
      description:
        `Visit the domain's listing page or the marketplace where it is for sale to see the asking price. ` +
        'This gives you a starting point for negotiations.',
      details: [
        `Try visiting ${domain} directly -- many for-sale domains display their price on the landing page.`,
        'Search for the domain on Sedo, Afternic, Dan.com, and GoDaddy Auctions.',
        'Note whether the listing says "Buy Now" (fixed price) or "Make Offer" (negotiable).',
        'Research comparable domain sales to see if the price is fair.',
      ],
      urgency: 'soon',
      estimatedTime: '10 minutes',
      difficulty: 'easy',
      helpText:
        'Listed domains are like houses with a "For Sale" sign. The asking price is a starting point ' +
        'and is often negotiable, especially for "Make Offer" listings.',
      links: [
        { label: 'Sedo', url: 'https://sedo.com' },
        { label: 'Afternic', url: 'https://www.afternic.com' },
        { label: 'Dan.com', url: 'https://dan.com' },
        { label: 'NameBio (price comparisons)', url: 'https://namebio.com' },
      ],
    },
    {
      stepNumber: 2,
      title: 'Decide on Your Budget',
      description:
        'Before making an offer, determine how much the domain is worth to you. ' +
        'Set a firm maximum price and commit to not exceeding it.',
      details: [
        'Consider how important this exact domain is for your brand or project.',
        'Factor in that you will also pay annual renewal fees ($10-15/year).',
        'Compare the cost against buying an alternative domain for $10-15.',
        'Remember: a domain is only worth what it is worth to you.',
      ],
      urgency: 'soon',
      estimatedTime: '15 minutes',
      difficulty: 'easy',
      helpText:
        'Domain pricing is highly subjective. A domain worth $10,000 to one person may be worth $100 to another. ' +
        'Focus on what it is worth for your specific use case.',
    },
    {
      stepNumber: 3,
      title: 'Make an Offer or Buy at Asking Price',
      description:
        'If the price is right, you can buy immediately. If you want to negotiate, ' +
        'submit an offer through the listing platform.',
      details: [
        '"Buy Now" listings can be purchased immediately with a credit card or payment service.',
        'For "Make Offer" listings, start at 50-70% of the asking price and negotiate from there.',
        'Always use the marketplace\'s built-in offer system rather than emailing directly.',
        'Be responsive -- sellers prefer buyers who communicate quickly.',
        'Get any agreed price in writing before sending money.',
      ],
      urgency: 'when-ready',
      estimatedTime: '10 minutes for the offer, 1-7 days for negotiation',
      difficulty: 'moderate',
      helpText:
        'Most marketplace offers follow a back-and-forth pattern. You offer, they counter, you counter again. ' +
        '2-3 rounds is typical before reaching an agreement.',
    },
    {
      stepNumber: 4,
      title: 'Use an Escrow Service for Payment',
      description:
        'Whether buying through a marketplace or directly, use an escrow service ' +
        'to protect your payment. Never wire money directly to a seller.',
      details: [
        'Most major marketplaces (Sedo, Dan.com, Afternic) have built-in escrow.',
        'For direct purchases, use Escrow.com -- the industry standard.',
        'The process: you pay escrow, the seller transfers the domain to you, escrow releases the payment.',
        'Typical escrow fees are 3-5% of the sale price.',
        'Do not release payment until the domain is confirmed in your registrar account.',
      ],
      urgency: 'when-ready',
      estimatedTime: '3-7 days',
      difficulty: 'moderate',
      helpText:
        'Escrow services prevent fraud by holding the money until both sides fulfill their obligations. ' +
        'This is the safest way to buy a domain from someone you do not know.',
      links: ESCROW_SERVICES,
    },
    {
      stepNumber: 5,
      title: 'Complete the Domain Transfer',
      description:
        'After payment, the seller will initiate a domain transfer to your registrar account. ' +
        'You will need to approve it on your end.',
      details: [
        'Make sure you have a registrar account ready to receive the domain.',
        'The seller will provide an authorization (EPP) code to start the transfer.',
        'Enter the EPP code at your registrar to begin the transfer.',
        'Approve the transfer when you receive a confirmation email.',
        'Transfers typically complete within 5-7 days, though some are faster.',
        'After transfer completes, verify DNS settings and enable auto-renew.',
      ],
      urgency: 'when-ready',
      estimatedTime: '5-7 days',
      difficulty: 'moderate',
      helpText:
        'An EPP code (also called an auth code or transfer code) is like a password for transferring ' +
        'a domain between registrars. The current owner must provide it to you.',
    },
  ];

  return {
    headline: 'This Domain is Listed for Sale',
    headlineColor: 'blue',
    summary:
      `The domain ${domain} is currently listed for sale, which means the owner is actively looking for a buyer. ` +
      'This is a good sign -- you can likely purchase it if the price fits your budget. ' +
      'The key is to research fair pricing, negotiate effectively, and use a safe payment method.',
    statusExplanation:
      'A domain listed "for sale" means the owner has explicitly put it on the market. ' +
      'This is the most straightforward acquisition scenario because both parties want the transaction to happen. ' +
      'The main question is agreeing on a fair price.',
    timelinePhase: 'active-for-sale',
    steps,
    showScriptDownloads: false,
    costSummary: {
      min: cost.min,
      max: cost.max,
      currency: cost.currency,
      breakdown:
        'The final price depends on the listing. ' +
        'Plus escrow fees (3-5% of sale price) and domain transfer/renewal ($10-15/year).',
    },
    timeSummary:
      'From first offer to owning the domain, expect 1-3 weeks. ' +
      'Buy Now purchases can complete in under a week.',
    successLikelihood:
      'High -- the owner wants to sell. Success mostly depends on whether you can agree on a price.',
    registrarName: registrar,
    registrarPhone: registrarContact?.phone,
    registrarEmail: registrarContact?.email,
    registrarUrl: inferRegistrarUrl(registrar),
  };
}

function buildReservedGuide(domain: string): RecoveryGuideData {
  return {
    headline: 'This Domain is Reserved',
    headlineColor: 'gray',
    summary:
      `The domain ${domain} is reserved by the domain registry and cannot be registered by the public. ` +
      'Reserved domains are set aside for technical, policy, or other reasons and are not available for purchase.',
    statusExplanation:
      'Some domain names are permanently reserved by the organizations that manage the domain name system. ' +
      'For example, "example.com" is reserved for use in documentation and testing. ' +
      'These domains cannot be registered, purchased, or transferred regardless of what you are willing to pay.',
    timelinePhase: 'reserved',
    steps: [
      {
        stepNumber: 1,
        title: 'This Domain is Permanently Reserved',
        description:
          `The domain ${domain} is set aside by the registry and is not available to register. ` +
          'Unfortunately, there is nothing that can be done to acquire it.',
        details: [
          'Reserved domains are controlled by ICANN or the relevant domain registry.',
          'They are used for technical purposes, examples, or policy reasons.',
          'No amount of money or negotiation can change this status.',
          'This is a permanent restriction, not a temporary one.',
        ],
        urgency: 'when-ready',
        difficulty: 'hard',
        helpText:
          'Domain registries (like Verisign for .com) reserve certain domain names ' +
          'to prevent confusion or for technical requirements of the internet.',
      },
      {
        stepNumber: 2,
        title: 'Choose an Alternative Domain',
        description:
          'Since this domain cannot be acquired, focus your energy on finding a great alternative ' +
          'that serves your needs just as well.',
        details: [
          'Try adding a word or prefix to create a unique variation.',
          'Consider different domain extensions (.net, .org, .co, .io, .app).',
          'Use a domain name generator for creative ideas.',
          'Focus on something memorable, easy to spell, and relevant to your project.',
          'Check that matching social media handles are available for brand consistency.',
        ],
        urgency: 'when-ready',
        estimatedTime: '15-30 minutes',
        difficulty: 'easy',
        helpText:
          'Many successful brands use creative domain names that are not dictionary words. ' +
          'Do not let one unavailable domain hold back your project.',
      },
    ],
    costSummary: {
      min: 0,
      max: 0,
      currency: 'USD',
      breakdown: 'This domain cannot be purchased. An alternative domain costs $10-15/year.',
    },
    timeSummary: 'This domain cannot be acquired. Finding and registering an alternative takes about 15 minutes.',
    successLikelihood: 'Not possible -- this domain is permanently reserved and cannot be registered.',
  };
}

function buildUnknownGuide(domain: string): RecoveryGuideData {
  return {
    headline: 'Unable to Determine Domain Status',
    headlineColor: 'gray',
    summary:
      `We were unable to fully analyze the status of ${domain}. ` +
      'This can happen due to rate limits, network issues, or the domain having an unusual configuration. ' +
      'You can try searching again, or use the manual tools below to investigate on your own.',
    statusExplanation:
      'When our automated analysis cannot determine a domain\'s status, it usually means one of a few things: ' +
      'the WHOIS server did not respond, the domain has a non-standard configuration, ' +
      'or there was a temporary network issue. The domain may still be available, active, or expired -- we just could not tell.',
    timelinePhase: 'unknown',
    steps: [
      {
        stepNumber: 1,
        title: 'Try Searching Again',
        description:
          'The analysis may have failed due to a temporary issue. Wait a moment and try running ' +
          'the search again -- it often succeeds on the second attempt.',
        details: [
          'Wait 30 seconds before retrying.',
          'Make sure the domain name is spelled correctly.',
          'Check that the domain extension is valid (e.g., .com, .net, .org).',
          'If the search keeps failing, try one of the manual tools below.',
        ],
        urgency: 'soon',
        estimatedTime: '2 minutes',
        difficulty: 'easy',
        helpText:
          'Automated WHOIS lookups sometimes fail due to server rate limits or temporary outages. ' +
          'A second attempt usually works.',
      },
      {
        stepNumber: 2,
        title: 'Check WHOIS Manually',
        description:
          'Use a WHOIS lookup tool to check the domain\'s registration status yourself. ' +
          'This will tell you whether the domain is registered, who owns it, and when it expires.',
        details: [
          `Search for "${domain}" on any of the WHOIS tools linked below.`,
          'If the result says "No match" or "Not found", the domain is likely available to register.',
          'If it shows registration details, note the registrar, expiry date, and owner information.',
          'Check the expiry date to determine if the domain is in a grace or redemption period.',
        ],
        urgency: 'soon',
        estimatedTime: '5 minutes',
        difficulty: 'easy',
        helpText:
          'WHOIS is the public registry for domain ownership. Anyone can look up a domain\'s WHOIS record ' +
          'to see basic information about its registration.',
        links: WHOIS_TOOLS,
      },
      {
        stepNumber: 3,
        title: 'Try Visiting the Domain Directly',
        description:
          `Open a web browser and try visiting ${domain}. What you see (or do not see) ` +
          'can tell you a lot about the domain\'s status.',
        details: [
          `Type "https://${domain}" in your browser's address bar.`,
          'If a real website loads, the domain is active and in use.',
          'If you see a parked page with ads, the domain is registered but not actively used.',
          'If the page does not load at all, the domain may be expired or available.',
          'If you see a "For Sale" page, the owner is looking to sell.',
        ],
        urgency: 'soon',
        estimatedTime: '2 minutes',
        difficulty: 'easy',
        helpText:
          'A simple browser test is one of the quickest ways to determine what is happening with a domain.',
      },
    ],
    costSummary: {
      min: 0,
      max: 0,
      currency: 'USD',
      breakdown: 'Unable to estimate costs until the domain status is determined.',
    },
    timeSummary: 'Start with the manual checks above -- they only take a few minutes.',
    successLikelihood: 'Cannot be determined until the domain status is known. Try the steps above to find out more.',
  };
}

// ---------------------------------------------------------------------------
// Context-driven guide builders and helpers (Gaps 1-7)
// ---------------------------------------------------------------------------

function buildActiveHostingIssueGuide(
  domain: string,
  registrar?: string,
  registrarContact?: { email?: string; phone?: string },
): RecoveryGuideData {
  const registrarName = registrar || 'your registrar';

  const steps: RecoveryStep[] = [
    {
      stepNumber: 1,
      title: 'Confirm the Problem is Hosting, Not the Domain',
      description:
        `Your domain ${domain} is properly registered and your DNS records look correct. ` +
        'The problem appears to be with your web hosting -- the server that stores your website files.',
      details: [
        `Your domain registration is active and has not expired.`,
        'Your DNS records (the settings that point your domain to a server) are configured.',
        'But the server your domain points to is not responding or is returning an error.',
        'This means the issue is almost certainly with your hosting provider, not your domain.',
      ],
      urgency: 'immediate',
      estimatedTime: '5 minutes to verify',
      difficulty: 'easy',
      helpText:
        'Think of it like this: your domain is your street address (working fine), but the building at that address ' +
        'has its lights off. We need to fix the building, not the address.',
    },
    {
      stepNumber: 2,
      title: 'Check Your Hosting Provider Status',
      description:
        'Visit your hosting provider\'s status page or contact them to find out if there is an outage or issue with your account.',
      details: [
        'Log into your hosting control panel (cPanel, Plesk, or your provider\'s dashboard).',
        'Check if your hosting account is active and paid up.',
        'Look for a status page (e.g., status.yourhost.com) to see if there is a known outage.',
        'If you cannot log in, your hosting account may have been suspended for non-payment or a terms violation.',
      ],
      urgency: 'immediate',
      estimatedTime: '10 minutes',
      difficulty: 'easy',
      helpText:
        'Hosting providers are the companies that store your website files and make them accessible online. ' +
        'Common providers include GoDaddy, Bluehost, SiteGround, HostGator, and Cloudflare.',
    },
    {
      stepNumber: 3,
      title: 'Contact Your Hosting Provider',
      description:
        'Call or chat with your hosting provider\'s support team. They can tell you exactly why your site is down and help fix it.',
      details: [
        'Phone support is usually the fastest option for urgent issues.',
        'Ask: "Is my hosting account active?" and "Why is my website not loading?"',
        'Common causes: expired hosting plan, server misconfiguration, SSL certificate issue, or exceeded resource limits.',
        'If your hosting was suspended, ask what steps are needed to reactivate it.',
      ],
      urgency: 'immediate',
      estimatedTime: '15-30 minutes',
      difficulty: 'moderate',
      phoneScript:
        `Hi, I'm calling about my website ${domain}. It's not loading even though my domain registration is active. ` +
        `Can you check if my hosting account is active and if there are any issues with the server?`,
    },
    {
      stepNumber: 4,
      title: 'Verify Your SSL Certificate',
      description:
        'If your site loads but shows a security warning, the issue may be an expired or misconfigured SSL certificate.',
      details: [
        'Try visiting your site with https:// and see if you get a security warning.',
        'In your hosting control panel, check if SSL/TLS is enabled and the certificate is current.',
        'Many hosting providers offer free SSL through Let\'s Encrypt -- ask support to enable it.',
        'If you recently changed hosting or DNS settings, the SSL certificate may need to be reissued.',
      ],
      urgency: 'soon',
      estimatedTime: '10 minutes',
      difficulty: 'moderate',
      helpText:
        'SSL certificates encrypt the connection between your visitors and your website. ' +
        'When they expire, browsers show scary warnings that keep people from visiting your site.',
    },
    {
      stepNumber: 5,
      title: 'Consider Switching Hosting Providers',
      description:
        'If your current hosting is unreliable or your provider is unresponsive, it may be time to switch to a better host.',
      details: [
        'SiteGround, Cloudways, and Vercel are reliable alternatives with migration support.',
        'Many hosting providers offer free website migration -- they will move your site for you.',
        'Before switching, make sure you have a backup of your website files and database.',
        'Update your DNS records to point to the new hosting provider after migration.',
        'The migration process typically takes 1-3 days with minimal downtime.',
      ],
      urgency: 'when-ready',
      estimatedTime: '1-3 days',
      difficulty: 'moderate',
      helpText:
        'Switching hosting providers is like moving your store to a new building. ' +
        'The address (domain) stays the same, but the physical location changes.',
    },
  ];

  return {
    headline: 'Your Domain is Fine -- the Issue is Your Hosting',
    headlineColor: 'yellow',
    summary:
      `The domain ${domain} is properly registered and configured, but the website is not loading. ` +
      'This usually means there is a problem with your web hosting (the server that stores your website), ' +
      'not with the domain itself. This is typically fixable by contacting your hosting provider.',
    statusExplanation:
      'Your domain name and your web hosting are two separate services. ' +
      'The domain is your internet address, and the hosting is the computer that stores your website files. ' +
      'Even when the domain is working perfectly, the hosting server can go down due to ' +
      'expired hosting plans, server errors, or technical issues.',
    timelinePhase: 'active',
    steps,
    costSummary: {
      min: 0,
      max: 100,
      currency: 'USD',
      breakdown:
        'If hosting just needs reactivation: $0-20/month. ' +
        'If switching providers: $0-50 for migration. ' +
        'SSL certificate: usually free with modern hosting.',
    },
    timeSummary:
      'Most hosting issues can be resolved within 24-48 hours. ' +
      'Simple fixes like reactivating an account may take just minutes.',
    successLikelihood:
      'Very likely -- hosting issues are almost always fixable. ' +
      'This is one of the easier website problems to resolve.',
    registrarName: registrar,
    registrarPhone: registrarContact?.phone,
    registrarEmail: registrarContact?.email,
    registrarUrl: inferRegistrarUrl(registrar),
  };
}

function buildStolenHijackedGuide(
  domain: string,
  registrar?: string,
  registrarContact?: { email?: string; phone?: string },
): RecoveryGuideData {
  const registrarName = registrar || 'the registrar';

  const steps: RecoveryStep[] = [
    {
      stepNumber: 1,
      title: 'Preserve Evidence Immediately',
      description:
        'Before doing anything else, document everything. Take screenshots and save records that prove you owned this domain.',
      details: [
        'Take screenshots of any WHOIS changes showing new registrant information.',
        'Save copies of your original registration confirmation emails.',
        'Screenshot your registrar account showing the domain is missing or transferred.',
        'Check web.archive.org for archived copies of your website as proof of prior use.',
        'Save any suspicious emails you received (phishing attempts, fake transfer notices).',
        'Record the dates when you last had control and when you discovered the theft.',
      ],
      urgency: 'immediate',
      estimatedTime: '30 minutes',
      difficulty: 'moderate',
      helpText:
        'Evidence is critical for every recovery path. Courts, ICANN, and registrars all require proof. ' +
        'The more documentation you have, the stronger your case.',
    },
    {
      stepNumber: 2,
      title: 'File an ICANN Transfer Dispute (IRTD)',
      description:
        'File a formal complaint with ICANN about the unauthorized transfer. This is free and puts the registrar on notice.',
      details: [
        'Go to the ICANN Transfer Dispute page and fill out the complaint form.',
        'You will need: the domain name, your registrar details, the gaining registrar, and a description of what happened.',
        'ICANN will forward your complaint to both registrars involved.',
        'The registrars are required to investigate and respond.',
        'This process is free but may take 2-4 weeks.',
      ],
      urgency: 'immediate',
      estimatedTime: '30 minutes',
      difficulty: 'moderate',
      helpText:
        'ICANN is the international organization that oversees domain name registrations. ' +
        'Filing a transfer dispute is like filing a formal complaint with the governing body.',
      links: [
        { label: 'ICANN Transfer Dispute Form', url: 'https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en' },
      ],
    },
    {
      stepNumber: 3,
      title: 'Contact the Registrar Abuse Team',
      description:
        `Contact ${registrarName}'s abuse team by phone AND email. Report the unauthorized transfer and request an immediate domain lock.`,
      details: [
        registrarContact?.phone
          ? `Call ${registrarName} at ${registrarContact.phone} and ask for the abuse/security team.`
          : `Find ${registrarName}'s abuse contact on their website or through ICANN's registrar directory.`,
        'Demand that the domain be locked immediately to prevent further transfers or modifications.',
        'Provide all the evidence you gathered in Step 1.',
        'Ask for a case/ticket number and the name of the person handling your case.',
        'Follow up the phone call with a written email documenting everything discussed.',
      ],
      urgency: 'immediate',
      estimatedTime: '30-60 minutes',
      difficulty: 'moderate',
      emailTemplateKey: 'hijacking-report',
      phoneScript:
        `Hi, I need to report an unauthorized domain transfer. My domain ${domain} was transferred without my permission. ` +
        `I need you to immediately lock this domain to prevent any further changes while this is investigated. ` +
        `Can I speak with someone on your abuse or security team?`,
    },
    {
      stepNumber: 4,
      title: 'File a Police Report',
      description:
        'Domain hijacking is a crime. File a report with your local police and with the FBI\'s Internet Crime Complaint Center (IC3).',
      details: [
        'File a report with your local police department -- you will need the report number for legal proceedings.',
        'File an online complaint with the FBI\'s IC3 (Internet Crime Complaint Center).',
        'Include all evidence: screenshots, dates, financial losses, and suspected method of attack.',
        'The police report strengthens your case with ICANN, registrars, and in court.',
        'If the domain was used for a business, document any revenue losses.',
      ],
      urgency: 'soon',
      estimatedTime: '1-2 hours',
      difficulty: 'moderate',
      helpText:
        'Even if local police may not actively investigate, having a police report on file ' +
        'adds legitimacy to your case and is often required for legal proceedings.',
      links: [
        { label: 'FBI IC3 Complaint Center', url: 'https://www.ic3.gov' },
      ],
    },
    {
      stepNumber: 5,
      title: 'Consider UDRP or Legal Action',
      description:
        'If the registrar process does not resolve the issue, you have legal options to recover your domain.',
      details: [
        'UDRP (Uniform Domain-Name Dispute-Resolution Policy): $1,500-5,000, takes about 2 months. Best if you have trademark rights.',
        'URS (Uniform Rapid Suspension): ~$375, faster but only suspends the domain, does not transfer it.',
        'ACPA lawsuit: US federal court, can award up to $100,000 per domain, but expensive and time-consuming.',
        'Consult a domain attorney -- many offer free initial consultations.',
        'If the domain was valuable, legal action may be worth the investment.',
      ],
      urgency: 'soon',
      estimatedTime: 'Weeks to months',
      difficulty: 'hard',
      helpText:
        'Legal action should be a last resort after trying registrar-level remedies. ' +
        'But for valuable domains, it is sometimes the only effective path.',
      links: [
        { label: 'WIPO UDRP Filing', url: 'https://www.wipo.int/amc/en/domains/' },
        { label: 'ICANN UDRP Policy', url: 'https://www.icann.org/resources/pages/help/dndr/udrp-en' },
      ],
    },
    {
      stepNumber: 6,
      title: 'Secure Your Accounts to Prevent Future Theft',
      description:
        'Once you recover the domain (or for your other domains), take immediate steps to prevent this from happening again.',
      details: [
        'Enable two-factor authentication (2FA) on your registrar account.',
        'Use a strong, unique password that you do not use anywhere else.',
        'Enable registrar lock (transfer lock) on all your domains.',
        'Set up email alerts for any changes to your domain or account.',
        'Consider using a registrar with enhanced security features (Cloudflare, Google Domains).',
        'Review who has access to your registrar account and remove any unauthorized users.',
      ],
      urgency: 'when-ready',
      estimatedTime: '15 minutes',
      difficulty: 'easy',
      helpText:
        'Most domain hijackings happen because of weak passwords, lack of two-factor authentication, ' +
        'or falling for phishing emails. These simple security measures block most attacks.',
    },
  ];

  return {
    headline: 'Domain Theft: Emergency Recovery Steps',
    headlineColor: 'red',
    summary:
      `If your domain ${domain} was transferred or modified without your permission, this is a serious situation ` +
      'that requires immediate action. Follow these steps in order to maximize your chances of recovery. ' +
      'Time is critical -- the sooner you act, the better your chances.',
    statusExplanation:
      'Domain hijacking occurs when someone gains unauthorized access to your domain registrar account ' +
      'and transfers the domain to themselves or changes its settings. This can happen through phishing, ' +
      'social engineering, or exploiting weak account security. While alarming, there are established ' +
      'processes for investigating and reversing unauthorized transfers.',
    timelinePhase: 'active',
    steps,
    proofOfOwnership: true,
    costSummary: {
      min: 0,
      max: 5000,
      currency: 'USD',
      breakdown:
        'ICANN Transfer Dispute: Free. ' +
        'UDRP filing: $1,500-5,000. ' +
        'URS filing: ~$375. ' +
        'Attorney consultation: $200-500/hour. ' +
        'ACPA lawsuit: $5,000-20,000+.',
    },
    timeSummary:
      'Registrar investigation: 2-4 weeks. UDRP: about 2 months. ' +
      'Legal action: 3-12 months. Act immediately for the best outcome.',
    successLikelihood:
      'Moderate to high if you act quickly and have good documentation. ' +
      'ICANN processes strongly favor legitimate owners when evidence is clear.',
    registrarName: registrar,
    registrarPhone: registrarContact?.phone,
    registrarEmail: registrarContact?.email,
    registrarUrl: inferRegistrarUrl(registrar),
  };
}

function buildContractualDisputeGuide(
  domain: string,
  registrar?: string,
  registrarContact?: { email?: string; phone?: string },
): RecoveryGuideData {
  const registrarName = registrar || 'the registrar';

  const steps: RecoveryStep[] = [
    {
      stepNumber: 1,
      title: 'Check WHOIS to See Who is Listed as the Owner',
      description:
        `The first step is to find out who is listed as the registered owner (registrant) of ${domain}. ` +
        'This determines your legal standing and your best course of action.',
      details: [
        `Look up ${domain} using the ICANN WHOIS lookup tool.`,
        'Pay attention to the "Registrant" field -- is it your name/company or the developer/agency?',
        'If YOUR name is listed, you have the strongest position -- you are the legal owner.',
        'If the DEVELOPER/AGENCY is listed, the situation is more complex but you still have options.',
        'Save or screenshot the WHOIS record for your records.',
      ],
      urgency: 'immediate',
      estimatedTime: '5 minutes',
      difficulty: 'easy',
      helpText:
        'The person or company listed as the registrant in WHOIS is considered the legal owner of the domain ' +
        'by ICANN. Even if you paid for it, the registrant field determines ownership in disputes.',
      links: WHOIS_TOOLS,
    },
    {
      stepNumber: 2,
      title: 'Send a Formal Transfer Demand',
      description:
        'Send a formal, written demand to the developer/agency requesting the domain be transferred to you. ' +
        'Keep it professional but firm, and set a clear deadline.',
      details: [
        'Use the email template below as a starting point -- customize it with your specific details.',
        'Send by email AND certified mail/registered post for a paper trail.',
        'Set a 14-day deadline for compliance.',
        'Reference your contract or agreement if one exists.',
        'Mention that you will file an ICANN complaint if they do not comply.',
        'Keep copies of everything you send.',
      ],
      urgency: 'immediate',
      estimatedTime: '30 minutes',
      difficulty: 'moderate',
      emailTemplateKey: 'transfer-dispute',
      helpText:
        'A formal demand letter establishes your intent on record and gives the other party a chance ' +
        'to resolve this without escalation. Many disputes are resolved at this stage.',
    },
    {
      stepNumber: 3,
      title: 'File an ICANN Registrar Transfer Complaint',
      description:
        'If the developer/agency does not comply, file a complaint with ICANN. They can compel registrars to investigate.',
      details: [
        'Visit the ICANN complaint page and file a Registrar Transfer Complaint.',
        'Explain that the domain was registered on your behalf and the managing party is refusing to release it.',
        'Attach your demand letter, any contract or agreement, and WHOIS records.',
        'ICANN will contact the registrar and require them to investigate.',
        'This process is free but may take several weeks.',
      ],
      urgency: 'soon',
      estimatedTime: '30 minutes',
      difficulty: 'moderate',
      helpText:
        'ICANN oversees all accredited registrars and has the authority to investigate complaints. ' +
        'Registrars take ICANN complaints seriously because non-compliance can affect their accreditation.',
      links: [
        { label: 'ICANN Complaint Form', url: 'https://www.icann.org/resources/pages/registrar-2013-11-15-en' },
      ],
    },
    {
      stepNumber: 4,
      title: 'Review Your Contract for Ownership Clauses',
      description:
        'If you had a written contract or agreement with the developer/agency, review it carefully for domain ownership language.',
      details: [
        'Look for clauses about domain ownership, intellectual property, and deliverables.',
        'Check if the contract says "work made for hire" or transfers IP rights to you.',
        'Look for any non-compete or non-transfer restrictions.',
        'If the contract is silent on domain ownership, you may need legal advice.',
        'Even without a written contract, verbal agreements and payment records can establish ownership.',
        'Save all emails, invoices, and communications related to the domain.',
      ],
      urgency: 'soon',
      estimatedTime: '30-60 minutes',
      difficulty: 'moderate',
      helpText:
        'Contracts are the strongest evidence in ownership disputes. Even informal agreements ' +
        '(like email exchanges) can serve as evidence of the intended arrangement.',
    },
    {
      stepNumber: 5,
      title: 'Consider Small Claims Court or Mediation',
      description:
        'If informal resolution and ICANN complaints do not work, you can pursue the matter through small claims court or mediation.',
      details: [
        'Small claims court handles disputes up to $5,000-10,000 (varies by jurisdiction).',
        'Filing fees are typically $30-75 and you do not need a lawyer.',
        'Mediation is another option -- a neutral third party helps you reach an agreement.',
        'Bring all documentation: contract, payment records, WHOIS records, demand letters, and correspondence.',
        'Many disputes are settled once the other party receives a court summons.',
      ],
      urgency: 'when-ready',
      estimatedTime: '1-3 months',
      difficulty: 'hard',
      helpText:
        'Small claims court is designed for individuals to resolve disputes without expensive lawyers. ' +
        'The process is simpler than regular court and judges are experienced with business disputes.',
    },
    {
      stepNumber: 6,
      title: 'Engage a Domain Attorney If Needed',
      description:
        'For high-value domains or complex disputes, consulting a domain name attorney may be the most effective path.',
      details: [
        'Many domain attorneys offer free initial consultations.',
        'They can send a lawyer letter, which is often more effective than a personal demand.',
        'An attorney can file a UDRP complaint if trademark rights are involved.',
        'For US-based disputes, ACPA (Anticybersquatting Consumer Protection Act) may apply.',
        'Attorney fees typically range from $200-500/hour, but a single letter may resolve the issue.',
      ],
      urgency: 'when-ready',
      estimatedTime: 'Varies',
      difficulty: 'hard',
      helpText:
        'Domain law is a specialized area. Attorneys who focus on domain disputes know the most ' +
        'effective strategies and can often resolve cases much faster than general-practice lawyers.',
    },
  ];

  return {
    headline: 'Recovering a Domain from a Provider or Developer',
    headlineColor: 'orange',
    summary:
      `The domain ${domain} may be controlled by a web developer, agency, or service provider who registered or managed it on your behalf. ` +
      'This is a common situation and there are established processes for resolving it. ' +
      'Start with a formal demand and escalate through ICANN if needed.',
    statusExplanation:
      'When a web developer or agency registers a domain on your behalf, ownership can become complicated. ' +
      'Under ICANN policy, the person listed as the registrant in WHOIS is considered the legal owner. ' +
      'However, if you paid for the domain and it was registered for your business, you have strong grounds ' +
      'to claim ownership even if the developer\'s name is on the registration.',
    timelinePhase: 'active',
    steps,
    proofOfOwnership: true,
    costSummary: {
      min: 0,
      max: 2000,
      currency: 'USD',
      breakdown:
        'ICANN complaint: Free. ' +
        'Formal demand letter: Free (DIY) or $200-500 (attorney). ' +
        'Small claims court: $30-75 filing fee. ' +
        'Attorney consultation: $200-500/hour.',
    },
    timeSummary:
      'Demand letter: 14 days to wait for response. ICANN complaint: 2-4 weeks. ' +
      'Small claims court: 1-3 months. Most disputes resolve within 2-6 weeks.',
    successLikelihood:
      'High if you have documentation (contract, payment records, emails). ' +
      'Most developers and agencies will comply once they receive a formal demand ' +
      'or learn that an ICANN complaint has been filed.',
    registrarName: registrar,
    registrarPhone: registrarContact?.phone,
    registrarEmail: registrarContact?.email,
    registrarUrl: inferRegistrarUrl(registrar),
  };
}

/**
 * Prepend "Step Zero" steps for users who lost their registrar credentials.
 * These steps help them figure out which registrar has their domain,
 * prove ownership, and recover access before following the standard guide.
 */
function prependLostCredentialsSteps(guide: RecoveryGuideData, domain: string): void {
  const newSteps: RecoveryStep[] = [
    {
      stepNumber: 0,
      title: 'Figure Out Which Registrar Has Your Domain',
      description:
        'If you do not know or remember which company manages your domain, ' +
        'you can find out using a free WHOIS lookup.',
      details: [
        `Go to lookup.icann.org and search for "${domain}".`,
        'Look for the "Registrar" field -- this tells you which company manages the domain.',
        'Note the registrar name, their website URL, and any abuse contact info.',
        'Check your old emails for registration confirmation messages -- search for "domain" or "registrar".',
        'If you recognize the registrar name, try to log in with common email addresses you may have used.',
      ],
      urgency: 'immediate',
      estimatedTime: '5-10 minutes',
      difficulty: 'easy',
      helpText:
        'Every domain is managed by a registrar. Even if you do not remember choosing one, ' +
        'the WHOIS lookup will reveal which company has it on file.',
      links: [
        { label: 'ICANN WHOIS Lookup', url: 'https://lookup.icann.org' },
      ],
    },
    {
      stepNumber: 0,
      title: 'Prove You Are the Rightful Owner',
      description:
        'To recover access to your domain without account credentials, you will need to prove your identity ' +
        'to the registrar. Gather as much documentation as possible.',
      details: [
        'Government-issued photo ID matching the name on the WHOIS registration.',
        'Business registration documents if the domain is registered to a company.',
        'Old registration confirmation or renewal emails.',
        'Credit card statements or PayPal receipts showing domain payments.',
        'Archived copies of your website (from web.archive.org) proving prior use.',
        'Any correspondence with the registrar from the original email address on file.',
      ],
      urgency: 'immediate',
      estimatedTime: '15-30 minutes',
      difficulty: 'moderate',
      helpText:
        'Registrars handle lost-access requests regularly. The key is proving you are the person ' +
        'listed as the registrant in the WHOIS record. The more documentation you have, the smoother the process.',
    },
    {
      stepNumber: 0,
      title: 'Contact the Registrar to Recover Account Access',
      description:
        'Call the registrar directly and explain that you need to recover access to your domain account. ' +
        'Phone is much faster than email for this process.',
      details: [
        'Ask for the "account recovery" or "domain recovery" department.',
        'Explain that you are the owner of the domain but have lost access to your account.',
        'Be ready to provide the proof of ownership documents you gathered.',
        'The registrar may need to verify your identity before granting access.',
        'If the email on the account is outdated, the registrar can often update it after identity verification.',
        'Ask for a reference/ticket number so you can follow up.',
      ],
      urgency: 'immediate',
      estimatedTime: '15-30 minutes',
      difficulty: 'moderate',
      phoneScript:
        `Hi, I need help recovering access to my domain account. The domain is ${domain}. ` +
        `I am the registered owner but I've lost access to my account credentials. ` +
        `I have documentation to prove my ownership. Can you help me recover access?`,
    },
  ];

  // Prepend new steps and renumber everything
  guide.steps = [...newSteps, ...guide.steps];
}

/**
 * Prepend content recovery steps when the user prioritizes recovering their
 * website content, or when Wayback Machine snapshots are available.
 */
function prependContentRecoverySteps(guide: RecoveryGuideData, domain: string): void {
  const newSteps: RecoveryStep[] = [
    {
      stepNumber: 0,
      title: 'Download Your Website from the Wayback Machine',
      description:
        'The Internet Archive may have saved copies of your website. ' +
        'Download them immediately before they are potentially overwritten by new content.',
      details: [
        `Visit web.archive.org and search for "${domain}".`,
        'Browse through the calendar to find the most recent snapshots of your site.',
        'Right-click and "Save As" on important pages to save them to your computer.',
        'For bulk downloads, use the Wayback Machine Downloader tool (free, open source).',
        'Save images, documents, and other files you find in the archived pages.',
        'This content may be the only copy of your website that still exists.',
      ],
      urgency: 'immediate',
      estimatedTime: '30-60 minutes',
      difficulty: 'moderate',
      helpText:
        'The Wayback Machine is a free service that automatically saves copies of websites over time. ' +
        'It may have snapshots of your site from days, months, or years ago.',
      links: [
        { label: 'Wayback Machine', url: 'https://web.archive.org' },
        { label: 'Wayback Machine Downloader', url: 'https://github.com/hartator/wayback-machine-downloader' },
      ],
    },
    {
      stepNumber: 0,
      title: 'Check for Other Copies of Your Content',
      description:
        'Your website content may exist in places you have not thought of yet. Check these sources before they disappear.',
      details: [
        'Google Cache: Search for "cache:' + domain + '" in Google for recently cached pages.',
        'Contact your previous hosting provider -- they may have backups for 30-90 days.',
        'Check your CMS (WordPress, Squarespace, Wix) for export/backup options if you still have login access.',
        'Search your email for content you may have drafted, reviewed, or sent to collaborators.',
        'Check your browser history -- you may be able to view cached versions of pages you visited.',
        'Look for local copies on your computer: downloaded files, exported databases, or backup folders.',
      ],
      urgency: 'immediate',
      estimatedTime: '30 minutes',
      difficulty: 'easy',
      helpText:
        'Content recovery is most successful when you act quickly. ' +
        'Google Cache and hosting backups are temporary, so check them as soon as possible.',
    },
  ];

  guide.steps = [...newSteps, ...guide.steps];
  guide.showScriptDownloads = true;
}

/**
 * Apply emergency mode: filter to immediate-urgency steps only,
 * prepend a "call now" step, and mark the guide as emergency mode.
 */
function applyEmergencyMode(guide: RecoveryGuideData, domain: string): void {
  // Filter to only immediate-urgency steps
  guide.steps = guide.steps.filter((s) => s.urgency === 'immediate');

  // Prepend a call-now step
  const callNowStep: RecoveryStep = {
    stepNumber: 0,
    title: 'Call Your Registrar RIGHT NOW',
    description:
      `This is an emergency. Pick up the phone and call ${guide.registrarName || 'your registrar'} immediately. ` +
      'Phone support is the fastest way to get help with urgent domain issues.',
    details: [
      guide.registrarPhone
        ? `Call NOW: ${guide.registrarPhone}`
        : `Find the phone number on ${guide.registrarName || 'your registrar'}'s website or search Google for "${guide.registrarName || 'domain registrar'} phone number".`,
      `Tell them: "I have an emergency with my domain ${domain}. I need immediate help."`,
      'Have your account email, domain name, and any ID ready.',
      'If you cannot reach them by phone, try live chat -- it is usually the next fastest option.',
      'Do NOT wait for email support -- it is too slow for emergencies.',
    ],
    urgency: 'immediate',
    estimatedTime: '5 minutes to connect',
    difficulty: 'easy',
    phoneScript:
      `Hi, this is an emergency. My domain ${domain} needs immediate attention. ` +
      `[Describe the issue: expired, stolen, website down, etc.]. ` +
      `Can you help me resolve this right away?`,
  };

  guide.steps = [callNowStep, ...guide.steps];

  guide.isEmergencyMode = true;
  guide.headline = 'EMERGENCY: ' + guide.headline;
  guide.headlineColor = 'red';
}

/**
 * Renumber all steps sequentially starting from 1.
 */
function renumberSteps(guide: RecoveryGuideData): void {
  guide.steps.forEach((step, i) => {
    step.stepNumber = i + 1;
  });
  if (guide.alternativeOptions) {
    guide.alternativeOptions.forEach((step, i) => {
      step.stepNumber = i + 1;
    });
  }
}

// ---------------------------------------------------------------------------
// Object-form input (used by the RecoveryGuide component)
// ---------------------------------------------------------------------------

/**
 * Convenience shape accepted by the object overload of `generateRecoveryGuide`.
 * Callers may pass the raw `statusReport`, `whois`, `wayback`, and `dns`
 * objects directly and the function will extract the relevant fields.
 */
export interface GenerateRecoveryGuideInput {
  domain: string;
  statusReport: {
    status: string;
    registrar?: string;
    registrarContact?: { email?: string; phone?: string };
    expiryDate?: Date | string;
    daysSinceExpiry?: number;
    daysUntilExpiry?: number;
    estimatedCost?: { min: number; max: number; currency: string };
    [key: string]: unknown;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  whois?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wayback?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dns?: any;
  context?: RecoveryContext;
}

function isObjectInput(
  first: unknown,
): first is GenerateRecoveryGuideInput {
  return (
    typeof first === 'object' &&
    first !== null &&
    'domain' in first &&
    'statusReport' in first
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate a structured, personalized recovery guide based on domain analysis results.
 *
 * This function is pure -- it has no side effects and does not import from other
 * project files. All data it needs is passed through its parameters.
 *
 * Accepts either positional arguments or a single object of type
 * `GenerateRecoveryGuideInput` (the form used by the RecoveryGuide component).
 */
export function generateRecoveryGuide(
  domainOrInput: string | GenerateRecoveryGuideInput,
  status?: string,
  registrar?: string,
  registrarContact?: { email?: string; phone?: string },
  expiryDate?: Date | string,
  daysSinceExpiry?: number,
  daysUntilExpiry?: number,
  hasWaybackContent?: boolean,
  waybackSnapshots?: number,
  isOnline?: boolean,
  estimatedCost?: { min: number; max: number; currency: string },
): RecoveryGuideData {
  // ---------- Handle object overload ----------
  if (isObjectInput(domainOrInput)) {
    const input = domainOrInput;
    const sr = input.statusReport;
    const wb = input.wayback;
    const guide = generateRecoveryGuide(
      input.domain,
      sr.status,
      sr.registrar,
      sr.registrarContact,
      sr.expiryDate,
      sr.daysSinceExpiry,
      sr.daysUntilExpiry,
      wb ? wb.available === true || (wb.totalSnapshots ?? 0) > 0 : undefined,
      wb ? wb.totalSnapshots : undefined,
      undefined,
      sr.estimatedCost,
    );

    // Apply context overlays
    const ctx = input.context;
    if (ctx) {
      const domain = input.domain;

      // Context flags that REPLACE the guide entirely
      if (ctx.stolenOrHijacked) {
        const hijackedGuide = buildStolenHijackedGuide(domain, sr.registrar, sr.registrarContact);
        Object.assign(guide, hijackedGuide);
      } else if (ctx.contractualDispute) {
        const disputeGuide = buildContractualDisputeGuide(domain, sr.registrar, sr.registrarContact);
        Object.assign(guide, disputeGuide);
      }

      // Context flags that PREPEND steps to the existing guide
      if (ctx.lostCredentials) {
        prependLostCredentialsSteps(guide, domain);
      }

      if (ctx.contentRecoveryPriority || guide.showScriptDownloads) {
        prependContentRecoverySteps(guide, domain);
      }

      // Emergency mode FILTERS the guide to immediate steps
      if (ctx.emergencyMode) {
        applyEmergencyMode(guide, domain);
      }

      // Always renumber after context modifications
      renumberSteps(guide);
    }

    return guide;
  }

  // ---------- Positional overload ----------
  const domain = domainOrInput;
  if (!status) {
    status = 'UNKNOWN';
  }
  // Normalise the expiry date to a Date object if provided as a string.
  const _expiryDate =
    expiryDate instanceof Date
      ? expiryDate
      : typeof expiryDate === 'string'
        ? new Date(expiryDate)
        : undefined;

  // If daysSinceExpiry / daysUntilExpiry were not provided but expiryDate was,
  // compute them so downstream builders have accurate data.
  if (_expiryDate && daysSinceExpiry === undefined && daysUntilExpiry === undefined) {
    const now = new Date();
    const diff = Math.floor(
      (_expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff >= 0) {
      daysUntilExpiry = diff;
    } else {
      daysSinceExpiry = Math.abs(diff);
    }
  }

  let guide: RecoveryGuideData;

  switch (status) {
    case 'AVAILABLE':
      guide = buildAvailableGuide(domain);
      break;

    case 'EXPIRED_GRACE':
      guide = buildExpiredGraceGuide(
        domain,
        registrar,
        registrarContact,
        daysSinceExpiry,
        hasWaybackContent,
      );
      break;

    case 'EXPIRED_REDEMPTION':
      guide = buildExpiredRedemptionGuide(
        domain,
        registrar,
        registrarContact,
        daysSinceExpiry,
        hasWaybackContent,
      );
      break;

    case 'PENDING_DELETE':
      guide = buildPendingDeleteGuide(domain, hasWaybackContent);
      break;

    case 'ACTIVE_IN_USE':
      guide = buildActiveInUseGuide(
        domain,
        registrar,
        registrarContact,
        hasWaybackContent,
        estimatedCost,
      );
      break;

    case 'ACTIVE_PARKED':
      guide = buildActiveParkedGuide(
        domain,
        registrar,
        registrarContact,
        hasWaybackContent,
        estimatedCost,
      );
      break;

    case 'ACTIVE_FOR_SALE':
      guide = buildActiveForSaleGuide(
        domain,
        registrar,
        registrarContact,
        estimatedCost,
      );
      break;

    case 'ACTIVE_HOSTING_ISSUE':
      guide = buildActiveHostingIssueGuide(domain, registrar, registrarContact);
      break;

    case 'RESERVED':
      guide = buildReservedGuide(domain);
      break;

    case 'UNKNOWN':
    default:
      guide = buildUnknownGuide(domain);
      break;
  }

  // Overlay registrar contact information when available.
  if (registrar && !guide.registrarName) {
    guide.registrarName = registrar;
  }
  if (registrarContact?.phone && !guide.registrarPhone) {
    guide.registrarPhone = registrarContact.phone;
  }
  if (registrarContact?.email && !guide.registrarEmail) {
    guide.registrarEmail = registrarContact.email;
  }
  if (!guide.registrarUrl && registrar) {
    guide.registrarUrl = inferRegistrarUrl(registrar);
  }

  // Override cost summary when the caller provides an explicit estimate
  // (only for statuses that do not have their own fixed cost logic).
  if (
    estimatedCost &&
    status !== 'AVAILABLE' &&
    status !== 'RESERVED' &&
    status !== 'UNKNOWN'
  ) {
    guide.costSummary = {
      ...guide.costSummary,
      min: estimatedCost.min,
      max: estimatedCost.max,
      currency: estimatedCost.currency,
    };
  }

  return guide;
}
