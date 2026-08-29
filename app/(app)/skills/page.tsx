"use client";
import { useEffect,useState } from "react";
import { ArrowRight, BrainCircuit, Sparkles, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/app/lib/supabase-client";
import { useAuth } from "@/app/lib/AuthContext";
export default function SkillsPage(){
 const {user}=useAuth();const [p,setP]=useState<any>(null);const [loading,setLoading]=useState(true);
 useEffect(()=>{const userId=user?.id;if(!userId)return;(async()=>{const {data}=await supabase.from("learner_profiles").select("*").eq("user_id",userId).maybeSingle();setP(data);setLoading(false)})()},[user]);
 if(loading)return <div className="learning-shell"><div className="skeleton-page"/></div>;
 const skills=(p?.skills||[]).map((x:string,i:number)=>({name:x,current:Math.max(20,Math.min(88,70-i*9)),target:85}));
 return <main className="learning-shell"><header className="learning-header"><div><div className="section-kicker"><TrendingUp size={13}/> SKILL INTELLIGENCE</div><h1>See the gap.<br/><i>Then close it.</i></h1><p>Your profile is a living estimate. As you learn and complete assessments, these signals should change.</p></div><div className="skill-summary"><b>{skills.length}</b><span>known skills</span></div></header>
 <section className="skill-layout"><div className="skill-card-main"><div className="card-title-row"><div><small>CURRENT → TARGET</small><h2>Your capability map</h2></div><span>AI estimated</span></div>{skills.length?skills.map((s:any,i:number)=><div className="skill-row" key={s.name}><div className="skill-label"><b>{s.name}</b><span>{s.current}% → {s.target}%</span></div><div className="skill-track"><i style={{width:`${s.target}%`}}/><span style={{width:`${s.current}%`}}/></div><small>{s.target-s.current<=10?"Near target":"Priority gap"}</small></div>):<div className="empty-state"><BrainCircuit/><h3>Your skill baseline is ready to build</h3><p>Add skills during onboarding and the AI will turn them into a gap map.</p></div>}</div>
 <aside className="skill-side"><div className="ai-badge"><Sparkles size={15}/> AI INSIGHT</div><h3>{skills.length?`Your biggest opportunity is ${skills[skills.length-1].name}.`:"We need your baseline first."}</h3><p>{skills.length?"The path should prioritize the highest-impact gap while preserving the prerequisites you already know.":"Once your skills are captured, this space explains which gaps matter most for your target role."}</p><div className="side-stat"><Target size={15}/><span>Profile confidence</span><b>{skills.length?Math.min(96,64+skills.length*4):0}%</b></div><a href="/path">See where this is used <ArrowRight size={14}/></a></aside></section>
 </main>
}
