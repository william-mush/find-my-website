# Find My Website

A comprehensive domain recovery and information platform that helps you:

- 🔍 Look up complete domain information (WHOIS, DNS, registration history)
- 📸 Browse historical website snapshots from the Wayback Machine
- 🛠️ Generate custom recovery scripts to rebuild lost websites
- 💰 Get cost estimates and recovery recommendations
- 📋 Receive step-by-step recovery guidance based on domain status

## Features

### Domain Analysis
- **WHOIS Lookup**: Get registrar, expiry dates, nameservers, and contact information
- **Domain Status Detection**: Automatically detect if a domain is active, expired, parked, for sale, or available
- **Recovery Difficulty Assessment**: Calculate how hard it will be to recover a domain

### Historical Data
- **Wayback Machine Integration**: Access millions of archived web pages
- **Snapshot Timeline**: See how a website evolved over the years
- **Quality Assessment**: Evaluate the completeness of archived content

### Recovery Tools
- **Custom Script Generation**: Download Bash, Node.js, or Python scripts tailored to your domain
- **Automated Content Recovery**: Scripts handle downloading, cleaning, and preparing archived content
- **Deployment Guides**: Get instructions for deploying recovered sites

### Recovery Recommendations
- Prioritized action plans based on domain status
- Cost and time estimates for different recovery methods
- Service provider recommendations (backorder, brokers, legal)
- Success rate calculations

## Quick Start

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose
- Ruby (for recovery scripts to work)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd find-my-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start database services**
   ```bash
   docker compose up -d
   ```

5. **Run database migrations**
   ```bash
   npm run db:push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
find-my-website/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── domain/          # Domain analysis endpoints
│   │   └── recovery/        # Recovery script generation
│   └── page.tsx             # Main search page
├── components/              # React components
│   ├── domain/             # Domain-specific components
│   │   ├── DomainSearch.tsx
│   │   └── DomainResults.tsx
│   ├── recovery/           # Recovery components
│   └── ui/                 # UI components
├── lib/                     # Core libraries
│   ├── db/                 # Database schema and connection
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── external-apis/      # External API integrations
│   │   ├── wayback.ts     # Wayback Machine API
│   │   └── whois.ts       # WHOIS lookup
│   ├── recovery/           # Recovery logic
│   │   ├── domain-status-analyzer.ts
│   │   └── script-generator.ts
│   ├── historical/         # Historical data handling
│   └── utils/              # Utility functions
├── docker-compose.yml      # Docker services configuration
├── drizzle.config.ts       # Database ORM configuration
└── .env                    # Environment variables
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## How It Works

### 1. Domain Analysis
When you search for a domain, the system:
1. Performs a WHOIS lookup to get registration information
2. Queries the Wayback Machine for archived snapshots
3. Analyzes the domain status (active, expired, available, etc.)
4. Calculates recovery difficulty and costs

### 2. Recovery Script Generation
The system generates custom scripts that:
1. Install `wayback_machine_downloader` gem
2. Download the best snapshot from the Wayback Machine
3. Clean up archive.org references and toolbars
4. Fix internal links
5. Generate a recovery report
6. Provide deployment instructions

### 3. Domain Status Types

- **AVAILABLE**: Domain can be registered immediately
- **ACTIVE_IN_USE**: Domain is actively used (hardest to recover)
- **ACTIVE_PARKED**: Domain is parked (moderate difficulty)
- **ACTIVE_FOR_SALE**: Domain is listed for sale
- **EXPIRED_GRACE**: Recently expired, in grace period
- **EXPIRED_REDEMPTION**: In redemption period (expensive to recover)
- **PENDING_DELETE**: About to be released (use backorder services)

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis
- **External APIs**:
  - Wayback Machine CDX API
  - System WHOIS command
  - (Optional) SecurityTrails API
  - (Optional) WhoisXML API

## Database Schema

The application uses PostgreSQL with the following main tables:

- `domain_searches` - Search history and cached results
- `whois_data` - Current WHOIS information
- `whois_history` - Historical WHOIS snapshots
- `dns_records` - Current and historical DNS records
- `wayback_snapshots` - Wayback Machine snapshot metadata
- `domain_status` - Domain status tracking
- `recovery_recommendations` - Generated recovery recommendations
- `service_providers` - Backorder services, brokers, etc.
- `recovery_attempts` - User recovery tracking
- `registrars` - Registrar database
- `generated_scripts` - Generated recovery scripts

## API Endpoints

### POST `/api/domain/analyze`
Analyze a domain and get complete information.

**Request:**
```json
{
  "domain": "example.com"
}
```

**Response:**
```json
{
  "domain": "example.com",
  "whois": { ... },
  "wayback": { ... },
  "statusReport": { ... },
  "analyzedAt": "2026-01-16T..."
}
```

### POST `/api/recovery/generate-script`
Generate a custom recovery script.

**Request:**
```json
{
  "domain": "example.com",
  "scriptType": "bash" | "nodejs" | "python"
}
```

**Response:**
Downloads the script file directly.

## Future Enhancements

### Phase 2 Features (Planned)
- [ ] User accounts and saved domains
- [ ] Domain monitoring with email alerts
- [ ] Bulk domain analysis
- [ ] SecurityTrails API integration for deeper historical data
- [ ] Domain valuation estimates
- [ ] Legal options (UDRP) guidance
- [ ] Service provider ratings and reviews
- [ ] Recovery success tracking and analytics

### Phase 3 Features (Future)
- [ ] AI-powered recovery recommendations
- [ ] Automated backorder service integration
- [ ] Domain marketplace integration
- [ ] Mobile app
- [ ] API for third-party integrations

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Set up external PostgreSQL and Redis (Vercel Postgres & Upstash)
5. Deploy

### Traditional Hosting

1. Build the application: `npm run build`
2. Set up PostgreSQL and Redis
3. Run migrations: `npm run db:push`
4. Start the server: `npm start`

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Redis
REDIS_URL="redis://host:6379"

# External APIs (Optional)
WAYBACK_API_URL="https://web.archive.org"
SECURITYTRAILS_API_KEY=""
WHOISXML_API_KEY=""

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For questions or issues:
- Open an issue on GitHub
- Check the documentation
- Contact support@findmywebsite.com (coming soon)

## Acknowledgments

- Wayback Machine / Internet Archive for historical web data
- Open source community for amazing tools and libraries

---

**Built with ❤️ to help people recover their lost websites**
