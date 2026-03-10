import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - 获取单个故事
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const story = await prisma.story.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        authorName: true,
        likes: true,
        views: true,
        isFeatured: true,
        createdAt: true,
        status: true,
      },
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // 只返回已批准的故事
    if (story.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Story not available" },
        { status: 403 }
      );
    }

    return NextResponse.json({ story });
  } catch (error) {
    console.error("Failed to fetch story:", error);
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    );
  }
}
