import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  welcomeEmail,
  quickStartEmail,
  checkInEmail,
  launchTipsEmail,
} from "@/lib/emails/onboarding-sequence";

export const dynamic = "force-dynamic";

const EMAIL_STEPS = [welcomeEmail, quickStartEmail, checkInEmail, launchTipsEmail];

export async function POST(request: NextRequest) {
  try {
    const { email, step, stationName } = await request.json();

    if (!email || step === undefined || !stationName) {
      return NextResponse.json(
        { error: "email, step (0-3), and stationName are required" },
        { status: 400 }
      );
    }

    const stepNum = Number(step);
    if (stepNum < 0 || stepNum > 3 || !Number.isInteger(stepNum)) {
      return NextResponse.json(
        { error: "step must be 0, 1, 2, or 3" },
        { status: 400 }
      );
    }

    const generator = EMAIL_STEPS[stepNum];
    const { subject, html } = generator(stationName);

    logger.info("Onboarding email generated", { email, step: stepNum, stationName });

    return NextResponse.json({
      email,
      step: stepNum,
      stationName,
      subject,
      html,
    });
  } catch (error) {
    logger.error("Failed to generate onboarding email", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to generate onboarding email" },
      { status: 500 }
    );
  }
}
