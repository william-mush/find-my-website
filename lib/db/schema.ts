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
