import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { newToken } from "@/lib/ids";
import { advertiserSchema } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = advertiserSchema.parse(payload);
    const advertiser = await prisma.advertiser.create({
      data: {
        ...parsed,
        apiKey: newToken("adv"),
      },
    });

    return NextResponse.json(
      {
        advertiser,
        message: "Advertiser created. Use apiKey for authenticated calls.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("advertiser POST error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
