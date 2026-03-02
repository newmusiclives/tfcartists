import { NextRequest, NextResponse } from "next/server";
import { railwayFetch } from "@/lib/api/railway";
import { requireAdmin } from "@/lib/api/auth";
import { unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorized();
    const { id } = await params;
    const res = await railwayFetch("/api/clocks/templates");
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return NextResponse.json({ error: errBody || "Railway API error" }, { status: res.status });
    }
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
    const session = await requireAdmin();
    if (!session) return unauthorized();
    const { id } = await params;
    const body = await request.json();
    const res = await railwayFetch(`/api/clocks/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update clock template" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorized();
    const { id } = await params;
    const body = await request.json();
    const res = await railwayFetch(`/api/clocks/templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update clock template" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorized();
    const { id } = await params;
    const res = await railwayFetch(`/api/clocks/templates/${id}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete clock template" }, { status: 500 });
  }
}
