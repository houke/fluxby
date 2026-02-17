/**
 * Content Security Policy Configuration
 *
 * Secure CSP setup with proper directives
 */

// ============================================================================
// CSP CONFIGURATION
// ============================================================================

export interface CSPDirectives {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  fontSrc: string[];
  connectSrc: string[];
  frameSrc: string[];
  objectSrc: string[];
  mediaSrc: string[];
  workerSrc: string[];
  childSrc: string[];
  formAction: string[];
  frameAncestors: string[];
  baseUri: string[];
  reportUri?: string;
  reportTo?: string;
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
}

// Development CSP (more permissive for hot reload, etc.)
export const developmentCSP: CSPDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // Allow for development tools
    "'unsafe-eval'", // Allow for hot reload
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Allow inline styles for development
  ],
  imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
  fontSrc: ["'self'", 'data:'],
  connectSrc: [
    "'self'",
    'ws://localhost:*', // WebSocket for HMR
    'http://localhost:*',
  ],
  frameSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  workerSrc: ["'self'", 'blob:'],
  childSrc: ["'self'", 'blob:'],
  formAction: ["'self'"],
  frameAncestors: ["'self'"],
  baseUri: ["'self'"],
};

// Production CSP (strict)
export const productionCSP: CSPDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'strict-dynamic'", // Allow scripts loaded by trusted scripts
    // Add nonce or hash for inline scripts
  ],
  styleSrc: [
    "'self'",
    // Use nonces for inline styles in production
  ],
  imgSrc: [
    "'self'",
    'data:',
    'blob:',
    'https://cdn.example.com', // Your CDN
  ],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  connectSrc: [
    "'self'",
    'https://api.example.com',
    'https://analytics.example.com',
  ],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  workerSrc: ["'self'", 'blob:'],
  childSrc: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  baseUri: ["'self'"],
  reportUri: '/api/csp-report',
  upgradeInsecureRequests: true,
  blockAllMixedContent: true,
};

// ============================================================================
// CSP HELPERS
// ============================================================================

/**
 * Generate nonce for inline scripts/styles
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Build CSP header string from directives
 */
export function buildCSPHeader(
  directives: CSPDirectives,
  nonce?: string,
): string {
  const parts: string[] = [];

  // Add nonce to script-src and style-src if provided
  const withNonce = (sources: string[]): string[] => {
    if (nonce) {
      return [...sources, `'nonce-${nonce}'`];
    }
    return sources;
  };

  parts.push(`default-src ${directives.defaultSrc.join(' ')}`);
  parts.push(`script-src ${withNonce(directives.scriptSrc).join(' ')}`);
  parts.push(`style-src ${withNonce(directives.styleSrc).join(' ')}`);
  parts.push(`img-src ${directives.imgSrc.join(' ')}`);
  parts.push(`font-src ${directives.fontSrc.join(' ')}`);
  parts.push(`connect-src ${directives.connectSrc.join(' ')}`);
  parts.push(`frame-src ${directives.frameSrc.join(' ')}`);
  parts.push(`object-src ${directives.objectSrc.join(' ')}`);
  parts.push(`media-src ${directives.mediaSrc.join(' ')}`);
  parts.push(`worker-src ${directives.workerSrc.join(' ')}`);
  parts.push(`child-src ${directives.childSrc.join(' ')}`);
  parts.push(`form-action ${directives.formAction.join(' ')}`);
  parts.push(`frame-ancestors ${directives.frameAncestors.join(' ')}`);
  parts.push(`base-uri ${directives.baseUri.join(' ')}`);

  if (directives.reportUri) {
    parts.push(`report-uri ${directives.reportUri}`);
  }

  if (directives.reportTo) {
    parts.push(`report-to ${directives.reportTo}`);
  }

  if (directives.upgradeInsecureRequests) {
    parts.push('upgrade-insecure-requests');
  }

  if (directives.blockAllMixedContent) {
    parts.push('block-all-mixed-content');
  }

  return parts.join('; ');
}

// ============================================================================
// EXPRESS MIDDLEWARE
// ============================================================================

import { Request, Response, NextFunction } from 'express';

export function cspMiddleware(directives: CSPDirectives = productionCSP) {
  return (req: Request, res: Response, next: NextFunction) => {
    const nonce = generateNonce();

    // Make nonce available to templates
    res.locals.cspNonce = nonce;

    const cspHeader = buildCSPHeader(directives, nonce);

    res.setHeader('Content-Security-Policy', cspHeader);

    next();
  };
}

// ============================================================================
// CSP VIOLATION REPORT HANDLER
// ============================================================================

interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    referrer: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    'blocked-uri': string;
    'status-code': number;
  };
}

export function cspReportHandler(req: Request, res: Response) {
  const report = req.body as CSPViolationReport;

  // Log for monitoring
  console.warn('CSP Violation:', {
    documentUri: report['csp-report']['document-uri'],
    violatedDirective: report['csp-report']['violated-directive'],
    blockedUri: report['csp-report']['blocked-uri'],
  });

  // In production, send to logging service
  // await loggingService.logSecurityEvent('csp_violation', report);

  res.status(204).end();
}

// ============================================================================
// OTHER SECURITY HEADERS
// ============================================================================

export function securityHeadersMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS filter (legacy browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Prevent information disclosure
    res.removeHeader('X-Powered-By');

    // HSTS (HTTP Strict Transport Security)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    );

    next();
  };
}

// ============================================================================
// USAGE WITH EXPRESS
// ============================================================================

/*
import express from 'express';

const app = express();

// Parse CSP reports
app.use('/api/csp-report', express.json({ type: 'application/csp-report' }));
app.post('/api/csp-report', cspReportHandler);

// Apply security headers
app.use(securityHeadersMiddleware());

// Apply CSP
const csp = process.env.NODE_ENV === 'production' 
  ? productionCSP 
  : developmentCSP;
app.use(cspMiddleware(csp));

// In templates, use the nonce:
// <script nonce="<%= cspNonce %>">...</script>
*/
