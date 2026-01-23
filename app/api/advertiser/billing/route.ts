import { NextResponse } from 'next/server';
import { getMockBillingData } from '@/lib/mock-advertiser-data';

// Get billing information for advertiser
export async function GET() {
  try {
    // Get mock billing data
    const billingData = getMockBillingData();

    return NextResponse.json(billingData);
  } catch (error) {
    console.error("Billing GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
