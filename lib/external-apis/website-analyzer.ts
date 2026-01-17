/**
 * Website Technology Detection and Analysis
 * Detects CMS, hosting, CDN, and other technologies
 */

import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';

export interface SSLCertificate {
  issuer: string;
  validFrom?: Date;
  validTo?: Date;
  isValid: boolean;
  daysUntilExpiry?: number;
}

export interface WebsiteAnalysis {
  domain: string;
  isOnline: boolean;
  httpStatus?: number;
  responseTime?: number;

  ssl: {
    enabled: boolean;
    certificate?: SSLCertificate;
  };

  server: {
    software?: string;
    poweredBy?: string;
    language?: string;
  };

  technologies: {
    cms?: string;
    framework?: string;
    cdn?: string;
    analytics?: string[];
    hosting?: string;
  };

  headers: {
    [key: string]: string;
  };

  hosting: {
    provider?: string;
    cloudProvider?: string;
    usingCDN: boolean;
    cdnProvider?: string;
  };

  security: {
    hasHSTS: boolean;
    hasCSP: boolean;
    hasXFrameOptions: boolean;
    securityScore: number;
  };

  performance: {
    redirects: number;
    compressionEnabled: boolean;
    cachingEnabled: boolean;
  };

  timestamp: Date;
}

export class WebsiteAnalyzer {
  /**
   * Analyze a website's technology stack and configuration
   */
  async analyze(domain: string): Promise<WebsiteAnalysis> {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const url = `https://${cleanDomain}`;

    const startTime = Date.now();
    let isOnline = false;
    let httpStatus: number | undefined;
    let headers: { [key: string]: string } = {};

    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: 'HEAD',
          redirect: 'follow',
        },
        2000 // 2s timeout for website check
      );

      isOnline = true;
      httpStatus = response.status;

      // Collect headers
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });
    } catch (error) {
      console.error('Website fetch failed:', error);
    }

    const responseTime = Date.now() - startTime;

    const technologies = this.detectTechnologies(headers);
    const hosting = this.detectHosting(headers, cleanDomain);
    const security = this.analyzeSecurityHeaders(headers);
    const server = this.detectServer(headers);

    return {
      domain: cleanDomain,
      isOnline,
      httpStatus,
      responseTime,
      ssl: {
        enabled: true, // Assuming HTTPS worked
        certificate: this.parseSSLFromHeaders(headers),
      },
      server,
      technologies,
      headers,
      hosting,
      security,
      performance: {
        redirects: 0, // Would need to track redirect chain
        compressionEnabled: !!headers['content-encoding'],
        cachingEnabled: !!headers['cache-control'] || !!headers['expires'],
      },
      timestamp: new Date(),
    };
  }

  /**
   * Detect server software from headers
   */
  private detectServer(headers: { [key: string]: string }): WebsiteAnalysis['server'] {
    return {
      software: headers['server'],
      poweredBy: headers['x-powered-by'],
      language: this.detectLanguage(headers),
    };
  }

  /**
   * Detect programming language from headers
   */
  private detectLanguage(headers: { [key: string]: string }): string | undefined {
    const poweredBy = headers['x-powered-by']?.toLowerCase() || '';

    if (poweredBy.includes('php')) return 'PHP';
    if (poweredBy.includes('asp.net')) return 'ASP.NET';
    if (poweredBy.includes('express')) return 'Node.js';
    if (headers['server']?.toLowerCase().includes('nginx')) return 'Nginx';

    return undefined;
  }

  /**
   * Detect CMS, frameworks, and other technologies
   */
  private detectTechnologies(headers: { [key: string]: string }): WebsiteAnalysis['technologies'] {
    const technologies: WebsiteAnalysis['technologies'] = {
      analytics: [],
    };

    // CMS Detection
    const poweredBy = headers['x-powered-by']?.toLowerCase() || '';
    const server = headers['server']?.toLowerCase() || '';

    if (poweredBy.includes('wordpress') || headers['x-wp-version']) {
      technologies.cms = 'WordPress';
    } else if (poweredBy.includes('drupal')) {
      technologies.cms = 'Drupal';
    } else if (headers['x-generator']?.includes('Joomla')) {
      technologies.cms = 'Joomla';
    } else if (poweredBy.includes('shopify') || headers['x-shopify-stage']) {
      technologies.cms = 'Shopify';
    } else if (headers['x-wix-request-id']) {
      technologies.cms = 'Wix';
    } else if (headers['x-squarespace-id']) {
      technologies.cms = 'Squarespace';
    }

    // Framework Detection
    if (poweredBy.includes('next.js') || headers['x-nextjs-cache']) {
      technologies.framework = 'Next.js';
    } else if (headers['x-nuxt-version']) {
      technologies.framework = 'Nuxt.js';
    } else if (poweredBy.includes('django')) {
      technologies.framework = 'Django';
    } else if (poweredBy.includes('rails')) {
      technologies.framework = 'Ruby on Rails';
    } else if (poweredBy.includes('laravel')) {
      technologies.framework = 'Laravel';
    }

    // CDN Detection
    technologies.cdn = this.detectCDN(headers);

    return technologies;
  }

  /**
   * Detect CDN provider
   */
  private detectCDN(headers: { [key: string]: string }): string | undefined {
    if (headers['cf-ray'] || headers['cf-cache-status']) return 'Cloudflare';
    if (headers['x-amz-cf-id']) return 'Amazon CloudFront';
    if (headers['x-fastly-request-id']) return 'Fastly';
    if (headers['x-akamai-request-id']) return 'Akamai';
    if (headers['x-cdn']) return headers['x-cdn'];

    return undefined;
  }

  /**
   * Detect hosting provider
   */
  private detectHosting(
    headers: { [key: string]: string },
    domain: string
  ): WebsiteAnalysis['hosting'] {
    const cdn = this.detectCDN(headers);
    const server = headers['server']?.toLowerCase() || '';

    let provider: string | undefined;
    let cloudProvider: string | undefined;

    // Vercel
    if (headers['x-vercel-id'] || server.includes('vercel')) {
      provider = 'Vercel';
      cloudProvider = 'Vercel Edge Network';
    }
    // Netlify
    else if (headers['x-nf-request-id'] || server.includes('netlify')) {
      provider = 'Netlify';
    }
    // AWS
    else if (headers['x-amz-cf-id'] || headers['x-amz-request-id']) {
      cloudProvider = 'Amazon Web Services (AWS)';
    }
    // Google Cloud
    else if (server.includes('gws') || headers['x-goog-']) {
      cloudProvider = 'Google Cloud Platform';
    }
    // Azure
    else if (server.includes('azure') || headers['x-ms-']) {
      cloudProvider = 'Microsoft Azure';
    }
    // Cloudflare Pages/Workers
    else if (headers['cf-ray']) {
      provider = cdn === 'Cloudflare' ? 'Cloudflare Pages/Workers' : undefined;
      cloudProvider = 'Cloudflare';
    }

    return {
      provider,
      cloudProvider,
      usingCDN: !!cdn,
      cdnProvider: cdn,
    };
  }

  /**
   * Analyze security headers
   */
  private analyzeSecurityHeaders(headers: { [key: string]: string }): WebsiteAnalysis['security'] {
    const hasHSTS = !!headers['strict-transport-security'];
    const hasCSP = !!headers['content-security-policy'];
    const hasXFrameOptions = !!headers['x-frame-options'];
    const hasXSSProtection = !!headers['x-xss-protection'];
    const hasContentType = !!headers['x-content-type-options'];

    let score = 0;
    if (hasHSTS) score += 30;
    if (hasCSP) score += 25;
    if (hasXFrameOptions) score += 20;
    if (hasXSSProtection) score += 15;
    if (hasContentType) score += 10;

    return {
      hasHSTS,
      hasCSP,
      hasXFrameOptions,
      securityScore: score,
    };
  }

  /**
   * Parse SSL certificate info from headers (limited without direct cert access)
   */
  private parseSSLFromHeaders(headers: { [key: string]: string }): SSLCertificate | undefined {
    // Most headers don't expose cert details, would need separate SSL check
    return undefined;
  }

  /**
   * Get technology stack summary
   */
  getTechStack(analysis: WebsiteAnalysis): string[] {
    const stack: string[] = [];

    if (analysis.technologies.cms) stack.push(analysis.technologies.cms);
    if (analysis.technologies.framework) stack.push(analysis.technologies.framework);
    if (analysis.server.software) stack.push(analysis.server.software);
    if (analysis.server.language) stack.push(analysis.server.language);
    if (analysis.hosting.provider) stack.push(analysis.hosting.provider);
    if (analysis.hosting.cdnProvider) stack.push(analysis.hosting.cdnProvider);

    return stack;
  }
}

// Export singleton instance
export const websiteAnalyzer = new WebsiteAnalyzer();
