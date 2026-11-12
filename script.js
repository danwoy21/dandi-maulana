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
})();
