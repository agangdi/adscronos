import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { createApiHandler } from '@/lib/middleware';

async function handleAdvertiserLogin(request: NextRequest): Promise<NextResponse> {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { authEmail, password } = await request.json();

    if (!authEmail || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Authenticate advertiser
    const advertiser = await AuthService.authenticateAdvertiser(authEmail, password);

    // Create session with advertiser role
    const session = await AuthService.createSession(
      advertiser.id,
      UserRole.ADVERTISER,
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: advertiser.id,
        email: advertiser.authEmail,
        role: advertiser.role,
        name: advertiser.name
      },
      ...session
    });
  } catch (error) {
    console.error('Advertiser login error:', error);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}

export const POST = createApiHandler(handleAdvertiserLogin, {
  rateLimit: 'auth',
  cors: true
});
