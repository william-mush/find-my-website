import { pgTable, serial, text, timestamp, integer, jsonb, boolean, varchar, index } from 'drizzle-orm/pg-core';

// Domain searches and analysis
export const domainSearches = pgTable('domain_searches', {
  id: serial('id').primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull(),
  searchedAt: timestamp('searched_at').defaultNow().notNull(),
  userId: varchar('user_id', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),

  // Analysis results (cached)
  statusAnalysis: jsonb('status_analysis'),
  recoveryRecommendations: jsonb('recovery_recommendations'),
  waybackSnapshots: jsonb('wayback_snapshots'),
  whoisData: jsonb('whois_data'),
  dnsRecords: jsonb('dns_records'),

  lastUpdated: timestamp('last_updated').defaultNow(),
}, (table) => ({
  domainIdx: index('domain_idx').on(table.domain),
  searchedAtIdx: index('searched_at_idx').on(table.searchedAt),
}));

// WHOIS data storage
export const whoisData = pgTable('whois_data', {
  id: serial('id').primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull(),
  rawData: text('raw_data'),
  parsedData: jsonb('parsed_data'),
  registrar: varchar('registrar', { length: 255 }),
  registrantEmail: varchar('registrant_email', { length: 255 }),
  createdDate: timestamp('created_date'),
  expiryDate: timestamp('expiry_date'),
  updatedDate: timestamp('updated_date'),
  nameservers: jsonb('nameservers'),
  status: jsonb('status'),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
}, (table) => ({
  domainIdx: index('whois_domain_idx').on(table.domain),
  expiryDateIdx: index('expiry_date_idx').on(table.expiryDate),
}));

// Historical WHOIS snapshots
export const whoisHistory = pgTable('whois_history', {
  id: serial('id').primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull(),
  snapshotDate: timestamp('snapshot_date').notNull(),
  rawData: text('raw_data'),
  parsedData: jsonb('parsed_data'),
  registrar: varchar('registrar', { length: 255 }),
  registrantName: varchar('registrant_name', { length: 255 }),
  registrantEmail: varchar('registrant_email', { length: 255 }),
  source: varchar('source', { length: 50 }), // 'securitytrails', 'whoisxml', 'manual'
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  domainIdx: index('whois_history_domain_idx').on(table.domain),
  snapshotDateIdx: index('snapshot_date_idx').on(table.snapshotDate),
}));

// DNS records (current and historical)
export const dnsRecords = pgTable('dns_records', {
  id: serial('id').primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull(),
  recordType: varchar('record_type', { length: 10 }).notNull(), // A, AAAA, MX, TXT, NS, etc.
  value: text('value').notNull(),
  ttl: integer('ttl'),
  isHistorical: boolean('is_historical').default(false),
  firstSeen: timestamp('first_seen').notNull(),
  lastSeen: timestamp('last_seen'),
  source: varchar('source', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  domainIdx: index('dns_domain_idx').on(table.domain),
  recordTypeIdx: index('dns_record_type_idx').on(table.recordType),
  firstSeenIdx: index('dns_first_seen_idx').on(table.firstSeen),
}));

// Wayback Machine snapshots
export const waybackSnapshots = pgTable('wayback_snapshots', {
  id: serial('id').primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull(),
  url: text('url').notNull(),
  snapshotDate: timestamp('snapshot_date').notNull(),
  statusCode: integer('status_code'),
  mimeType: varchar('mime_type', { length: 100 }),
  digest: varchar('digest', { length: 64 }),
  length: integer('length'),
  waybackUrl: text('wayback_url'),
  fetchedAt: timestamp('fetched_at').defaultNow(),
}, (table) => ({
  domainIdx: index('wayback_domain_idx').on(table.domain),
  snapshotDateIdx: index('wayback_snapshot_date_idx').on(table.snapshotDate),
}));

// Domain status tracking
export const domainStatus = pgTable('domain_status', {
  id: serial('id').primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  currentStatus: varchar('current_status', { length: 50 }).notNull(),
  // ACTIVE_IN_USE, ACTIVE_PARKED, ACTIVE_FOR_SALE, EXPIRED_GRACE, EXPIRED_REDEMPTION, PENDING_DELETE, AVAILABLE, RESERVED, UNKNOWN

  isRegistered: boolean('is_registered'),
  isActive: boolean('is_active'),
  isParkeDomain: boolean('is_parked'),
  isForSale: boolean('is_for_sale'),

  expiryDate: timestamp('expiry_date'),
  deletionDate: timestamp('deletion_date'),

  registrar: varchar('registrar', { length: 255 }),
  registrarAbuseEmail: varchar('registrar_abuse_email', { length: 255 }),
  registrarAbusePhone: varchar('registrar_abuse_phone', { length: 50 }),

  recoveryDifficulty: varchar('recovery_difficulty', { length: 20 }), // EASY, MODERATE, HARD, VERY_HARD, IMPOSSIBLE
  estimatedCostMin: integer('estimated_cost_min'),
  estimatedCostMax: integer('estimated_cost_max'),
  estimatedTimeWeeks: integer('estimated_time_weeks'),
  successRatePercent: integer('success_rate_percent'),

  lastChecked: timestamp('last_checked').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  domainIdx: index('status_domain_idx').on(table.domain),
  currentStatusIdx: index('current_status_idx').on(table.currentStatus),
  expiryDateIdx: index('status_expiry_date_idx').on(table.expiryDate),
}));

// Recovery recommendations
export const recoveryRecommendations = pgTable('recovery_recommendations', {
  id: serial('id').primaryKey(),
  domainStatusId: integer('domain_status_id').references(() => domainStatus.id),
  domain: varchar('domain', { length: 255 }).notNull(),

  method: varchar('method', { length: 100 }).notNull(),
  priority: varchar('priority', { length: 20 }).notNull(), // CRITICAL, VERY_HIGH, HIGH, MEDIUM, LOW

  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  steps: jsonb('steps').notNull(), // Array of step strings

  estimatedCostMin: integer('estimated_cost_min'),
  estimatedCostMax: integer('estimated_cost_max'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  estimatedTime: varchar('estimated_time', { length: 100 }),
  successRate: integer('success_rate'), // 0-100

  requiredServices: jsonb('required_services'), // Array of service objects
  contacts: jsonb('contacts'), // Array of contact objects

  legalOptions: jsonb('legal_options'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  domainIdx: index('recovery_domain_idx').on(table.domain),
  priorityIdx: index('recovery_priority_idx').on(table.priority),
}));

// Service providers (backorder, brokers, legal)
export const serviceProviders = pgTable('service_providers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // backorder, broker, legal, registrar, valuation
  url: text('url'),
  description: text('description'),

  pricing: jsonb('pricing'),
  features: jsonb('features'),
  successRate: varchar('success_rate', { length: 50 }),

  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),

  isActive: boolean('is_active').default(true),
  rating: integer('rating'), // 1-5

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User recovery attempts tracking
export const recoveryAttempts = pgTable('recovery_attempts', {
  id: serial('id').primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }),

  method: varchar('method', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // in_progress, successful, failed, abandoned

  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date'),

  actualCost: integer('actual_cost'),
  actualTimeWeeks: integer('actual_time_weeks'),

  notes: text('notes'),
  outcome: text('outcome'),

  servicesUsed: jsonb('services_used'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  domainIdx: index('attempts_domain_idx').on(table.domain),
  userIdx: index('attempts_user_idx').on(table.userId),
  statusIdx: index('attempts_status_idx').on(table.status),
}));

// Registrar database
export const registrars = pgTable('registrars', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  ianaId: integer('iana_id'),

  website: text('website'),
  abuseEmail: varchar('abuse_email', { length: 255 }),
  abusePhone: varchar('abuse_phone', { length: 50 }),
  supportEmail: varchar('support_email', { length: 255 }),
  supportPhone: varchar('support_phone', { length: 50 }),

  recoveryProcess: text('recovery_process'),
  transferPolicy: text('transfer_policy'),
  redemptionFee: integer('redemption_fee'),

  rating: integer('rating'), // 1-5
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Generated recovery scripts
export const generatedScripts = pgTable('generated_scripts', {
  id: serial('id').primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }),

  scriptType: varchar('script_type', { length: 50 }).notNull(), // bash, nodejs, python
  scriptContent: text('script_content').notNull(),

  config: jsonb('config'), // Domain-specific configuration

  downloadCount: integer('download_count').default(0),
  lastDownloaded: timestamp('last_downloaded'),

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  domainIdx: index('scripts_domain_idx').on(table.domain),
  userIdx: index('scripts_user_idx').on(table.userId),
}));

// API usage tracking (for analytics and abuse detection)
export const apiUsage = pgTable('api_usage', {
  id: serial('id').primaryKey(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  userId: varchar('user_id', { length: 255 }),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  domain: varchar('domain', { length: 255 }),

  // Request details
  method: varchar('method', { length: 10 }).notNull(),
  userAgent: text('user_agent'),
  referer: text('referer'),

  // Response details
  statusCode: integer('status_code').notNull(),
  responseTime: integer('response_time'), // milliseconds
  rateLimitRemaining: integer('rate_limit_remaining'),

  // Flags
  wasBlocked: boolean('was_blocked').default(false),
  wasRateLimited: boolean('was_rate_limited').default(false),
  wasInvalidInput: boolean('was_invalid_input').default(false),

  // Timestamps
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
}, (table) => ({
  ipIdx: index('api_usage_ip_idx').on(table.ipAddress),
  userIdIdx: index('api_usage_user_id_idx').on(table.userId),
  endpointIdx: index('api_usage_endpoint_idx').on(table.endpoint),
  requestedAtIdx: index('api_usage_requested_at_idx').on(table.requestedAt),
  blockedIdx: index('api_usage_blocked_idx').on(table.wasBlocked),
}));

// IP abuse tracking (for automatic blocking)
export const ipAbuse = pgTable('ip_abuse', {
  id: serial('id').primaryKey(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull().unique(),

  // Abuse metrics
  totalRequests: integer('total_requests').default(0).notNull(),
  rateLimitViolations: integer('rate_limit_violations').default(0).notNull(),
  invalidInputAttempts: integer('invalid_input_attempts').default(0).notNull(),
  suspiciousPatterns: integer('suspicious_patterns').default(0).notNull(),

  // Blocking status
  isBlocked: boolean('is_blocked').default(false),
  blockReason: varchar('block_reason', { length: 255 }),
  blockedAt: timestamp('blocked_at'),
  blockedUntil: timestamp('blocked_until'),
  autoBlockCount: integer('auto_block_count').default(0),

  // Tracking
  firstSeen: timestamp('first_seen').defaultNow().notNull(),
  lastSeen: timestamp('last_seen').defaultNow().notNull(),
  lastViolation: timestamp('last_violation'),

  // Notes
  userAgent: text('user_agent'),
  notes: text('notes'),
}, (table) => ({
  ipIdx: index('ip_abuse_ip_idx').on(table.ipAddress),
  blockedIdx: index('ip_abuse_blocked_idx').on(table.isBlocked),
  lastSeenIdx: index('ip_abuse_last_seen_idx').on(table.lastSeen),
}));

// ============================================================================
// AUTHENTICATION TABLES (NextAuth.js compatible)
// ============================================================================

// Users table
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  password: varchar('password', { length: 255 }), // Hashed password for email/password auth
  tier: varchar('tier', { length: 20 }).default('free').notNull(), // 'free', 'pro', 'enterprise'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

// OAuth accounts (Google, GitHub, etc.)
export const accounts = pgTable('accounts', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(), // 'oauth' | 'credentials'
  provider: varchar('provider', { length: 255 }).notNull(), // 'google', 'github', 'credentials'
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
}, (table) => ({
  userIdIdx: index('accounts_user_id_idx').on(table.userId),
  providerAccountIdx: index('accounts_provider_account_idx').on(table.provider, table.providerAccountId),
}));

// Sessions table
export const sessions = pgTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
}));

// Verification tokens (for email verification)
export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  compoundKey: index('verification_tokens_identifier_token_idx').on(table.identifier, table.token),
}));

// Network lookups (reverse IP, ASN, etc.)
export const networkLookups = pgTable('network_lookups', {
  id: serial('id').primaryKey(),
  input: varchar('input', { length: 255 }).notNull(), // Domain or IP
  inputType: varchar('input_type', { length: 10 }).notNull(), // 'ip' or 'domain'
  primaryIP: varchar('primary_ip', { length: 45 }).notNull(),

  userId: varchar('user_id', { length: 255 }).references(() => users.id, { onDelete: 'cascade' }),
  ipAddress: varchar('ip_address', { length: 45 }), // Client IP for anonymous lookups

  // Cached results
  reverseIPData: jsonb('reverse_ip_data'), // List of domains on same IP
  asnData: jsonb('asn_data'), // ASN and network info
  geolocationData: jsonb('geolocation_data'), // IP location data
  analysis: jsonb('analysis'), // Network analysis results

  totalDomains: integer('total_domains').default(0),
  hostingProvider: varchar('hosting_provider', { length: 255 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // Cache expiry (7 days)
}, (table) => ({
  inputIdx: index('network_lookups_input_idx').on(table.input),
  primaryIPIdx: index('network_lookups_primary_ip_idx').on(table.primaryIP),
  userIdIdx: index('network_lookups_user_id_idx').on(table.userId),
  expiresAtIdx: index('network_lookups_expires_at_idx').on(table.expiresAt),
}));

// IP cache for reverse IP lookups
export const ipCache = pgTable('ip_cache', {
  id: serial('id').primaryKey(),
  ip: varchar('ip', { length: 45 }).notNull().unique(),

  // Reverse IP data
  domains: jsonb('domains').notNull(), // Array of domain objects
  totalDomains: integer('total_domains').default(0),
  source: varchar('source', { length: 50 }).notNull(),

  // ASN/Network data
  asn: integer('asn'),
  asnOrganization: varchar('asn_organization', { length: 255 }),
  asnCountry: varchar('asn_country', { length: 2 }),
  networkType: varchar('network_type', { length: 50 }),
  isDatacenter: boolean('is_datacenter').default(false),

  // Geolocation
  country: varchar('country', { length: 100 }),
  countryCode: varchar('country_code', { length: 2 }),
  city: varchar('city', { length: 100 }),
  latitude: varchar('latitude', { length: 20 }),
  longitude: varchar('longitude', { length: 20 }),

  cachedAt: timestamp('cached_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // 7 day TTL
}, (table) => ({
  ipIdx: index('ip_cache_ip_idx').on(table.ip),
  expiresAtIdx: index('ip_cache_expires_at_idx').on(table.expiresAt),
}));

// Network relationships (domain-IP-ASN mapping)
export const networkRelationships = pgTable('network_relationships', {
  id: serial('id').primaryKey(),

  domain: varchar('domain', { length: 255 }).notNull(),
  ip: varchar('ip', { length: 45 }).notNull(),
  asn: integer('asn'),

  hostingProvider: varchar('hosting_provider', { length: 255 }),
  country: varchar('country', { length: 100 }),

  firstSeen: timestamp('first_seen').defaultNow().notNull(),
  lastSeen: timestamp('last_seen').defaultNow().notNull(),

  isActive: boolean('is_active').default(true),
}, (table) => ({
  domainIdx: index('network_relationships_domain_idx').on(table.domain),
  ipIdx: index('network_relationships_ip_idx').on(table.ip),
  asnIdx: index('network_relationships_asn_idx').on(table.asn),
  compoundIdx: index('network_relationships_domain_ip_idx').on(table.domain, table.ip),
}));

// ============================================================================
// USER DASHBOARD TABLES
// ============================================================================

// Saved domains (user bookmarks/favorites)
export const savedDomains = pgTable('saved_domains', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  domain: varchar('domain', { length: 255 }).notNull(),
  notes: text('notes'),
  tags: jsonb('tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('saved_domains_user_id_idx').on(table.userId),
  domainIdx: index('saved_domains_domain_idx').on(table.domain),
  userDomainIdx: index('saved_domains_user_domain_idx').on(table.userId, table.domain),
}));

// Search history (automatic tracking)
export const searchHistory = pgTable('search_history', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  domain: varchar('domain', { length: 255 }).notNull(),
  analysisType: varchar('analysis_type', { length: 20 }).notNull().default('domain'), // 'domain' or 'network'
  resultSummary: jsonb('result_summary').$type<{
    status?: string;
    isRegistered?: boolean;
    registrar?: string;
    expiryDate?: string;
    isOnline?: boolean;
    recoveryDifficulty?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('search_history_user_id_idx').on(table.userId),
  domainIdx: index('search_history_domain_idx').on(table.domain),
  createdAtIdx: index('search_history_created_at_idx').on(table.createdAt),
}));

// Domain watchlist (monitoring)
export const domainWatchlist = pgTable('domain_watchlist', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  domain: varchar('domain', { length: 255 }).notNull(),
  alertOnChange: boolean('alert_on_change').default(true),
  lastCheckedAt: timestamp('last_checked_at'),
  lastStatus: jsonb('last_status').$type<{
    isRegistered?: boolean;
    isOnline?: boolean;
    registrar?: string;
    expiryDate?: string;
    status?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('domain_watchlist_user_id_idx').on(table.userId),
  domainIdx: index('domain_watchlist_domain_idx').on(table.domain),
  userDomainIdx: index('domain_watchlist_user_domain_idx').on(table.userId, table.domain),
}));

// ============================================================================
// API KEYS
// ============================================================================

// API keys for programmatic access
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull(), // bcrypt hash of the full key
  keyPrefix: varchar('key_prefix', { length: 16 }).notNull(), // first 8 chars for display (e.g. "fmw_live")
  permissions: jsonb('permissions').default(['domain:analyze']), // JSON array of permission strings
  rateLimit: integer('rate_limit').default(100), // requests per hour
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
}, (table) => ({
  userIdIdx: index('api_keys_user_id_idx').on(table.userId),
  keyPrefixIdx: index('api_keys_key_prefix_idx').on(table.keyPrefix),
}));
