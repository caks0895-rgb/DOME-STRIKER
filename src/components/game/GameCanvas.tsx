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
  const [matchResult,setMatchResult]=useState<{outcome:"win"|"loss"|"draw";coinsEarned:number;ratingChange:number;newRating:number;playerGoals:number;}>( null);

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

    // ===== DRAW BG =====
    function drawBg(){
      t+=0.008;
      const sky=ctx.createLinearGradient(0,0,0,H*0.48);
      sky.addColorStop(0,"#4a7ec8");sky.addColorStop(0.6,"#7aaee0");sky.addColorStop(1,"#a8cef0");
      ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
      function cloud(cx:number,cy:number,s:number){
        ctx.fillStyle="rgba(255,255,255,0.88)";
        ctx.beginPath();ctx.arc(cx,cy,s*1.2,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(cx+s*1.5,cy+s*0.25,s,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(cx-s*1.3,cy+s*0.3,s*0.85,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(cx+s*0.4,cy-s*0.5,s*0.9,0,Math.PI*2);ctx.fill();
      }
      cloud(W*0.1,H*0.07,W*0.04);cloud(W*0.38,H*0.05,W*0.032);cloud(W*0.68,H*0.08,W*0.042);cloud(W*0.9,H*0.04,W*0.028);
      function fl(fx:number,fy:number){
        ctx.strokeStyle="#99aabb";ctx.lineWidth=W*0.009;
        ctx.beginPath();ctx.moveTo(fx,fy+H*0.15);ctx.lineTo(fx,fy);ctx.stroke();
        ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx+W*0.065,fy);ctx.stroke();
        for(let i=0;i<5;i++){
          const lx=fx+W*0.01+i*W*0.011;
          ctx.fillStyle="#ffffaa";ctx.beginPath();ctx.arc(lx,fy,W*0.008,0,Math.PI*2);ctx.fill();
          ctx.save();ctx.globalAlpha=0.05;ctx.fillStyle="#ffffa0";
          ctx.beginPath();ctx.moveTo(lx,fy);ctx.lineTo(lx-W*0.06,H*0.6);ctx.lineTo(lx+W*0.06,H*0.6);ctx.closePath();ctx.fill();
          ctx.restore();
        }
      }
      fl(W*0.22,H*0.06);fl(W*0.68,H*0.06);
    }

    // ===== DRAW STADIUM =====
    function drawStadium(){
      const gy=GY(),gw=GW(),gh=GH();
      ctx.fillStyle="#2e2850";ctx.fillRect(0,H*0.2,W,H*0.28);
      const hc=["#f4a460","#d2691e","#ffb347","#ffdead","#cd853f","#deb887","#c87030","#e8c090"];
      const sc2=["#e63946","#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ec4899","#14b8a6","#f97316","#dc2626","#6366f1"];
      const hr2=["#1a0a00","#2c1004","#8b4513","#000","#3d1c02","#4a2800"];
      for(let row=0;row<6;row++){
        const ry=H*0.22+row*(H*0.075);
        const headR=Math.max(5,W*0.012-row*0.4);
        const gap=headR*2.5;
        const cnt=Math.ceil(W/gap)+1;
        for(let i=0;i<cnt;i++){
          const hx=i*gap+(row%2)*gap*0.5;
          const hy=ry+Math.sin(i*1.7+row*2)*headR*0.3;
          ctx.fillStyle=sc2[(i+row*3)%sc2.length];ctx.fillRect(hx-headR*0.6,hy+headR*0.7,headR*1.2,headR*2.0);
          ctx.fillStyle=hc[(i+row*2)%hc.length];ctx.beginPath();ctx.arc(hx,hy,headR,0,Math.PI*2);ctx.fill();
          ctx.fillStyle=hr2[(i+row)%hr2.length];ctx.beginPath();ctx.arc(hx,hy-headR*0.25,headR,Math.PI,Math.PI*2);ctx.fill();
        }
      }
      ctx.fillStyle="#0e5040";ctx.fillRect(0,H*0.47,W,H*0.06);
      ctx.strokeStyle="rgba(255,255,255,0.12)";ctx.lineWidth=1;
      for(let i=1;i<18;i++){ctx.beginPath();ctx.moveTo(i*W/18,H*0.47);ctx.lineTo(i*W/18,H*0.53);ctx.stroke();}
      const pitchY=H*0.53;
      ctx.fillStyle="#27ae60";ctx.fillRect(0,pitchY,W,gy-pitchY+H*0.28);
      const sw=W/12;
      for(let i=0;i<12;i++){if(i%2===0){ctx.fillStyle="rgba(0,0,0,0.045)";ctx.fillRect(i*sw,pitchY,sw,gy-pitchY+H*0.28);}}
      ctx.strokeStyle="rgba(255,255,255,0.72)";ctx.lineWidth=2.5;
      ctx.strokeRect(gw,pitchY,W-gw*2,gy-pitchY);
      ctx.beginPath();ctx.moveTo(W/2,pitchY);ctx.lineTo(W/2,gy);ctx.stroke();
      ctx.beginPath();ctx.arc(W/2,gy,W*0.1,Math.PI,0);ctx.stroke();
      ctx.beginPath();ctx.ellipse(W/2,gy,W*0.1,H*0.035,0,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,0.7)";ctx.beginPath();ctx.arc(W/2,gy,3.5,0,Math.PI*2);ctx.fill();
      const paW=W*0.16,paH=H*0.14;
      ctx.strokeRect(gw,gy-paH,paW,paH);ctx.strokeRect(W-gw-paW,gy-paH,paW,paH);
      ctx.fillStyle="rgba(255,255,255,0.7)";
      ctx.beginPath();ctx.arc(gw+paW*0.55,gy-paH*0.28,2.5,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(W-gw-paW*0.55,gy-paH*0.28,2.5,0,Math.PI*2);ctx.fill();
      for(let s=0;s<2;s++){
        const gx=s===0?0:W-gw,px=s===0?gw:W-gw;
        ctx.fillStyle="rgba(220,220,220,0.1)";ctx.fillRect(gx,gy-gh,gw,gh);
        ctx.save();ctx.beginPath();ctx.rect(gx,gy-gh,gw,gh);ctx.clip();
        ctx.strokeStyle="rgba(255,255,255,0.22)";ctx.lineWidth=0.8;
        for(let r=0;r*10<gh+10;r++){ctx.beginPath();ctx.moveTo(gx,gy-gh+r*10);ctx.lineTo(gx+gw,gy-gh+r*10);ctx.stroke();}
        for(let col=0;col*10<gw+10;col++){ctx.beginPath();ctx.moveTo(gx+col*10,gy-gh);ctx.lineTo(gx+col*10,gy);ctx.stroke();}
        ctx.restore();
        ctx.fillStyle="#ffffff";ctx.fillRect(px-4,gy-gh-5,8,gh+6);ctx.fillRect(gx-1,gy-gh-5,gw+2,8);
        ctx.fillStyle="#ff6600";
        for(let i=0;i<4;i++){ctx.fillRect(px-4,gy-gh+i*gh*0.25,8,gh*0.1);}
        ctx.fillStyle="rgba(0,0,0,0.18)";ctx.fillRect(px+3,gy-gh,4,gh);
        ctx.fillStyle="#ff6600";
        ctx.beginPath();ctx.moveTo(px,gy+5);ctx.lineTo(px-10,gy+18);ctx.lineTo(px+10,gy+18);ctx.closePath();ctx.fill();
      }
      const gg=ctx.createLinearGradient(0,gy,0,H);
      gg.addColorStop(0,"#1a6632");gg.addColorStop(1,"#0a2a14");
      ctx.fillStyle=gg;ctx.fillRect(0,gy,W,H-gy);
      ctx.fillStyle="rgba(0,0,0,0.15)";ctx.fillRect(0,gy,W,3);
    }

    // ===== DRAW CHARACTER =====
    function drawChar(p:any){
      const s=PS(),cx=p.x+s,fy=p.y,fl=p.fr?1:-1;
      ctx.save();ctx.globalAlpha=0.28;ctx.fillStyle="#000";
      ctx.beginPath();ctx.ellipse(cx,GY(),s*1.05,s*0.2,0,0,Math.PI*2);ctx.fill();ctx.restore();
      ctx.save();ctx.translate(cx,fy);ctx.scale(fl,1);
      const jc=p.ai?"#cc2020":"#1a35bb",jl=p.ai?"#ff5555":"#4466ff";
      ctx.fillStyle=jc;ctx.beginPath();ctx.ellipse(0,-s*0.5,s*0.72,s*0.9,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=jl;ctx.beginPath();ctx.ellipse(-s*0.18,-s*0.6,s*0.24,s*0.6,-0.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="white";ctx.beginPath();ctx.ellipse(0,-s*1.3,s*0.2,s*0.11,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#c8845a";ctx.fillRect(-s*0.12,-s*1.45,s*0.24,s*0.2);
      const hr=s*1.28,hcy=-s*1.8;
      ctx.fillStyle="#e8a070";ctx.beginPath();ctx.arc(0,hcy,hr,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(200,120,60,0.35)";ctx.beginPath();ctx.arc(hr*0.12,hcy+hr*0.08,hr*0.9,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.18)";ctx.beginPath();ctx.arc(-hr*0.24,hcy-hr*0.24,hr*0.38,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#d48858";
      ctx.beginPath();ctx.arc(-hr*0.94,hcy,hr*0.2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(hr*0.94,hcy,hr*0.2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#c07040";
      ctx.beginPath();ctx.arc(-hr*0.94,hcy,hr*0.12,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(hr*0.94,hcy,hr*0.12,0,Math.PI*2);ctx.fill();
      if(!p.ai){
        ctx.fillStyle="#5c3010";ctx.beginPath();ctx.arc(0,hcy,hr,Math.PI*0.98,Math.PI*2.02);ctx.fill();
        ctx.fillStyle="#6b3818";
        for(let i=0;i<7;i++){const a=Math.PI+i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*hr*0.82,Math.sin(a)*hr*0.82+hcy);ctx.lineTo(Math.cos(a+0.08)*hr*1.55,Math.sin(a+0.08)*hr*1.55+hcy);ctx.lineTo(Math.cos(a+0.16)*hr*0.82,Math.sin(a+0.16)*hr*0.82+hcy);ctx.fill();}
        ctx.fillStyle="rgba(80,40,8,0.3)";ctx.beginPath();ctx.ellipse(0,hcy+hr*0.55,hr*0.6,hr*0.28,0,0,Math.PI*2);ctx.fill();
      }else{
        ctx.fillStyle="#4a2808";ctx.beginPath();ctx.arc(0,hcy,hr,Math.PI*0.78,Math.PI*2.22);ctx.fill();
        ctx.fillStyle="#5c3010";ctx.beginPath();ctx.moveTo(hr*0.55,hcy-hr*0.35);ctx.quadraticCurveTo(hr*1.45,hcy+hr*0.1,hr*1.18,hcy+hr*0.85);ctx.quadraticCurveTo(hr*0.75,hcy+hr*0.45,hr*0.48,hcy+hr*0.25);ctx.fill();
        ctx.fillStyle="rgba(60,30,5,0.35)";ctx.beginPath();ctx.ellipse(hr*0.04,hcy+hr*0.56,hr*0.6,hr*0.26,0,0,Math.PI*2);ctx.fill();
      }
      const ey=hcy-s*0.06;
      ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(hr*0.27,ey,hr*0.23,hr*0.25,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(-hr*0.21,ey,hr*0.23,hr*0.25,0,0,Math.PI*2);ctx.fill();
      const ic=p.ai?"#2a7a1a":"#1a3888";
      ctx.fillStyle=ic;ctx.beginPath();ctx.arc(hr*0.27,ey,hr*0.165,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=ic;ctx.beginPath();ctx.arc(-hr*0.21,ey,hr*0.165,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#000";ctx.beginPath();ctx.arc(hr*0.28,ey+hr*0.02,hr*0.1,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#000";ctx.beginPath();ctx.arc(-hr*0.20,ey+hr*0.02,hr*0.1,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(hr*0.34,ey-hr*0.09,hr*0.055,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(-hr*0.14,ey-hr*0.09,hr*0.055,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#3a1a00";
      ctx.beginPath();ctx.ellipse(hr*0.27,ey-hr*0.31,hr*0.22,hr*0.08,-0.18,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(-hr*0.21,ey-hr*0.31,hr*0.22,hr*0.08,0.18,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(160,80,20,0.35)";ctx.beginPath();ctx.arc(hr*0.05,hcy+hr*0.16,hr*0.1,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#7c2d00";ctx.lineWidth=s*0.1;ctx.lineCap="round";
      if(p.kt>0){
        ctx.fillStyle="#5a1800";ctx.beginPath();ctx.ellipse(hr*0.04,hcy+hr*0.43,hr*0.2,hr*0.13,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="rgba(255,255,255,0.85)";ctx.beginPath();ctx.ellipse(hr*0.04,hcy+hr*0.39,hr*0.12,hr*0.07,0,0,Math.PI*2);ctx.fill();
      }else{ctx.beginPath();ctx.arc(hr*0.04,hcy+hr*0.27,hr*0.22,0.18,Math.PI-0.18);ctx.stroke();}
      ctx.fillStyle=p.ai?"#880000":"#001280";
      ctx.beginPath();ctx.ellipse(0,s*0.38,s*0.62,s*0.28,0,0,Math.PI*2);ctx.fill();
      const la=p.onG?Math.sin(Date.now()*0.013*Math.abs(p.vx))*s*0.52:0;
      const kx=p.kt>0?s*1.1:0,ky=p.kt>0?-s*0.42:0;
      ctx.strokeStyle="#c8845a";ctx.lineWidth=s*0.43;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(-s*0.27,s*0.42);ctx.lineTo(-s*0.34+la,s*1.0);ctx.stroke();
      ctx.beginPath();ctx.moveTo(s*0.27,s*0.42);ctx.lineTo(s*0.34-la+kx,s*1.0+ky);ctx.stroke();
      ctx.strokeStyle="white";ctx.lineWidth=s*0.39;
      ctx.beginPath();ctx.moveTo(-s*0.34+la,s*0.78);ctx.lineTo(-s*0.36+la,s*0.98);ctx.stroke();
      ctx.beginPath();ctx.moveTo(s*0.34-la+kx,s*0.78+ky);ctx.lineTo(s*0.36-la+kx,s*0.98+ky);ctx.stroke();
      ctx.fillStyle="#111";
      ctx.beginPath();ctx.ellipse(-s*0.36+la,s*1.04,s*0.4,s*0.17,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(s*0.36-la+kx,s*1.04+ky,s*0.4,s*0.17,p.kt>0?-0.38:0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.18)";
      ctx.beginPath();ctx.ellipse(-s*0.26+la,s*1.01,s*0.16,s*0.07,-0.2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#444";
      for(let i=0;i<3;i++){
        ctx.beginPath();ctx.arc(-s*0.28+la+i*s*0.1,s*1.09,s*0.04,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(s*0.28-la+kx+i*s*0.1,s*1.09+ky,s*0.04,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }

    // ===== DRAW BALL =====
    function drawBall(){
      const br=BR();
      trail.forEach((tr,i)=>{
        const a=(1-i/trail.length)*0.2;
        ctx.save();ctx.globalAlpha=a;ctx.fillStyle="rgba(255,255,255,0.95)";
        ctx.beginPath();ctx.arc(tr.x,tr.y,br*(1-i/trail.length*0.4),0,Math.PI*2);ctx.fill();
        ctx.restore();
      });
      ctx.save();ctx.globalAlpha=0.28;ctx.fillStyle="#000";
      ctx.beginPath();ctx.ellipse(ball.x,GY(),br*1.1,br*0.22,0,0,Math.PI*2);ctx.fill();ctx.restore();
      ctx.save();ctx.translate(ball.x,ball.y);ctx.rotate(ball.rot);
      const bg=ctx.createRadialGradient(-br*0.3,-br*0.35,br*0.04,0,0,br);
      bg.addColorStop(0,"#fff");bg.addColorStop(0.4,"#eee");bg.addColorStop(1,"#bbb");
      ctx.fillStyle=bg;ctx.beginPath();ctx.arc(0,0,br,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#111";
      for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2-Math.PI/2,px=Math.cos(a)*br*0.5,py=Math.sin(a)*br*0.5;ctx.beginPath();for(let j=0;j<5;j++){const ba=a+(j/5)*Math.PI*2;j===0?ctx.moveTo(px+Math.cos(ba)*br*0.28,py+Math.sin(ba)*br*0.28):ctx.lineTo(px+Math.cos(ba)*br*0.28,py+Math.sin(ba)*br*0.28);}ctx.closePath();ctx.fill();}
      ctx.beginPath();for(let j=0;j<5;j++){const ba=(j/5)*Math.PI*2-Math.PI/2;j===0?ctx.moveTo(Math.cos(ba)*br*0.28,Math.sin(ba)*br*0.28):ctx.lineTo(Math.cos(ba)*br*0.28,Math.sin(ba)*br*0.28);}ctx.closePath();ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.68)";ctx.beginPath();ctx.ellipse(-br*0.28,-br*0.32,br*0.28,br*0.17,-0.5,0,Math.PI*2);ctx.fill();
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
      drawBg();drawStadium();drawChar(p1);drawChar(p2);drawBall();
      if(gft>0){
        ctx.fillStyle=`rgba(255,220,50,${(gft/85)*0.22})`;ctx.fillRect(0,0,W,H);
        if(gft>55){ctx.fillStyle=`rgba(255,220,50,${(gft-55)/30})`;ctx.font=`900 ${W*0.1}px sans-serif`;ctx.textAlign="center";ctx.fillText("GOAL!",W/2,H/2);}
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

  const handleExit=()=>{try{const o=window.screen?.orientation as any;if(o?.unlock)o.unlock();}catch{}onExit();};
  const bindBtn=(prop:string)=>({
    onPointerDown:(e:React.PointerEvent)=>{e.preventDefault();(K.current as any)[prop]=true;},
    onPointerUp:(e:React.PointerEvent)=>{e.preventDefault();(K.current as any)[prop]=false;},
    onPointerLeave:()=>{(K.current as any)[prop]=false;},
    onPointerCancel:()=>{(K.current as any)[prop]=false;},
  });
  const Btn=({label,prop,col}:{label:string;prop:string;col?:string})=>(
    <div {...bindBtn(prop)} style={{width:58,height:58,borderRadius:"50%",background:col||"rgba(30,20,80,0.92)",border:"2px solid rgba(255,255,255,0.2)",boxShadow:"0 4px 14px rgba(0,0,0,0.6)",color:"#fff",fontSize:22,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",userSelect:"none",WebkitUserSelect:"none",touchAction:"none"}}>
      {label}
    </div>
  );
  const GoalBar=({goals}:{goals:number})=>(
    <div style={{display:"flex",alignItems:"center",gap:3,marginTop:2}}>
      <div style={{width:52,height:4,background:"#fff",borderRadius:2}}/
