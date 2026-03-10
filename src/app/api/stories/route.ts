import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - 获取故事列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "APPROVED";
    const featured = searchParams.get("featured") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (featured) {
      where.isFeatured = true;
    }

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        orderBy: featured 
          ? { featuredAt: "desc" }
          : { createdAt: "desc" },
        skip,
        take: limit,
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
        },
      }),
      prisma.story.count({ where }),
    ]);

    return NextResponse.json({
      stories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}

// POST - 提交新故事
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, authorName, authorEmail } = body;

    // 验证必填字段
    if (!title || !content || !category || !authorName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 验证栏目
    const validCategories = ["TRACE", "CROSS", "LIGHT", "UNFINISHED"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // 创建故事
    const story = await prisma.story.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category,
        authorName: authorName.trim(),
        authorEmail: authorEmail?.trim() || null,
        status: "PENDING", // 默认待审阅
        likes: 0,
        views: 0,
      },
    });

    return NextResponse.json({
      success: true,
      story: {
        id: story.id,
        title: story.title,
        status: story.status,
      },
    });
  } catch (error) {
    console.error("Failed to create story:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    );
  }
}
