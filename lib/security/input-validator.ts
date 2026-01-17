/**
 * Input Validation and Sanitization
 * Prevents injection attacks and malicious input
 */

export interface ValidationResult {
  valid: boolean;
  sanitized: string;
  errors: string[];
}

export class InputValidator {
  /**
   * Validate and sanitize domain name
   */
  validateDomain(input: string): ValidationResult {
    const errors: string[] = [];

    // Remove whitespace
    let sanitized = input.trim().toLowerCase();

    // Check length
    if (sanitized.length === 0) {
      errors.push('Domain cannot be empty');
      return { valid: false, sanitized: '', errors };
    }

    if (sanitized.length > 253) {
      errors.push('Domain too long (max 253 characters)');
      return { valid: false, sanitized: '', errors };
    }

    // Remove protocol if present
    sanitized = sanitized.replace(/^https?:\/\//, '');
    sanitized = sanitized.replace(/^www\./, '');

    // Remove path, query string, fragment
    sanitized = sanitized.split('/')[0];
    sanitized = sanitized.split('?')[0];
    sanitized = sanitized.split('#')[0];

    // Remove port if present
    sanitized = sanitized.split(':')[0];

    // Validate domain format
    // Allows: letters, numbers, hyphens, dots
    // Must have at least one dot (TLD)
    const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/;

    if (!domainRegex.test(sanitized)) {
      errors.push('Invalid domain format');
      return { valid: false, sanitized, errors };
    }

    // Check for suspicious patterns
    if (this.hasSuspiciousPatterns(sanitized)) {
      errors.push('Domain contains suspicious patterns');
      return { valid: false, sanitized, errors };
    }

    // Check if localhost or internal
    if (this.isLocalOrInternal(sanitized)) {
      errors.push('Cannot analyze local or internal domains');
      return { valid: false, sanitized, errors };
    }

    return { valid: true, sanitized, errors: [] };
  }

  /**
   * Check for SQL injection patterns
   */
  private hasSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /[;<>'"\\]/,           // SQL injection characters
      /\.\./,                // Path traversal
      /javascript:/i,        // XSS
      /data:/i,              // Data URIs
      /vbscript:/i,          // VBScript
      /onload=/i,            // Event handlers
      /onerror=/i,
      /<script/i,            // Script tags
      /union.*select/i,      // SQL UNION
      /drop.*table/i,        // SQL DROP
      /insert.*into/i,       // SQL INSERT
      /delete.*from/i,       // SQL DELETE
      /exec\(/i,             // Command execution
      /eval\(/i,             // JavaScript eval
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Check if domain is localhost or internal
   */
  private isLocalOrInternal(domain: string): boolean {
    const internalDomains = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '.local',
      '.internal',
      '.private',
      '10.',
      '172.16.',
      '192.168.',
    ];

    return internalDomains.some(internal =>
      domain === internal || domain.startsWith(internal) || domain.endsWith(internal)
    );
  }

  /**
   * Sanitize string for display (prevent XSS)
   */
  sanitizeForDisplay(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate IP address
   */
  validateIP(ip: string): boolean {
    // IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }

    // IPv6 (simplified)
    const ipv6Regex = /^([0-9a-f]{0,4}:){7}[0-9a-f]{0,4}$/i;
    return ipv6Regex.test(ip);
  }
}

export const inputValidator = new InputValidator();
