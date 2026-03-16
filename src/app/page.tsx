"use client";
import { useState, useEffect, useRef } from "react";
import ShopPage from "@/components/ui/ShopPage";
import MissionsPage from "@/components/ui/MissionsPage";
import LeaderboardPage from "@/components/ui/LeaderboardPage";
import MatchPage from "@/components/ui/MatchPage";
import SettingsModal from "@/components/ui/SettingsModal";
import GameCanvas from "@/components/game/GameCanvas";

export type Tab = "home"|"missions"|"shop"|"leaderboard"|"match"|"playing";

const player = { username:"Player1", displayName:"You", pfpUrl:"", coins:1250, gems:30, rating:1024, level:5, wins:12, losses:4 };

export default function Home() {
  const [tab,setTab]=useState<Tab>("home");
  const [showSettings,setShowSettings]=useState(false);
  const [music,setMusic]=useState(true);
  const [sfx,setSfx]=useState(true);

  return (
    <div style={{position:"fixed",inset:0,background:"#0d0b1e",fontFamily:"'Nunito',sans-serif",overflow:"hidden"}}>
      {tab==="home"        && <HomePage player={player} onPlay={()=>setTab("match")} onSettings={()=>setShowSettings(true)}/>}
      {tab==="missions"    && <MissionsPage onBack={()=>setTab("home")} player={player}/>}
      {tab==="shop"        && <ShopPage onBack={()=>setTab("home")} player={player}/>}
      {tab==="leaderboard" && <LeaderboardPage onBack={()=>setTab("home")} player={player}/>}
      {tab==="match"       && <MatchPage onBack={()=>setTab("home")} onStartGame={()=>setTab("playing")} player={player}/>}
      {tab==="playing"     && <GameCanvas onExit={()=>setTab("home")} player={player}/>}

      {tab!=="playing" && (
        <nav style={{position:"fixed",bottom:0,left:0,right:0,height:64,zIndex:100,background:"rgba(13,11,30,0.95)",borderTop:"1px solid rgba(255,255,255,0.1)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"space-around"}}>
          {([
            {id:"missions",icon:"📋",label:"Missions"},
            {id:"shop",icon:"🎰",label:"Shop"},
            {id:"home",icon:"🏠",label:"Home"},
            {id:"leaderboard",icon:"🏆",label:"Rank"},
            {id:"match",icon:"⚽",label:"Play"},
          ] as const).map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} style={{background:"none",border:"none",color:tab===n.id?"#ffd700":"rgba(255,255,255,0.45)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,flex:1,padding:"8px 4px",fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:10}}>
              <span style={{fontSize:22}}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
      )}

      {showSettings && <SettingsModal music={music} sfx={sfx} onMusic={setMusic} onSfx={setSfx} onClose={()=>setShowSettings(false)}/>}
    </div>
  );
}

interface HomePageProps { player:any; onPlay:()=>void; onSettings:()=>void; }

function HomePage({player,onPlay,onSettings}:HomePageProps) {
  const canvasRef=useRef<HTMLCanvasElement>(null);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    const ctx=canvas.getContext("2d")!;
    let raf:number, t=0;
    function resize(){canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight;}
    resize();
    window.addEventListener("resize",resize);
    function draw(){
      const W=canvas.width,H=canvas.height;
      t+=0.016;
      const sky=ctx.createLinearGradient(0,0,0,H*0.65);
      sky.addColorStop(0,"#08061a");sky.addColorStop(0.5,"#1a0e4a");sky.addColorStop(1,"#2d1a80");
      ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
      for(let i=0;i<60;i++){
        ctx.globalAlpha=(Math.sin(t*2+i)*0.3+0.7)*0.55;
        ctx.fillStyle="#fff";
        ctx.beginPath();ctx.arc((i*173+40)%W,(i*97+10)%(H*0.4),0.8,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
      ([[0,0.07,0.28],[0.07,0.06,0.22],[0.12,0.09,0.31],[0.7,0.06,0.26],[0.75,0.09,0.30],[0.87,0.07,0.27]] as number[][]).forEach(([rx,rw,rh])=>{
        const bx=rx*W,bw=rw*W,bh=rh*H,by=H*0.55-bh;
        ctx.fillStyle="#12092e";ctx.fillRect(bx,by,bw,bh);
        const cols=Math.max(2,Math.floor(bw/13)),rows=Math.max(2,Math.floor(bh/16));
        for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
          if(Math.sin(t*0.3+r*7+c*13)>0.1){
            ctx.fillStyle=Math.sin(r+c)>0?"rgba(255,210,80,0.75)":"rgba(200,240,255,0.5)";
            ctx.fillRect(bx+bw*(c+0.5)/(cols+1)-4,by+r*(bh/rows)+3,8,6);
          }
        }
      });
      const gy=H*0.68,gw=W*0.085,standY=H*0.47,standH=H*0.08;
      let acc=0;
      ([["#1a5276",0.14],["#c9a227",0.08],["#117a65",0.55],["#c0392b",0.08],["#1a5276",0.05]] as [string,number][]).forEach(([c,w])=>{
        ctx.fillStyle=c;ctx.fillRect(gw+acc*W,standY,w*W,standH);acc+=w;
      });
      ctx.fillStyle="#27ae60";ctx.fillRect(gw,gy-H*0.22,W-gw*2,H*0.22+H*0.32);
      const sw=(W-gw*2)/10;
      for(let i=0;i<10;i++){
        ctx.fillStyle=i%2===0?"rgba(0,0,0,0.07)":"rgba(255,255,255,0.04)";
        ctx.fillRect(gw+i*sw,gy-H*0.22,sw,H*0.22+H*0.32);
      }
      ctx.strokeStyle="rgba(255,255,255,0.6)";ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(W/2,gy-H*0.22);ctx.lineTo(W/2,gy);ctx.stroke();
      ctx.beginPath();ctx.arc(W/2,gy,W*0.07,Math.PI,0);ctx.stroke();
      for(let s=0;s<2;s++){
        const gx=s===0?0:W-gw,px=s===0?gw:W-gw;
        ctx.fillStyle="rgba(180,180,180,0.1)";ctx.fillRect(gx,gy-W*0.09,gw,W*0.09);
        ctx.fillStyle="#ecf0f1";ctx.fillRect(px-3,gy-W*0.09-3,6,W*0.09+3);ctx.fillRect(gx,gy-W*0.09-3,gw,6);
      }
      const gg=ctx.createLinearGradient(0,gy,0,H);
      gg.addColorStop(0,"#1e8449");gg.addColorStop(1,"#0f3320");
      ctx.fillStyle=gg;ctx.fillRect(0,gy,W,H-gy);
      raf=requestAnimationFrame(draw);
    }
    draw();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);};
  },[]);

  return (
    <div style={{position:"fixed",inset:0,display:"flex",flexDirection:"column",paddingBottom:64}}>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>
      <div style={{position:"relative",zIndex:10,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"rgba(0,0,0,0.25)",backdropFilter:"blur(8px)"}}>
        <div style={{display:"flex",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(0,0,0,0.45)",border:"1px solid rgba(255,210,0,0.3)",borderRadius:20,padding:"4px 10px"}}>
            <span style={{fontSize:16}}>🪙</span>
            <span style={{fontSize:13,fontWeight:800,color:"#ffd700"}}>{player.coins.toLocaleString()}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(0,0,0,0.45)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:20,padding:"4px 10px"}}>
            <span style={{fontSize:16}}>💎</span>
            <span style={{fontSize:13,fontWeight:800,color:"#c084fc"}}>{player.gems}</span>
          </div>
        </div>
        <button onClick={onSettings} style={{background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"6px 10px",color:"#fff",fontSize:18,cursor:"pointer"}}>⚙️</button>
      </div>
      <div style={{position:"relative",zIndex:10,flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 20px",gap:8}}>
        <div style={{animation:"float 3s ease-in-out infinite",marginBottom:4}}>
          <svg width="110" height="130" viewBox="0 0 110 130">
            <ellipse cx="55" cy="125" rx="32" ry="6" fill="rgba(0,0,0,0.3)"/>
            <ellipse cx="55" cy="90" rx="28" ry="34" fill="#e63946"/>
            <ellipse cx="55" cy="90" rx="8" ry="34" fill="rgba(255,255,255,0.18)"/>
            <text x="55" y="95" textAnchor="middle" fontSize="14" fontWeight="900" fill="rgba(255,255,255,0.85)">1</text>
            <rect x="47" y="56" width="16" height="10" fill="#c8845a"/>
            <circle cx="55" cy="42" r="34" fill="#f0a070"/>
            <circle cx="42" cy="34" r="28" fill="rgba(255,255,255,0.12)"/>
            <path d="M22,36 Q20,10 55,8 Q90,10 88,36 Q80,18 55,20 Q30,18 22,36Z" fill="#1c1008"/>
            {[0,1,2,3,4].map(i=>{const a=Math.PI+i*0.22;return <path key={i} d={`M${55+Math.cos(a)*30},${42+Math.sin(a)*30} L${55+Math.cos(a+0.08)*48},${42+Math.sin(a+0.08)*48} L${55+Math.cos(a+0.16)*30},${42+Math.sin(a+0.16)*30}Z`} fill="#1c1008"/>;} )}
            <ellipse cx="65" cy="38" rx="9" ry="10" fill="white"/>
            <ellipse cx="46" cy="38" rx="9" ry="10" fill="white"/>
            <circle cx="66" cy="39" r="6" fill="#1a3a10"/>
            <circle cx="47" cy="39" r="6" fill="#1a3a10"/>
            <circle cx="67" cy="40" r="3.5" fill="black"/>
            <circle cx="48" cy="40" r="3.5" fill="black"/>
            <circle cx="69" cy="37" r="2" fill="white"/>
            <circle cx="50" cy="37" r="2" fill="white"/>
            <path d="M58,28 L74,31" stroke="#3d1f00" strokeWidth="3" strokeLinecap="round"/>
            <path d="M39,28 L53,31" stroke="#3d1f00" strokeWidth="3" strokeLinecap="round"/>
            <path d="M44,54 Q55,64 66,54" stroke="#6b2000" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <ellipse cx="55" cy="118" rx="22" ry="10" fill="#9b1c1c"/>
            <line x1="44" y1="122" x2="38" y2="128" stroke="#c8845a" strokeWidth="10" strokeLinecap="round"/>
            <line x1="66" y1="122" x2="72" y2="128" stroke="#c8845a" strokeWidth="10" strokeLinecap="round"/>
            <ellipse cx="36" cy="128" rx="10" ry="5" fill="#111"/>
            <ellipse cx="74" cy="128" rx="10" ry="5" fill="#111"/>
            <circle cx="55" cy="8" r="8" fill="white" stroke="#222" strokeWidth="1.5"/>
            <circle cx="55" cy="8" r="3" fill="#222"/>
          </svg>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:40,lineHeight:1,background:"linear-gradient(135deg,#ffd700,#ff6b35)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:1}}>
            DOME STRIKER
          </div>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"rgba(255,255,255,0.6)",letterSpacing:3,marginTop:2}}>
            SMASH • SCORE • WIN
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:4}}>
          {([{icon:"⭐",val:`Lv.${player.level}`},{icon:"🏆",val:`${player.wins}W`},{icon:"📊",val:`${player.rating}`}]).map(s=>(
            <div key={s.icon} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(0,0,0,0.45)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"4px 10px"}}>
              <span style={{fontSize:13}}>{s.icon}</span>
              <span style={{fontSize:12,fontWeight:800,color:"#fff"}}>{s.val}</span>
            </div>
          ))}
        </div>
        <button onClick={onPlay} style={{marginTop:8,padding:"16px 52px",fontSize:22,fontWeight:900,fontFamily:"'Fredoka One',cursive",background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",border:"3px solid rgba(255,255,255,0.25)",borderRadius:50,cursor:"pointer",boxShadow:"0 6px 30px rgba(34,197,94,0.5)",animation:"pulse-glow 2s ease-in-out infinite",letterSpacing:2}}>
          ⚽ PLAY NOW
        </button>
        <p style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>Tap to play</p>
      </div>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes pulse-glow{0%,100%{box-shadow:0 6px 20px rgba(34,197,94,0.4)}50%{box-shadow:0 6px 40px rgba(34,197,94,0.8)}}
      `}</style>
    </div>
  );
}
