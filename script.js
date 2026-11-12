(function(){
  var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var RM=matchMedia('(prefers-reduced-motion: reduce)').matches, HOVER=matchMedia('(hover: hover)').matches;

  /* scroll progress */
  var bar=$('#bar'), de=document.documentElement;
  addEventListener('scroll',function(){bar.style.transform='scaleX('+(de.scrollTop/((de.scrollHeight-de.clientHeight)||1))+')'},{passive:true});

  /* reveal on scroll + GPA count-up */
  function countUp(el){
    var t=+el.dataset.count; if(RM){el.textContent=t.toFixed(2);return}
    var s=null; (function f(n){ if(s===null)s=n; var p=Math.min((n-s)/1100,1);
      el.textContent=(t*(1-Math.pow(1-p,3))).toFixed(2); if(p<1)requestAnimationFrame(f); })(performance.now());
  }
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(!e.isIntersecting)return; var el=e.target; io.unobserve(el);
    if(el.hasAttribute('data-r')){el.classList.add('in');
      el.addEventListener('transitionend',function(){el.removeAttribute('data-r')},{once:true});}
    if(el.dataset.count)countUp(el);
  })},{threshold:.15});
  $$('[data-r]').forEach(function(el,i){el.style.setProperty('--d',(i%4)*70+'ms');io.observe(el)});
  $$('[data-count]').forEach(function(el){io.observe(el)});

  /* card spotlight follows the cursor */
  document.addEventListener('pointermove',function(e){
    var c=e.target.closest&&e.target.closest('.card'); if(!c)return;
    var r=c.getBoundingClientRect(); c.style.setProperty('--mx',(e.clientX-r.left)+'px'); c.style.setProperty('--my',(e.clientY-r.top)+'px');
  });

  /* click ripple on buttons and cards */
  document.addEventListener('pointerdown',function(e){
    var t=e.target.closest&&e.target.closest('.btn,.card'); if(!t||RM)return;
    var r=t.getBoundingClientRect(), d=Math.max(r.width,r.height)*2, s=document.createElement('span');
    s.className='rip'; s.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-r.left-d/2)+'px;top:'+(e.clientY-r.top-d/2)+'px';
    t.appendChild(s); setTimeout(function(){s.remove()},650);
  });

  /* magnetic buttons + tilting photo (mouse devices only) */
  if(HOVER&&!RM){
    $$('.btn').forEach(function(b){
      b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();
        b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.14)+'px,'+((e.clientY-r.top-r.height/2)*.24)+'px)'});
      b.addEventListener('pointerleave',function(){b.style.transform=''});
    });
    var ph=$('.photo');
    if(ph){
      ph.addEventListener('pointermove',function(e){var r=ph.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        ph.style.transform='perspective(800px) rotateY('+(x*9)+'deg) rotateX('+(-y*9)+'deg)'});
      ph.addEventListener('pointerleave',function(){ph.style.transform=''});
    }
  }

  /* rotating words in the hero */
  var words=['cleaning messy data','forecasting with machine learning','shipping dashboards','learning data engineering'], rot=$('#rot'), wi=0;
  if(rot&&!RM)setInterval(function(){rot.classList.add('out');setTimeout(function(){wi=(wi+1)%words.length;rot.textContent=words[wi];rot.classList.remove('out')},300)},2600);

  /* live demo loader */
  var APP='https://dengue-forecasting-6rjhu2pnnuv5yovomq8ngc.streamlit.app/?embed=true';
  var load=$('#load'), gate=$('#gate'), stage=$('#stage');
  if(load)load.addEventListener('click',function(){
    gate.querySelector('p').textContent='Loading the app. If it was asleep, this can take up to a minute.';
    load.disabled=true; load.textContent='Loading';
    var f=document.createElement('iframe'); f.title='Dengue forecasting app (Streamlit)'; f.src=APP; f.loading='lazy';
    f.addEventListener('load',function(){gate.hidden=true}); stage.appendChild(f);
  });

  /* copy email + toast */
  var toast=$('#toast'), tt;
  function say(m){toast.textContent=m;toast.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){toast.classList.remove('show')},1800)}
  var copy=$('#copy');
  if(copy)copy.addEventListener('click',function(){
    var mail='dandimaulana1994@gmail.com';
    if(navigator.clipboard)navigator.clipboard.writeText(mail).then(function(){say('Email copied')},function(){location.href='mailto:'+mail});
    else location.href='mailto:'+mail;
  });

  /* active nav link */
  var links=$$('a.l');
  if('IntersectionObserver' in window){
    var nio=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting)links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)});
    })},{rootMargin:'-40% 0px -55% 0px'});
    ['experience','projects','about','contact'].forEach(function(id){nio.observe(document.getElementById(id))});
  }
  /* Projects: horror mode + wandering mosquitoes (only while this section is in view) */
  var pj=$('#projects'), mz=$('#mozzies');
  if(pj&&mz){
    var MOZ='<svg viewBox="0 0 48 32" aria-hidden="true"><path class="lg" d="M20 16L12 5M22 16L9 17M20 16l-7 11M25 16L20 3M25 16l-3 14"/><g transform="rotate(-28 22 10)"><ellipse class="wg" cx="22" cy="10" rx="10" ry="3.4"/></g><g transform="rotate(28 22 22)"><ellipse class="wg w2" cx="22" cy="22" rx="10" ry="3.4"/></g><ellipse class="b" cx="11" cy="16" rx="9" ry="2.6"/><ellipse class="b" cx="22" cy="16" rx="5" ry="3.4"/><circle class="b" cx="29" cy="16" r="2.7"/><path class="lg" d="M31 16h10" stroke-width="1.3"/></svg>';
    var ms=[], raf=0, last=0, ptr=null, swt;
    function turn(a,to){return Math.atan2(Math.sin(to-a),Math.cos(to-a))}
    function spawn(){
      var W=pj.offsetWidth, H=pj.offsetHeight, n=innerWidth<700?6:10;
      for(var i=0;i<n;i++){
        var el=document.createElement('div'); el.className='mz'; el.innerHTML=MOZ; mz.appendChild(el);
        ms.push({el:el,x:Math.random()*W,y:Math.random()*H,a:Math.random()*6.28,s:55+Math.random()*50,p:Math.random()*100,k:.6+Math.random()*.8});
      }
    }
    function tick(t){
      var dt=Math.min((t-last)/1000||0,.05), ts=t/1000, W=pj.offsetWidth, H=pj.offsetHeight;
      last=t;
      ms.forEach(function(m){
        m.a+=(Math.sin(ts*1.7*m.k+m.p)*1.6+Math.cos(ts*.9+m.p*2)*1.1)*dt*2.2;           /* lazy wandering */
        if(ptr){                                                                         /* drawn to the cursor, then circle it */
          var dx=ptr.x-m.x, dy=ptr.y-m.y, d=Math.sqrt(dx*dx+dy*dy);
          if(d<420)m.a+=turn(m.a,Math.atan2(dy,dx)+(d<110?1.4:0))*dt*2.2;
        }
        if(m.x<-40||m.x>W+40||m.y<-40||m.y>H+40)m.a+=turn(m.a,Math.atan2(H/2-m.y,W/2-m.x))*dt*4;   /* stay inside the section */
        m.x+=Math.cos(m.a)*m.s*dt; m.y+=Math.sin(m.a)*m.s*dt;
        var jx=Math.sin(ts*47+m.p)*1.3, jy=Math.cos(ts*53+m.p)*1.3;                      /* buzzing jitter */
        m.el.style.transform='translate('+(m.x+jx-20)+'px,'+(m.y+jy-13)+'px) rotate('+m.a+'rad)';
      });
      raf=requestAnimationFrame(tick);
    }
    function fly(on){
      if(on){
        if(RM)return;
        if(!ms.length)spawn();
        if(!raf){last=performance.now();raf=requestAnimationFrame(tick)}
      }else setTimeout(function(){if(!pj.classList.contains('dark')&&raf){cancelAnimationFrame(raf);raf=0}},900);
    }
    pj.addEventListener('pointermove',function(e){var r=pj.getBoundingClientRect();ptr={x:e.clientX-r.left,y:e.clientY-r.top}});
    pj.addEventListener('pointerleave',function(){ptr=null});
    new IntersectionObserver(function(es){es.forEach(function(e){
      var on=e.isIntersecting;
      pj.classList.add('sw'); clearTimeout(swt); swt=setTimeout(function(){pj.classList.remove('sw')},1000);
      pj.classList.toggle('dark',on); fly(on);
    })},{rootMargin:'-30% 0px -30% 0px'}).observe(pj);
  }
})();
