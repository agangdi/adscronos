import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { createApiHandler } from '@/lib/middleware';

async function handleAdminLogin(request: NextRequest): Promise<NextResponse> {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find admin user
    const admin = await prisma.advertiser.findFirst({
      where: { 
        authEmail: email,
        role: UserRole.ADMIN
      }
    });

    if (!admin || !await AuthService.verifyPassword(password, admin.passwordHash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create session with admin role
    const session = await AuthService.createSession(
      admin.id,
      UserRole.ADMIN,
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: admin.id,
        email: admin.authEmail,
        role: admin.role,
        name: admin.name
      },
      ...session
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

export const POST = createApiHandler(handleAdminLogin, {
  rateLimit: 'auth',
  cors: true
});
