(function(){
  var zone=document.getElementById('zone2'),cv=document.getElementById('fbc'),fl=document.getElementById('flash'),btn=document.getElementById('fzmode');
  if(!zone||!cv||!cv.getContext)return;
  var ctx=cv.getContext('2d'),RM=matchMedia('(prefers-reduced-motion: reduce)').matches,TAU=Math.PI*2,rnd=Math.random;
  var W=0,H=0,R=26,on=false,show=true,raf=0,last=0,stopT,swt,slow=0,small=false;
  var px=-999,py=-999,pvx=0,pvy=0,pt=0,ball={x:0,y:-60,vx:0,vy:0,a:0},bits=[],pat,shade;
  var goals=0,inG=false,rip=null,pop=null,hit=0,respawn=0;
  var CC=['#2b59ff','#14b866','#ef3b4b','#ffffff','#ffcf4a','#c4f04a'];
  var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};

  /* stadium camera flashes: tiny dots, CSS opacity animation only */
  for(var i=0,n=innerWidth<700?8:16;i<n;i++){
    var d=document.createElement('i');
    d.style.cssText='left:'+(rnd()*100).toFixed(1)+'%;top:'+(rnd()*100).toFixed(1)+'%;animation-delay:-'+(rnd()*5).toFixed(2)+'s;animation-duration:'+(2.4+rnd()*3).toFixed(1)+'s';
    fl.appendChild(d);
  }

  /* the ball is drawn once into two sprites: rotating panels + fixed shading */
  function pent(g,cx,cy,r,rot){g.beginPath();for(var i=0;i<5;i++){var a=rot+i*TAU/5;g[i?'lineTo':'moveTo'](cx+Math.cos(a)*r,cy+Math.sin(a)*r)}g.closePath();g.fill()}
  function build(){
    pat=document.createElement('canvas');pat.width=pat.height=120;
    var g=pat.getContext('2d'),r=52,i,a;
    g.translate(60,60);g.fillStyle='#f4f7fa';g.beginPath();g.arc(0,0,r,0,TAU);g.fill();
    g.save();g.beginPath();g.arc(0,0,r,0,TAU);g.clip();
    g.fillStyle='#151a21';g.strokeStyle='rgba(21,26,33,.6)';g.lineWidth=2;
    pent(g,0,0,16,-Math.PI/2);
    for(i=0;i<5;i++){a=-Math.PI/2+i*TAU/5;
      g.beginPath();g.moveTo(Math.cos(a)*16,Math.sin(a)*16);g.lineTo(Math.cos(a)*r*.72,Math.sin(a)*r*.72);g.stroke();
      pent(g,Math.cos(a)*r*.98,Math.sin(a)*r*.98,17,a);}
    g.restore();
    shade=document.createElement('canvas');shade.width=shade.height=120;
    g=shade.getContext('2d');g.translate(60,60);
    var s=g.createRadialGradient(-18,-22,4,0,0,r);
    s.addColorStop(0,'rgba(255,255,255,.6)');s.addColorStop(.38,'rgba(255,255,255,0)');s.addColorStop(1,'rgba(8,18,28,.42)');
    g.fillStyle=s;g.beginPath();g.arc(0,0,r,0,TAU);g.fill();
    g.strokeStyle='rgba(8,18,28,.55)';g.lineWidth=1.6;g.beginPath();g.arc(0,0,r-.8,0,TAU);g.stroke();
  }

  function confetti(x,y){
    for(var i=0,m=small?16:46;i<m&&bits.length<150;i++){
      var a=-Math.PI/2+(rnd()-.5)*2.4,v=240+rnd()*520;
      bits.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:rnd()*6,vr:(rnd()-.5)*14,w:5+rnd()*5,h:3+rnd()*4,c:CC[i%6],t:0});
    }
  }
  function kick(x,y){
    var dx=ball.x-x,dy=ball.y-y,d=Math.sqrt(dx*dx+dy*dy)||1;
    if(d<320){var f=1-d/320;ball.vx+=dx/d*1100*f;ball.vy=Math.min(ball.vy,0)-(500+700*f)}
    confetti(x,y);
  }
  function drop(){ball.x=W*(.18+rnd()*.35);ball.y=-R*2;ball.vx=150+rnd()*250;ball.vy=0;inG=false;respawn=0}

  /* goal on the right: net mesh that billows when the ball lands in it */
  function drawNet(gx,gt,gl,dt){
    var C=9,N=7,A=0,i,j,p;
    if(rip){rip.t+=dt;if(rip.t>1.6)rip=null;else A=rip.amp*Math.exp(-rip.t*3)}
    function pt2(i,j){
      var x=gx+(W-gx)*i/C,y=gt+(gl-gt)*j/N;
      if(A>.3){var dx=x-rip.x,dy=y-rip.y,dd=Math.sqrt(dx*dx+dy*dy),f=Math.sin(Math.PI*i/C)*Math.sin(Math.PI*j/N),w=A*f*Math.sin(dd*.045-rip.t*16)*Math.exp(-dd*.004);x+=w*.8;y+=w*.5}
      return [x,y];
    }
    ctx.strokeStyle='rgba(255,255,255,.36)';ctx.lineWidth=1;ctx.beginPath();
    for(j=0;j<=N;j++)for(i=0;i<=C;i++){p=pt2(i,j);if(i)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1])}
    for(i=0;i<=C;i++)for(j=0;j<=N;j++){p=pt2(i,j);if(j)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1])}
    ctx.stroke();
  }
  function drawFrame(gx,gt,gl){
    ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=hit>0?9:7;ctx.strokeStyle=hit>0?'#c4f04a':'#f3f6f8';
    ctx.beginPath();ctx.moveTo(W+4,gt);ctx.lineTo(gx,gt);ctx.lineTo(gx,gl);ctx.stroke();
  }

  function tick(t){
    var dt=Math.min((t-last)/1000||.016,.04),fy=H-R-Math.max(28,H*.07),gl=fy+R,gw=clamp(W*.16,84,150),gh=clamp(H*.2,112,160),gx=W-gw,gt=gl-gh,i;last=t;
    if(dt>.034){if(++slow>45)lite()}else if(slow>0)slow--;
    ctx.clearRect(0,0,W,H);
    if(show){
      ball.vy+=1900*dt;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
      if(ball.x<R){ball.x=R;ball.vx=Math.abs(ball.vx)*.8}
      else if(ball.x>W-R){                                                     /* back wall: soft in the net, bouncy elsewhere */
        var inN=ball.y>gt+2,v0=ball.vx;ball.x=W-R;ball.vx=-Math.abs(ball.vx)*(inN?.15:.8);
        if(inN&&v0>260)rip={t:0,x:W,y:ball.y,amp:clamp(v0/70,5,14)};
      }
      if(ball.y<R){ball.y=R;ball.vy=Math.abs(ball.vy)*.6}
      if(ball.y>fy){ball.y=fy;ball.vy=Math.abs(ball.vy)>90?-ball.vy*.66:0;ball.vx*=1-Math.min(1,dt*1.6)}
      ball.vx*=1-dt*.08;
      var cx=clamp(ball.x,gx-3,W),cy=clamp(ball.y,gt-4,gt+4),ex=ball.x-cx,ey=ball.y-cy,ed=Math.sqrt(ex*ex+ey*ey);
      if(ed<R){                                                               /* crossbar and post top: the ball bounces off */
        var nx=ed?ex/ed:0,ny=ed?ey/ed:-1,vn=ball.vx*nx+ball.vy*ny;
        if(vn<0){ball.vx-=1.75*vn*nx;ball.vy-=1.75*vn*ny;if(-vn>160)hit=.35}
        ball.x=cx+nx*R;ball.y=cy+ny*R;
      }
      var inside=ball.x>gx+14&&ball.y>gt+10;
      if(inside&&!inG){                                                       /* GOAL */
        inG=true;goals++;respawn=2.4;
        rip={t:0,x:ball.x,y:ball.y,amp:clamp(Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy)/50,8,24)};
        pop={t:0};confetti(gx+gw*.4,gt+gh*.35);
      }else if(!inside&&ball.x<gx-R)inG=false;
      if(respawn>0){respawn-=dt;if(respawn<=0)drop()}
      hit=Math.max(0,hit-dt);
      var pr=Math.pow(.02,dt);pvx*=pr;pvy*=pr;                                /* cursor speed fades when the mouse stops */
      var dx=ball.x-px,dy=ball.y-py,d=Math.sqrt(dx*dx+dy*dy);
      if(d<R+12){var kx=dx/(d||1),ky=dy/(d||1),sp=Math.sqrt(pvx*pvx+pvy*pvy);   /* the cursor kicks the ball */
        ball.vx=clamp(pvx*.8+kx*(200+sp*.2),-1700,1700);ball.vy=clamp(pvy*.8+ky*(200+sp*.2)-140,-1700,1700);
        ball.x=px+kx*(R+12);ball.y=py+ky*(R+12)}
      ball.a+=ball.vx*dt/R;
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse((gx+W)/2,gl+2,(W-gx)/2,6,0,0,TAU);ctx.fill();
      drawNet(gx,gt,gl,dt);
      var h=clamp((fy-ball.y)/(H*.6),0,1),k=1.05-h*.4;                      /* soft shadow on the grass */
      ctx.fillStyle='rgba(0,0,0,'+(.34*(1-h*.8)).toFixed(3)+')';ctx.beginPath();ctx.ellipse(ball.x,gl-3,R*k,R*.2*k,0,0,TAU);ctx.fill();
      var c=Math.cos(ball.a)*.5,s=Math.sin(ball.a)*.5;
      ctx.setTransform(c,s,-s,c,ball.x,ball.y);ctx.drawImage(pat,-60,-60);
      ctx.setTransform(.5,0,0,.5,ball.x,ball.y);ctx.drawImage(shade,-60,-60);
      ctx.setTransform(1,0,0,1,0,0);
      drawFrame(gx,gt,gl);
    }
    for(i=bits.length-1;i>=0;i--){                                          /* confetti in the three host-nation colours */
      var b=bits[i];b.t+=dt;
      if(b.t>1.7){bits.splice(i,1);continue}
      b.vy+=900*dt;b.vx*=1-dt*1.2;b.x+=b.vx*dt;b.y+=b.vy*dt;b.r+=b.vr*dt;
      var cc=Math.cos(b.r),ss=Math.sin(b.r);
      ctx.globalAlpha=Math.min(1,(1.7-b.t)*1.5);ctx.fillStyle=b.c;ctx.setTransform(cc,ss,-ss,cc,b.x,b.y);ctx.fillRect(-b.w/2,-b.h/2,b.w,b.h);
    }
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;
    if(pop){                                                                /* GOAL! banner */
      pop.t+=dt;
      if(pop.t>1.8)pop=null;
      else{
        var u=pop.t,sc=1+Math.max(0,.35-u)*3;
        ctx.save();ctx.globalAlpha=u<1.2?1:1-(u-1.2)/.6;ctx.translate(W/2,H*.3);ctx.scale(sc,sc);
        ctx.font='italic 800 88px "Barlow Condensed","Segoe UI",sans-serif';ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=8;
        ctx.strokeStyle='#07210f';ctx.fillStyle='#c4f04a';
        var txt='GOAL!'+(goals>1?'  x'+goals:'');ctx.strokeText(txt,0,0);ctx.fillText(txt,0,0);ctx.restore();
      }
    }
    raf=requestAnimationFrame(tick);
  }
  function lite(){slow=0;small=true;zone.classList.add('lite');bits.length=0}
  function size(){var w=document.documentElement.clientWidth;if(W!==w||H!==innerHeight){W=cv.width=w;H=cv.height=innerHeight}}
  function sync(){
    clearTimeout(stopT);
    if(on&&!RM){if(!pat)build();size();if(!raf){last=performance.now();raf=requestAnimationFrame(tick)}}
    else stopT=setTimeout(function(){cancelAnimationFrame(raf);raf=0;ctx.clearRect(0,0,W,H)},1000);
  }
  addEventListener('resize',function(){if(on)size()});

  new IntersectionObserver(function(es){
    var was=on;on=es[es.length-1].isIntersecting;
    zone.classList.add('sw');clearTimeout(swt);swt=setTimeout(function(){zone.classList.remove('sw')},1000);
    zone.classList.toggle('on',on);
    if(on&&!was){size();drop()}                                              /* the ball drops in */
    sync();
  },{rootMargin:'-22% 0px -22% 0px'}).observe(zone);

  addEventListener('pointermove',function(e){
    var dtm=Math.max(.008,(e.timeStamp-pt)/1000);
    if(px>-900){pvx=pvx*.5+(e.clientX-px)/dtm*.5;pvy=pvy*.5+(e.clientY-py)/dtm*.5}
    px=e.clientX;py=e.clientY;pt=e.timeStamp;
  },{passive:true});
  document.addEventListener('mouseout',function(e){if(!e.relatedTarget)px=py=-999});
  zone.addEventListener('pointerdown',function(e){if(on&&show&&!RM)kick(e.clientX,e.clientY)});
  if(btn){
    btn.addEventListener('pointerdown',function(e){e.stopPropagation()});
    btn.addEventListener('click',function(){show=!show;btn.querySelector('b').textContent=show?'on':'off';btn.setAttribute('aria-pressed',String(show))});
  }

  /* live demo loader */
  var ld=document.getElementById('load2'),gt2=document.getElementById('gate2'),st=document.getElementById('stage2');
  if(ld)ld.addEventListener('click',function(){
    gt2.querySelector('p').textContent='Loading the app. If it was asleep, this can take up to a minute.';
    ld.disabled=true;ld.textContent='Loading';
    var f=document.createElement('iframe');f.title='World Cup 2026 predictor (Streamlit)';
    f.src='https://wc2026-predictor-cjxuseohmyprqhhlunh6r8.streamlit.app/?embed=true';f.loading='lazy';
    f.addEventListener('load',function(){gt2.hidden=true});st.appendChild(f);
  });
})();
