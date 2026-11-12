(function(){
  var zone=document.getElementById('zone'),cv=document.getElementById('mzc'),bokeh=document.getElementById('bokeh'),btn=document.getElementById('mzmode');
  if(!zone||!cv||!cv.getContext)return;
  var ctx=cv.getContext('2d'),RM=matchMedia('(prefers-reduced-motion: reduce)').matches,TAU=Math.PI*2,rnd=Math.random;
  var W=0,H=0,k=0,target=0,raf=0,last=0,ptr=null,mode='follow',burst=0,bx=0,by=0,ms=[],cleared=true;
  var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
  var turn=function(a,t){return Math.atan2(Math.sin(t-a),Math.cos(t-a))};

  /* blurred bokeh lights in the haze */
  var cols=['255,70,100','255,120,70','190,60,170','255,190,190','230,40,70'];
  for(var i=0,n=innerWidth<700?8:16;i<n;i++){
    var b=document.createElement('i'),s=50+rnd()*150;
    b.style.cssText='left:'+rnd()*100+'%;top:'+rnd()*100+'%;width:'+s+'px;height:'+s+'px;background:rgba('+cols[i%5]+','+(.16+rnd()*.26).toFixed(2)+');filter:blur('+Math.round(8+rnd()*26)+'px);animation-duration:'+Math.round(14+rnd()*16)+'s;animation-delay:-'+Math.round(rnd()*20)+'s';
    bokeh.appendChild(b);
  }

  function spawn(){
    var N=innerWidth<700?6:11;
    for(var i=0;i<N;i++){
      var near=i<2,far=i>=N-3,a=rnd()*TAU,sp=near?40:far?45:70+rnd()*40;
      ms.push({x:rnd()*W,y:rnd()*H,a:a,ta:a,tt:0,v:sp,sp:sp,boost:1,ph:rnd()*100,near:near,far:far,z:near?1.9:far?.5:.8+rnd()*.25});
    }
  }
  function size(){
    var r=zone.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);
    W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);
    if(!ms.length&&W)spawn();
  }

  /* one detailed mosquito, head pointing along +x */
  function moz(m,ts,al){
    var i,j,sw=Math.sin(ts*5+m.ph);
    ctx.save();ctx.translate(m.x,m.y);ctx.rotate(m.a);ctx.scale(m.z,m.z);
    if(m.near)ctx.filter='blur(5px)';else if(m.far)ctx.filter='blur(1.2px)';
    ctx.globalAlpha=al*(m.near?.6:m.far?.8:1);ctx.lineCap='round';ctx.lineWidth=.9;
    var A=[.8,1.55,2.55],B=[3,0,-3];                                   /* legs: femur, tibia, pale-banded tarsus */
    for(i=0;i<6;i++){
      var sd=i<3?-1:1,q=i%3,a0=sd*A[q]+Math.sin(ts*6+m.ph+i)*.1,x=B[q],y=sd*1.6,p=[[x,y]],bd=[0,sd*(q<2?-.6:.5),sd*(q<2?.7:-.5)];
      for(j=0;j<3;j++){var an=a0+bd[j],L=j==1?11:9;x+=Math.cos(an)*L;y+=Math.sin(an)*L;p.push([x,y])}
      ctx.strokeStyle='#8c7b7d';ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);ctx.lineTo(p[1][0],p[1][1]);ctx.lineTo(p[2][0],p[2][1]);ctx.stroke();
      ctx.strokeStyle='#ece2d9';ctx.beginPath();ctx.moveTo(p[2][0],p[2][1]);ctx.lineTo(p[3][0],p[3][1]);ctx.stroke();
    }
    ctx.shadowColor='rgba(255,80,100,.5)';ctx.shadowBlur=7;             /* segmented abdomen with white bands */
    for(i=6;i>=0;i--){
      var u=i/7,ax=-7-u*21,ay=Math.sin(u*2+ts*3+m.ph)*.6+u*u*1.6,r=3.2*(1-u*.55)+.5;
      ctx.fillStyle='#55444a';ctx.beginPath();ctx.ellipse(ax,ay,4,r,0,0,TAU);ctx.fill();
      ctx.fillStyle='#efe5dc';ctx.beginPath();ctx.ellipse(ax+2,ay,.9,r*.92,0,0,TAU);ctx.fill();
    }
    var g=ctx.createRadialGradient(-1,-2,1,0,0,9);g.addColorStop(0,'#a08a8d');g.addColorStop(1,'#43343a');
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,8.5,5.6,0,0,TAU);ctx.fill();   /* thorax + lyre marks */
    ctx.shadowBlur=0;ctx.strokeStyle='#f1e8df';ctx.lineWidth=.8;
    ctx.beginPath();ctx.moveTo(-5,-1.4);ctx.quadraticCurveTo(0,-3.4,5,-1.4);ctx.moveTo(-5,1.4);ctx.quadraticCurveTo(0,3.4,5,1.4);ctx.stroke();
    var f=Math.sin(ts*75+m.ph);                                         /* wings: fast translucent flutter */
    for(j=-1;j<=1;j+=2){
      ctx.save();ctx.translate(-1,j*2.4);ctx.rotate(-j*(.5+f*.28));
      ctx.fillStyle='rgba(228,240,255,.2)';ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=.5;
      ctx.beginPath();ctx.ellipse(-13,0,14,3,0,0,TAU);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(-1,0);ctx.lineTo(-26,0);ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle='#43343a';ctx.beginPath();ctx.arc(10.5,0,3.7,0,TAU);ctx.fill();   /* head, eyes, proboscis, antennae */
    for(j=-1;j<=1;j+=2){
      ctx.fillStyle='#1a0b0f';ctx.beginPath();ctx.ellipse(11.2,j*2.3,1.9,1.5,0,0,TAU);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.arc(11.8,j*2.9,.45,0,TAU);ctx.fill();
    }
    ctx.strokeStyle='#2b1d21';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(13.8,0);ctx.quadraticCurveTo(21,.4+sw*.3,29,1.4+sw*.4);ctx.stroke();
    ctx.strokeStyle='#7a696c';ctx.lineWidth=.7;ctx.beginPath();
    ctx.moveTo(13,-1);ctx.lineTo(20,-2.2);ctx.moveTo(13,1);ctx.lineTo(20,2.2);
    ctx.moveTo(12.5,-2);ctx.lineTo(19,-6.5);ctx.moveTo(12.5,2);ctx.lineTo(19,6.5);ctx.stroke();
    ctx.restore();
  }

  function step(m,dt,ts){
    m.tt-=dt;
    if(m.tt<=0){m.tt=.5+rnd()*1.6;m.ta=m.a+(rnd()-.5)*2.4;m.boost=rnd()<.25?1.8:1}   /* sudden darts */
    var steer=turn(m.a,m.ta)*2.2,spd=m.sp*m.boost;
    if(ptr){
      var dx=ptr.x-m.x,dy=ptr.y-m.y,d=Math.sqrt(dx*dx+dy*dy)||1,to=Math.atan2(dy,dx);
      if(mode==='follow'){if(d<480){steer=turn(m.a,to+(d<95?1.5:0))*3;if(d<95)spd*=.7}}   /* drawn to the cursor, then circle it */
      else if(d<280){steer=turn(m.a,to+Math.PI)*5;spd*=2.2}                              /* panic away from the cursor */
    }
    if(burst>0){var ex=m.x-bx,ey=m.y-by;if(ex*ex+ey*ey<176400){steer=turn(m.a,Math.atan2(ey,ex))*7;spd*=2.6}}   /* click = scatter */
    if(m.x<-30||m.x>W+30||m.y<-30||m.y>H+30)steer=turn(m.a,Math.atan2(H/2-m.y,W/2-m.x))*4;
    m.a+=steer*dt;m.v+=(spd-m.v)*dt*3;
    m.x+=Math.cos(m.a)*m.v*dt;m.y+=Math.sin(m.a)*m.v*dt;
  }

  function tick(t){
    var dt=Math.min((t-last)/1000||.016,.05),ts=t/1000;last=t;
    k=RM?target:k+(target-k)*Math.min(1,dt*6);
    if(Math.abs(target-k)<.002)k=target;
    zone.style.setProperty('--k',k.toFixed(3));
    zone.classList.toggle('deep',k>.85);
    if(k>.04&&!RM){
      ctx.clearRect(0,0,W,H);cleared=false;
      var al=clamp(k*1.6,0,1);
      ms.forEach(function(m){step(m,dt,ts);moz(m,ts,al)});
      burst=Math.max(0,burst-dt);
    }else if(!cleared){ctx.clearRect(0,0,W,H);cleared=true}
    raf=(k>.02||Math.abs(target-k)>.002)?requestAnimationFrame(tick):0;
  }
  function wake(){if(!raf){last=performance.now();raf=requestAnimationFrame(tick)}}

  /* scroll-driven blend: 0 when the zone is away, smoothly up to 1 as it fills the middle of the screen */
  function measure(){
    var r=zone.getBoundingClientRect(),vh=innerHeight,top=vh*.2,bot=vh*.8;
    var o=clamp((Math.min(r.bottom,bot)-Math.max(r.top,top))/(bot-top),0,1);
    target=o*o*(3-2*o);wake();
  }
  addEventListener('scroll',measure,{passive:true});
  if(window.ResizeObserver)new ResizeObserver(function(){size();measure()}).observe(zone);else addEventListener('resize',function(){size();measure()});
  size();measure();

  function rel(e){var r=zone.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
  zone.addEventListener('pointermove',function(e){ptr=rel(e)});
  zone.addEventListener('pointerleave',function(){ptr=null});
  zone.addEventListener('pointerdown',function(e){ptr=rel(e);bx=ptr.x;by=ptr.y;burst=.8});
  if(btn){
    btn.addEventListener('pointerdown',function(e){e.stopPropagation()});
    btn.addEventListener('click',function(){
      mode=mode==='follow'?'avoid':'follow';
      btn.setAttribute('aria-pressed',String(mode==='avoid'));
      btn.querySelector('b').textContent=mode==='follow'?'follow me':'avoid me';
    });
  }
})();
