"use client";
import { useEffect, useRef, useState } from "react";

const WIN_GOALS=10;
const CPU_RATING=1050;

function calcElo(my:number,opp:number,r:"win"|"loss"|"draw"){
  const K=30,e=1/(1+Math.pow(10,(opp-my)/400)),a=r==="win"?1:r==="draw"?0.5:0;
  return Math.round(K*(a-e));
}
function calcCoins(r:"win"|"loss"|"draw",g:number){return(r==="win"?100:r==="draw"?40:20)+g*8;}

export default function GameCanvas({onExit,player}:{onExit:()=>void;player:any}){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const K=useRef({left:false,right:false,jump:false,kick:false});
  const prevJ=useRef(false);
  const prevK=useRef(false);
  const [score,setScore]=useState([0,0]);
  const [timeLeft,setTimeLeft]=useState(90);
  const [gameOver,setGameOver]=useState(false);
  const [isPortrait,setIsPortrait]=useState(false);
  const [matchResult,setMatchResult]=useState<{outcome:"win"|"loss"|"draw";coinsEarned:number;ratingChange:number;newRating:number;playerGoals:number;}|null>(null);

  useEffect(()=>{
    if(typeof window==="undefined")return;
    function chk(){setIsPortrait(window.innerHeight>window.innerWidth);}
    chk();
    window.addEventListener("orientationchange",chk);
    window.addEventListener("resize",chk);
    try{const o=window.screen?.orientation as any;if(o?.lock)o.lock("landscape");}catch{}
    return()=>{
      try{const o=window.screen?.orientation as any;if(o?.unlock)o.unlock();}catch{}
      window.removeEventListener("orientationchange",chk);
      window.removeEventListener("resize",chk);
    };
  },[]);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    const ctx=canvas.getContext("2d");
    if(!ctx)return;
    let raf:number,W=0,H=0,t=0;

    function resize(){
      const c=canvasRef.current;
      if(!c)return;
      W=c.offsetWidth;H=c.offsetHeight;c.width=W;c.height=H;
    }
    resize();
    window.addEventListener("resize",()=>{resize();reset();});

    const GY=()=>H*0.72,GW=()=>Math.max(50,W*0.088),GH=()=>Math.min(115,H*0.25),BR=()=>Math.max(13,W*0.024),PS=()=>Math.max(18,W*0.037);
    const GRAV=0.47;
    const trail:Array<{x:number,y:number}>=[];
    let ball={x:0,y:0,vx:0,vy:0,rot:0};
    let p1:any,p2:any,sc=[0,0],tl=90,over=false,gft=0,pSec=Date.now();

    function spawnBall(){ball={x:W/2,y:GY()-H*0.2,vx:(Math.random()-0.5)*3,vy:-5,rot:0};}
    function mkP(s:number){return{x:s===0?W*0.22:W*0.72,y:GY(),vx:0,vy:0,onG:true,jc:0,kt:0,ai:s===1,fr:s===0};}
    function reset(){spawnBall();p1=mkP(0);p2=mkP(1);trail.length=0;}
    reset();

    function endGame(){
      if(over)return;over=true;
      const outcome:("win"|"loss"|"draw")=sc[0]>sc[1]?"win":sc[1]>sc[0]?"loss":"draw";
      const myRating=player?.rating??1000;
      const rc=calcElo(myRating,CPU_RATING,outcome);
      setMatchResult({outcome,coinsEarned:calcCoins(outcome,sc[0]),ratingChange:rc,newRating:myRating+rc,playerGoals:sc[0]});
      setGameOver(true);
    }

    function doKick(p:any){
      const cx=p.x+PS(),cy=p.y-PS()*1.9,dx=ball.x-cx,dy=ball.y-cy,d=Math.sqrt(dx*dx+dy*dy);
      p.kt=14;
      if(d<BR()+PS()*2.7){const sp=W*0.022,a=Math.atan2(dy,dx);ball.vx=Math.cos(a)*sp*(p.fr?1.38:0.9);ball.vy=Math.sin(a)*sp-H*0.009;}
    }
    function physP(p:any){
      p.vy+=GRAV;p.x+=p.vx;p.y+=p.vy;
      if(p.y>=GY()){p.y=GY();p.vy=0;p.onG=true;p.jc=0;}
      if(p.x<GW()+4)p.x=GW()+4;
      if(p.x>W-GW()-PS()*2.2)p.x=W-GW()-PS()*2.2;
      if(p.kt>0)p.kt--;
    }
    function physBall(){
      ball.vy+=GRAV*0.8;ball.vx*=0.993;ball.vy*=0.993;ball.rot+=ball.vx*0.04;
      trail.unshift({x:ball.x,y:ball.y});if(trail.length>20)trail.pop();
      ball.x+=ball.vx;ball.y+=ball.vy;
      if(ball.y+BR()>=GY()){ball.y=GY()-BR();ball.vy*=-0.62;ball.vx*=0.88;}
      if(ball.y-BR()<=H*0.1){ball.y=H*0.1+BR();ball.vy*=-0.5;}
      if(ball.x-BR()<=GW()){if(ball.y>=GY()-GH()){doGoal(1);return;}ball.x=GW()+BR();ball.vx*=-0.72;}
      if(ball.x+BR()>=W-GW()){if(ball.y>=GY()-GH()){doGoal(0);return;}ball.x=W-GW()-BR();ball.vx*=-0.72;}
    }
    function collide(p:any){
      const cx=p.x+PS(),cy=p.y-PS()*1.9,dx=ball.x-cx,dy=ball.y-cy,d=Math.sqrt(dx*dx+dy*dy),mn=BR()+PS()*1.5;
      if(d<mn&&d>0.01){const nx=dx/d,ny=dy/d,ov=mn-d;ball.x+=nx*ov;ball.y+=ny*ov;const rv=(ball.vx-p.vx)*nx+(ball.vy-p.vy)*ny;if(rv<0){ball.vx-=1.5*rv*nx;ball.vy-=1.5*rv*ny;}}
    }
    function doGoal(who:number){
      if(gft>0||over)return;sc[who]++;gft=85;
      setScore([sc[0],sc[1]]);
      if(sc[0]>=WIN_GOALS||sc[1]>=WIN_GOALS){setTimeout(()=>endGame(),1400);return;}
      setTimeout(()=>{reset();gft=0;},1400);
    }

    // ===== DRAW UNIFIED SCENE =====
    function drawScene(){
      const gy=GY(),gw=GW(),gh=GH();
      
      // SKY - gradient yang natural
      const skyGrad=ctx.createLinearGradient(0,0,0,H*0.55);
      skyGrad.addColorStop(0,"#87CEEB");
      skyGrad.addColorStop(0.6,"#b3d9ff");
      skyGrad.addColorStop(1,"#d9ecff");
      ctx.fillStyle=skyGrad;
      ctx.fillRect(0,0,W,H*0.55);
      
      // CLOUDS - floating naturally
      ctx.fillStyle="rgba(255,255,255,0.95)";
      function drawCloud(cx:number,cy:number,w:number){
        ctx.beginPath();
        ctx.arc(cx-w*0.35,cy,w*0.42,0,Math.PI*2);
        ctx.arc(cx,cy-w*0.12,w*0.52,0,Math.PI*2);
        ctx.arc(cx+w*0.35,cy,w*0.42,0,Math.PI*2);
        ctx.fill();
      }
      drawCloud(W*0.12,H*0.1,W*0.065);
      drawCloud(W*0.72,H*0.08,W*0.075);
      drawCloud(W*0.4,H*0.2,W*0.055);
      
      // STADIUM CROWD - integrated ke langit
      ctx.fillStyle="rgba(60,50,90,0.9)";
      ctx.fillRect(0,H*0.35,W,H*0.22);
      
      // Crowd heads - lebih natural
      const crowdColors=["#d97ec1","#b389d9","#9a7db8","#7a6ba3","#b894d9","#d1a8e8"];
      const crowdSize=W*0.032;
      for(let row=0;row<4;row++){
        const cy=H*0.38+row*H*0.052;
        const offsetX=(row%2)*crowdSize*1.3;
        for(let col=0;col<Math.ceil(W/(crowdSize*2.4))+1;col++){
          const cx=col*(crowdSize*2.4)+offsetX;
          ctx.fillStyle=crowdColors[(col+row*2)%crowdColors.length];
          ctx.beginPath();ctx.arc(cx,cy,crowdSize,0,Math.PI*2);ctx.fill();
          // Eyes simple tapi cute
          ctx.fillStyle="rgba(0,0,0,0.6)";
          ctx.beginPath();ctx.arc(cx-crowdSize*0.28,cy-crowdSize*0.18,crowdSize*0.16,0,Math.PI*2);ctx.fill();
          ctx.beginPath();ctx.arc(cx+crowdSize*0.28,cy-crowdSize*0.18,crowdSize*0.16,0,Math.PI*2);ctx.fill();
        }
      }
      
      // GRASS FIELD - blending dengan crowd
      const grassGrad=ctx.createLinearGradient(0,H*0.57,0,H);
      grassGrad.addColorStop(0,"#2ab855");
      grassGrad.addColorStop(1,"#1a8a3f");
      ctx.fillStyle=grassGrad;
      ctx.fillRect(0,H*0.57,W,H*0.43);
      
      // FIELD SHADOW - perspektif depth
      ctx.fillStyle="rgba(0,0,0,0.08)";
      const shadowGrad=ctx.createLinearGradient(0,H*0.57,0,H);
      shadowGrad.addColorStop(0,"rgba(0,0,0,0.15)");
      shadowGrad.addColorStop(1,"rgba(0,0,0,0.02)");
      ctx.fillStyle=shadowGrad;
      ctx.fillRect(0,H*0.57,W,H*0.43);
      
      // FIELD LINES - integrated naturally
      ctx.strokeStyle="rgba(255,255,255,0.75)";ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();
      ctx.beginPath();ctx.moveTo(W/2,H*0.57);ctx.lineTo(W/2,gy);ctx.stroke();
      ctx.beginPath();ctx.arc(W/2,gy,W*0.09,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,0.7)";
      ctx.beginPath();ctx.arc(W/2,gy,2.5,0,Math.PI*2);ctx.fill();
      
      // PENALTY AREAS & BOXES
      ctx.strokeStyle="rgba(255,255,255,0.65)";ctx.lineWidth=1.8;
      const paW=W*0.18,paH=H*0.15;
      // Left area
      ctx.strokeRect(gw,gy-paH,paW,paH);
      ctx.beginPath();ctx.arc(gw+paW*0.55,gy-paH*0.28,W*0.018,0,Math.PI*2);ctx.stroke();
      // Right area
      ctx.strokeRect(W-gw-paW,gy-paH,paW,paH);
      ctx.beginPath();ctx.arc(W-gw-paW*0.55,gy-paH*0.28,W*0.018,0,Math.PI*2);ctx.stroke();
      
      // GOALS - integrated dengan lapangan
      for(let s=0;s<2;s++){
        const gx=s===0?0:W-gw;
        
        // Goal post - 3D look
        ctx.strokeStyle="#fff";ctx.lineWidth=3.5;
        ctx.strokeRect(gx,gy-gh,gw,gh);
        
        // Goal backing - depth
        ctx.fillStyle="rgba(255,255,255,0.08)";
        ctx.fillRect(gx,gy-gh,gw,gh);
        
        // Net - fine pattern
        ctx.strokeStyle="rgba(255,255,255,0.35)";ctx.lineWidth=0.8;
        for(let i=0;i<9;i++){
          const x=gx+(gw/9)*i;
          ctx.beginPath();ctx.moveTo(x,gy-gh);ctx.lineTo(x,gy);ctx.stroke();
        }
        for(let i=0;i<6;i++){
          const y=gy-gh+(gh/6)*i;
          ctx.beginPath();ctx.moveTo(gx,y);ctx.lineTo(gx+gw,y);ctx.stroke();
        }
        
        // Goal post corners - detail
        ctx.fillStyle="#fff";
        ctx.fillRect(gx-2,gy-gh-2,4,4);
        ctx.fillRect(gx+gw-2,gy-gh-2,4,4);
        ctx.fillRect(gx-2,gy-2,4,4);
        ctx.fillRect(gx+gw-2,gy-2,4,4);
      }
    }

    // ===== DRAW CHARACTER (POLISHED) =====
    function drawChar(p:any){
      const s=PS()*1.25,cx=p.x+s*0.8,fy=p.y,fl=p.fr?1:-1;
      ctx.save();ctx.translate(cx,fy);ctx.scale(fl,1);
      
      // Shadow - integrated dengan lapangan
      ctx.fillStyle="rgba(0,0,0,0.25)";
      ctx.beginPath();ctx.ellipse(0,s*0.58,s*0.8,s*0.16,0,0,Math.PI*2);ctx.fill();
      
      // Jersey/Body
      const jerseyColor=p.ai?"#e53935":"#1e88e5";
      ctx.fillStyle=jerseyColor;
      ctx.beginPath();ctx.ellipse(0,s*0.08,s*0.62,s*0.7,0,0,Math.PI*2);ctx.fill();
      
      // Jersey outline
      ctx.strokeStyle=p.ai?"#c62828":"#0d47a1";ctx.lineWidth=s*0.11;
      ctx.beginPath();ctx.ellipse(0,s*0.08,s*0.62,s*0.7,0,0,Math.PI*2);ctx.stroke();
      
      // Jersey stripe
      ctx.fillStyle="rgba(255,255,255,0.18)";
      ctx.fillRect(-s*0.1,s*-0.18,s*0.2,s*0.42);
      
      // Arms
      ctx.strokeStyle="#e8b896";ctx.lineWidth=s*0.43;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(-s*0.42,-s*0.08);ctx.lineTo(-s*0.95,-s*0.3);ctx.stroke();
      ctx.beginPath();ctx.moveTo(s*0.42,-s*0.08);ctx.lineTo(s*0.95,-s*0.3);ctx.stroke();
      
      // Hands
      ctx.fillStyle="#e8b896";
      ctx.beginPath();ctx.arc(-s*0.95,-s*0.3,s*0.21,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(s*0.95,-s*0.3,s*0.21,0,Math.PI*2);ctx.fill();
      
      // Head
      ctx.fillStyle="#e8b896";
      ctx.beginPath();ctx.arc(0,-s*0.92,s*0.42,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#d4a76a";ctx.lineWidth=s*0.09;
      ctx.beginPath();ctx.arc(0,-s*0.92,s*0.42,0,Math.PI*2);ctx.stroke();
      
      // Hair
      const hairColor=p.ai?"#5d4037":"#8d6e63";
      ctx.fillStyle=hairColor;
      ctx.beginPath();ctx.arc(0,-s*1.15,s*0.37,0,Math.PI);ctx.fill();
      ctx.beginPath();ctx.arc(-s*0.35,-s*1.02,s*0.2,0,Math.PI);ctx.fill();
      ctx.beginPath();ctx.arc(s*0.35,-s*1.02,s*0.2,0,Math.PI);ctx.fill();
      
      // Eyes
      ctx.fillStyle="#fff";
      ctx.beginPath();ctx.ellipse(-s*0.16,-s*0.94,s*0.15,s*0.17,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(s*0.16,-s*0.94,s*0.15,s*0.17,0,0,Math.PI*2);ctx.fill();
      
      // Pupils
      const eyeColor=p.ai?"#3d2817":"#1a5490";
      ctx.fillStyle=eyeColor;
      ctx.beginPath();ctx.arc(-s*0.16,-s*0.89,s*0.08,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(s*0.16,-s*0.89,s*0.08,0,Math.PI*2);ctx.fill();
      
      // Eye shine
      ctx.fillStyle="#fff";
      ctx.beginPath();ctx.arc(-s*0.12,-s*0.93,s*0.035,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(s*0.2,-s*0.93,s*0.035,0,Math.PI*2);ctx.fill();
      
      // Eyebrows
      ctx.strokeStyle="#8d6e63";ctx.lineWidth=s*0.075;ctx.lineCap="round";
      ctx.beginPath();ctx.arc(-s*0.16,-s*1.07,s*0.19,Math.PI,0);ctx.stroke();
      ctx.beginPath();ctx.arc(s*0.16,-s*1.07,s*0.19,Math.PI,0);ctx.stroke();
      
      // Nose
      ctx.strokeStyle="#d4a76a";ctx.lineWidth=s*0.065;
      ctx.beginPath();ctx.moveTo(0,-s*0.84);ctx.lineTo(0,-s*0.69);ctx.stroke();
      
      // Mouth
      ctx.strokeStyle="#000";ctx.lineWidth=s*0.085;ctx.lineCap="round";
      ctx.beginPath();ctx.arc(0,-s*0.58,s*0.13,0,Math.PI);ctx.stroke();
      
      // Legs
      ctx.strokeStyle="#2a2a2a";ctx.lineWidth=s*0.37;ctx.lineCap="round";
      const la=p.onG?Math.sin(Date.now()*0.013*Math.abs(p.vx))*s*0.3:0;
      const kx=p.kt>0?s*0.75:0,ky=p.kt>0?-s*0.42:0;
      ctx.beginPath();ctx.moveTo(-s*0.22,s*0.48);ctx.lineTo(-s*0.22+la,s*0.92);ctx.stroke();
      ctx.beginPath();ctx.moveTo(s*0.22,s*0.48);ctx.lineTo(s*0.22-la+kx,s*0.92+ky);ctx.stroke();
      
      // Shoes
      ctx.fillStyle="#1a1a1a";
      ctx.beginPath();ctx.ellipse(-s*0.22+la,s*1.0,s*0.27,s*0.15,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(s*0.22-la+kx,s*1.0+ky,s*0.27,s*0.15,0,0,Math.PI*2);ctx.fill();
      
      // Shoe accent
      ctx.fillStyle="rgba(255,255,255,0.35)";
      ctx.beginPath();ctx.ellipse(-s*0.22+la,s*0.94,s*0.2,s*0.09,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(s*0.22-la+kx,s*0.94+ky,s*0.2,s*0.09,0,0,Math.PI*2);ctx.fill();
      
      // Kick effect
      if(p.kt>0){
        ctx.fillStyle=`rgba(255,200,50,${0.65*(p.kt/14)})`;
        ctx.beginPath();ctx.arc(s*0.6,-s*0.16,s*0.4,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=`rgba(255,220,100,${0.4*(p.kt/14)})`;
        ctx.beginPath();ctx.arc(s*0.82,-s*0.08,s*0.3,0,Math.PI*2);ctx.fill();
      }
      
      ctx.restore();
    }

    // ===== DRAW BALL =====
    function drawBall(){
      const br=BR();
      
      // Trail
      trail.forEach((tr,i)=>{
        const a=(1-i/trail.length)*0.16;
        ctx.fillStyle=`rgba(255,255,255,${a})`;
        ctx.beginPath();ctx.arc(tr.x,tr.y,br*0.85,0,Math.PI*2);ctx.fill();
      });
      
      // Shadow
      ctx.fillStyle="rgba(0,0,0,0.15)";
      ctx.beginPath();ctx.ellipse(ball.x,GY(),br*1.3,br*0.26,0,0,Math.PI*2);ctx.fill();
      
      // Ball
      ctx.fillStyle="#fff";
      ctx.beginPath();ctx.arc(ball.x,ball.y,br,0,Math.PI*2);ctx.fill();
      
      // Ball outline
      ctx.strokeStyle="#000";ctx.lineWidth=br*0.16;
      ctx.beginPath();ctx.arc(ball.x,ball.y,br,0,Math.PI*2);ctx.stroke();
      
      // Soccer ball pattern
      ctx.fillStyle="#000";ctx.strokeStyle="#000";ctx.lineWidth=br*0.085;
      const hexSize=br*0.36;
      ctx.save();ctx.translate(ball.x,ball.y);ctx.rotate(ball.rot);
      for(let i=0;i<6;i++){
        const angle=(i/6)*Math.PI*2;
        const x=Math.cos(angle)*hexSize;
        const y=Math.sin(angle)*hexSize;
        ctx.beginPath();
        for(let j=0;j<6;j++){
          const a=(j/6)*Math.PI*2;
          const px=x+Math.cos(a)*br*0.15;
          const py=y+Math.sin(a)*br*0.15;
          if(j===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
        }
        ctx.closePath();ctx.stroke();
      }
      ctx.restore();
    }

    function loop(){
      if(!over&&gft===0){
        const Ki=K.current,sp=W*0.006;
        if(Ki.left){p1.vx=-sp;p1.fr=false;}else if(Ki.right){p1.vx=sp;p1.fr=true;}else p1.vx*=0.72;
        if(Ki.jump&&!prevJ.current&&p1.jc<2){p1.vy=-H*0.033;p1.onG=false;p1.jc++;}
        if(Ki.kick&&!prevK.current)doKick(p1);
        prevJ.current=Ki.jump;prevK.current=Ki.kick;
        const sp2=W*0.005,cx2=p2.x+PS();
        if(Math.abs(ball.x-cx2)>PS()){p2.vx=ball.x<cx2?-sp2:sp2;p2.fr=ball.x>cx2;}else p2.vx*=0.62;
        if(ball.y<GY()-H*0.1&&p2.onG&&Math.abs(ball.x-cx2)<W*0.22&&Math.random()<0.04){p2.vy=-H*0.033;p2.onG=false;p2.jc=1;}
        if(Math.random()<0.048)doKick(p2);
        physP(p1);physP(p2);physBall();collide(p1);collide(p2);
        if(gft>0)gft--;
        const now=Date.now();
        if(now-pSec>=1000){pSec=now;if(tl>0){tl--;setTimeLeft(tl);}else endGame();}
      }
      const c=canvasRef.current;if(!c)return;
      ctx.clearRect(0,0,W,H);
      drawScene();drawChar(p1);drawChar(p2);drawBall();
      
      // Score display
      ctx.fillStyle="rgba(0,0,0,0.6)";ctx.fillRect(W*0.28,H*0.01,W*0.44,H*0.075);
      ctx.fillStyle="#fff";ctx.font=`bold ${W*0.058}px Arial`;ctx.textAlign="center";
      ctx.fillText(`${sc[0]}`,W*0.365,H*0.075);
      ctx.fillText(`${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,'0')}`,W*0.5,H*0.075);
      ctx.fillText(`${sc[1]}`,W*0.635,H*0.075);
      
      // Goal flash
      if(gft>0){
        ctx.fillStyle=`rgba(255,220,50,${(gft/85)*0.28})`;ctx.fillRect(0,0,W,H);
        if(gft>55){ctx.fillStyle="rgba(255,220,50,0.95)";ctx.font=`900 ${W*0.15}px Arial`;ctx.textAlign="center";ctx.fillText("GOAL!",W/2,H/2);}
      }
      
      raf=requestAnimationFrame(loop);
    }
    loop();

    const km:Record<string,string>={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"jump",w:"jump",W:"jump",ArrowDown:"kick",s:"kick",S:"kick"};
    const kd=(e:KeyboardEvent)=>{if(km[e.key]){e.preventDefault();(K.current as any)[km[e.key]]=true;}};
    const ku=(e:KeyboardEvent)=>{if(km[e.key])(K.current as any)[km[e.key]]=false;};
    window.addEventListener("keydown",kd);window.addEventListener("keyup",ku);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku);window.removeEventListener("resize",()=>{});};
  },[]);

  return(
    <div style={{width:"100vw",height:"100vh",display:"flex",flexDirection:"column",background:"#000",overflow:"hidden"}}>
      <div style={{flex:1,position:"relative"}}>
        <canvas ref={canvasRef} style={{width:"100%",height:"100%",display:"block"}}/>
      </div>
      <div style={{padding:"12px",textAlign:"center",color:"#fff",fontSize:"13px",background:"rgba(0,0,0,0.85)"}}>
        ← → Move | ↑/W Jump | ↓/S Kick | ESC Exit
      </div>
    </div>
  );
}
