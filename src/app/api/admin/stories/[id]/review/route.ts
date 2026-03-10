import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST - 审阅故事
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
    const { action, reviewNote } = await request.json();

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const story = await prisma.story.update({
      where: { id },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        reviewNote: reviewNote || null,
        reviewedBy: session.user?.name || session.user?.email,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ story });
  } catch (error) {
    console.error("Failed to review story:", error);
    return NextResponse.json(
      { error: "Failed to review story" },
      { status: 500 }
    );
  }
}
