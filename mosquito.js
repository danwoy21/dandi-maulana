(function(){
  var zone=document.getElementById('zone'),cv=document.getElementById('mzc'),bokeh=document.getElementById('bokeh'),btn=document.getElementById('mzmode');
  if(!zone||!cv||!cv.getContext)return;
  var ctx=cv.getContext('2d'),RM=matchMedia('(prefers-reduced-motion: reduce)').matches,TAU=Math.PI*2,rnd=Math.random;
  var W=0,H=0,zx=0,zy=0,on=false,raf=0,last=0,ptr=null,mode='follow',burst=0,bx=0,by=0,ms=[],S=null,slow=0,swt,stopT;
  var MODES=['follow','avoid','off'],LAB={follow:'follow me',avoid:'avoid me',off:'hidden'};
  var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
  var turn=function(a,t){return Math.atan2(Math.sin(t-a),Math.cos(t-a))};

  /* soft bokeh lights: plain radial gradients, animated with transform only (no blur filters) */
  var cols=['255,70,100','255,120,70','190,60,170','255,190,190','230,40,70'];
  for(var i=0,n=innerWidth<700?5:8;i<n;i++){
    var b=document.createElement('i'),s=90+rnd()*190,c=cols[i%5],a=.2+rnd()*.25;
    b.style.cssText='left:'+rnd()*100+'%;top:'+rnd()*100+'%;width:'+s+'px;height:'+s+'px;background:radial-gradient(circle,rgba('+c+','+a.toFixed(2)+'),rgba('+c+','+(a*.5).toFixed(2)+') 45%,transparent 70%);animation-duration:'+Math.round(16+rnd()*14)+'s;animation-delay:-'+Math.round(rnd()*20)+'s';
    bokeh.appendChild(b);
  }

  /* each mosquito is drawn ONCE into a small sprite; the animation loop only stamps sprites */
  var SC=2,SW=160,SH=128;
  function draw(g,f){
    var i,j,p,x,y,an,L,A=[.8,1.55,2.55],B=[3,0,-3];
    g.lineCap='round';g.lineWidth=.9;
    for(i=0;i<6;i++){                                                       /* legs, pale-banded tarsi */
      var sd=i<3?-1:1,q=i%3,a0=sd*A[q],bd=[0,sd*(q<2?-.6:.5),sd*(q<2?.7:-.5)];x=B[q];y=sd*1.6;p=[[x,y]];
      for(j=0;j<3;j++){an=a0+bd[j];L=j==1?11:9;x+=Math.cos(an)*L;y+=Math.sin(an)*L;p.push([x,y])}
      g.strokeStyle='#8c7b7d';g.beginPath();g.moveTo(p[0][0],p[0][1]);g.lineTo(p[1][0],p[1][1]);g.lineTo(p[2][0],p[2][1]);g.stroke();
      g.strokeStyle='#ece2d9';g.beginPath();g.moveTo(p[2][0],p[2][1]);g.lineTo(p[3][0],p[3][1]);g.stroke();
    }
    g.shadowColor='rgba(255,80,100,.5)';g.shadowBlur=12;
    for(i=6;i>=0;i--){                                                      /* segmented abdomen with white bands */
      var u=i/7,ax=-7-u*21,ay=Math.sin(u*2)*.6+u*u*1.6,r=3.2*(1-u*.55)+.5;
      g.fillStyle='#55444a';g.beginPath();g.ellipse(ax,ay,4,r,0,0,TAU);g.fill();
      g.fillStyle='#efe5dc';g.beginPath();g.ellipse(ax+2,ay,.9,r*.92,0,0,TAU);g.fill();
    }
    var gr=g.createRadialGradient(-1,-2,1,0,0,9);gr.addColorStop(0,'#a08a8d');gr.addColorStop(1,'#43343a');
    g.fillStyle=gr;g.beginPath();g.ellipse(0,0,8.5,5.6,0,0,TAU);g.fill();   /* thorax + lyre marks */
    g.shadowBlur=0;g.strokeStyle='#f1e8df';g.lineWidth=.8;
    g.beginPath();g.moveTo(-5,-1.4);g.quadraticCurveTo(0,-3.4,5,-1.4);g.moveTo(-5,1.4);g.quadraticCurveTo(0,3.4,5,1.4);g.stroke();
    for(j=-1;j<=1;j+=2){                                                    /* translucent wings at flap angle f */
      g.save();g.translate(-1,j*2.4);g.rotate(-j*(.5+f*.28));
      g.fillStyle='rgba(228,240,255,.2)';g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=.5;
      g.beginPath();g.ellipse(-13,0,14,3,0,0,TAU);g.fill();g.stroke();
      g.beginPath();g.moveTo(-1,0);g.lineTo(-26,0);g.stroke();g.restore();
    }
    g.fillStyle='#43343a';g.beginPath();g.arc(10.5,0,3.7,0,TAU);g.fill();     /* head, eyes, proboscis, antennae */
    for(j=-1;j<=1;j+=2){
      g.fillStyle='#1a0b0f';g.beginPath();g.ellipse(11.2,j*2.3,1.9,1.5,0,0,TAU);g.fill();
      g.fillStyle='rgba(255,255,255,.8)';g.beginPath();g.arc(11.8,j*2.9,.45,0,TAU);g.fill();
    }
    g.strokeStyle='#2b1d21';g.lineWidth=1.2;g.beginPath();g.moveTo(13.8,0);g.quadraticCurveTo(21,.4,29,1.4);g.stroke();
    g.strokeStyle='#7a696c';g.lineWidth=.7;g.beginPath();
    g.moveTo(13,-1);g.lineTo(20,-2.2);g.moveTo(13,1);g.lineTo(20,2.2);g.moveTo(12.5,-2);g.lineTo(19,-6.5);g.moveTo(12.5,2);g.lineTo(19,6.5);g.stroke();
  }
  function sprite(f,blur){
    var c=document.createElement('canvas');c.width=SW;c.height=SH;var g=c.getContext('2d');
    g.scale(SC,SC);g.translate(SW/SC/2,SH/SC/2);
    if(blur&&'filter' in g)g.filter='blur('+blur+'px)';
    draw(g,f);return c;
  }
  function build(){S={n:[],near:[],far:[]};[-1,0,1].forEach(function(f){S.n.push(sprite(f,0));S.near.push(sprite(f,5));S.far.push(sprite(f,1.6))})}

  function spawn(){
    var N=innerWidth<700?5:9,nr=innerWidth<700?0:1;
    for(var i=0;i<N;i++){
      var near=i<nr,far=i>=N-2,a=rnd()*TAU,sp=near?40:far?45:70+rnd()*40;
      ms.push({x:rnd()*W,y:rnd()*H,a:a,ta:a,tt:0,v:sp,sp:sp,boost:1,ph:rnd()*100,near:near,far:far,z:near?1.9:far?.5:.8+rnd()*.25});
    }
  }
  function step(m,dt){
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
    if(dt>.034){if(++slow>45)lite()}else if(slow>0)slow--;                 /* safety net for slow devices */
    ctx.clearRect(0,0,W,H);
    ms.forEach(function(m){
      step(m,dt);
      var set=m.near?S.near:m.far?S.far:S.n,fr=set[[0,1,2,1][((ts*20+m.ph)|0)&3]],s=m.z/SC,cs=Math.cos(m.a)*s,sn=Math.sin(m.a)*s;
      ctx.setTransform(cs,sn,-sn,cs,m.x,m.y);ctx.globalAlpha=m.near?.65:m.far?.8:1;ctx.drawImage(fr,-SW/2,-SH/2);
    });
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;
    burst=Math.max(0,burst-dt);
    raf=requestAnimationFrame(tick);
  }
  function lite(){slow=0;zone.classList.add('lite');ms.length=Math.min(ms.length,4)}
  function sync(){
    clearTimeout(stopT);
    if(on&&mode!=='off'&&!RM){if(!S)build();if(!ms.length&&W)spawn();if(!raf){last=performance.now();raf=requestAnimationFrame(tick)}}
    else stopT=setTimeout(function(){cancelAnimationFrame(raf);raf=0;ctx.clearRect(0,0,W,H)},mode==='off'?0:1000);
  }

  function place(){var r=zone.getBoundingClientRect();zx=r.left+scrollX;zy=r.top+scrollY}
  function size(){var r=zone.getBoundingClientRect();W=Math.round(r.width);H=Math.round(r.height);cv.width=W;cv.height=H;place();if(on)sync()}
  if(window.ResizeObserver)new ResizeObserver(size).observe(zone);else addEventListener('resize',size);
  size();

  /* the theme switches on/off when the section is in the middle of the screen; the CSS handles the soft fade */
  new IntersectionObserver(function(es){
    on=es[es.length-1].isIntersecting;
    zone.classList.add('sw');clearTimeout(swt);swt=setTimeout(function(){zone.classList.remove('sw')},1000);
    zone.classList.toggle('on',on);place();sync();
  },{rootMargin:'-22% 0px -22% 0px'}).observe(zone);

  zone.addEventListener('pointermove',function(e){ptr={x:e.pageX-zx,y:e.pageY-zy}});
  zone.addEventListener('pointerleave',function(){ptr=null});
  zone.addEventListener('pointerdown',function(e){ptr={x:e.pageX-zx,y:e.pageY-zy};bx=ptr.x;by=ptr.y;burst=.8});
  if(btn){
    btn.addEventListener('pointerdown',function(e){e.stopPropagation()});
    btn.addEventListener('click',function(){
      mode=MODES[(MODES.indexOf(mode)+1)%3];
      btn.querySelector('b').textContent=LAB[mode];btn.setAttribute('aria-pressed',String(mode!=='follow'));sync();
    });
  }
})();
