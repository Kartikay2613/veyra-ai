"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BrainCircuit, CheckCircle2, ChevronRight, Clock3, GitBranch, LineChart, Moon, Settings, Sparkles, Sun, Target, TrendingUp, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase-client";
import { useAuth } from "@/app/lib/AuthContext";

type Path = { id:string; title:string; description:string; estimated_weeks:number; completion_percentage:number; ai_reasoning:string; created_at?:string };
type Item = { id:string; sequence:number; milestone:string; reason:string; status:string; progress:number; resource?:any };

function levelFor(xp:number){
  const thresholds=[0,50,150,350,700,1200,2000,3000,4500,6000];
  let level=1;
  thresholds.forEach((t,i)=>{ if(xp>=t) level=i+1; });
  const current=thresholds[Math.min(level-1, thresholds.length-1)];
  const next=thresholds[Math.min(level, thresholds.length-1)];
  return { level, pct: next>current ? Math.min(100,Math.round(((xp-current)/(next-current))*100)) : 100, nextXp: Math.max(0,next-xp) };
}

export default function Dashboard(){
  const { user, profile: accountProfile, theme, setTheme } = useAuth();
  const [path,setPath]=useState<Path|null>(null);
  const [paths,setPaths]=useState<Path[]>([]);
  const [items,setItems]=useState<Item[]>([]);
  const [profile,setProfile]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [themeSaving,setThemeSaving]=useState(false);

  useEffect(() => {
    let cancelled=false;
    const userId = user?.id;
    async function loadDashboard(){
      if(!userId){setLoading(false);return;}
      setLoading(true);
      try{
        const [profileResult,pathResult]=await Promise.all([
          supabase.from("learner_profiles").select("*").eq("user_id",userId).maybeSingle(),
          supabase.from("learning_paths").select("*").eq("user_id",userId).order("created_at",{ascending:false}).limit(12),
        ]);
        if(cancelled)return;
        const allPaths=(pathResult.data??[]) as Path[];
        const selected=allPaths[0]??null;
        setProfile(profileResult.data??null); setPaths(allPaths); setPath(selected);
        if(!selected){setItems([]);return;}
        const {data:pathItems,error}=await supabase.from("learning_path_items").select("id,sequence,milestone,reason,status,progress,resource_id,learning_resources(*)").eq("path_id",selected.id).order("sequence");
        if(error) console.error("Dashboard path items:",error);
        if(!cancelled)setItems((pathItems??[]).map((item:any)=>({...item,resource:item.learning_resources})));
      }catch(error){console.error("Dashboard loading:",error)}finally{if(!cancelled)setLoading(false)}
    }
    void loadDashboard();
    return()=>{cancelled=true};
  },[user]);

  const xp=accountProfile?.total_xp??0;
  const level=useMemo(()=>levelFor(xp),[xp]);
  const completed=items.filter(x=>x.progress>=100||x.status==="completed").length;
  const pct=path?.completion_percentage??(items.length?Math.round(completed/items.length*100):0);
  const next=items.find(x=>x.status==="available"||x.status==="in_progress")||items.find(x=>x.progress<100);

  async function changeTheme(nextTheme:"light"|"dark"){
    if(themeSaving||nextTheme===theme)return;
    setThemeSaving(true);
    try{await setTheme(nextTheme)}finally{setThemeSaving(false)}
  }

  if(loading)return <main className="learning-shell"><div className="dashboard-loading-v2"><div className="loading-orb"/><p>Opening your personalized command center…</p></div></main>;

  return <main className="learning-shell dashboard-v2">
    <header className="learning-header dashboard-header-v2">
      <div>
        <div className="section-kicker"><Sparkles size={13}/> PERSONALIZED COMMAND CENTER</div>
        <h1>Your path, <i>not a playlist.</i></h1>
        <p>One place for your learning routes, progress, AI recommendations, XP and account controls.</p>
      </div>
      <div className="dashboard-head-actions"><Link className="outline-action" href="/path">Open current path <ArrowRight size={15}/></Link><Link className="dashboard-settings-link" href="/settings"><Settings size={14}/> Account settings</Link></div>
    </header>

    <section className="dashboard-top-grid-v2">
      <div className="command-hero">
        <div className="hero-label"><span>✦ CURRENT LEARNING PATH</span><b>{path?.estimated_weeks||"—"}{path?" WEEKS":""}</b></div>
        <h2>{path?.title||"Build your personalized learning path"}</h2>
        <p>{path?.description||"Tell Veyra your target, starting skills, interests and available time. Your AI roadmap will be generated from that profile."}</p>
        {path ? <><div className="big-progress"><span style={{width:`${pct}%`}}/></div><div className="big-progress-meta"><span>{pct}% complete</span><span>{completed} of {items.length} milestones</span></div><div className="command-actions"><Link href={`/path/${path.id}`} className="primary-btn">Continue path <ArrowRight size={16}/></Link><Link href="/assessment" className="ghost-btn">Calibrate with AI <LineChart size={15}/></Link></div></> : <div className="command-actions"><Link href="/onboarding" className="primary-btn">Build my path <ArrowRight size={16}/></Link><Link href="/settings" className="ghost-btn">Account settings</Link></div>}
      </div>

      <aside className="signal-card dashboard-next-card"><div className="signal-head"><span><BrainCircuit size={16}/> AI SIGNAL</span><small>{next?"NEXT BEST ACTION":"READY"}</small></div><h3>{next?.resource?.title||"Your next best action"}</h3><p>{next?.reason||path?.ai_reasoning||"Your path is built around your target, starting point and learning preferences."}</p><div className="signal-meta"><span><Clock3 size={13}/> {next?.resource?.estimated_hours||2}h</span><span>{next?.resource?.difficulty||"Adaptive"}</span></div><Link href={next?`/path/${path?.id}`:"/onboarding"}>{next?"Continue learning":"Create your first path"} <ChevronRight size={14}/></Link></aside>
    </section>

    <section className="dashboard-account-panel">
      <div className="dashboard-account-copy"><div className="section-kicker"><Settings size={13}/> WORKSPACE CONTROL</div><h2>Everything you need after login.</h2><p>Change your appearance, manage your profile, review your XP and jump directly into any learning route.</p><div className="dashboard-account-links"><Link href="/settings">Full account settings <ArrowRight size={13}/></Link><Link href="/coach">Open AI coach <ArrowRight size={13}/></Link><Link href="/leaderboard">View XP leaderboard <Trophy size={13}/></Link></div></div>
      <div className="dashboard-theme-control"><span>APPEARANCE</span><div className="dashboard-theme-buttons"><button className={theme==="dark"?"active":""} onClick={()=>void changeTheme("dark")} disabled={themeSaving}><Moon size={15}/> Dark</button><button className={theme==="light"?"active":""} onClick={()=>void changeTheme("light")} disabled={themeSaving}><Sun size={15}/> Light</button></div><small>Saved to your Veyra account and restored on your next login.</small></div>
      <div className="dashboard-xp-panel"><div className="xp-panel-head"><div><span>VEYRA XP</span><strong>{xp.toLocaleString()} XP</strong></div><div className="xp-level-badge">LV {level.level}</div></div><div className="xp-track"><i style={{width:`${level.pct}%`}}/></div><div className="xp-panel-meta"><span>{level.nextXp ? `${level.nextXp} XP to next level` : "Maximum level reached"}</span><Link href="/leaderboard">See progress <ArrowRight size={12}/></Link></div></div>
    </section>

    <section className="insight-row">
      <div className="insight-card"><div className="insight-icon"><Target/></div><div><small>LEARNER</small><strong>{accountProfile?.name||"Learner"}</strong><p>{profile?.experience_level||"Starting point mapped"}</p></div></div>
      <div className="insight-card"><div className="insight-icon"><TrendingUp/></div><div><small>LEARNING CAPACITY</small><strong>{profile?.weekly_hours||7} hrs / week</strong><p>Workload calibrated to you</p></div></div>
      <div className="insight-card"><div className="insight-icon"><Zap/></div><div><small>XP LEVEL</small><strong>Level {level.level}</strong><p>{xp.toLocaleString()} total XP</p></div></div>
      <div className="insight-card"><div className="insight-icon"><CheckCircle2/></div><div><small>MILESTONES</small><strong>{completed}/{items.length||0}</strong><p>Completed in current path</p></div></div>
    </section>

    <section className="dashboard-path-library">
      <div className="lower-head"><div><div className="section-kicker"><GitBranch size={13}/> YOUR LEARNING OS</div><h2>Every goal gets its own route.</h2><p className="dashboard-section-sub">Create multiple paths and open each course in its own focused dashboard.</p></div><Link href="/onboarding?new=1" className="primary-btn">Create another path <ArrowRight size={14}/></Link></div>
      {paths.length ? <div className="dashboard-path-grid">{paths.map(p=><Link href={`/path/${p.id}`} className={`dashboard-path-card ${p.id===path?.id?"active":""}`} key={p.id}><span>{p.id===path?.id?"ACTIVE PATH":"LEARNING PATH"}</span><h3>{p.title}</h3><p>{p.description||"Personalized route built around your target and evidence."}</p><div><b>{p.completion_percentage||0}%</b><small>{p.estimated_weeks||"—"} weeks · Open course dashboard <ArrowRight size={12}/></small></div></Link>)}</div> : <div className="dashboard-empty-paths"><Sparkles size={18}/><div><b>Your first path starts here.</b><p>Use onboarding to generate a personalized course with milestones, projects, resources and adaptive checkpoints.</p></div><Link href="/onboarding">Start building <ArrowRight size={14}/></Link></div>}
    </section>

    <section className="dashboard-lower">
      <div className="lower-main"><div className="lower-head"><div><div className="section-kicker">ROADMAP PREVIEW</div><h2>The next 3 moves</h2></div><Link href={path?`/path/${path.id}`:"/onboarding"}>See all <ArrowRight size={14}/></Link></div><div className="preview-list">{items.slice(0,3).map((it,i)=><div className={`preview-item ${i===0?"current":""}`} key={it.id}><span className="preview-num">{String(it.sequence).padStart(2,"0")}</span><div><small>{it.milestone||"MILESTONE"}</small><b>{it.resource?.title||`Learning milestone ${it.sequence}`}</b><p>{it.reason||"Prerequisite-aware step in your personalized sequence."}</p></div><span className="preview-status">{it.progress>=100?"✓":i===0?"NEXT":"LOCKED"}</span></div>)}</div></div>
      <div className="ai-insight"><Sparkles size={17}/><small>WHY YOUR PATH LOOKS LIKE THIS</small><p>{path?.ai_reasoning||"Your AI path combines your target outcome, experience, interests, current skills and learning preferences."}</p><Link href="/coach">Ask Veyra AI <ArrowRight size={14}/></Link></div>
    </section>
  </main>
}
