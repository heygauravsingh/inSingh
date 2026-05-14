import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  // In a real production app, you should secure this route with a secret key
  // so that only your cron service (like Vercel Cron) can trigger it.

  try {
    // 1. Find all posts that are scheduled for a time in the past and are still "scheduled"
    const now = new Date();
    const pendingPosts = await prisma.post.findMany({
      where: {
        status: "scheduled",
        scheduledTime: {
          lte: now,
        },
      },
      include: {
        user: {
          include: {
            accounts: true, // We need the user's LinkedIn account to get the token
          },
        },
      },
    });

    if (pendingPosts.length === 0) {
      return NextResponse.json({ message: "No posts to publish at this time." });
    }

    const results = [];

    // 2. Loop through each post and publish it to LinkedIn
    for (const post of pendingPosts) {
      const linkedInAccount = post.user.accounts.find(
        (acc) => acc.provider === "linkedin"
      );

      if (!linkedInAccount || !linkedInAccount.access_token) {
        console.error(`User ${post.userId} has no valid LinkedIn account connected.`);
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "failed" },
        });
        results.push({ id: post.id, status: "failed", reason: "No access token" });
        continue;
      }

      // 3. Make the API request to LinkedIn
      try {
        const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${linkedInAccount.access_token}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          body: JSON.stringify({
            author: `urn:li:person:${linkedInAccount.providerAccountId}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                  text: post.content,
                },
                shareMediaCategory: "NONE",
              },
            },
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("LinkedIn API Error:", errorData);
          throw new Error(errorData.message || "Failed to post to LinkedIn");
        }

        // 4. Update the post status to "published"
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "published" },
        });

        results.push({ id: post.id, status: "published" });
      } catch (err) {
        console.error(`Failed to publish post ${post.id}:`, err);
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "failed" },
        });
        results.push({ id: post.id, status: "failed" });
      }
    }

    return NextResponse.json({ message: "Processed scheduled posts", results });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
