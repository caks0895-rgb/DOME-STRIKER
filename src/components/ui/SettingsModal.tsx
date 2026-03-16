"use client";
interface Props {
  music: boolean; sfx: boolean;
  onMusic: (v:boolean)=>void; onSfx: (v:boolean)=>void;
  onClose: ()=>void;
}
export default function SettingsModal({ music, sfx, onMusic, onSfx, onClose }: Props) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)"}}>
      <div style={{background:"#1a1035",border:"1px solid rgba(255,255,255,0.12)",borderRadius:20,padding:24,width:"min(340px,92vw)",animation:"pop 0.25s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontSize:20,fontWeight:900,color:"#fff"}}>⚙️ Settings</span>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:18}}>✕</button>
        </div>
        {[{label:"🎵 Music",val:music,set:onMusic},{label:"🔊 Sound Effects",val:sfx,set:onSfx}].map(({label,val,set})=>(
          <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
            <span style={{fontSize:15,fontWeight:700,color:"#fff"}}>{label}</span>
            <button onClick={()=>set(!val)} style={{width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",background:val?"linear-gradient(135deg,#22c55e,#16a34a)":"rgba(255,255,255,0.12)",position:"relative",transition:"background 0.2s"}}>
              <span style={{position:"absolute",top:3,left:val?26:3,width:22,height:22,borderRadius:"50%",background:"#fff",transition:"left 0.2s",display:"block"}}/>
            </button>
          </div>
        ))}
        <div style={{marginTop:16,padding:"14px 0",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <span style={{fontSize:15,fontWeight:700,color:"#fff"}}>📊 Graphics Quality</span>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            {["Low","Medium","High"].map((q,i)=>(
              <button key={q} style={{flex:1,padding:"8px 0",borderRadius:10,border:`1px solid ${i===1?"#6c3fff":"rgba(255,255,255,0.12)"}`,background:i===1?"rgba(108,63,255,0.25)":"rgba(255,255,255,0.06)",color:i===1?"#a78bfa":"rgba(255,255,255,0.6)",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                {q}
              </button>
            ))}
          </div>
        </div>
        <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
          <button style={{padding:"12px",borderRadius:12,background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#f87171",fontWeight:800,fontSize:14,cursor:"pointer"}}>
            🚪 Sign Out
          </button>
          <p style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.25)"}}>Dome Striker v0.1.0</p>
        </div>
      </div>
      <style>{`@keyframes pop{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
