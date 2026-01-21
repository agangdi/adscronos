import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { createApiHandler } from '@/lib/middleware';

async function handlePublisherLogin(request: NextRequest): Promise<NextResponse> {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { authEmail, password } = await request.json();

    if (!authEmail || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Authenticate publisher
    const publisher = await AuthService.authenticatePublisher(authEmail, password);

    // Create session with publisher role
    const session = await AuthService.createSession(
      publisher.id,
      UserRole.PUBLISHER,
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: publisher.id,
        email: publisher.authEmail,
        role: publisher.role,
        siteName: publisher.siteName
      },
      ...session
    });
  } catch (error) {
    console.error('Publisher login error:', error);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}

export const POST = createApiHandler(handlePublisherLogin, {
  rateLimit: 'auth',
  cors: true
});
