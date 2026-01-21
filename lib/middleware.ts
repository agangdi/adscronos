import { NextRequest, NextResponse } from 'next/server';
import { AuthService, AuthUser, Permissions } from './auth';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

// Rate limiting configuration
const RATE_LIMIT_WINDOWS = {
  api: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
  auth: { requests: 5, window: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  upload: { requests: 10, window: 60 * 1000 }, // 10 uploads per minute
};

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

// Authentication middleware
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    console.log('🔐 [AUTH] Starting authentication process');
    console.log('🔐 [AUTH] Request URL:', request.url);
    console.log('🔐 [AUTH] Request method:', request.method);
    
    const authHeader = request.headers.get('Authorization');
    console.log('🔐 [AUTH] Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'NOT FOUND');
    
    const token = extractToken(request);
    console.log('🔐 [AUTH] Extracted token:', token ? `${token.substring(0, 20)}...` : 'NULL');
    
    if (!token) {
      console.log('❌ [AUTH] No token found, returning 401');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('🔐 [AUTH] Calling AuthService.getUserByToken...');
    const user = await AuthService.getUserByToken(token);
    console.log('🔐 [AUTH] AuthService result:', user ? `User found: ${user.id} (${user.role})` : 'NULL');
    
    if (!user) {
      console.log('❌ [AUTH] User not found or token invalid, returning 401');
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    console.log('✅ [AUTH] Authentication successful, proceeding to handler');
    // Add user to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;

    return handler(authenticatedRequest);
  } catch (error) {
    console.error('💥 [AUTH] Authentication error:', error);
    console.error('💥 [AUTH] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

// Role-specific authentication middleware
export async function withRoleSpecificAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  expectedRole: UserRole
): Promise<NextResponse> {
  try {
    const token = extractToken(request);
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify token with specific role
    const payload = AuthService.verifyTokenForRole(token, expectedRole);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token for this role' }, { status: 401 });
    }

    // Get user by token (this will validate session)
    const user = await AuthService.getUserByToken(token);
    
    if (!user || user.role !== expectedRole) {
      return NextResponse.json({ error: 'Access denied for this role' }, { status: 403 });
    }

    // Add user to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;

    return handler(authenticatedRequest);
  } catch (error) {
    console.error('Role-specific authentication error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

// Authorization middleware
export function withRole(allowedRoles: UserRole[]) {
  return async (
    request: AuthenticatedRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    if (!request.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    return handler(request);
  };
}

// Rate limiting middleware
export async function withRateLimit(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  limitType: keyof typeof RATE_LIMIT_WINDOWS = 'api'
): Promise<NextResponse> {
  try {
    const identifier = getClientIdentifier(request);
    const endpoint = getEndpointPath(request);
    const config = RATE_LIMIT_WINDOWS[limitType];
    
    const windowStart = new Date(Math.floor(Date.now() / config.window) * config.window);
    
    // Get or create rate limit record
    const rateLimit = await prisma.apiRateLimit.upsert({
      where: {
        identifier_endpoint_windowStart: {
          identifier,
          endpoint,
          windowStart
        }
      },
      update: {
        requests: { increment: 1 }
      },
      create: {
        identifier,
        endpoint,
        requests: 1,
        windowStart
      }
    });

    // Check if limit exceeded
    if (rateLimit.requests > config.requests) {
      const resetTime = new Date(windowStart.getTime() + config.window);
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          resetTime: resetTime.toISOString(),
          limit: config.requests,
          window: config.window / 1000
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.requests.toString(),
            'X-RateLimit-Remaining': Math.max(0, config.requests - rateLimit.requests).toString(),
            'X-RateLimit-Reset': resetTime.toISOString()
          }
        }
      );
    }

    // Add rate limit headers to response
    const response = await handler(request);
    
    response.headers.set('X-RateLimit-Limit', config.requests.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, config.requests - rateLimit.requests).toString());
    response.headers.set('X-RateLimit-Reset', new Date(windowStart.getTime() + config.window).toISOString());

    return response;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return handler(request); // Continue without rate limiting on error
  }
}

// CORS middleware
export function withCORS(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return handler(request).then(response => {
    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    response.headers.set('Access-Control-Max-Age', '86400');

    return response;
  });
}

// API Key authentication middleware
export async function withApiKey(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    // Check if it's an advertiser API key
    const advertiser = await prisma.advertiser.findUnique({
      where: { apiKey }
    });

    if (advertiser) {
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        id: advertiser.id,
        email: advertiser.authEmail,
        role: advertiser.role,
        name: advertiser.name
      };
      return handler(authenticatedRequest);
    }

    // Check if it's a publisher API key
    const publisher = await prisma.publisher.findUnique({
      where: { apiKey }
    });

    if (publisher) {
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        id: publisher.id,
        email: publisher.authEmail,
        role: publisher.role,
        siteName: publisher.siteName
      };
      return handler(authenticatedRequest);
    }

    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  } catch (error) {
    console.error('API key authentication error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

// Combined middleware for API routes
export function createApiHandler(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: {
    auth?: 'jwt' | 'apiKey' | 'both' | 'role-specific';
    roles?: UserRole[];
    specificRole?: UserRole; // For role-specific JWT authentication
    rateLimit?: keyof typeof RATE_LIMIT_WINDOWS;
    cors?: boolean;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    let middlewareChain = async (req: NextRequest) => {
      // Handle OPTIONS requests for CORS
      if (req.method === 'OPTIONS') {
        return new NextResponse(null, { status: 200 });
      }

      const authenticatedRequest = req as AuthenticatedRequest;
      return handler(authenticatedRequest);
    };

    // Apply CORS if enabled
    if (options.cors !== false) {
      const originalChain = middlewareChain;
      middlewareChain = (req: NextRequest) => withCORS(req, originalChain);
    }

    // Apply rate limiting if specified
    if (options.rateLimit) {
      const originalChain = middlewareChain;
      middlewareChain = (req: NextRequest) => withRateLimit(req, originalChain, options.rateLimit);
    }

    // Apply authentication if specified
    if (options.auth === 'jwt') {
      const originalChain = middlewareChain;
      middlewareChain = (req: NextRequest) => withAuth(req, originalChain as (req: AuthenticatedRequest) => Promise<NextResponse>);
    } else if (options.auth === 'apiKey') {
      const originalChain = middlewareChain;
      middlewareChain = (req: NextRequest) => withApiKey(req, originalChain as (req: AuthenticatedRequest) => Promise<NextResponse>);
    } else if (options.auth === 'both') {
      const originalChain = middlewareChain;
      middlewareChain = async (req: NextRequest) => {
        // Try JWT first, then API key
        const token = extractToken(req);
        if (token) {
          return withAuth(req, originalChain as (req: AuthenticatedRequest) => Promise<NextResponse>);
        } else {
          return withApiKey(req, originalChain as (req: AuthenticatedRequest) => Promise<NextResponse>);
        }
      };
    } else if (options.auth === 'role-specific' && options.specificRole) {
      const originalChain = middlewareChain;
      middlewareChain = (req: NextRequest) => withRoleSpecificAuth(req, originalChain as (req: AuthenticatedRequest) => Promise<NextResponse>, options.specificRole!);
    }

    // Apply role-based authorization if specified
    if (options.roles && options.roles.length > 0) {
      const originalChain = middlewareChain;
      middlewareChain = (req: NextRequest) => withRole(options.roles!)(req as AuthenticatedRequest, originalChain as (req: AuthenticatedRequest) => Promise<NextResponse>);
    }

    return middlewareChain(request);
  };
}

// Helper functions
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get API key first
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey) return `api:${apiKey}`;

  // Fall back to IP address
  const forwarded = request.headers.get('X-Forwarded-For');
  const realIp = request.headers.get('X-Real-IP');
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || 'unknown';
  return `ip:${ip}`;
}

function getEndpointPath(request: NextRequest): string {
  const url = new URL(request.url);
  return url.pathname;
}

// Permission checking utilities
export const requirePermission = {
  manageCampaigns: (user: AuthUser | undefined) => user && Permissions.canManageCampaigns(user),
  manageCreatives: (user: AuthUser | undefined) => user && Permissions.canManageCreatives(user),
  manageAdUnits: (user: AuthUser | undefined) => user && Permissions.canManageAdUnits(user),
  viewAnalytics: (user: AuthUser | undefined) => user && Permissions.canViewAnalytics(user),
  manageUsers: (user: AuthUser | undefined) => user && Permissions.canManageUsers(user),
  accessBilling: (user: AuthUser | undefined) => user && Permissions.canAccessBilling(user)
};
