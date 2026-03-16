"use client";
import { useState } from "react";

const DAILY = [
  { id:1, icon:"⚽", title:"Score 5 Goals",       reward:150, rewardType:"🪙", progress:3, target:5 },
  { id:2, icon:"🏆", title:"Win 2 Matches",  reward:200, rewardType:"🪙", progress:2, target:2 },
  { id:3, icon:"💨", title:"Run 100m",           reward:50,  rewardType:"🪙", progress:40,target:100 },
];
const WEEKLY = [
  { id:4, icon:"🎯", title:"Score 30 Goals",        reward:5,   rewardType:"💎", progress:12,target:30 },
  { id:5, icon:"👑", title:"Win 10 Matches",   reward:800, rewardType:"🪙", progress:4, target:10 },
  { id:6, icon:"🔥", title:"3 Wins In a Row",    reward:3,   rewardType:"💎", progress:1, target:3 },
];

export default function MissionsPage({ onBack, player }: { onBack:()=>void; player:any }) {
  const [tab, setTab] = useState<"daily"|"weekly">("daily");
  const missions = tab==="daily"?DAILY:WEEKLY;
  return (
    <div style={{position:"fixed",inset:0,paddingBottom:64,display:"flex",flexDirection:"column",background:"#0d0b1e"}}>
      <div style={{padding:"14px 16px 10px",background:"linear-gradient(180deg,rgba(108,63,255,0.2),transparent)",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <span style={{fontSize:24}}>📋</span>
          <span style={{fontSize:20,fontWeight:900,color:"#fff"}}>Missions</span>
        </div>
        <div style={{display:"flex",gap:8,background:"rgba(255,255,255,0.06)",borderRadius:12,padding:4}}>
          {(["daily","weekly"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px 0",borderRadius:9,border:"none",cursor:"pointer",fontWeight:800,fontSize:13,background:tab===t?"linear-gradient(135deg,#6c3fff,#8b5fff)":"transparent",color:tab===t?"#fff":"rgba(255,255,255,0.45)"}}>
              {t==="daily"?"☀️ Daily":"📅 Weekly"}
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"8px 16px",display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:12}}>⏰</span>
        <span style={{fontSize:12,color:"rgba(255,255,255,0.45)",fontWeight:700}}>{tab==="daily"?"Resets in: 06:42:15":"Resets in: 3h 22m"}</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 16px",display:"flex",flexDirection:"column",gap:10}}>
        {missions.map(m=>{
          const pct=Math.min(100,(m.progress/m.target)*100);
          const done=m.progress>=m.target;
          return (
            <div key={m.id} style={{background:done?"rgba(34,197,94,0.08)":"rgba(255,255,255,0.05)",border:`1px solid ${done?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:14,padding:14}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:44,height:44,borderRadius:12,background:done?"rgba(34,197,94,0.2)":"rgba(108,63,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{m.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800,color:done?"#86efac":"#fff",marginBottom:4}}>{m.title}</div>
                  <div style={{height:6,background:"rgba(255,255,255,0.1)",borderRadius:6,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:done?"linear-gradient(90deg,#22c55e,#86efac)":"linear-gradient(90deg,#6c3fff,#a78bfa)",borderRadius:6}}/>
                  </div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:3,fontWeight:700}}>{m.progress}/{m.target}</div>
                </div>
                <button style={{padding:"8px 14px",borderRadius:10,border:"none",cursor:done?"pointer":"default",fontWeight:800,fontSize:13,background:done?"linear-gradient(135deg,#f59e0b,#ffd700)":"rgba(255,255,255,0.06)",color:done?"#1a0a00":"rgba(255,255,255,0.25)",opacity:done?1:0.6,flexShrink:0}}>
                  {done?`${m.reward}${m.rewardType}`:"Claim"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
