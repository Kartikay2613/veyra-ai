"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock3, Compass, GraduationCap, Sparkles, Target, UserRound } from "lucide-react";
import { supabase } from "@/app/lib/supabase-client";
import { useAuth } from "@/app/lib/AuthContext";
import Logo from "@/app/components/Logo";

type Step = { id:string; eyebrow:string; question:string; description:string; options?:string[]; multi?:boolean; placeholder?:string };

const STEPS: Step[] = [
  { id:"goal", eyebrow:"01 · OUTCOME", question:"What do you want to become good at?", description:"Describe the outcome in your own words. The AI uses this as the north star for your entire path.", placeholder:"e.g. Become a production-ready ML engineer and build deployable AI systems" },
  { id:"role", eyebrow:"02 · TARGET ROLE", question:"What role are you aiming for?", description:"Choose the closest target. We will use it to map the skills and prerequisites that matter.", options:["Software Engineer","ML / AI Engineer","Data Scientist","Data Analyst","Product Manager","UX / Product Designer","Cybersecurity Engineer","DevOps / Cloud Engineer","Other"] },
  { id:"experience", eyebrow:"03 · STARTING POINT", question:"Where are you starting from?", description:"Be honest. A shorter path with the right foundations beats skipping prerequisites.", options:["Beginner — building fundamentals","Intermediate — I can build independently","Advanced — I need depth and specialization","Career switcher — strong in another field"] },
  { id:"interests", eyebrow:"04 · INTERESTS", question:"Which areas should your path lean into?", description:"Pick the topics you genuinely want to spend time on. Select as many as relevant.", multi:true, options:["AI / Machine Learning","Web Development","Data & Analytics","Cloud / DevOps","Cybersecurity","Product & Strategy","Design & UX","Research","Open Source","Entrepreneurship"] },
  { id:"skills", eyebrow:"05 · SKILL BASELINE", question:"What do you already know?", description:"List tools, languages, frameworks or concepts you have used. Separate them with commas.", placeholder:"Python, SQL, React, statistics, Git..." },
  { id:"learning", eyebrow:"06 · HOW YOU LEARN", question:"How should the AI teach you?", description:"This changes the balance of courses, projects, practice and explanations.", options:["Hands-on — learn by building","Structured — courses + checkpoints","Fast-track — concise theory + practice","Deep dive — theory + challenging projects"] },
  { id:"time", eyebrow:"07 · YOUR CAPACITY", question:"How much time can you realistically give each week?", description:"Your roadmap adapts its workload to this number.", options:["3–5 hours","6–8 hours","9–12 hours","13–20 hours","20+ hours"] },
  { id:"history", eyebrow:"08 · WHAT YOU'VE DONE", question:"What have you already completed?", description:"Optional. Existing courses, certifications, projects or learning paths help us avoid repeating what you know.", placeholder:"e.g. Andrew Ng ML course, built 2 Python projects, AWS Cloud Practitioner..." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewPath = searchParams.get("new") === "1";
  const { user, refreshProfile } = useAuth();
  const [step,setStep]=useState(0);
  const [values,setValues]=useState<Record<string,string| string[]>>({ interests:[] });
  const [busy,setBusy]=useState(false);
  const [custom,setCustom]=useState("");
  const current=STEPS[step];
  const selected=values[current.id];
  const progress=((step+1)/STEPS.length)*100;

  useEffect(() => {
    // The onboarding flow is account-specific; never expose it to guests.
    if (!user) {
      router.replace("/auth?mode=login&next=/onboarding");
    }
  }, [user, router]);

  useEffect(()=>{
    const currentUser = user;
    if(!currentUser) return;
    (async()=>{
      if (isNewPath) return;
      const {data:goal}=await supabase.from("learning_goals").select("id").eq("user_id",currentUser.id).eq("status","active").order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(!goal) return;
      const {data:path}=await supabase.from("learning_paths").select("id").eq("user_id",currentUser.id).eq("goal_id",goal.id).limit(1).maybeSingle();
      if(path) router.replace("/dashboard");
    })();
  },[user,router,isNewPath]);

  const canContinue = useMemo(()=>{
    if(current.id==="goal"||current.id==="skills"||current.id==="history") return String(selected||"").trim().length>0 || current.id==="history";
    if(current.multi) return Array.isArray(selected) && selected.length>0;
    return Boolean(selected);
  },[current,selected]);

  function choose(option:string){
    if(current.multi){
      const arr=Array.isArray(selected)?selected:[];
      setValues(v=>({...v,[current.id]:arr.includes(option)?arr.filter(x=>x!==option):[...arr,option]}));
    } else setValues(v=>({...v,[current.id]:option}));
  }

  async function finish(){
    if(!user) return router.replace("/auth");
    setBusy(true);
    try{
      const interests=Array.isArray(values.interests)?values.interests:[];
      const weeklyMap:Record<string,number>={"3–5 hours":4,"6–8 hours":7,"9–12 hours":10,"13–20 hours":16,"20+ hours":22};
      const weeklyHours=weeklyMap[String(values.time)]||7;
      const role=String(values.role||"Other");
      const goal=String(values.goal);
      const experience=String(values.experience||"Beginner");
      const skills=String(values.skills||"").split(",").map(x=>x.trim()).filter(Boolean);
      const completed=String(values.history||"").split(",").map(x=>x.trim()).filter(Boolean);
      const learningStyle=String(values.learning||"Hands-on — learn by building");

      const { error: profileErr }=await supabase.from("learner_profiles").upsert({
        user_id:user.id, experience_level:experience, interests, skills,
        learning_styles:[learningStyle], weekly_hours:weeklyHours,
        completed_courses:completed, updated_at:new Date().toISOString()
      },{onConflict:"user_id"});
      if(profileErr) throw profileErr;

      // A deliberate “Create another path” action always creates a new goal.
      // This keeps multiple learning routes independent instead of overwriting the current route.
      const {data:goalRow,error:goalErr}=await supabase.from("learning_goals").insert({
        user_id:user.id,title:goal,description:`Personalized path toward ${role}.`,
        current_level:experience,target_level:"job-ready",status:"active"
      }).select("id").single();
      if(goalErr) throw goalErr;
      const ai=await fetch("/api/build_learning_path",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({goal,role,specialization:"",experience,interests,skills,learningStyle,weeklyHours,completedCourses:completed})});
      const result=await ai.json();
      if(!result.success) throw new Error(result.error||"AI path generation failed");
      const p=result.plan;

      const {data:pathRow,error:pathErr}=await supabase.from("learning_paths").insert({
        user_id:user.id,goal_id:goalRow.id,title:p.pathTitle||`Path to ${role}`,
        description:p.description||"Your adaptive learning roadmap.",estimated_weeks:p.estimatedWeeks||12,
        completion_percentage:0,ai_reasoning:p.reasoning||"Built from your goals, skills and learning preferences."
      }).select("id").single();
      if(pathErr) throw pathErr;

      for(const m of (p.modules||[])){
        const resourceTypeMap:Record<string,string>={course:"course",video:"video",article:"article",book:"book",project:"project",assessment:"assessment",documentation:"documentation"};
        const rawType=String(m.resourceType||"course").toLowerCase().trim();
        const resourceType=resourceTypeMap[rawType]||"course";
        const projectNote=String(m.project||"").trim();
        const assessmentNote=String(m.assessment||"").trim();
        const resourceDescription=[m.reason||m.milestone,projectNote?`Project: ${projectNote}`:"",assessmentNote?`Assessment: ${assessmentNote}`:""].filter(Boolean).join(" ");
        const {data:resRow,error:resErr}=await supabase.from("learning_resources").insert({
          title:m.resourceTitle||m.title,description:resourceDescription,resource_type:resourceType,
          provider:m.provider||"Curated",url:m.url||null,difficulty:m.difficulty||"Intermediate",
          estimated_hours:m.estimatedHours||2,skills:m.skills||[],prerequisites:m.prerequisites||[],rating:null
        }).select("id").single();
        if(resErr) throw resErr;
        const {error:itemErr}=await supabase.from("learning_path_items").insert({
          path_id:pathRow.id,resource_id:resRow.id,sequence:m.sequence||1,milestone:m.milestone,
          reason:m.reason,is_required:true,status:m.sequence===1?"available":"locked",progress:0
        });
        if(itemErr) throw itemErr;
      }

      // Refresh the shared Learning OS auth context after the new path is persisted.
      await refreshProfile();
      router.replace("/dashboard");
    }catch(e){
      console.error(e);
      alert(e instanceof Error?e.message:"Could not create your personalized path.");
    }finally{setBusy(false);}
  }

  function next(){
    if(!canContinue) return;
    if(step===STEPS.length-1) return finish();
    setStep(s=>s+1); setCustom("");
  }

  return <main className="new-ob">
    <aside className="new-ob-side">
      <div><Logo onClick={()=>router.replace("/")}/></div>
      <div className="new-ob-side-copy">
        <span className="premium-kicker"><Sparkles size={13}/> AI PATH BUILDER</span>
        <h1>Build a path that knows <i>you.</i></h1>
        <p>We turn your goal, starting skills, interests and learning behavior into a prerequisite-aware roadmap.</p>
        <div className="ob-proof">
          <div><Target size={17}/><span><b>Goal-first</b><small>Every recommendation works backward from your outcome.</small></span></div>
          <div><Compass size={17}/><span><b>Gap-aware</b><small>We identify what you know before adding what you need.</small></span></div>
          <div><GraduationCap size={17}/><span><b>Adaptive</b><small>Feedback and assessments can change your sequence.</small></span></div>
        </div>
      </div>
      <div className="new-ob-side-foot">Private by design · Your learning profile stays yours</div>
    </aside>

    <section className="new-ob-main">
      <div className="new-ob-top">
        <div className="new-ob-progress"><span style={{width:`${progress}%`}}/></div>
        <div className="new-ob-meta"><span>{current.eyebrow}</span><b>{step+1}<em>/</em>{STEPS.length}</b></div>
      </div>
      <div className="new-ob-card">
        <div className="new-ob-question">
          <h2>{current.question}</h2><p>{current.description}</p>
        </div>

        {(current.id==="goal"||current.id==="skills"||current.id==="history") &&
          <textarea className="new-ob-textarea" autoFocus value={String(selected||"")} onChange={e=>setValues(v=>({...v,[current.id]:e.target.value}))} placeholder={current.placeholder}/>}

        {current.options && <div className={`new-ob-options ${current.multi?"multi":""}`}>
          {current.options.map((o,i)=>{
            const active=current.multi?Array.isArray(selected)&&selected.includes(o):selected===o;
            return <button key={o} type="button" className={active?"selected":""} onClick={()=>choose(o)}>
              <span className="option-index">{String(i+1).padStart(2,"0")}</span><span>{o}</span>{active&&<Check size={17}/>}
            </button>
          })}
        </div>}

        <div className="new-ob-tip"><Clock3 size={14}/> This takes about 2 minutes. Your answers directly shape the roadmap.</div>
      </div>
      <div className="new-ob-footer">
        <button className="ghost-btn" onClick={()=>step?setStep(s=>s-1):router.replace("/")} disabled={busy}><ArrowLeft size={16}/> Back</button>
        <button className="primary-btn" onClick={next} disabled={!canContinue||busy}>{busy?<><span className="spinner"/> Building your path…</>:step===STEPS.length-1?<>Generate my path <Sparkles size={16}/></>:<>Continue <ArrowRight size={16}/></>}</button>
      </div>
      <div className="new-ob-dots">{STEPS.map((_,i)=><span key={i} className={i<step?"done":i===step?"active":""}/>)}</div>
    </section>
  </main>;
}
