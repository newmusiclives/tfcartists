import { NextRequest, NextResponse } from "next/server";

// In production, these would come from database
let communications = [
  {
    id: 1,
    leadId: 2,
    type: "email",
    subject: "TrueFans RADIO - Get FREE Airplay",
    content: "Initial outreach email...",
    status: "sent",
    sentAt: "2024-01-18T10:00:00Z",
    openedAt: null,
    respondedAt: null,
    createdAt: new Date().toISOString(),
  },
];

// GET /api/riley/communications - Get all communications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");

    let filteredCommunications = [...communications];

    // Filter by lead ID
    if (leadId) {
      filteredCommunications = filteredCommunications.filter(
        (comm) => comm.leadId === parseInt(leadId)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredCommunications,
      count: filteredCommunications.length,
    });
  } catch (error) {
    console.error("Error fetching communications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch communications" },
      { status: 500 }
    );
  }
}

// POST /api/riley/communications - Log new communication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.leadId || !body.type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new communication record
    const newCommunication = {
      id: communications.length + 1,
      leadId: body.leadId,
      type: body.type, // email, phone, sms, social
      subject: body.subject,
      content: body.content,
      status: body.status || "sent",
      sentAt: new Date().toISOString(),
      openedAt: body.openedAt || null,
      respondedAt: body.respondedAt || null,
      createdAt: new Date().toISOString(),
    };

    communications.push(newCommunication);

    return NextResponse.json({
      success: true,
      data: newCommunication,
      message: "Communication logged successfully",
    });
  } catch (error) {
    console.error("Error logging communication:", error);
    return NextResponse.json(
      { success: false, error: "Failed to log communication" },
      { status: 500 }
    );
  }
}

// PUT /api/riley/communications - Update communication status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Communication ID is required" },
        { status: 400 }
      );
    }

    const commIndex = communications.findIndex((comm) => comm.id === body.id);

    if (commIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Communication not found" },
        { status: 404 }
      );
    }

    // Update communication
    communications[commIndex] = {
      ...communications[commIndex],
      ...body,
    };

    return NextResponse.json({
      success: true,
      data: communications[commIndex],
      message: "Communication updated successfully",
    });
  } catch (error) {
    console.error("Error updating communication:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update communication" },
      { status: 500 }
    );
  }
}
