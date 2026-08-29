import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { requireUser } from "@/app/lib/requireUser";

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY;
  return apiKey ? new Groq({ apiKey }) : null;
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (!user) {
    return NextResponse.json({ success: false, error: authError?.message || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { goal, role, specialization, experience, interests, skills, learningStyle, weeklyHours, completedCourses } = body;

    if (!goal || !role) {
      return NextResponse.json({ success: false, error: "Goal and role are required." }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY_1 && !process.env.GROQ_API_KEY) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY_1 (or GROQ_API_KEY) is not configured." }, { status: 500 });
    }

    const prompt = `Create a personalized learning roadmap.
Learner goal: ${goal}
Target role: ${role}
Specialization: ${specialization || "not specified"}
Experience: ${experience || "beginner"}
Interests: ${JSON.stringify(interests || [])}
Current skills: ${JSON.stringify(skills || [])}
Learning style: ${learningStyle || "hands-on"}
Weekly hours: ${weeklyHours || 7}
Completed courses: ${JSON.stringify(completedCourses || [])}

Return ONLY JSON:
{
 "pathTitle": "short outcome-focused title",
 "description": "one sentence",
 "estimatedWeeks": number,
 "reasoning": "2-3 sentences explaining personalization",
 "skillGaps": [{"skill":"string","current":number,"target":number,"reason":"string"}],
 "modules": [
   {
     "sequence": number,
     "title": "module title",
     "milestone": "milestone",
     "reason": "why this is here for this learner",
     "difficulty": "Beginner|Intermediate|Advanced",
     "estimatedHours": number,
     "skills": ["skill"],
     "prerequisites": ["skill"],
     "resourceTitle": "resource title",
     "resourceType": "Course|Project|Assessment|Article",
     "provider": "provider",
     "url": "https://example.com",
     "project": "one practical project or empty string",
     "assessment": "one assessment/checkpoint"
   }
 ],
 "firstAction": "specific action for today"
}
Create 6-8 modules in prerequisite order. Make them specific to the role and learner, not generic career advice.
Ensure the roadmap contains at least 2 hands-on project modules and at least 1 assessment/checkpoint. Use resourceType values from exactly: Course, Video, Article, Book, Project, Assessment, Documentation. Do not invent other resource types.`;

    const groq = getGroqClient();
    if (!groq) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY_1 (or GROQ_API_KEY) is not configured." }, { status: 500 });
    }

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      temperature: 0.55,
      max_completion_tokens: 5000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an expert adaptive learning architect. Build practical, prerequisite-aware learning paths." },
        { role: "user", content: prompt }
      ]
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const plan = JSON.parse(content);
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
