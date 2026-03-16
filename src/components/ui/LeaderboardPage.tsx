"use client";
import { useState } from "react";

const LEADERS = [
  {rank:1,name:"DragonSlayer",rating:2840,wins:142,country:"🇧🇷",pfp:"🐉"},
  {rank:2,name:"NinjaKicker",  rating:2720,wins:128,country:"🇯🇵",pfp:"🥷"},
  {rank:3,name:"PharaohGoal",  rating:2650,wins:115,country:"🇪🇬",pfp:"👑"},
  {rank:4,name:"VikingStrike", rating:2480,wins:98, country:"🇳🇴",pfp:"⚔️"},
  {rank:5,name:"CyBorgFC",     rating:2310,wins:87, country:"🇩🇪",pfp:"🤖"},
  {rank:6,name:"TurboBoost",   rating:2200,wins:76, country:"🇫🇷",pfp:"⚡"},
  {rank:7,name:"FreezeKing",   rating:2100,wins:65, country:"🇦🇷",pfp:"❄️"},
  {rank:8,name:"TornadoShot",  rating:1980,wins:59, country:"🇲🇽",pfp:"🌪️"},
  {rank:9,name:"GoalsdenBoot",   rating:1850,wins:52, country:"🇪🇸",pfp:"🥇"},
  {rank:10,name:"Player1",     rating:1024,wins:12, country:"🇮🇩",pfp:"⚽",isMe:true},
];

export default function LeaderboardPage({ onBack, player }: { onBack:()=>void; player:any }) {
  const [tab,setTab]=useState<"global"|"friends">("global");
  return (
    <div style={{position:"fixed",inset:0,paddingBottom:64,display:"flex",flexDirection:"column",background:"#0d0b1e"}}>
      <div style={{padding:"14px 16px 10px",background:"linear-gradient(180deg,rgba(245,158,11,0.2),transparent)",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <span style={{fontSize:24}}>🏆</span>
          <span style={{fontSize:20,fontWeight:900,color:"#fff"}}>Leaderboard</span>
          <span style={{marginLeft:"auto",fontSize:11,color:"rgba(255,255,255,0.4)",fontWeight:700}}>Season 1</span>
        </div>
        <div style={{display:"flex",gap:8,background:"rgba(255,255,255,0.06)",borderRadius:12,padding:4}}>
          {(["global","friends"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px 0",borderRadius:9,border:"none",cursor:"pointer",fontWeight:800,fontSize:13,background:tab===t?"linear-gradient(135deg,#f59e0b,#d97706)":"transparent",color:tab===t?"#fff":"rgba(255,255,255,0.45)"}}>
              {t==="global"?"🌍 Global":"👥 Friends"}
            </button>
          ))}
        </div>
      </div>
      {/* Podium */}
      <div style={{padding:"16px 16px 8px"}}>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:8}}>
          <Podium p={LEADERS[1]} h={80} bg="rgba(148,163,184,0.15)" col="#94a3b8" medal="🥈"/>
          <Podium p={LEADERS[0]} h={100} bg="rgba(245,158,11,0.15)" col="#ffd700" medal="🥇" crown/>
          <Podium p={LEADERS[2]} h={68}  bg="rgba(180,83,9,0.15)"   col="#fb923c" medal="🥉"/>
        </div>
      </div>
      {/* List */}
      <div style={{flex:1,overflowY:"auto",padding:"0 16px",display:"flex",flexDirection:"column",gap:6}}>
        {LEADERS.slice(3).map(p=>(
          <div key={p.rank} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:(p as any).isMe?"rgba(108,63,255,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${(p as any).isMe?"rgba(108,63,255,0.4)":"rgba(255,255,255,0.07)"}`,borderRadius:12}}>
            <span style={{fontSize:13,fontWeight:900,color:"rgba(255,255,255,0.4)",width:24,textAlign:"center"}}>#{p.rank}</span>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{p.pfp}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:800,color:(p as any).isMe?"#a78bfa":"#fff"}}>{p.country} {p.name}{(p as any).isMe?" (You)":""}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontWeight:700}}>{p.wins} wins</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:15,fontWeight:900,color:"#ffd700"}}>{p.rating}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",fontWeight:700}}>rating</div>
            </div>
          </div>
        ))}
      </div>
      {/* My rank sticky */}
      <div style={{padding:"8px 16px",background:"rgba(13,11,30,0.95)",borderTop:"1px solid rgba(108,63,255,0.3)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"rgba(108,63,255,0.12)",border:"1px solid rgba(108,63,255,0.3)",borderRadius:12}}>
          <span style={{fontSize:13,fontWeight:900,color:"#a78bfa",width:24}}>#10</span>
          <div style={{width:34,height:34,borderRadius:10,background:"rgba(108,63,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⚽</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:"#a78bfa"}}>🇮🇩 {player.username} (You)</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontWeight:700}}>{player.wins} wins</div>
          </div>
          <div style={{fontSize:15,fontWeight:900,color:"#ffd700"}}>{player.rating}</div>
        </div>
      </div>
    </div>
  );
}

function Podium({p,h,bg,col,medal,crown}:any) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1,maxWidth:100}}>
      {crown&&<span style={{fontSize:18}}>👑</span>}
      <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,border:`1px solid ${col}44`}}>{p.pfp}</div>
      <span style={{fontSize:10,fontWeight:800,color:col,textAlign:"center"}}>{p.name}</span>
      <span style={{fontSize:12,fontWeight:900,color:col}}>{p.rating}</span>
      <div style={{width:"100%",background:bg,border:`1px solid ${col}33`,borderRadius:"8px 8px 0 0",height:h,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:24}}>{medal}</span>
      </div>
    </div>
  );
}
