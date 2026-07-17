import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return NextResponse.json({
    id,
    averageBpm: 132,
    averageEnergy: 0.78,
    averageValence: 0.69,
    genres: ["pop", "dance", "ambient"],
  });
}
