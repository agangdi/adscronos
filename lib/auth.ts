import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { UserRole, SessionStatus } from '@prisma/client';

// Role-specific JWT secrets
const JWT_SECRETS = {
  [UserRole.ADMIN]: process.env.JWT_ADMIN_SECRET || 'fallback-admin-secret-key',
  [UserRole.ADVERTISER]: process.env.JWT_ADVERTISER_SECRET || 'fallback-advertiser-secret-key',
  [UserRole.PUBLISHER]: process.env.JWT_PUBLISHER_SECRET || 'fallback-publisher-secret-key'
};

const JWT_REFRESH_SECRETS = {
  [UserRole.ADMIN]: process.env.JWT_ADMIN_REFRESH_SECRET || 'fallback-admin-refresh-secret',
  [UserRole.ADVERTISER]: process.env.JWT_ADVERTISER_REFRESH_SECRET || 'fallback-advertiser-refresh-secret',
  [UserRole.PUBLISHER]: process.env.JWT_PUBLISHER_REFRESH_SECRET || 'fallback-publisher-refresh-secret'
};

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  siteName?: string;
}

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT tokens
  static generateTokens(userId: string, role: UserRole) {
    const accessPayload: JWTPayload = { userId, role, type: 'access' };
    const refreshPayload: JWTPayload = { userId, role, type: 'refresh' };

    const accessSecret = JWT_SECRETS[role];
    const refreshSecret = JWT_REFRESH_SECRETS[role];

    const accessToken = jwt.sign(accessPayload, accessSecret as string, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign(refreshPayload, refreshSecret as string, { expiresIn: JWT_REFRESH_EXPIRES_IN });

    return { accessToken, refreshToken };
  }

  // Verify JWT token - tries all role-specific secrets
  static verifyToken(token: string, type: 'access' | 'refresh' = 'access'): JWTPayload | null {
    const secrets = type === 'access' ? JWT_SECRETS : JWT_REFRESH_SECRETS;
    
    // Try each role-specific secret
    for (const role of Object.values(UserRole)) {
      try {
        const secret = secrets[role];
        const payload = jwt.verify(token, secret) as JWTPayload;
        
        if (payload.type !== type || payload.role !== role) {
          continue;
        }
        
        return payload;
      } catch {
        // Continue to next secret
        continue;
      }
    }
    
    return null;
  }

  // Verify JWT token with specific role
  static verifyTokenForRole(token: string, role: UserRole, type: 'access' | 'refresh' = 'access'): JWTPayload | null {
    try {
      const secrets = type === 'access' ? JWT_SECRETS : JWT_REFRESH_SECRETS;
      const secret = secrets[role];
      const payload = jwt.verify(token, secret) as JWTPayload;
      
      if (payload.type !== type || payload.role !== role) {
        return null;
      }
      
      return payload;
    } catch {
      return null;
    }
  }

  // Create user session
  static async createSession(
    userId: string, 
    role: UserRole, 
    ipAddress?: string, 
    userAgent?: string
  ) {
    console.log('🔧 [AUTH] Creating session for user:', userId, 'role:', role);
    const { accessToken, refreshToken } = this.generateTokens(userId, role);
    console.log('🔧 [AUTH] Generated tokens successfully');
    
    // Calculate expiry dates
    const accessExpiresAt = new Date(Date.now() + this.parseTimeToMs(JWT_EXPIRES_IN));
    const refreshExpiresAt = new Date(Date.now() + this.parseTimeToMs(JWT_REFRESH_EXPIRES_IN));

    // Create session record
    const sessionData = {
      token: accessToken,
      refreshToken,
      status: SessionStatus.ACTIVE,
      expiresAt: accessExpiresAt,
      ipAddress,
      userAgent,
      ...(role === UserRole.ADVERTISER ? { advertiserId: userId } : { publisherId: userId })
    };

    console.log('🔧 [AUTH] Creating session record in database...');
    const session = await prisma.userSession.create({
      data: sessionData
    });
    console.log('🔧 [AUTH] Session created successfully:', session.id);

    return {
      accessToken,
      refreshToken,
      expiresAt: accessExpiresAt,
      refreshExpiresAt,
      sessionId: session.id
    };
  }

  // Refresh token
  static async refreshToken(refreshToken: string) {
    const payload = this.verifyToken(refreshToken, 'refresh');
    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    // Check if session exists and is active
    const session = await prisma.userSession.findFirst({
      where: {
        refreshToken,
        status: SessionStatus.ACTIVE,
        expiresAt: { gt: new Date() }
      }
    });

    if (!session) {
      throw new Error('Session not found or expired');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(payload.userId, payload.role);
    const accessExpiresAt = new Date(Date.now() + this.parseTimeToMs(JWT_EXPIRES_IN));

    // Update session
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        token: accessToken,
        refreshToken: newRefreshToken,
        expiresAt: accessExpiresAt,
        updatedAt: new Date()
      }
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt: accessExpiresAt
    };
  }

  // Revoke session
  static async revokeSession(token: string) {
    await prisma.userSession.updateMany({
      where: {
        OR: [
          { token },
          { refreshToken: token }
        ]
      },
      data: {
        status: SessionStatus.REVOKED,
        updatedAt: new Date()
      }
    });
  }

  // Get user by token
  static async getUserByToken(token: string): Promise<AuthUser | null> {
    console.log('🔍 [AUTH] getUserByToken called with token:', token.substring(0, 20) + '...');
    
    const payload = this.verifyToken(token);
    console.log('🔍 [AUTH] Token verification result:', payload ? `Valid - userId: ${payload.userId}, role: ${payload.role}` : 'INVALID');
    
    if (!payload) {
      console.log('❌ [AUTH] Token verification failed');
      return null;
    }

    // Check session
    console.log('🔍 [AUTH] Looking for session in database...');
    const session = await prisma.userSession.findFirst({
      where: {
        token,
        status: SessionStatus.ACTIVE,
        expiresAt: { gt: new Date() }
      }
    });

    console.log('🔍 [AUTH] Session lookup result:', session ? `Found session: ${session.id}` : 'NO SESSION FOUND');
    
    if (!session) {
      console.log('❌ [AUTH] No active session found for token');
      return null;
    }

    // Get user based on role
    if (payload.role === UserRole.ADVERTISER) {
      const advertiser = await prisma.advertiser.findUnique({
        where: { id: payload.userId }
      });
      
      if (!advertiser) return null;
      
      return {
        id: advertiser.id,
        email: advertiser.authEmail,
        role: advertiser.role,
        name: advertiser.name
      };
    } else if (payload.role === UserRole.PUBLISHER) {
      const publisher = await prisma.publisher.findUnique({
        where: { id: payload.userId }
      });
      
      if (!publisher) return null;
      
      return {
        id: publisher.id,
        email: publisher.authEmail,
        role: publisher.role,
        siteName: publisher.siteName
      };
    }

    return null;
  }

  // Authenticate advertiser
  static async authenticateAdvertiser(email: string, password: string) {
    const advertiser = await prisma.advertiser.findUnique({
      where: { authEmail: email }
    });

    if (!advertiser || !await this.verifyPassword(password, advertiser.passwordHash)) {
      throw new Error('Invalid credentials');
    }

    return advertiser;
  }

  // Authenticate publisher
  static async authenticatePublisher(email: string, password: string) {
    const publisher = await prisma.publisher.findUnique({
      where: { authEmail: email }
    });

    if (!publisher || !await this.verifyPassword(password, publisher.passwordHash)) {
      throw new Error('Invalid credentials');
    }

    return publisher;
  }

  // Clean up expired sessions
  static async cleanupExpiredSessions() {
    await prisma.userSession.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        status: SessionStatus.ACTIVE
      },
      data: {
        status: SessionStatus.EXPIRED,
        updatedAt: new Date()
      }
    });
  }

  // Helper to parse time strings like "1h", "7d" to milliseconds
  private static parseTimeToMs(timeStr: string): number {
    const units: Record<string, number> = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };

    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }
}

// Role-based access control
export function requireRole(allowedRoles: UserRole[]) {
  return (user: AuthUser | null): boolean => {
    return user !== null && allowedRoles.includes(user.role);
  };
}

// Permission helpers
export const Permissions = {
  canManageCampaigns: requireRole([UserRole.ADVERTISER, UserRole.ADMIN]),
  canManageCreatives: requireRole([UserRole.ADVERTISER, UserRole.ADMIN]),
  canManageAdUnits: requireRole([UserRole.PUBLISHER, UserRole.ADMIN]),
  canViewAnalytics: requireRole([UserRole.ADVERTISER, UserRole.PUBLISHER, UserRole.ADMIN]),
  canManageUsers: requireRole([UserRole.ADMIN]),
  canAccessBilling: requireRole([UserRole.ADVERTISER, UserRole.PUBLISHER, UserRole.ADMIN])
};
