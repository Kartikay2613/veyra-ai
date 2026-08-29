// test-groq.mjs — standalone test, run with: npx tsx test-groq.mjs
import { config } from "dotenv";
config({ path: ".env.local" });

const { generateSprintTasks } = await import("./app/api/utils.ts");

const result = await generateSprintTasks({
  goalTitle: "Become a Product Designer at a startup",
  totalDays: 7,
  selections: { experience: "entry-level", time: "30 min/day" },
});

console.log("\n\n--- FINAL RESULT ---");
console.log(JSON.stringify(result, null, 2));