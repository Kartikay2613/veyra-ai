"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Today(){ const router=useRouter(); useEffect(()=>router.replace("/dashboard"),[router]); return <div className="learning-shell"><div className="skeleton-page"/></div>; }
