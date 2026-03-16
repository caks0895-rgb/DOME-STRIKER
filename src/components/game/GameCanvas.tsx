"use client";
import { useEffect, useRef, useState } from "react";

async function lockLandscape() {
  try { const o=window.screen?.orientation as any; if(o?.lock) await o.lock("landscape"); } catch {}
}
async function unlockOrientation() {
  try { const o=window.screen?.orientation as any; if(o?.unlock) o.unlock(); } catch {}
}

const WIN_GOALS = 10;
const CPU_RATING = 1050;

function calcElo(myRating:number, oppRating:number, result:"win"|"loss"|"draw"){
  const K=30;
  const expected=1/(1+Math.pow(10,(oppRating-myRating)/400));
  const actual=result==="win"?1:result==="draw"?0.5:0;
  return Math.round(K*(actual-expected));
}
function calcCoins(result:"win"|"loss"|"draw", goals:number){
  const base=result==="win"?100:result==="draw"?40:20;
  return base+Math.floor(goals*8);
}

export default function GameCanvas({ onExit, player }: { onExit:()=>void; player:any }) {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const K=useRef({left:false,right:false,jump:false,kick:false});
  const prevJ=useRef(false);
  const prevK=useRef(false);
  const [score,setScore]=useState([0,0]);
  const [timeLeft,setTimeLeft]=useState(90);
  const [gameOver,setGameOver]=useState(false);
  const [isPortrait,setIsPortrait]=useState(false);
  const [matchResult,setMatchResult]=useState<{
    outcome:"win"|"loss"|"draw";coinsEarned:number;ratingChange:number;newRating:number;playerGoals:number;
  }|null>(null);

  useEffect(()=>{
    lockLandscape();
    function chk(){setIsPortrait(window.innerHeight>window.innerWidth);}
    chk();
    window.addEventListener("orientationchange",chk);
    window.addEventListener("resize",chk);
    return()=>{unlockOrientation();window.removeEventListener("orientationchange",chk);window.removeEventListener("resize",chk);};
  },[]);

  useEffect(()=>{
    const canvas=canvasRef.current!;
    const ctx=canvas.getContext("2d")!;
    let raf:number, W=0, H=0, t=0;

    function resize(){W=canvas.offsetWidth;H=canvas.offsetHeight;canvas.width=W;canvas.height=H;}
    resize();
    window.addEventListener("resize",()=>{resize();reset();});

    const GY=()=>H*0.71,GW_=()=>Math.max(48,W*0.085),GH_=()=>Math.min(108,H*0.21),BR=()=>Math.max(12,W*0.023),PS=()=>Math.max(17,W*0.037);
    const GRAV=0.46;
    let ball={x:0,y:0,vx:0,vy:0,rot:0,spin:0};
    let p1:any,p2:any,sc=[0,0],tl=90,over=false,gft=0,pSec=Date.now();

    function spawnBall(){ball={x:W/2,y:GY()-H*0.22,vx:(Math.random()-0.5)*3,vy:-5,rot:0,spin:0};}
    function mkP(side:number){return{x:side===0?W*0.2:W*0.72,y:GY(),vx:0,vy:0,onG:true,jc:0,kt:0,ai:side===1,col:side===0?"#e63946":"#3b82f6",faceR:side===0};}
    function reset(){spawnBall();p1=mkP(0);p2=mkP(1);}
    reset();

    function endGame(){
      if(over)return;
      over=true;
      const outcome:("win"|"loss"|"draw")=sc[0]>sc[1]?"win":sc[1]>sc[0]?"loss":"draw";
      const myRating=player?.rating??1000;
      const ratingChange=calcElo(myRating,CPU_RATING,outcome);
      setMatchResult({outcome,coinsEarned:calcCoins(outcome,sc[0]),ratingChange,newRating:myRating+ratingChange,playerGoals:sc[0]});
      setGameOver(true);
    }

    function doKick(p:any){
      const cx=p.x+PS(),cy=p.y-PS()*1.85,dx=ball.x-cx,dy=ball.y-cy,d=Math.sqrt(dx*dx+dy*dy);
      p.kt=14;
      if(d<BR()+PS()*2.6){
        const sp=W*0.02,a=Math.atan2(dy,dx);
        ball.vx=Math.cos(a)*sp*(p.faceR?1.35:0.9);
        ball.vy=Math.sin(a)*sp-H*0.008;
        ball.spin=(p.faceR?1:-1)*10;
      }
    }
    function physP(p:any){
      p.vy+=GRAV;p.x+=p.vx;p.y+=p.vy;
      if(p.y>=GY()){p.y=GY();p.vy=0;p.onG=true;p.jc=0;}
      if(p.x<GW_()+2)p.x=GW_()+2;
      if(p.x>W-GW_()-PS()*2.1)p.x=W-GW_()-PS()*2.1;
      if(p.kt>0)p.kt--;
    }
    function physBall(){
      ball.vy+=GRAV*0.78;ball.vx*=0.994;ball.vy*=0.995;ball.spin*=0.97;
      ball.rot+=ball.spin*0.025+(ball.vx*0.025);
      ball.x+=ball.vx;ball.y+=ball.vy;
      if(ball.y+BR()>=GY()){ball.y=GY()-BR();ball.vy*=-0.63;ball.vx*=0.88;ball.spin*=-0.5;}
      if(ball.y-BR()<=H*0.15){ball.y=H*0.15+BR();ball.vy*=-0.5;}
      if(ball.x-BR()<=GW_()){if(ball.y>=GY()-GH_()){goal(1);return;}ball.x=GW_()+BR();ball.vx*=-0.72;}
      if(ball.x+BR()>=W-GW_()){if(ball.y>=GY()-GH_()){goal(0);return;}ball.x=W-GW_()-BR();ball.vx*=-0.72;}
    }
    function collide(p:any){
      const cx=p.x+PS(),cy=p.y-PS()*1.85,dx=ball.x-cx,dy=ball.y-cy,d=Math.sqrt(dx*dx+dy*dy),mn=BR()+PS()*1.45;
      if(d<mn&&d>0.01){const nx=dx/d,ny=dy/d,ov=mn-d;ball.x+=nx*ov;ball.y+=ny*ov;const rv=(ball.vx-p.vx)*nx+(ball.vy-p.vy)*ny;if(rv<0){ball.vx-=1.5*rv*nx;ball.vy-=1.5*rv*ny;}}
    }
    function goal(who:number){
      if(gft>0||over)return;
      sc[who]++;gft=85;
      setScore([sc[0],sc[1]]);
      if(sc[0]>=WIN_GOALS||sc[1]>=WIN_GOALS){setTimeout(()=>endGame(),1400);return;}
      setTimeout(()=>{reset();gft=0;},1400);
    }

    function ltn(h:string,a:number){let r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`rgb(${Math.min(255,r+a)},${Math.min(255,g+a)},${Math.min(255,b+a)})`;}
    function dkn(h:string,a:number){let r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`rgb(${Math.max(0,r-a)},${Math.max(0,g-a)},${Math.max(0,b-a)})`;}

    // ===== HIGH QUALITY DRAWING =====
    function drawBg(){
      t+=0.008;
      // Deep night sky
      const sky=ctx.createLinearGradient(0,0,0,H*0.58);
      sky.addColorStop(0,"#04020f");sky.addColorStop(0.4,"#0d0828");sky.addColorStop(0.7,"#1a0e4a");sky.addColorStop(1,"#2a1878");
      ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

      // Stars with twinkle
      for(let i=0;i<80;i++){
        const blink=Math.sin(t*1.5+i*2.1)*0.4+0.6;
        ctx.globalAlpha=blink*0.65;
        ctx.fillStyle=i%8===0?"#ffe0b0":"#ffffff";
        ctx.beginPath();ctx.arc((i*173+40)%W,(i*97+8)%(H*0.42),i%5===0?1.4:0.8,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;

      // Moon
      const mg=ctx.createRadialGradient(W*0.88,H*0.08,0,W*0.88,H*0.08,W*0.038);
      mg.addColorStop(0,"#fffff0");mg.addColorStop(0.6,"#ffe8a0");mg.addColorStop(1,"rgba(255,220,100,0)");
      ctx.fillStyle=mg;ctx.beginPath();ctx.arc(W*0.88,H*0.08,W*0.038,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=0.06;ctx.beginPath();ctx.arc(W*0.88,H*0.08,W*0.075,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;

      // Detailed buildings
      const blds=[
        {rx:0,rw:.07,rh:.30},{rx:.06,rw:.05,rh:.22},{rx:.10,rw:.08,rh:.34},{rx:.17,rw:.06,rh:.26},
        {rx:.22,rw:.04,rh:.18},{rx:.65,rw:.06,rh:.26},{rx:.70,rw:.08,rh:.32},
        {rx:.77,rw:.05,rh:.20},{rx:.81,rw:.07,rh:.30},{rx:.87,rw:.06,rh:.24},{rx:.92,rw:.08,rh:.28},
      ];
      blds.forEach(b=>{
        const bx=b.rx*W,bw=b.rw*W,bh=b.rh*H,by=H*0.56-bh;
        ctx.fillStyle="rgba(0,0,0,0.25)";ctx.fillRect(bx+3,by+3,bw,bh);
        ctx.fillStyle="#0d0820";ctx.fillRect(bx,by,bw,bh);
        ctx.fillStyle="rgba(255,255,255,0.04)";ctx.fillRect(bx,by,bw,4);
        ctx.fillStyle="rgba(255,255,255,0.03)";ctx.fillRect(bx,by,2,bh);
        const cols=Math.max(2,Math.floor(bw/12)),rows=Math.max(3,Math.floor(bh/14));
        for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
          if(Math.sin(t*0.2+r*7.3+c*11.7+b.rx*100)>0.0){
            ctx.fillStyle=Math.sin(r+c+b.rx)>0?"rgba(255,210,80,0.8)":"rgba(180,220,255,0.6)";
            ctx.fillRect(bx+bw*(c+0.5)/(cols+1)-3.5,by+r*(bh/rows)+4,7,5);
          }
        }
      });

      // Floodlights with glow
      [[W*0.29,H*0.36],[W*0.71,H*0.36]].forEach(([fx,fy])=>{
        ctx.strokeStyle="#3a3a4a";ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(fx,fy+H*0.16);ctx.lineTo(fx,fy);ctx.lineTo(fx+W*0.055,fy);ctx.stroke();
        for(let i=0;i<6;i++){
          const lx=fx+W*0.015+i*W*0.008;
          ctx.save();ctx.globalAlpha=0.04+Math.sin(t+i)*0.01;
          const cg=ctx.createRadialGradient(lx,fy,0,lx,fy,H*0.35);
          cg.addColorStop(0,"rgba(255,240,180,1)");cg.addColorStop(1,"rgba(255,240,180,0)");
          ctx.fillStyle=cg;ctx.beginPath();ctx.arc(lx,fy,H*0.35,0,Math.PI*2);ctx.fill();
          ctx.restore();
          ctx.fillStyle="#ffe566";ctx.beginPath();ctx.arc(lx,fy,W*0.006,0,Math.PI*2);ctx.fill();
          ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(lx,fy,W*0.003,0,Math.PI*2);ctx.fill();
        }
      });
    }

    function drawPitch(){
      const gy=GY(),gw=GW_(),gh=GH_();
      const standY=gy-gh-H*0.1,standH=H*0.1;

      // Stadium wall
      ctx.fillStyle="#0a0820";ctx.fillRect(gw-8,standY-4,W-gw*2+16,standH+gh+12);

      // Colored stands with crowd dots
      const stands=[
        {x:gw,w:W*.13,c:"#1a4060"},{x:gw+W*.13,w:W*.08,c:"#7a5a00"},
        {x:gw+W*.21,w:W*.24,c:"#0a4030"},{x:gw+W*.45,w:W*.12,c:"#5a1020"},
        {x:gw+W*.57,w:W*.13,c:"#1a2060"},{x:gw+W*.70,w:W*.08,c:"#7a3a00"},
        {x:gw+W*.78,w:W*.09,c:"#3a1050"},
      ];
      stands.forEach(s=>{
        const sg=ctx.createLinearGradient(0,standY,0,standY+standH);
        sg.addColorStop(0,s.c);sg.addColorStop(1,dkn(s.c,30));
        ctx.fillStyle=sg;ctx.fillRect(s.x,standY,s.w,standH);
        // Crowd
        const dotW=Math.floor(s.w/7);
        for(let r=0;r<4;r++)for(let d=0;d<dotW;d++){
          ctx.fillStyle=`rgba(255,255,255,${0.06+Math.random()*0.06})`;
          ctx.beginPath();ctx.arc(s.x+d*7+3,standY+r*(standH/4)+6,2.5,0,Math.PI*2);ctx.fill();
        }
        ctx.fillStyle="rgba(255,255,255,0.05)";ctx.fillRect(s.x,standY,s.w,3);
      });

      // Pitch grass with gradient
      const grass=ctx.createLinearGradient(0,standY+standH,0,gy);
      grass.addColorStop(0,"#2d8a44");grass.addColorStop(0.5,"#27ae60");grass.addColorStop(1,"#1e8449");
      ctx.fillStyle=grass;ctx.fillRect(gw,standY+standH,W-gw*2,gy-(standY+standH)+H*0.3);

      // Grass stripes
      const sw=(W-gw*2)/12;
      for(let i=0;i<12;i++){
        ctx.fillStyle=i%2===0?"rgba(0,0,0,0.06)":"rgba(255,255,255,0.03)";
        ctx.fillRect(gw+i*sw,standY+standH,sw,gy-(standY+standH)+H*0.3);
      }

      // Pitch markings
      ctx.strokeStyle="rgba(255,255,255,0.75)";ctx.lineWidth=2;
      const pitchY=standY+standH;
      ctx.strokeRect(gw+4,pitchY+2,W-gw*2-8,gy-pitchY-4);
      ctx.beginPath();ctx.moveTo(W/2,pitchY+2);ctx.lineTo(W/2,gy);ctx.stroke();
      const cr=Math.min(H*0.1,W*0.075);
      ctx.beginPath();ctx.arc(W/2,gy,cr,Math.PI,0);ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,0.75)";ctx.beginPath();ctx.arc(W/2,gy,3,0,Math.PI*2);ctx.fill();
      // Penalty areas
      const paW=W*0.14,paH=H*0.1;
      ctx.strokeRect(gw+4,gy-paH,paW,paH);ctx.strokeRect(W-gw-4-paW,gy-paH,paW,paH);
      // Penalty spots
      ctx.fillStyle="rgba(255,255,255,0.6)";
      ctx.beginPath();ctx.arc(gw+4+paW*0.55,gy-paH*0.3,2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(W-gw-4-paW*0.55,gy-paH*0.3,2,0,Math.PI*2);ctx.fill();

      // Goals — detailed with 3D posts
      for(let s=0;s<2;s++){
        const gx=s===0?0:W-gw,px=s===0?gw:W-gw;
        // Shadow
        ctx.fillStyle="rgba(0,0,0,0.2)";ctx.fillRect(gx+3,gy-gh+3,gw,gh);
        // Net gradient
        const ng=ctx.createLinearGradient(gx,gy-gh,gx+gw,gy);
        ng.addColorStop(0,"rgba(200,200,200,0.07)");ng.addColorStop(1,"rgba(150,150,150,0.14)");
        ctx.fillStyle=ng;ctx.fillRect(gx,gy-gh,gw,gh);
        // Net hexagonal
        ctx.save();ctx.beginPath();ctx.rect(gx,gy-gh,gw,gh);ctx.clip();
        ctx.strokeStyle="rgba(255,255,255,0.18)";ctx.lineWidth=0.7;
        const cs=11;
        for(let row=0;row*cs<gh+cs;row++)for(let col=0;col*cs<gw+cs;col++){
          ctx.beginPath();ctx.arc(gx+col*cs+(row%2)*cs*0.5,gy-gh+row*cs,cs*0.48,0,Math.PI*2);ctx.stroke();
        }
        ctx.restore();
        // 3D Post
        ctx.fillStyle="rgba(0,0,0,0.25)";ctx.fillRect(px-2,gy-gh-2,9,gh+3);
        const pg=ctx.createLinearGradient(px-5,0,px+5,0);
        pg.addColorStop(0,"#a0a8b0");pg.addColorStop(0.4,"#ffffff");pg.addColorStop(1,"#c0c8d0");
        ctx.fillStyle=pg;ctx.fillRect(px-5,gy-gh-5,10,gh+5);
        // Crossbar
        const bg2=ctx.createLinearGradient(0,gy-gh-5,0,gy-gh+5);
        bg2.addColorStop(0,"#a0a8b0");bg2.addColorStop(0.5,"#ffffff");bg2.addColorStop(1,"#c0c8d0");
        ctx.fillStyle=bg2;ctx.fillRect(gx-1,gy-gh-5,gw+2,10);
      }

      // Ground
      const gg=ctx.createLinearGradient(0,gy,0,H);
      gg.addColorStop(0,"#1e8449");gg.addColorStop(0.3,"#166334");gg.addColorStop(1,"#0a2214");
      ctx.fillStyle=gg;ctx.fillRect(0,gy,W,H-gy);
      ctx.fillStyle="rgba(0,0,0,0.18)";ctx.fillRect(0,gy,W,4);
    }

    function drawChar(p:any){
      const s=PS(),cx=p.x+s,fy=p.y,fl=p.faceR?1:-1;
      // Shadow
      ctx.save();ctx.globalAlpha=0.25;ctx.fillStyle="#000";
      ctx.beginPath();ctx.ellipse(cx,GY(),s*1.1,s*0.22,0,0,Math.PI*2);ctx.fill();ctx.restore();

      ctx.save();ctx.translate(cx,fy);ctx.scale(fl,1);

      // Body with shine
      const bg=ctx.createRadialGradient(-s*.3,-s*.5,s*.05,0,0,s*1.1);
      bg.addColorStop(0,ltn(p.col,65));bg.addColorStop(0.5,p.col);bg.addColorStop(1,dkn(p.col,25));
      ctx.fillStyle=bg;ctx.beginPath();ctx.ellipse(0,-s*.52,s*.7,s*.84,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.12)";ctx.beginPath();ctx.ellipse(-s*.15,-s*.7,s*.35,s*.5,-.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.15)";ctx.beginPath();ctx.ellipse(0,-s*.52,s*.16,s*.84,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.85)";ctx.font=`900 ${s*.58}px sans-serif`;ctx.textAlign="center";ctx.fillText(p.ai?"2":"1",0,-s*.28);

      // Neck
      ctx.fillStyle="#c8845a";ctx.fillRect(-s*.13,-(s*1.52+s*1.2*.72),s*.26,s*.4);

      // Big head with highlight
      const hr=s*1.2,hcy=-(s*1.52+hr*.72);
      const hg=ctx.createRadialGradient(-hr*.3,-hr*.3,hr*.05,-hr*.05,-hr*.05,hr*1.1);
      hg.addColorStop(0,"#ffd0a0");hg.addColorStop(0.5,"#e8956a");hg.addColorStop(1,"#c07040");
      ctx.fillStyle=hg;ctx.beginPath();ctx.arc(0,hcy,hr,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.15)";ctx.beginPath();ctx.arc(-hr*.2,hcy-hr*.2,hr*.42,0,Math.PI*2);ctx.fill();

      // Hair
      if(!p.ai){
        ctx.fillStyle="#1c1008";ctx.beginPath();ctx.arc(0,hcy,hr,Math.PI*1.05,Math.PI*1.95);ctx.fill();
        for(let i=0;i<6;i++){
          const sa=Math.PI+i*.175;
          ctx.beginPath();ctx.moveTo(Math.cos(sa)*hr*.88,Math.sin(sa)*hr*.88+hcy);
          ctx.lineTo(Math.cos(sa+.06)*hr*1.58,Math.sin(sa+.06)*hr*1.58+hcy);
          ctx.lineTo(Math.cos(sa+.14)*hr*.88,Math.sin(sa+.14)*hr*.88+hcy);ctx.fill();
        }
      } else {
        ctx.fillStyle="#7a4828";ctx.beginPath();ctx.arc(0,hcy,hr,Math.PI*.85,Math.PI*2.15);ctx.fill();
        ctx.fillStyle="#6b3a1f";ctx.beginPath();ctx.ellipse(s*.38,hcy+s*.4,s*.22,s*.78,.28,0,Math.PI*2);ctx.fill();
      }

      // Eyes
      const ey=hcy-s*.05;
      ctx.fillStyle="rgba(0,0,0,0.1)";ctx.beginPath();ctx.ellipse(hr*.28,ey+1,hr*.22,hr*.25,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(0,0,0,0.1)";ctx.beginPath();ctx.ellipse(-hr*.17,ey+1,hr*.22,hr*.25,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(hr*.27,ey,hr*.22,hr*.25,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(-hr*.17,ey,hr*.22,hr*.25,0,0,Math.PI*2);ctx.fill();
      const ic=p.ai?"#1a4a7a":"#1a3a10";
      ctx.fillStyle=ic;ctx.beginPath();ctx.arc(hr*.29,ey,hr*.15,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=ic;ctx.beginPath();ctx.arc(-hr*.15,ey,hr*.15,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#000";ctx.beginPath();ctx.arc(hr*.31,ey,hr*.08,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#000";ctx.beginPath();ctx.arc(-hr*.13,ey,hr*.08,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.9)";
      ctx.beginPath();ctx.arc(hr*.36,ey-hr*.08,hr*.045,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(-hr*.08,ey-hr*.08,hr*.045,0,Math.PI*2);ctx.fill();
      // Eyebrows
      ctx.strokeStyle="#3d1f00";ctx.lineWidth=s*.1;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(hr*.1,ey-hr*.29);ctx.lineTo(hr*.45,ey-hr*.21);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-hr*.04,ey-hr*.29);ctx.lineTo(-hr*.4,ey-hr*.21);ctx.stroke();
      // Nose
      ctx.strokeStyle="rgba(90,40,0,0.3)";ctx.lineWidth=s*.07;
      ctx.beginPath();ctx.moveTo(hr*.05,hcy+hr*.05);ctx.lineTo(hr*.12,hcy+hr*.18);ctx.lineTo(0,hcy+hr*.18);ctx.stroke();
      // Mouth
      ctx.strokeStyle="#6b2000";ctx.lineWidth=s*.1;ctx.lineCap="round";
      if(p.kt>0){
        ctx.fillStyle="#6b2000";ctx.beginPath();ctx.ellipse(0,hcy+hr*.38,hr*.17,hr*.12,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(0,hcy+hr*.35,hr*.1,hr*.05,0,0,Math.PI*2);ctx.fill();
      } else {
        ctx.beginPath();ctx.arc(0,hcy+hr*.2,hr*.2,.18,Math.PI-.18);ctx.stroke();
      }

      // Shorts
      const sg2=ctx.createRadialGradient(-s*.1,s*.2,0,0,s*.28,s*.65);
      sg2.addColorStop(0,ltn(dkn(p.col,20),20));sg2.addColorStop(1,dkn(p.col,50));
      ctx.fillStyle=sg2;ctx.beginPath();ctx.ellipse(0,s*.26,s*.6,s*.28,0,0,Math.PI*2);ctx.fill();

      // Legs
      const la=p.onG?Math.sin(Date.now()*.013*Math.abs(p.vx))*s*.52:0,kx=p.kt>0?s*1.08:0,ky=p.kt>0?-s*.4:0;
      ctx.strokeStyle="#c8845a";ctx.lineWidth=s*.42;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(-s*.26,s*.38);ctx.lineTo(-s*.33+la,s*.96);ctx.stroke();
      ctx.beginPath();ctx.moveTo(s*.26,s*.38);ctx.lineTo(s*.33-la+kx,s*.96+ky);ctx.stroke();
      ctx.strokeStyle="rgba(255,255,255,0.9)";ctx.lineWidth=s*.38;
      ctx.beginPath();ctx.moveTo(-s*.33+la,s*.76);ctx.lineTo(-s*.35+la,s*.94);ctx.stroke();
      ctx.beginPath();ctx.moveTo(s*.33-la+kx,s*.76+ky);ctx.lineTo(s*.35-la+kx,s*.94+ky);ctx.stroke();
      // Shoes with shine
      const shg=ctx.createLinearGradient(-s*.4,s*.95,s*.4,s*1.05);
      shg.addColorStop(0,"#1a1a1a");shg.addColorStop(0.5,"#333");shg.addColorStop(1,"#111");
      ctx.fillStyle=shg;
      ctx.beginPath();ctx.ellipse(-s*.35+la,s*1.0,s*.38,s*.17,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(s*.35-la+kx,s*1.0+ky,s*.38,s*.17,p.kt>0?-.38:0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.15)";
      ctx.beginPath();ctx.ellipse(-s*.26+la,s*.97,s*.15,s*.07,-.2,0,Math.PI*2);ctx.fill();

      ctx.restore();
    }

    function drawBall(){
      const br=BR();
      ctx.save();ctx.globalAlpha=0.25;ctx.fillStyle="#000";
      ctx.beginPath();ctx.ellipse(ball.x,GY(),br*1.1,br*0.22,0,0,Math.PI*2);ctx.fill();ctx.restore();
      ctx.save();ctx.translate(ball.x,ball.y);ctx.rotate(ball.rot);
      // Ball gradient
      const bg=ctx.createRadialGradient(-br*.3,-br*.35,br*.04,br*.05,br*.05,br*1.1);
      bg.addColorStop(0,"#ffffff");bg.addColorStop(0.35,"#eeeeee");bg.addColorStop(0.7,"#cccccc");bg.addColorStop(1,"#999999");
      ctx.fillStyle=bg;ctx.beginPath();ctx.arc(0,0,br,0,Math.PI*2);ctx.fill();
      // Pentagons
      ctx.fillStyle="#111111";
      for(let i=0;i<5;i++){
        const a=(i/5)*Math.PI*2-Math.PI/2,px=Math.cos(a)*br*.5,py=Math.sin(a)*br*.5;
        ctx.beginPath();
        for(let j=0;j<5;j++){const ba=a+(j/5)*Math.PI*2;j===0?ctx.moveTo(px+Math.cos(ba)*br*.28,py+Math.sin(ba)*br*.28):ctx.lineTo(px+Math.cos(ba)*br*.28,py+Math.sin(ba)*br*.28);}
        ctx.closePath();ctx.fill();
      }
      ctx.beginPath();
      for(let j=0;j<5;j++){const ba=(j/5)*Math.PI*2-Math.PI/2;j===0?ctx.moveTo(Math.cos(ba)*br*.28,Math.sin(ba)*br*.28):ctx.lineTo(Math.cos(ba)*br*.28,Math.sin(ba)*br*.28);}
      ctx.closePath();ctx.fill();
      // Double shine
      ctx.fillStyle="rgba(255,255,255,0.65)";ctx.beginPath();ctx.ellipse(-br*.28,-br*.32,br*.28,br*.17,-.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.2)";ctx.beginPath();ctx.ellipse(-br*.1,-br*.45,br*.12,br*.07,-.3,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }

    function loop(){
      if(!over&&gft===0){
        const Ki=K.current,sp=W*.006;
        if(Ki.left){p1.vx=-sp;p1.faceR=false;}else if(Ki.right){p1.vx=sp;p1.faceR=true;}else p1.vx*=.72;
        if(Ki.jump&&!prevJ.current&&p1.jc<2){p1.vy=-H*.032;p1.onG=false;p1.jc++;}
        if(Ki.kick&&!prevK.current)doKick(p1);
        prevJ.current=Ki.jump;prevK.current=Ki.kick;
        const sp2=W*.005,cx2=p2.x+PS();
        if(Math.abs(ball.x-cx2)>PS()){p2.vx=ball.x<cx2?-sp2:sp2;p2.faceR=ball.x>cx2;}else p2.vx*=.62;
        if(ball.y<GY()-H*.1&&p2.onG&&Math.abs(ball.x-cx2)<W*.22&&Math.random()<.04){p2.vy=-H*.032;p2.onG=false;p2.jc=1;}
        if(Math.random()<.048)doKick(p2);
        physP(p1);physP(p2);physBall();collide(p1);collide(p2);
        if(gft>0)gft--;
        const now=Date.now();
        if(now-pSec>=1000){pSec=now;if(tl>0){tl--;setTimeLeft(tl);}else endGame();}
      }
      ctx.clearRect(0,0,W,H);
      drawBg();drawPitch();drawChar(p1);drawChar(p2);drawBall();
      raf=requestAnimationFrame(loop);
    }
    loop();

    const km:Record<string,string>={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"jump",w:"jump",W:"jump",ArrowDown:"kick",s:"kick",S:"kick"};
    const kd=(e:KeyboardEvent)=>{if(km[e.key]){e.preventDefault();(K.current as any)[km[e.key]]=true;}};
    const ku=(e:KeyboardEvent)=>{if(km[e.key])(K.current as any)[km[e.key]]=false;};
    window.addEventListener("keydown",kd);window.addEventListener("keyup",ku);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku);};
  },[]);

  const handleExit=()=>{unlockOrientation();onExit();};
  const bindBtn=(prop:string)=>({
    onPointerDown:(e:React.PointerEvent)=>{e.preventDefault();(K.current as any)[prop]=true;},
    onPointerUp:(e:React.PointerEvent)=>{e.preventDefault();(K.current as any)[prop]=false;},
    onPointerLeave:()=>{(K.current as any)[prop]=false;},
    onPointerCancel:()=>{(K.current as any)[prop]=false;},
  });
  const Btn=({label,prop,col}:{label:string;prop:string;col?:string})=>(
    <div {...bindBtn(prop)} style={{width:56,height:56,borderRadius:"50%",background:col||"rgba(20,15,70,0.9)",border:"2px solid rgba(255,255,255,0.2)",boxShadow:"0 4px 14px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.12)",color:"#fff",fontSize:22,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",userSelect:"none",WebkitUserSelect:"none",touchAction:"none"}}>
      {label}
    </div>
  );

  if(isPortrait) return (
    <div style={{position:"fixed",inset:0,background:"#0d0b1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,zIndex:999}}>
      <div style={{fontSize:80,animation:"rot 1.5s ease-in-out infinite"}}>📱</div>
      <div style={{fontSize:22,fontWeight:900,color:"#fff"}}>Rotate Your Phone</div>
      <div style={{fontSize:14,color:"rgba(255,255,255,0.5)",textAlign:"center",maxWidth:260}}>Turn your phone sideways for the best experience!</div>
      <button onClick={handleExit} style={{marginTop:12,padding:"10px 24px",borderRadius:12,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.6)",fontWeight:700,fontSize:14,cursor:"pointer"}}>Back to Menu</button>
      <style>{`@keyframes rot{0%{transform:rotate(0deg)}30%{transform:rotate(-90deg)}60%{transform:rotate(-90deg)}100%{transform:rotate(0deg)}}`}</style>
    </div>
  );

  const GoalBar=({goals}:{goals:number})=>{
    const pct=Math.min(100,(goals/WIN_GOALS)*100);
    const col=goals>=WIN_GOALS?"#22c55e":goals>=7?"#f59e0b":"#6c3fff";
    return(
      <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
        <div style={{width:56,height:4,background:"rgba(255,255,255,0.15)",borderRadius:4,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:col,borderRadius:4,transition:"width 0.3s"}}/>
        </div>
        <span style={{fontSize:9,color:"rgba(255,255,255,0.45)",fontWeight:700}}>{goals}/{WIN_GOALS}</span>
      </div>
    );
  };

  return (
    <div style={{position:"fixed",inset:0,background:"#0d0b1e",display:"flex",flexDirection:"column"}}>
      {/* HUD */}
      <div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",zIndex:10,background:"rgba(10,8,32,0.92)",border:"1px solid rgba(108,63,255,0.35)",borderRadius:16,padding:"6px 20px",textAlign:"center",pointerEvents:"none",minWidth:210,backdropFilter:"blur(10px)",boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:18}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:9,fontWeight:800,color:"rgba(255,100,100,0.8)",letterSpacing:1,fontFamily:"sans-serif"}}>YOU</div>
            <div style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1,fontFamily:"sans-serif"}}>{score[0]}</div>
            <GoalBar goals={score[0]}/>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:1,fontWeight:700,fontFamily:"sans-serif"}}>DOME STRIKER</div>
            <div style={{fontSize:15,fontWeight:900,color:"#a78bfa",fontFamily:"sans-serif"}}>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}</div>
            <div style={{fontSize:8,color:"rgba(255,255,255,0.25)",fontFamily:"sans-serif"}}>First to {WIN_GOALS} wins</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:9,fontWeight:800,color:"rgba(100,150,255,0.8)",letterSpacing:1,fontFamily:"sans-serif"}}>CPU</div>
            <div style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1,fontFamily:"sans-serif"}}>{score[1]}</div>
            <GoalBar goals={score[1]}/>
          </div>
        </div>
      </div>

      {/* Exit */}
      <button onClick={handleExit} style={{position:"absolute",top:12,left:12,zIndex:10,background:"rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"sans-serif"}}>✕</button>

      <canvas ref={canvasRef} style={{width:"100%",height:"100%",display:"block"}}/>

      {/* Match Result */}
      {gameOver&&matchResult&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:20,backdropFilter:"blur(8px)"}}>
          <div style={{fontSize:56,marginBottom:8}}>{matchResult.outcome==="win"?"🏆":matchResult.outcome==="draw"?"🤝":"💀"}</div>
          <div style={{fontSize:30,fontWeight:900,color:"#fff",marginBottom:4,fontFamily:"sans-serif"}}>
            {matchResult.outcome==="win"?"You Win!":matchResult.outcome==="draw"?"Draw!":"CPU Wins!"}
          </div>
          <div style={{fontSize:22,fontWeight:900,color:"rgba(255,255,255,0.45)",marginBottom:24,fontFamily:"sans-serif"}}>{score[0]} — {score[1]}</div>
          <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:"18px 36px",display:"flex",gap:28,marginBottom:12}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:30}}>🪙</div>
              <div style={{fontSize:22,fontWeight:900,color:"#ffd700",fontFamily:"sans-serif"}}>+{matchResult.coinsEarned}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:700,fontFamily:"sans-serif"}}>COINS</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:30}}>⭐</div>
              <div style={{fontSize:22,fontWeight:900,color:matchResult.ratingChange>=0?"#22c55e":"#ef4444",fontFamily:"sans-serif"}}>
                {matchResult.ratingChange>=0?"+":""}{matchResult.ratingChange}
              </div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:700,fontFamily:"sans-serif"}}>RATING</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:30}}>📊</div>
              <div style={{fontSize:22,fontWeight:900,color:"#a78bfa",fontFamily:"sans-serif"}}>{matchResult.newRating}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:700,fontFamily:"sans-serif"}}>NEW MMR</div>
            </div>
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginBottom:20,fontFamily:"sans-serif"}}>{matchResult.playerGoals} goals × 8🪙 bonus</div>
          <button onClick={handleExit} style={{padding:"14px 44px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#6c3fff,#8b5fff)",color:"#fff",fontWeight:900,fontSize:16,cursor:"pointer",fontFamily:"sans-serif",boxShadow:"0 4px 24px rgba(108,63,255,0.5)"}}>
            Back to Menu
          </button>
        </div>
      )}

      {/* Controls */}
      <div style={{position:"absolute",bottom:10,left:0,width:"100%",display:"flex",justifyContent:"space-between",padding:"0 16px",zIndex:10}}>
        <div style={{display:"flex",gap:10}}><Btn label="←" prop="left"/><Btn label="→" prop="right"/></div>
        <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
          <Btn label="👟" prop="kick" col="rgba(180,30,30,0.92)"/>
          <Btn label="↑" prop="jump" col="rgba(25,90,210,0.92)"/>
        </div>
      </div>
    </div>
  );
}
