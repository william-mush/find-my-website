/**
 * Technology Stack Detector
 * Detects web technologies, frameworks, and platforms used by domains
 */

import { fetchWithTimeout } from '../utils/fetch-with-timeout';

export interface TechStack {
  domain: string;
  technologies: Technology[];
  server: ServerInfo | null;
  cms: string | null;
  frameworks: string[];
  analytics: string[];
  cdn: string | null;
  hostingPlatform: string | null;
  ssl: SSLInfo | null;
  detectedAt: string;
}

export interface Technology {
  name: string;
  category: string;
  version?: string;
  confidence: 'high' | 'medium' | 'low';
  indicators: string[];
}

export interface ServerInfo {
  software: string;
  version?: string;
  language?: string;
}

export interface SSLInfo {
  issuer: string;
  validFrom: string;
  validTo: string;
  protocol: string;
}

export class TechStackDetector {
  /**
   * Detect technology stack for a domain
   */
  async detect(domain: string): Promise<TechStack> {
    console.log(`[TechStackDetector] Analyzing ${domain}...`);
    const startTime = Date.now();

    const technologies: Technology[] = [];
    let server: ServerInfo | null = null;
    let cms: string | null = null;
    const frameworks: string[] = [];
    const analytics: string[] = [];
    let cdn: string | null = null;
    let hostingPlatform: string | null = null;
    let ssl: SSLInfo | null = null;

    try {
      // Fetch homepage
      const response = await fetchWithTimeout(
        `https://${domain}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FindMyWebsite/1.0; +https://find-my-website.vercel.app)',
          },
          redirect: 'follow',
        },
        5000
      );

      const html = await response.text();
      const headers = response.headers;

      // 1. Detect server from headers
      const serverHeader = headers.get('server');
      if (serverHeader) {
        server = this.parseServerHeader(serverHeader);
        technologies.push({
          name: server.software,
          category: 'Web Server',
          version: server.version,
          confidence: 'high',
          indicators: ['HTTP Server header'],
        });
      }

      // 2. Detect X-Powered-By
      const poweredBy = headers.get('x-powered-by');
      if (poweredBy) {
        technologies.push({
          name: poweredBy,
          category: 'Backend Framework',
          confidence: 'high',
          indicators: ['X-Powered-By header'],
        });
      }

      // 3. Detect CDN from headers
      cdn = this.detectCDN(headers);
      if (cdn) {
        technologies.push({
          name: cdn,
          category: 'CDN',
          confidence: 'high',
          indicators: ['HTTP headers'],
        });
      }

      // 4. Detect CMS from HTML
      cms = this.detectCMS(html);
      if (cms) {
        technologies.push({
          name: cms,
          category: 'CMS',
          confidence: 'high',
          indicators: ['HTML meta tags', 'Generator tags'],
        });
      }

      // 5. Detect JavaScript frameworks
      const detectedFrameworks = this.detectFrameworks(html);
      frameworks.push(...detectedFrameworks);
      detectedFrameworks.forEach((fw) => {
        technologies.push({
          name: fw,
          category: 'JavaScript Framework',
          confidence: 'medium',
          indicators: ['Script tags', 'Framework signatures'],
        });
      });

      // 6. Detect analytics
      const detectedAnalytics = this.detectAnalytics(html);
      analytics.push(...detectedAnalytics);
      detectedAnalytics.forEach((tool) => {
        technologies.push({
          name: tool,
          category: 'Analytics',
          confidence: 'high',
          indicators: ['Script tags'],
        });
      });

      // 7. Detect hosting platform
      hostingPlatform = this.detectHostingPlatform(headers, html);
      if (hostingPlatform) {
        technologies.push({
          name: hostingPlatform,
          category: 'Hosting Platform',
          confidence: 'high',
          indicators: ['HTTP headers', 'Platform signatures'],
        });
      }

      // 8. Detect programming languages
      const languages = this.detectProgrammingLanguages(html, headers);
      languages.forEach((lang) => {
        technologies.push({
          name: lang,
          category: 'Programming Language',
          confidence: 'medium',
          indicators: ['File extensions', 'Framework patterns'],
        });
      });

      console.log(`[TechStackDetector] Detected ${technologies.length} technologies in ${Date.now() - startTime}ms`);
    } catch (error: any) {
      console.error(`[TechStackDetector] Error analyzing ${domain}:`, error.message);
    }

    return {
      domain,
      technologies,
      server,
      cms,
      frameworks,
      analytics,
      cdn,
      hostingPlatform,
      ssl,
      detectedAt: new Date().toISOString(),
    };
  }

  /**
   * Parse Server header
   */
  private parseServerHeader(header: string): ServerInfo {
    const parts = header.split('/');
    const software = parts[0];
    const version = parts[1]?.split(' ')[0];

    return {
      software,
      version,
    };
  }

  /**
   * Detect CDN from headers
   */
  private detectCDN(headers: Headers): string | null {
    const cdnHeaders = [
      { name: 'Cloudflare', headers: ['cf-ray', 'cf-cache-status'] },
      { name: 'Fastly', headers: ['fastly-ssl', 'x-fastly-request-id'] },
      { name: 'Akamai', headers: ['x-akamai-request-id', 'akamai-origin-hop'] },
      { name: 'CloudFront', headers: ['x-amz-cf-id', 'via'] },
      { name: 'KeyCDN', headers: ['x-keycdn-cache'] },
      { name: 'StackPath', headers: ['x-sp-cache'] },
      { name: 'BunnyCDN', headers: ['cdn-pullzone', 'cdn-uid'] },
    ];

    for (const cdn of cdnHeaders) {
      for (const header of cdn.headers) {
        if (headers.get(header)) {
          return cdn.name;
        }
      }
    }

    // Check Via header for CDN signatures
    const via = headers.get('via');
    if (via) {
      if (via.toLowerCase().includes('cloudfront')) return 'CloudFront';
      if (via.toLowerCase().includes('cloudflare')) return 'Cloudflare';
      if (via.toLowerCase().includes('fastly')) return 'Fastly';
    }

    return null;
  }

  /**
   * Detect CMS from HTML content
   */
  private detectCMS(html: string): string | null {
    const cmsPatterns = [
      { name: 'WordPress', patterns: [/wp-content/i, /wp-includes/i, /<meta name="generator" content="WordPress/i] },
      { name: 'Drupal', patterns: [/Drupal\.settings/i, /<meta name="Generator" content="Drupal/i] },
      { name: 'Joomla', patterns: [/\/components\/com_/i, /<meta name="generator" content="Joomla/i] },
      { name: 'Shopify', patterns: [/cdn\.shopify\.com/i, /Shopify\.theme/i] },
      { name: 'Wix', patterns: [/static\.wixstatic\.com/i, /parastorage\.com/i] },
      { name: 'Squarespace', patterns: [/static\.squarespace\.com/i, /Squarespace\.Constants/i] },
      { name: 'Webflow', patterns: [/webflow\.com/i, /data-wf-page/i] },
      { name: 'Ghost', patterns: [/<meta name="generator" content="Ghost/i] },
      { name: 'Blogger', patterns: [/blogger\.com/i, /blogspot\.com/i] },
      { name: 'Magento', patterns: [/Mage\.Cookies/i, /\/skin\/frontend\//i] },
    ];

    for (const cms of cmsPatterns) {
      if (cms.patterns.some((pattern) => pattern.test(html))) {
        return cms.name;
      }
    }

    return null;
  }

  /**
   * Detect JavaScript frameworks
   */
  private detectFrameworks(html: string): string[] {
    const frameworks: string[] = [];

    const frameworkPatterns = [
      { name: 'React', patterns: [/react/i, /__REACT/i, /data-reactroot/i] },
      { name: 'Next.js', patterns: [/\/_next\//i, /__NEXT_DATA__/i] },
      { name: 'Vue.js', patterns: [/vue\.js/i, /Vue\.config/i, /data-v-/i] },
      { name: 'Nuxt.js', patterns: [/__NUXT__/i, /nuxt\.js/i] },
      { name: 'Angular', patterns: [/angular/i, /ng-version/i] },
      { name: 'Svelte', patterns: [/svelte/i, /data-svelte/i] },
      { name: 'jQuery', patterns: [/jquery/i, /\$\.fn\.jquery/i] },
      { name: 'Gatsby', patterns: [/gatsby/i, /___gatsby/i] },
      { name: 'Ember.js', patterns: [/ember/i, /Ember\.VERSION/i] },
      { name: 'Backbone.js', patterns: [/backbone/i, /Backbone\.VERSION/i] },
    ];

    for (const framework of frameworkPatterns) {
      if (framework.patterns.some((pattern) => pattern.test(html))) {
        frameworks.push(framework.name);
      }
    }

    return frameworks;
  }

  /**
   * Detect analytics tools
   */
  private detectAnalytics(html: string): string[] {
    const analytics: string[] = [];

    const analyticsPatterns = [
      { name: 'Google Analytics', patterns: [/google-analytics\.com\/analytics\.js/i, /gtag\(/i, /ga\('create'/i] },
      { name: 'Google Tag Manager', patterns: [/googletagmanager\.com\/gtm\.js/i] },
      { name: 'Facebook Pixel', patterns: [/connect\.facebook\.net\/en_US\/fbevents\.js/i, /fbq\('init'/i] },
      { name: 'Hotjar', patterns: [/static\.hotjar\.com/i] },
      { name: 'Mixpanel', patterns: [/mixpanel\.com\/libs\/mixpanel/i] },
      { name: 'Segment', patterns: [/cdn\.segment\.com/i] },
      { name: 'Amplitude', patterns: [/amplitude\.com/i] },
      { name: 'Plausible', patterns: [/plausible\.io/i] },
      { name: 'Matomo', patterns: [/matomo\.js/i, /piwik\.js/i] },
    ];

    for (const tool of analyticsPatterns) {
      if (tool.patterns.some((pattern) => pattern.test(html))) {
        analytics.push(tool.name);
      }
    }

    return analytics;
  }

  /**
   * Detect hosting platform
   */
  private detectHostingPlatform(headers: Headers, html: string): string | null {
    // Check headers first
    const serverHeader = headers.get('server');
    if (serverHeader) {
      if (serverHeader.includes('Vercel')) return 'Vercel';
      if (serverHeader.includes('Netlify')) return 'Netlify';
      if (serverHeader.includes('GitHub.com')) return 'GitHub Pages';
      if (serverHeader.includes('CloudFront')) return 'AWS (CloudFront)';
    }

    // Check X-Powered-By
    const poweredBy = headers.get('x-powered-by');
    if (poweredBy) {
      if (poweredBy.includes('Next.js')) return 'Vercel (Next.js)';
      if (poweredBy.includes('Vercel')) return 'Vercel';
      if (poweredBy.includes('WP Engine')) return 'WP Engine';
    }

    // Check HTML for platform signatures
    if (html.includes('netlify.app')) return 'Netlify';
    if (html.includes('vercel.app')) return 'Vercel';
    if (html.includes('herokuapp.com')) return 'Heroku';
    if (html.includes('amplifyapp.com')) return 'AWS Amplify';
    if (html.includes('azurewebsites.net')) return 'Azure';
    if (html.includes('cloudflareinsights.com')) return 'Cloudflare Pages';

    return null;
  }

  /**
   * Detect programming languages
   */
  private detectProgrammingLanguages(html: string, headers: Headers): string[] {
    const languages: string[] = [];

    // From X-Powered-By or Server headers
    const poweredBy = headers.get('x-powered-by');
    if (poweredBy) {
      if (/PHP/i.test(poweredBy)) languages.push('PHP');
      if (/ASP\.NET/i.test(poweredBy)) languages.push('ASP.NET (C#)');
      if (/Express/i.test(poweredBy)) languages.push('Node.js');
    }

    // From HTML patterns
    if (/\.php/i.test(html)) languages.push('PHP');
    if (/\.aspx/i.test(html)) languages.push('ASP.NET (C#)');
    if (/\.jsp/i.test(html)) languages.push('Java (JSP)');
    if (/django/i.test(html)) languages.push('Python (Django)');
    if (/flask/i.test(html)) languages.push('Python (Flask)');
    if (/rails/i.test(html)) languages.push('Ruby (Rails)');

    return [...new Set(languages)]; // Remove duplicates
  }
}

export const techStackDetector = new TechStackDetector();
