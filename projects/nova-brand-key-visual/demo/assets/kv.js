/* ══════════════════════════════════════════
   NOVA KV SYSTEM — INTERACTION LAYER
   ══════════════════════════════════════════ */
(function(){
'use strict';

const $  = (s,p)=> (p||document).querySelector(s);
const $$ = (s,p)=> Array.from((p||document).querySelectorAll(s));
const clamp = (v,a,b)=> Math.min(b,Math.max(a,v));
const lerp = (a,b,t)=> a+(b-a)*t;

const COLORS = [
  {name:'DEEP NAVY',  hex:'#0A1018', role:'主背景 · 深蓝近黑基底', pct:52, dark:true},
  {name:'MIDNIGHT',   hex:'#141E2E', role:'次级背景 · 卡片与信息条', pct:18, dark:true},
  {name:'GRAY BLUE',  hex:'#8FA8C8', role:'玻璃银蓝 · 正文与辅助信息', pct:14, dark:true},
  {name:'WARM GOLD',  hex:'#C9A86A', role:'暖金 · 焦点与品牌高光', pct:6,  dark:false},
  {name:'PURE WHITE', hex:'#FFFFFF', role:'纯白 · 主字标与最高对比', pct:10, dark:false}
];

const VARIANTS = [
  {id:'V—01', name:'MASTER 原色', dot:'#8FA8C8', color:'#8FA8C8',
   desc:'标准冷峻基调，深蓝近黑底 + 银色玻璃 + 克制金。品牌主视觉默认形态。',
   use:'适用：品牌主视觉 · 官网首屏 · 年度发布会主屏',
   grade:'rgba(10,16,24,0)', filter:'none', eyebrow:'LIQUID INTELLIGENCE',
   word:'NOVA', sub:'拟生智能 · 让智能如光流动'},
  {id:'V—02', name:'GOLDEN HOUR 金时', dot:'#C9A86A', color:'#C9A86A',
   desc:'整体暖偏移，金色焦散加强，模拟黄昏时段的液态金属反射。',
   use:'适用：新品发布 · 品牌片头 · 媒体专访背景',
   grade:'rgba(48,32,10,.30)', filter:'saturate(1.32) sepia(.26) brightness(1.06)', eyebrow:'LIQUID INTELLIGENCE',
   word:'NOVA', sub:'拟生智能 · 让智能如光流动'},
  {id:'V—03', name:'DEEP OCEAN 深潜', dot:'#3A5578', color:'#3A5578',
   desc:'蓝色主导、压制金色，玻璃层加厚，营造深海般的沉静与科技纵深。',
   use:'适用：技术白皮书 · 开发者大会 · B 端产品页',
   grade:'rgba(12,26,46,.34)', filter:'saturate(1.5) hue-rotate(-12deg) brightness(.94)', eyebrow:'DEEP INTELLIGENCE',
   word:'NOVA', sub:'拟生智能 · 向深处生长'},
  {id:'V—04', name:'MONO FROST 素霜', dot:'#C8D6E8', color:'#C8D6C8',
   desc:'近单色冷白处理，剥离暖金，呈现极简工业设计发布会的克制气质。',
   use:'适用：硬件开箱 · 工业设计奖 · 概念车发布',
   grade:'rgba(28,38,52,.42)', filter:'saturate(.42) brightness(1.1) contrast(1.06)', eyebrow:'PURE FORM',
   word:'NOVA', sub:'拟生智能 · 至简至真'}
];

const MOTION = [
  {id:'E—01', name:'字标入场', desc:'主字标从下方 38px 淡入，900ms，快进慢出缓动。', dur:'900ms', ease:'0.16,1,0.3,1', bars:[22,40,58,80,100,80,58,40]},
  {id:'E—02', name:'光泽扫过', desc:'玻璃表面斜向高光由左至右扫过，模拟光源移动。', dur:'1500ms', ease:'0.16,1,0.3,1', bars:[8,26,52,84,100,72,40,16]},
  {id:'E—03', name:'液态跟随', desc:'指针位移驱动玻璃核形变，位移越大折射越强。', dur:'spring', ease:'0.2,0.8,0.3,1', bars:[40,72,96,100,88,64,44,26]},
  {id:'E—04', name:'视差层移', desc:'KV 板随指针做 ±9deg 三维倾斜，产生空间纵深。', dur:'700ms', ease:'0.16,1,0.3,1', bars:[30,50,70,88,70,50,30,18]}
];

const APPS = [
  {n:'A—01', name:'发布会主屏', desc:'16:9 巨幕主视觉，舞台中央播放，无任何 UI 干扰。', size:'3840 × 2160', ratio:'16 / 9', label:'STAGE KEY SCREEN', eyebrow:'LIQUID INTELLIGENCE', word:'NOVA', sub:'拟生智能 · 让智能如光流动'},
  {n:'A—02', name:'品牌官网首屏', desc:'横版全幅铺底，中央字标与滚动提示构成第一视觉落点。', size:'1920 × 1200', ratio:'16 / 10', label:'WEB HERO', eyebrow:'LIQUID INTELLIGENCE', word:'NOVA', sub:'拟生智能 · 让智能如光流动'},
  {n:'A—03', name:'社交媒体方图', desc:'裁切为 1:1 保留中央焦点，玻璃曲面作为四角包裹。', size:'1080 × 1080', ratio:'1 / 1', label:'SOCIAL 1:1', eyebrow:'LIQUID INTELLIGENCE', word:'NOVA', sub:'让智能如光流动'},
  {n:'A—04', name:'品牌名片 / 物料', desc:'竖版延展，中央竖排字标，暖金细线分隔信息区。', size:'1080 × 1920', ratio:'9 / 16', label:'BRAND CARD', eyebrow:'NOVA', word:'拟生智能', sub:'让智能如光流动'}
];

const TYPE_ROWS = [
  {l:'WORDMARK / NOVA', s:'120 PX · LIGHT 300 · <span>0.34em</span>'},
  {l:'EYEBROW / LIQUID', s:'15 PX · LIGHT 300 · <span>0.62em</span>'},
  {l:'SUBTITLE / 副标', s:'21 PX · 思源黑体 · <span>0.50em</span>'},
  {l:'INFO BAR / 信息条', s:'11 PX · LIGHT 300 · <span>0.22em</span>'},
  {l:'BODY / 正文', s:'13.5 PX · 思源黑体 · 行高 2.0'}
];
const TYPE_ROWS_CN = [
  {l:'品牌名 / NOVA', s:'30 PX · LIGHT 200 · <span>0.30em</span>'},
  {l:'主副标 / 拟生智能', s:'21 PX · 思源黑体 Light · <span>0.50em</span>'},
  {l:'引导文案', s:'14.5 PX · Regular 300 · 行高 2.15'},
  {l:'规范说明 / 标签', s:'11 PX · Light 300 · <span>0.20em</span>'},
  {l:'数据 / 数值', s:'28 PX · LIGHT 200 · 等宽数字'}
];

/* ══════ 1. 光标 ══════ */
const cursor = $('#cursor');
let cx=0, cy=0, rx=0, ry=0, mx=0, my=0;
if(cursor && window.matchMedia('(pointer:fine)').matches){
  window.addEventListener('mousemove', e=>{ mx=e.clientX; my=e.clientY; });
  const loop=()=>{
    cx=lerp(cx,mx,.32); cy=lerp(cy,my,.32);
    rx=lerp(rx,mx,.16); ry=lerp(ry,my,.16);
    cursor.style.setProperty('--x',cx+'px');
    $('.cursor-dot').style.transform=`translate3d(${cx}px,${cy}px,0)`;
    $('.cursor-ring').style.transform=`translate3d(${rx}px,${ry}px,0)`;
    requestAnimationFrame(loop);
  };
  loop();
  const HOVER='a,button,.ccard,.vcard,.sp-c i,.kv-bar-c i,.stat,.scard,.mat-item,.app-card,.blob-stage';
  document.addEventListener('mouseover',e=>{
    if(e.target.closest(HOVER)){
      cursor.classList.add('hov');
      const label = e.target.closest('[data-copy]') ? 'COPY'
                  : e.target.closest('.ccard') ? 'COPY HEX'
                  : e.target.closest('.blob-stage') ? 'DRAG' : '';
      $('.cursor-label').textContent = label;
    }
  });
  document.addEventListener('mouseout',e=>{ if(e.target.closest(HOVER)) cursor.classList.remove('hov'); });
}

/* ══════ 2. 进度条 + 导航 ══════ */
const progress=$('#progress'), nav=$('#nav');
function onScroll(){
  const h=document.documentElement.scrollHeight-window.innerHeight;
  const p=h>0?window.scrollY/h:0;
  progress.style.width=(p*100)+'%';
  nav.classList.toggle('stuck', window.scrollY>40);
}
window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

/* ══════ 3. 滚动揭示 ══════ */
const io=new IntersectionObserver(es=>{
  es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
},{threshold:.12,rootMargin:'0px 0px -60px 0px'});
$$('.reveal').forEach((el,i)=>{ el.style.transitionDelay=(i%4*70)+'ms'; io.observe(el); });
$$('.spec-board').forEach(el=>io.observe(el));

/* 材质计量条：进入视口后填充到 data-w */
const mio=new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(!e.isIntersecting) return;
    const b=e.target;
    setTimeout(()=>{ b.style.width=b.dataset.w+'%'; },260);
    mio.unobserve(b);
  });
},{threshold:.4});
$$('.mat-meter i').forEach(el=>mio.observe(el));

/* ══════ 4. 数字计数 ══════ */
const cio=new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(!e.isIntersecting) return;
    const el=e.target, end=parseFloat(el.dataset.count), suf=el.dataset.suffix||'';
    let t0=null, dur=1400;
    const step=ts=>{
      if(!t0)t0=ts;
      const p=clamp((ts-t0)/dur,0,1);
      const v=Math.round(end*(1-Math.pow(1-p,3)));
      el.textContent=v.toLocaleString()+suf;
      if(p<1)requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    cio.unobserve(el);
  });
},{threshold:.5});
$$('[data-count]').forEach(el=>cio.observe(el));

/* ══════ 5. Hero KV 3D 视差 ══════ */
$$('[data-tilt]').forEach(box=>{
  const soft=box.dataset.tiltSoft==='1'||box.hasAttribute('data-tilt-soft');
  const max=soft?5:9;
  box.addEventListener('mousemove',e=>{
    const r=box.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width-.5;
    const py=(e.clientY-r.top)/r.height-.5;
    box.style.transform=`rotateY(${px*max}deg) rotateX(${-py*max}deg) translateZ(0)`;
    const sc=box.querySelector('.var-display>img, .kv-screen>img');
    if(sc) sc.style.transform=`scale(1.06) translate3d(${-px*10}px,${-py*8}px,0)`;
  });
  box.addEventListener('mouseleave',()=>{
    box.style.transform='';
    const sc=box.querySelector('.var-display>img, .kv-screen>img');
    if(sc) sc.style.transform='';
  });
});

/* ══════ 6. Hero 色板注入 ══════ */
const heroPal=$('#kvPalette'), specPal=$('#specPalette');
COLORS.forEach(c=>{
  [heroPal,specPal].forEach(host=>{
    if(!host) return;
    const i=document.createElement('i');
    i.style.background=c.hex;
    i.title=c.name+' '+c.hex;
    i.dataset.copy=c.hex;
    host.appendChild(i);
  });
});

/* ══════ 7. 变体切换 ══════ */
const varImg=$('#varImg'), varGrade=$('#varGrade'), varDisp=$('#varDisplay');
const vEyebrow=$('#varEyebrow'), vWord=$('#varWord'), vSub=$('#varSub');
const panel=$('#varPanel');
let current=0;
VARIANTS.forEach((v,i)=>{
  const b=document.createElement('button');
  b.className='vcard reveal'+(i===0?' on':'');
  b.innerHTML=`
    <div class="vc-top"><span class="vc-id">${v.id}</span><span class="vc-dot" style="background:${v.color};color:${v.color}"></span></div>
    <div class="vc-name">${v.name}</div>
    <div class="vc-desc">${v.desc}</div>
    <div class="vc-use">${v.use}</div>`;
  b.addEventListener('click',()=>setVariant(i));
  panel.appendChild(b);
});
function setVariant(i){
  if(i===current) return;
  current=i;
  const v=VARIANTS[i];
  varDisp.classList.add('sw');
  setTimeout(()=>{
    varGrade.style.background=v.grade;
    varImg.style.filter=v.filter;
    vEyebrow.textContent=v.eyebrow;
    vWord.textContent=v.word;
    vSub.textContent=v.sub;
    varDisp.classList.remove('sw');
  },340);
  $$('.vcard',panel).forEach((c,k)=>c.classList.toggle('on',k===i));
  showToast(`${v.id} · ${v.name}`);
}
$$('.vcard',panel).forEach(c=>io.observe(c));
panel.insertAdjacentHTML('beforeend',
  `<div class="vpanel-foot"><div class="vpf-k">当前变体参数</div><div class="vpf-v" id="vpfv"></div></div>`);
function updateFoot(){
  const v=VARIANTS[current];
  const el=$('#vpfv');
  if(el) el.innerHTML=`GRADE · ${v.grade}<br>FILTER · ${v.filter}<br>EYEBROW · ${v.eyebrow}`;
}
updateFoot();

/* ══════ 8. 液态 blob 实验室 ══════ */
const stage=$('#blobStage'), core=$('#blobCore'), blobVal=$('#blobVal');
if(stage){
  const blobs=$$('.blob',stage);
  let bx=0,by=0,tx=0,ty=0,raf;
  function move(e){
    const r=stage.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width-.5;
    const py=(e.clientY-r.top)/r.height-.5;
    tx=px; ty=py;
    if(!raf) tick();
  }
  function tick(){
    bx=lerp(bx,tx,.12); by=lerp(by,ty,.12);
    const d=Math.hypot(bx,by);
    const t=(x,y,s)=>`translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${s})`;
    blobs[0].style.transform=t(bx*130,by*100,1+d*.5);
    blobs[1].style.transform=t(-bx*170,-by*120,1+d*.9);
    blobs[2].style.transform=t(bx*70,-by*140,1-d*.3);
    blobs[3].style.transform=t(-bx*100,by*150,1+d*.7);
    core.style.transform=t(bx*190,by*140,1+d*1.5);
    if(blobVal) blobVal.textContent='REFRACTION '+(1+d*2.4).toFixed(2);
    if(Math.abs(bx-tx)+Math.abs(by-ty)>.002) raf=requestAnimationFrame(tick);
    else raf=null;
  }
  stage.addEventListener('mousemove',move);
  stage.addEventListener('mouseleave',()=>{ tx=0; ty=0; if(!raf)tick(); });
  stage.addEventListener('touchmove',e=>{ if(e.touches[0]){ move(e.touches[0]); e.preventDefault(); } },{passive:false});
  setTimeout(()=>{ tx=.16; ty=-.12; tick(); },900);
}

/* ══════ 9. 色彩系统 ══════ */
const cGrid=$('#colorGrid');
COLORS.forEach(c=>{
  const d=document.createElement('div');
  d.className='ccard reveal';
  d.dataset.copy=c.hex;
  d.innerHTML=`
    <div class="cc-top" style="background:${c.hex};${c.dark&&c.hex!=='#0A1018'?'color:#fff;':''}">
      <span class="cc-name" style="${c.hex==='#0A1018'?'color:#fff':''}">${c.name}</span>
      <span class="cc-copy">COPY</span>
    </div>
    <div class="cc-b">
      <div class="cc-hex">${c.hex}</div>
      <div class="cc-role">${c.role}</div>
      <div class="cc-pct"><span>占比</span><b>${c.pct}%</b></div>
    </div>
    <div class="cc-shine"></div>`;
  cGrid.appendChild(d);
  io.observe(d);
});
const cuBar=$('#cuBar');
COLORS.forEach(c=>{
  const i=document.createElement('i');
  i.style.background=c.hex; i.style.width='0%'; i.dataset.p=c.name+' '+c.pct+'%';
  i.title=c.name+' '+c.hex;
  cuBar.appendChild(i);
  setTimeout(()=>{ i.style.width=c.pct+'%'; },900);
});
const cuRamp=$('#cuRamp');
['#050A11','#0A1018','#141E2E','#2A3A52','#5A7093','#8FA8C8','#C9A86A','#FFFFFF'].forEach(h=>{
  const i=document.createElement('i');
  i.style.background=h; i.title=h; i.dataset.copy=h;
  cuRamp.appendChild(i);
});

/* ══════ 10. 字体行 ══════ */
const rows=(host,data)=>{
  const h=$(host); if(!h) return;
  data.forEach(r=>{
    const d=document.createElement('div');
    d.className='td-row';
    d.innerHTML=`<span class="tdr-l">${r.l}</span><span class="tdr-s">${r.s}</span>`;
    h.appendChild(d);
  });
};
rows('#tdRows',TYPE_ROWS);
rows('#tdRowsCn',TYPE_ROWS_CN);

/* ══════ 11. 动效卡 ══════ */
const mGrid=$('#motionGrid');
MOTION.forEach(m=>{
  const d=document.createElement('div');
  d.className='mcard reveal';
  const bars=m.bars.map((h,i)=>`<i style="height:${h}%;animation-delay:${i*70}ms"></i>`).join('');
  d.innerHTML=`
    <div class="mc-viz">${bars}</div>
    <div class="mc-id">${m.id}</div>
    <h3>${m.name}</h3>
    <p>${m.desc}</p>
    <div class="mc-foot"><span>DURATION <b>${m.dur}</b></span><span>EASE <b>${m.ease}</b></span></div>`;
  mGrid.appendChild(d);
  io.observe(d);
});

/* ══════ 12. 应用卡 ══════ */
const aGrid=$('#appGrid');
APPS.forEach(a=>{
  const d=document.createElement('div');
  d.className='app-card reveal';
  d.dataset.copy=a.name+' · '+a.size;
  d.innerHTML=`
    <div class="app-vis" style="aspect-ratio:${a.ratio}">
      <img src="bg.png" alt="${a.name}">
      <div class="app-tint"></div>
      <div class="app-mark">
        <div class="am-e">${a.eyebrow}</div>
        <div class="am-w">${a.word}</div>
        <div class="am-s">${a.sub}</div>
      </div>
      <span class="app-tag">${a.label}</span>
    </div>
    <div class="app-b">
      <div class="app-n">${a.n}</div>
      <div class="app-name">${a.name}</div>
      <div class="app-desc">${a.desc}</div>
      <div class="app-size">SIZE <b>${a.size}</b> · RATIO ${a.ratio}</div>
    </div>`;
  aGrid.appendChild(d);
  io.observe(d);
});

/* ══════ 13. Toast + 复制 ══════ */
const toast=$('#toast'), toastT=$('.toast-t');
let toastTimer;
function showToast(msg){
  if(!toast) return;
  toastT.textContent=msg;
  toast.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('on'),1900);
}
function copyText(t){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(t).then(()=>showToast('已复制 · '+t)).catch(()=>fallback(t));
  } else fallback(t);
}
function fallback(t){
  const ta=document.createElement('textarea');
  ta.value=t; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); showToast('已复制 · '+t); }
  catch(e){ showToast(t); }
  document.body.removeChild(ta);
}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-copy]');
  if(el) copyText(el.dataset.copy);
  const sb=e.target.closest('[data-scroll]');
  if(sb){
    const t=$(sb.dataset.scroll);
    if(t) window.scrollTo({top:t.offsetTop-40,behavior:'smooth'});
  }
});

/* ══════ 14. 滚动跑马灯 ══════ */
const mqTrack=$('#mqTrack');
if(mqTrack){
  const items=['LIQUID INTELLIGENCE','NOVA 拟生智能','GLASS REFRACTION','1600 × 1000',
    'DEEP NAVY #0A1018','WARM GOLD #C9A86A','MONTSERRAT LIGHT','思源黑体','KEY VISUAL KV—001'];
  let html='';
  for(let r=0;r<2;r++) items.forEach(t=>{ html+=`<span>${t}</span>`; });
  mqTrack.innerHTML=html;
}

/* ══════ 15. 磁吸按钮 ══════ */
$$('.btn-primary,.btn-line,.btn-ghost').forEach(btn=>{
  btn.addEventListener('mousemove',e=>{
    const r=btn.getBoundingClientRect();
    const x=(e.clientX-r.left-r.width/2)*.16;
    const y=(e.clientY-r.top-r.height/2)*.22;
    btn.style.transform=`translate(${x}px,${y}px)`;
  });
  btn.addEventListener('mouseleave',()=>{ btn.style.transform=''; });
});

/* ══════ 16. 键盘快捷 ══════ */
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'&&current<3) setVariant(current+1);
  if(e.key==='ArrowLeft'&&current>0) setVariant(current-1);
});

})();
