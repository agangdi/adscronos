import { NextResponse } from 'next/server';
import { getMockAnalyticsData } from '@/lib/mock-advertiser-data';

// Get analytics for advertiser
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    // Limit to 90 days max
    const maxDays = Math.min(days, 90);
    
    // Get mock analytics data
    const analyticsData = getMockAnalyticsData(maxDays);

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
