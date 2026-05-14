import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, scheduledTime, imageUrl } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // @ts-ignore
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: "User ID missing from session" }, { status: 401 });
    }

    let finalScheduledTime = scheduledTime ? new Date(scheduledTime) : new Date();
    if (isNaN(finalScheduledTime.getTime())) {
      finalScheduledTime = new Date();
    }

    const postData = {
      content,
      scheduledTime: finalScheduledTime,
      userId: userId,
      status: scheduledTime ? "scheduled" : "draft",
      imageUrl: imageUrl || null,
    };

    console.log("Prisma Create Attempt:", postData);

    const post = await prisma.post.create({
      data: postData,
    });

    console.log("Post created successfully:", post.id);

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("Error creating post:", error);
    let errorMessage = error.message || "Internal Server Error";
    if (error.code) errorMessage = `Prisma Error ${error.code}: ${errorMessage}`;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;

    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { scheduledTime: 'asc' },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
