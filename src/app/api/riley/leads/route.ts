import { NextRequest, NextResponse } from "next/server";

// In production, these would come from database
// For now, using in-memory storage for demonstration
let leads = [
  {
    id: 1,
    name: "Sarah Martinez",
    genre: "Indie Folk",
    location: "Burlington, VT",
    source: "instagram",
    socialHandle: "@sarahmartinezmusic",
    email: "sarah@example.com",
    followers: 2400,
    lastShow: "The Higher Ground - Jan 15",
    status: "new",
    notes: "Strong engagement on recent posts. Has upcoming show at Nectar's.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "The Wanderers",
    genre: "Americana",
    location: "Montpelier, VT",
    source: "venue",
    email: "band@thewanderers.com",
    phone: "(802) 555-0123",
    website: "thewanderers.com",
    lastShow: "Langdon Street Cafe - Jan 10",
    status: "contacted",
    firstContact: "Jan 18, 2024",
    lastContact: "Jan 18, 2024",
    nextFollowUp: "Jan 25, 2024",
    notes: "Sent initial outreach email. Waiting for response.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /api/riley/leads - Get all leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const search = searchParams.get("search");

    let filteredLeads = [...leads];

    // Filter by status
    if (status && status !== "all") {
      filteredLeads = filteredLeads.filter((lead) => lead.status === status);
    }

    // Filter by source
    if (source && source !== "all") {
      filteredLeads = filteredLeads.filter((lead) => lead.source === source);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLeads = filteredLeads.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchLower) ||
          lead.genre.toLowerCase().includes(searchLower) ||
          lead.location.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredLeads,
      count: filteredLeads.length,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

// POST /api/riley/leads - Create new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.genre || !body.location || !body.source) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new lead
    const newLead = {
      id: leads.length + 1,
      name: body.name,
      genre: body.genre,
      location: body.location,
      source: body.source,
      socialHandle: body.socialHandle,
      email: body.email,
      phone: body.phone,
      website: body.website,
      followers: body.followers,
      lastShow: body.lastShow,
      status: "new",
      notes: body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leads.push(newLead);

    return NextResponse.json({
      success: true,
      data: newLead,
      message: "Lead created successfully",
    });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create lead" },
      { status: 500 }
    );
  }
}

// PUT /api/riley/leads - Update lead
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Lead ID is required" },
        { status: 400 }
      );
    }

    const leadIndex = leads.findIndex((lead) => lead.id === body.id);

    if (leadIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // Update lead
    leads[leadIndex] = {
      ...leads[leadIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: leads[leadIndex],
      message: "Lead updated successfully",
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

// DELETE /api/riley/leads - Delete lead
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Lead ID is required" },
        { status: 400 }
      );
    }

    const leadIndex = leads.findIndex((lead) => lead.id === parseInt(id));

    if (leadIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    leads.splice(leadIndex, 1);

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
