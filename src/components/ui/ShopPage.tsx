"use client";
import { useState } from "react";
import { CHARACTERS, BALLS, SKILLS, RARITY_COLORS, RARITY_GLOW, ALL_ITEMS, type GameItem } from "@/lib/items";

type ShopTab = "gacha"|"characters"|"balls"|"skills";

export default function ShopPage({ onBack, player }: { onBack:()=>void; player:any }) {
  const [tab, setTab] = useState<ShopTab>("gacha");
  const [pulling, setPulling] = useState(false);
  const [pullResult, setPullResult] = useState<GameItem|null>(null);
  const [multiResult, setMultiResult] = useState<GameItem[]|null>(null);

  function doPull(multi=false) {
    setPulling(true);
    setTimeout(()=>{
      if(multi){ setMultiResult(Array.from({length:10},()=>ALL_ITEMS[Math.floor(Math.random()*ALL_ITEMS.length)])); setPullResult(null); }
      else { setPullResult(ALL_ITEMS[Math.floor(Math.random()*ALL_ITEMS.length)]); setMultiResult(null); }
      setPulling(false);
    },1200);
  }

  const tabItems:Record<ShopTab,GameItem[]> = { gacha:[], characters:CHARACTERS, balls:BALLS, skills:SKILLS };

  return (
    <div style={{position:"fixed",inset:0,paddingBottom:64,display:"flex",flexDirection:"column",background:"#0d0b1e"}}>
      <div style={{padding:"14px 16px 10px",background:"linear-gradient(180deg,rgba(168,85,247,0.2),transparent)",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <span style={{fontSize:24}}>🎰</span>
          <span style={{fontSize:20,fontWeight:900,color:"#fff"}}>Shop & Gacha</span>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,210,0,0.3)",borderRadius:16,padding:"3px 8px"}}>
              <span>🪙</span><span style={{fontSize:12,fontWeight:800,color:"#ffd700"}}>{player.coins}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(0,0,0,0.4)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:16,padding:"3px 8px"}}>
              <span>💎</span><span style={{fontSize:12,fontWeight:800,color:"#c084fc"}}>{player.gems}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
          {([["gacha","🎰 Gacha"],["characters","👤 Characters"],["balls","⚽ Bola"],["skills","⚡ Skills"]] as const).map(([t,label])=>(
            <button key={t} onClick={()=>setTab(t)} style={{flexShrink:0,padding:"7px 14px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:800,fontSize:12,background:tab===t?"linear-gradient(135deg,#a855f7,#7c3aed)":"rgba(255,255,255,0.07)",color:tab===t?"#fff":"rgba(255,255,255,0.5)"}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
        {tab==="gacha" && (
          <>
            <div style={{background:"linear-gradient(135deg,#1e0a3c,#3b0764)",border:"1px solid rgba(168,85,247,0.4)",borderRadius:18,padding:18,textAlign:"center",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 30%,rgba(168,85,247,0.2),transparent 65%)"}}/>
              <div style={{fontSize:52,marginBottom:4}}>🐉</div>
              <div style={{fontWeight:900,fontSize:18,color:"#fff",marginBottom:2}}>Dragon Pull</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",marginBottom:14}}>Get rare characters & items!</div>
              <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                <button onClick={()=>doPull(false)} disabled={pulling} style={{padding:"12px 20px",borderRadius:14,border:"none",cursor:"pointer",fontWeight:900,fontSize:14,background:"linear-gradient(135deg,#a855f7,#7c3aed)",color:"#fff",opacity:pulling?0.6:1}}>
                  {pulling?"Pulling...":"🎰 Pull ×1"}<br/><span style={{fontSize:10,opacity:0.8}}>500🪙 / 10💎</span>
                </button>
                <button onClick={()=>doPull(true)} disabled={pulling} style={{padding:"12px 20px",borderRadius:14,border:"none",cursor:"pointer",fontWeight:900,fontSize:14,background:"linear-gradient(135deg,#f59e0b,#ffd700)",color:"#1a0a00",opacity:pulling?0.6:1}}>
                  {pulling?"Pulling...":"🎰 Pull ×10"}<br/><span style={{fontSize:10,opacity:0.7}}>4500🪙 / 80💎</span>
                </button>
              </div>
            </div>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:14}}>
              <div style={{fontWeight:800,fontSize:13,color:"rgba(255,255,255,0.6)",marginBottom:10}}>📊 Drop Rates</div>
              {[["Legendary","#f59e0b","2%"],["Epic","#a855f7","13%"],["Rare","#3b82f6","35%"],["Common","#94a3b8","50%"]].map(([r,c,p])=>(
                <div key={r} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <span style={{fontSize:12,fontWeight:800,color:c,width:72}}>{r}</span>
                  <div style={{flex:1,height:6,background:"rgba(255,255,255,0.08)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:p,background:c,borderRadius:4}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.5)",width:30,textAlign:"right"}}>{p}</span>
                </div>
              ))}
            </div>
            {pullResult && <PullResult item={pullResult} onClose={()=>setPullResult(null)}/>}
            {multiResult && <MultiResult items={multiResult} onClose={()=>setMultiResult(null)}/>}
          </>
        )}
        {tab!=="gacha" && tabItems[tab].map(item=>(
          <ItemCard key={item.id} item={item} owned={item.price===0}/>
        ))}
      </div>
    </div>
  );
}

function ItemCard({item,owned}:{item:GameItem;owned:boolean}) {
  const rc=RARITY_COLORS[item.rarity];
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",border:`1px solid ${rc}33`,borderRadius:14,padding:12}}>
      <div style={{width:52,height:52,borderRadius:12,background:`${rc}22`,border:`1px solid ${rc}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:`0 0 12px ${RARITY_GLOW[item.rarity]}`}}>{item.icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>{item.name}</div>
        <div style={{fontSize:11,color:rc,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>{item.rarity}</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:2}}>{item.description}</div>
      </div>
      <button style={{padding:"8px 14px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:800,fontSize:13,flexShrink:0,background:owned?"rgba(34,197,94,0.15)":item.gemPrice?"linear-gradient(135deg,#a855f7,#7c3aed)":"linear-gradient(135deg,#f59e0b,#ffd700)",color:owned?"#86efac":item.gemPrice?"#fff":"#1a0a00"}}>
        {owned?"✓ Owned":item.gemPrice?`${item.gemPrice}💎`:`${item.price}🪙`}
      </button>
    </div>
  );
}

function PullResult({item,onClose}:{item:GameItem;onClose:()=>void}) {
  const rc=RARITY_COLORS[item.rarity];
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)"}} onClick={onClose}>
      <div style={{background:"#1a1035",border:`2px solid ${rc}`,borderRadius:24,padding:32,textAlign:"center",maxWidth:280,width:"90%",boxShadow:`0 0 60px ${RARITY_GLOW[item.rarity]}`}}>
        <div style={{fontSize:64,marginBottom:8}}>{item.icon}</div>
        <div style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:4}}>{item.name}</div>
        <div style={{fontSize:13,color:rc,fontWeight:800,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{item.rarity}</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.55)",marginBottom:20}}>{item.description}</div>
        <button style={{padding:"12px 32px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${rc},${rc}88)`,color:"#fff",fontWeight:900,fontSize:16,cursor:"pointer"}}>Nice! ✨</button>
      </div>
    </div>
  );
}

function MultiResult({items,onClose}:{items:GameItem[];onClose:()=>void}) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",padding:16}}>
      <div style={{background:"#1a1035",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,padding:20,width:"100%",maxWidth:360}}>
        <div style={{fontWeight:900,fontSize:18,color:"#fff",textAlign:"center",marginBottom:16}}>🎰 Pull Results ×10</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:16}}>
          {items.map((item,i)=>{
            const rc=RARITY_COLORS[item.rarity];
            return (
              <div key={i} style={{aspectRatio:"1",borderRadius:10,background:`${rc}22`,border:`1px solid ${rc}55`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                <span style={{fontSize:20}}>{item.icon}</span>
                <span style={{fontSize:8,color:rc,fontWeight:800,textTransform:"uppercase"}}>{item.rarity.slice(0,3)}</span>
              </div>
            );
          })}
        </div>
        <button onClick={onClose} style={{width:"100%",padding:12,borderRadius:14,border:"none",background:"linear-gradient(135deg,#6c3fff,#8b5fff)",color:"#fff",fontWeight:900,fontSize:15,cursor:"pointer"}}>Save All</button>
      </div>
    </div>
  );
}
