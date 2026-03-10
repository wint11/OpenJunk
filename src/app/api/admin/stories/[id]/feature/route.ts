import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST - 设置/取消精选
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { feature } = await request.json();

    const story = await prisma.story.update({
      where: { id },
      data: {
        isFeatured: feature,
        featuredAt: feature ? new Date() : null,
      },
    });

    return NextResponse.json({ story });
  } catch (error) {
    console.error("Failed to feature story:", error);
    return NextResponse.json(
      { error: "Failed to feature story" },
      { status: 500 }
    );
  }
}
