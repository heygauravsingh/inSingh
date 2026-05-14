const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testQuota() {
  const genAI = new GoogleGenerativeAI("AIzaSyDOuCgQD8XUuWgWL4_3CTmQijPsWBpuDzc");
  const models = ["gemini-flash-latest", "gemini-pro-latest", "gemini-1.5-flash-8b-latest"];
  
  for (const m of models) {
    try {
      console.log(`Testing ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("hi");
      console.log(`Success with ${m}!`);
      return m;
    } catch (e) {
      console.log(`Error with ${m}: ${e.message}`);
    }
  }
}

testQuota();
