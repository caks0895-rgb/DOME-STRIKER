"use client";
import { useState, useEffect } from "react";

export default function MatchPage({ onBack, onStartGame, player }: { onBack:()=>void; onStartGame:()=>void; player:any }) {
  const [state,setState]=useState<"menu"|"searching"|"found">("menu");
  const [searchTime,setSearchTime]=useState(0);
  const [opponent,setOpponent]=useState<any>(null);
  const [mode,setMode]=useState<"online"|"bot">("online");

  useEffect(()=>{
    if(state!=="searching")return;
    const timer=setInterval(()=>setSearchTime(t=>t+1),1000);
    const bots=[{name:"NinjaBot",rating:1050,pfp:"🥷",country:"🇯🇵"},{name:"VikingAI",rating:980,pfp:"⚔️",country:"🇳🇴"},{name:"DragonBot",rating:1120,pfp:"🐉",country:"🇧🇷"}];
    const timeout=setTimeout(()=>{
      const b=bots[Math.floor(Math.random()*bots.length)];
      setOpponent(mode==="bot"?{...b,name:b.name+" (AI)"}:{name:"RandomPlayer",rating:1010+Math.floor(Math.random()*200),pfp:"⚽",country:"🌍"});
      setState("found");
    },mode==="bot"?1500:5000);
    return()=>{clearInterval(timer);clearTimeout(timeout);};
  },[state,mode]);

  if(state==="menu") return (
    <div style={{position:"fixed",inset:0,paddingBottom:64,display:"flex",flexDirection:"column",background:"#0d0b1e"}}>
      <div style={{padding:"14px 16px 10px",background:"linear-gradient(180deg,rgba(34,197,94,0.2),transparent)",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24}}>⚽</span>
          <span style={{fontSize:20,fontWeight:900,color:"#fff"}}>Find Match</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:16}}>
        <div style={{background:"rgba(108,63,255,0.1)",border:"1px solid rgba(108,63,255,0.3)",borderRadius:16,padding:16,display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{width:52,height:52,borderRadius:14,background:"rgba(108,63,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>⚽</div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:900,color:"#fff"}}>🇮🇩 {player.username}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:700}}>Rating: {player.rating} • Lv.{player.level}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:20,fontWeight:900,color:"#ffd700"}}>{player.rating}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>MMR</div>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:800,color:"rgba(255,255,255,0.5)",marginBottom:10,letterSpacing:0.5}}>SELECT MODE</div>
          <div style={{display:"flex",gap:10}}>
            {([["online","🌐 Online","Opponent pemain nyata","#22c55e"],["bot","🤖 vs AI","Opponent AI kapan saja","#3b82f6"]] as const).map(([m,label,desc,col])=>(
              <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:14,borderRadius:14,border:`2px solid ${mode===m?col:"rgba(255,255,255,0.1)"}`,background:mode===m?`${col}18`:"rgba(255,255,255,0.04)",cursor:"pointer",textAlign:"left"}}>
                <div style={{fontSize:18,marginBottom:4}}>{label.split(" ")[0]}</div>
                <div style={{fontSize:13,fontWeight:800,color:mode===m?col:"#fff"}}>{label}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>{desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:800,color:"rgba(255,255,255,0.5)",marginBottom:10,letterSpacing:0.5}}>MATCH TYPE</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[{icon:"⚔️",name:"Ranked",desc:"Official rated match",reward:"Rating + Coins",active:true},{icon:"🎮",name:"Casual",desc:"Casual play, no rating",reward:"Coins only",active:false},{icon:"🏆",name:"Tournament",desc:"Seasonal tournament",reward:"Big prizes",active:false,coming:true}].map(mt=>(
              <div key={mt.name} style={{display:"flex",alignItems:"center",gap:12,padding:14,borderRadius:14,border:`1px solid ${mt.active?"rgba(34,197,94,0.4)":"rgba(255,255,255,0.08)"}`,background:mt.active?"rgba(34,197,94,0.06)":"rgba(255,255,255,0.03)",opacity:mt.coming?0.5:1}}>
                <span style={{fontSize:24}}>{mt.icon}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:14,fontWeight:800,color:mt.active?"#86efac":"#fff"}}>{mt.name}</span>
                    {mt.coming&&<span style={{fontSize:9,fontWeight:800,color:"#f59e0b",background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:6,padding:"1px 6px"}}>SEGERA</span>}
                  </div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>{mt.desc}</div>
                </div>
                <div style={{fontSize:11,color:"#ffd700",fontWeight:700}}>{mt.reward}</div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={()=>{setSearchTime(0);setState("searching");}} style={{width:"100%",padding:"18px 0",borderRadius:16,border:"none",cursor:"pointer",fontWeight:900,fontSize:18,background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",boxShadow:"0 6px 30px rgba(34,197,94,0.4)",letterSpacing:1}}>
          ⚽ {mode==="online"?"FIND OPPONENT":"PLAY vs AI"}
        </button>
      </div>
    </div>
  );

  if(state==="searching") return (
    <div style={{position:"fixed",inset:0,paddingBottom:64,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#0d0b1e",gap:20}}>
      <div style={{fontSize:64,animation:"spin 1s linear infinite"}}>⚽</div>
      <div style={{fontSize:20,fontWeight:900,color:"#fff"}}>Searching Opponent...</div>
      <div style={{fontSize:14,color:"rgba(255,255,255,0.45)",fontWeight:700}}>{String(Math.floor(searchTime/60)).padStart(2,"0")}:{String(searchTime%60).padStart(2,"0")}</div>
      {searchTime>=5&&<div style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>None opponent? Bot will be assigned...</div>}
      <button onClick={()=>setState("menu")} style={{padding:"10px 24px",borderRadius:12,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.6)",fontWeight:700,fontSize:14,cursor:"pointer"}}>Cancel</button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,paddingBottom:64,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#0d0b1e",gap:16,padding:24}}>
      <div style={{fontSize:14,fontWeight:800,color:"#22c55e",letterSpacing:2,marginBottom:4}}>OPPONENT FOUND!</div>
      <div style={{display:"flex",alignItems:"center",gap:16,width:"100%",maxWidth:340}}>
        <div style={{flex:1,background:"rgba(108,63,255,0.1)",border:"1px solid rgba(108,63,255,0.3)",borderRadius:14,padding:14,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:6}}>⚽</div>
          <div style={{fontSize:14,fontWeight:800,color:"#a78bfa"}}>{player.username}</div>
          <div style={{fontSize:13,fontWeight:900,color:"#ffd700"}}>{player.rating}</div>
        </div>
        <div style={{fontSize:24,fontWeight:900,color:"rgba(255,255,255,0.5)"}}>VS</div>
        {opponent&&(
          <div style={{flex:1,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:14,padding:14,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:6}}>{opponent.pfp}</div>
            <div style={{fontSize:14,fontWeight:800,color:"#fca5a5"}}>{opponent.country} {opponent.name}</div>
            <div style={{fontSize:13,fontWeight:900,color:"#ffd700"}}>{opponent.rating}</div>
          </div>
        )}
      </div>
      <button onClick={onStartGame} style={{width:"100%",maxWidth:340,padding:"18px 0",borderRadius:16,border:"none",cursor:"pointer",fontWeight:900,fontSize:18,background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",boxShadow:"0 6px 30px rgba(34,197,94,0.4)",letterSpacing:1,marginTop:8}}>
        ⚽ PLAY NOW!
      </button>
      <button onClick={()=>setState("menu")} style={{padding:"8px 20px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontWeight:700,fontSize:13}}>Decline</button>
    </div>
  );
}
