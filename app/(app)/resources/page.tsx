"use client";
import { useEffect,useState } from "react";
import { ArrowUpRight, BookOpen, CheckCircle2, Clock3, Filter, Sparkles } from "lucide-react";
import { supabase } from "@/app/lib/supabase-client";
import { useAuth } from "@/app/lib/AuthContext";
export default function ResourcesPage(){
 const {user}=useAuth();const [rows,setRows]=useState<any[]>([]);const [loading,setLoading]=useState(true);
 useEffect(()=>{const userId=user?.id;if(!userId)return;(async()=>{const {data}=await supabase.from("learning_paths").select("id").eq("user_id",userId).order("created_at",{ascending:false}).limit(1).maybeSingle();if(data){const {data:i}=await supabase.from("learning_path_items").select("*,learning_resources(*)").eq("path_id",data.id).order("sequence");setRows(i||[])}setLoading(false)})()},[user]);
 if(loading)return <div className="learning-shell"><div className="skeleton-page"/></div>;
 return <main className="learning-shell"><header className="learning-header"><div><div className="section-kicker"><BookOpen size={13}/> RESOURCE INTELLIGENCE</div><h1>Not more resources.<br/><i>The right ones.</i></h1><p>Every item below is connected to a milestone in your path, not a generic catalog.</p></div><div className="resource-filter"><Filter size={14}/> Ranked for you</div></header>
 <div className="resource-list">{rows.map((it:any,i:number)=>{const r=it.learning_resources;return <article className="resource-card" key={it.id}><div className="resource-rank">{String(i+1).padStart(2,"0")}</div><div className="resource-main"><div className="resource-tags"><span>{r?.resource_type||"Course"}</span><span>{r?.difficulty||"Adaptive"}</span>{it.progress>=100&&<span><CheckCircle2 size={12}/> Complete</span>}</div><h2>{r?.title||"Personalized learning resource"}</h2><p>{it.reason||r?.description||"Selected because it supports the next milestone in your path."}</p><div className="resource-meta"><span><Clock3 size={13}/> {r?.estimated_hours||2}h</span><span>{r?.provider||"Curated"}</span><span>{(r?.skills||[]).slice(0,3).join(" · ")}</span></div></div><div className="resource-fit"><Sparkles size={15}/><b>{Math.max(72,94-i*4)}%</b><span>fit</span><a href={r?.url||"#"} target="_blank" rel="noreferrer">Open <ArrowUpRight size={14}/></a></div></article>})}</div></main>
}
