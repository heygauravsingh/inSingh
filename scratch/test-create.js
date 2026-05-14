const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreate() {
  try {
    const post = await prisma.post.create({
      data: {
        content: "Test post with image",
        scheduledTime: new Date(Date.now() + 86400000), // 1 day in future
        status: "scheduled",
        userId: "cmp5bi9ig0000a6pc6txmqqe3", // From the sqlite output
        imageUrl: "/uploads/test.png"
      }
    });
    console.log("Post created:", post);
  } catch (e) {
    console.error("Create failed:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCreate();
