# Find My Website - Project Overview

## What We Built

A comprehensive domain recovery platform that helps users recover lost domains and rebuild websites from archived content.

## Core Features

### 1. Domain Analysis Engine
**Location**: `lib/recovery/domain-status-analyzer.ts`

- Analyzes domain registration status
- Determines recovery difficulty (EASY to IMPOSSIBLE)
- Calculates cost estimates ($10 - $100,000+)
- Provides success rate predictions
- Identifies recovery opportunities and warnings

**Domain Statuses**:
- `AVAILABLE` - Ready to register
- `EXPIRED_GRACE` - Recently expired, high recovery chance
- `EXPIRED_REDEMPTION` - Expensive but possible
- `PENDING_DELETE` - Use backorder services
- `ACTIVE_PARKED` - Contact owner
- `ACTIVE_FOR_SALE` - Purchase opportunity
- `ACTIVE_IN_USE` - Hardest to recover

### 2. Wayback Machine Integration
**Location**: `lib/external-apis/wayback.ts`

- Fetches archived snapshots from Internet Archive
- Provides snapshot timeline (first to last)
- Assesses content quality (none/poor/fair/good/excellent)
- Identifies best snapshot for recovery
- Estimates recoverable pages

### 3. Recovery Script Generator
**Location**: `lib/recovery/script-generator.ts`

Generates custom scripts in 3 languages:
- **Bash** - For Linux/Mac users
- **Node.js** - For developers
- **Python** - For Python enthusiasts

**Script Features**:
- Automatically installs `wayback_machine_downloader`
- Downloads best snapshot
- Cleans Wayback Machine references
- Fixes internal links
- Generates recovery report
- Provides deployment instructions

### 4. WHOIS Lookup
**Location**: `lib/external-apis/whois.ts`

- Fetches domain registration data
- Parses registrar information
- Identifies expiry dates
- Detects grace/redemption periods
- Provides contact information

### 5. User Interface

#### Search Page
**Location**: `app/page.tsx`

- Clean, modern design
- Real-time domain search
- Error handling
- Loading states
- Feature showcase

#### Domain Results Dashboard
**Location**: `components/domain/DomainResults.tsx`

**3 Tabs**:
1. **Overview**: WHOIS data, Wayback stats
2. **Recovery Guide**: Actionable steps, script downloads
3. **Historical Data**: Snapshot timeline, yearly breakdown

**Visual Features**:
- Status badges with color coding
- Difficulty indicators
- Cost/time estimates
- Success rate display
- Interactive tabs

## Technical Architecture

### Stack
- **Frontend**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis
- **APIs**: Wayback Machine CDX API, System WHOIS

### Project Structure
```
find-my-website/
├── app/
│   ├── api/domain/analyze/route.ts      # Domain analysis API
│   ├── api/recovery/generate-script/    # Script generation API
│   └── page.tsx                         # Main UI
├── components/
│   └── domain/
│       ├── DomainSearch.tsx             # Search component
│       └── DomainResults.tsx            # Results dashboard
├── lib/
│   ├── db/
│   │   ├── schema.ts                    # Database schema
│   │   └── index.ts                     # DB connection
│   ├── external-apis/
│   │   ├── wayback.ts                   # Wayback API client
│   │   └── whois.ts                     # WHOIS client
│   └── recovery/
│       ├── domain-status-analyzer.ts    # Status analyzer
│       └── script-generator.ts          # Script generator
├── docker-compose.yml                    # PostgreSQL + Redis
├── drizzle.config.ts                    # ORM config
└── .env                                 # Environment vars
```

## Database Schema

**11 Tables** for comprehensive tracking:

1. **domain_searches** - Search history & cached results
2. **whois_data** - Current WHOIS information
3. **whois_history** - Historical WHOIS snapshots
4. **dns_records** - Current & historical DNS
5. **wayback_snapshots** - Snapshot metadata
6. **domain_status** - Domain status tracking
7. **recovery_recommendations** - Generated recommendations
8. **service_providers** - Backorder/broker database
9. **recovery_attempts** - User tracking
10. **registrars** - Registrar contact database
11. **generated_scripts** - Script generation tracking

## API Endpoints

### `POST /api/domain/analyze`
Analyzes a domain and returns:
- WHOIS data
- Wayback Machine snapshots
- Status report with recovery guidance

### `POST /api/recovery/generate-script`
Generates and downloads a custom recovery script:
- Bash (.sh)
- Node.js (.js)
- Python (.py)

## How to Use

### 1. Start the Application
```bash
# Start databases
docker compose up -d

# Start dev server
npm run dev
```

### 2. Search for a Domain
- Enter any domain name
- System analyzes in real-time
- View comprehensive results

### 3. Download Recovery Script
- Navigate to "Recovery Guide" tab
- Choose script type (Bash/Node/Python)
- Run locally to recover website

### 4. Follow Recovery Steps
- Script downloads website from Wayback
- Cleans and fixes content
- Generates deployment guide

## Key Algorithms

### Recovery Difficulty Calculation
```typescript
function assessDifficulty(domain) {
  if (available) return EASY
  if (expired < 45 days) return MODERATE
  if (expired 45-75 days) return HARD
  if (parked) return MODERATE
  if (active) return VERY_HARD
  if (reserved) return IMPOSSIBLE
}
```

### Cost Estimation
Based on domain status:
- **Available**: $10-50
- **Expired Grace**: $500-2,000
- **Expired Redemption**: $1,000-5,000
- **Parked**: $1,000-10,000
- **Active**: $5,000-100,000

### Best Snapshot Selection
1. Filter by status code (200 OK)
2. Sort by content size (larger = more complete)
3. Prefer more recent snapshots
4. Return highest quality match

## Recovery Methods by Status

| Status | Primary Method | Secondary | Timeline |
|--------|---------------|-----------|----------|
| Available | Register now | - | Immediate |
| Expired Grace | Contact owner | Backorder | 1-2 weeks |
| Redemption | Contact owner | Wait for delete | 2-4 weeks |
| Pending Delete | Backorder services | Multiple services | 1-2 weeks |
| Parked | Make offer | Domain broker | 4-8 weeks |
| For Sale | Purchase | Negotiate | 2-4 weeks |
| Active | Contact owner | Broker/Legal | 12+ weeks |

## Future Enhancements

### Phase 2 (Next Steps)
- [ ] User accounts & authentication
- [ ] Save favorite domains
- [ ] Email alerts for status changes
- [ ] Bulk domain analysis
- [ ] SecurityTrails API integration
- [ ] Domain valuation estimates
- [ ] Service provider reviews

### Phase 3 (Advanced)
- [ ] AI-powered recommendations
- [ ] Automated backorder integration
- [ ] Domain marketplace
- [ ] Mobile app
- [ ] Public API

## Development Notes

### Testing Domains
- `google.com` - Active, well-archived
- `example.com` - Reserved domain
- Any expired domain for testing recovery flows

### Known Limitations
1. WHOIS lookups require system `whois` command
2. Some domains may have privacy protection
3. Wayback Machine coverage varies by domain
4. Recovery success depends on many factors

### Performance Considerations
- WHOIS lookups: ~1-3 seconds
- Wayback API: ~2-5 seconds
- Script generation: Instant
- Database queries: < 100ms (with proper indexing)

## Deployment Checklist

- [ ] Set up PostgreSQL database
- [ ] Set up Redis cache
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Test WHOIS functionality
- [ ] Test Wayback Machine API
- [ ] Verify script generation
- [ ] Deploy to hosting platform

## Support & Resources

- **Documentation**: See README.md
- **Database Schema**: See lib/db/schema.ts
- **API Docs**: See API Endpoints section
- **Example Scripts**: Generated dynamically

## Credits

Built with:
- Next.js & React
- Wayback Machine / Internet Archive
- PostgreSQL & Drizzle ORM
- Tailwind CSS

---

**Project Status**: ✅ MVP Complete
**Last Updated**: 2026-01-16
**Version**: 0.1.0
