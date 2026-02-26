import { NextRequest, NextResponse } from "next/server";
import { railwayFetch } from "@/lib/api/railway";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await railwayFetch("/api/clocks/templates");
    const data = await res.json();
    const template = (data.templates || []).find((t: any) => t.id === id);
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ template });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch clock template" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const res = await railwayFetch(`/api/clocks/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update clock template" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const res = await railwayFetch(`/api/clocks/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update clock template" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await railwayFetch(`/api/clocks/templates/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete clock template" }, { status: 500 });
  }
}
