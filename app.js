const C=window.CONFIG||{},live=!!(C.SUPABASE_URL&&C.SUPABASE_KEY),$=s=>document.querySelector(s);
const bn=n=>Number(n).toLocaleString('bn-BD');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const vid=(()=>{let v=localStorage.getItem('v4j_vid');if(!v){v=crypto.randomUUID();localStorage.setItem('v4j_vid',v)}return v})();
const myVote=id=>localStorage.getItem('v4j_voted_'+id);
async function api(p,o={}){const r=await fetch(C.SUPABASE_URL+'/rest/v1/'+p,{...o,headers:{apikey:C.SUPABASE_KEY,Authorization:'Bearer '+C.SUPABASE_KEY,'Content-Type':'application/json'}});if(!r.ok)throw new Error(await r.text());return r.json()}
const DEMO=[{id:'d1',title:'ডেমো জরিপ: কোন বিষয়ে দ্রুত বিচার চান?',description:'এটি নমুনা জরিপ। Supabase যুক্ত করলে আসল জরিপ আসবে।',closes_at:new Date(Date.now()+6048e5).toISOString(),options:[{id:'a',name:'দুর্নীতি দমন',subtitle:'প্রশাসনিক স্বচ্ছতা'},{id:'b',name:'নারী ও শিশু নির্যাতন',subtitle:'দ্রুত বিচার ট্রাইব্যুনাল'},{id:'c',name:'ভূমি দখল',subtitle:'গ্রামীণ ভূমি বিরোধ'}]}];
const demoCounts=()=>JSON.parse(localStorage.getItem('v4j_demo')||'{}');
async function loadPolls(){return live?api('polls?select=*,options(*)&active=eq.true&order=created_at.desc'):DEMO}
async function results(p){if(!live){const d=demoCounts();return p.options.map(o=>({option_id:o.id,total:d[o.id]||0}))}return api('rpc/get_results',{method:'POST',body:JSON.stringify({p_poll:p.id})})}
async function castVote(p,o){if(!live){const d=demoCounts();d[o]=(d[o]||0)+1;localStorage.setItem('v4j_demo',JSON.stringify(d));return}
 await api('rpc/cast_vote',{method:'POST',body:JSON.stringify({p_poll:p.id,p_option:o,p_voter:vid})})}
const closed=p=>p.closes_at&&new Date(p.closes_at)<=new Date();
function card(p){
 const v=myVote(p.id),cl=closed(p);
 const opts=(p.options||[]).sort((a,b)=>(a.sort||0)-(b.sort||0)).map(o=>`<button class="opt${v===o.id?' sel':''}" data-o="${esc(o.id)}" ${v||cl?'disabled':''}>${o.image_url?`<img class="av" src="${esc(o.image_url)}" alt="">`:`<span class="av">${esc([...o.name][0])}</span>`}<span><b>${esc(o.name)}</b><small>${esc(o.subtitle)}</small></span></button>`).join('');
 const url=encodeURIComponent(location.href.split('#')[0]),txt=encodeURIComponent('আমি Vote4Justice এ ভোট দিয়েছি: '+p.title);
 return `<article class="poll" id="p${esc(p.id)}"><h2>${esc(p.title)}</h2><p class="mut">${esc(p.description)}</p>
 <div class="meta">${p.closes_at?`⏳ ${cl?'<b>জরিপ শেষ</b>':`শেষ হবে: <b class="cd" data-t="${esc(p.closes_at)}"></b>`} · `:''}মোট ভোট: <b class="tot">--</b></div>
 <div class="opts">${opts}</div>
 ${v||cl?'':`<button class="go" disabled>ভোট দিন</button>`}
 <div class="res">${v||cl?'':'<div class="lock">🔒 ভোট দিলে লাইভ ফলাফল দেখতে পাবেন</div>'}</div>
 <div class="share"><a target="_blank" rel="noopener" href="https://wa.me/?text=${txt}%20${url}">WhatsApp</a><a target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${url}">Facebook</a><button class="cp">লিংক কপি</button></div></article>`}
async function showRes(p){const el=$('#p'+p.id+' .res');try{const r=await results(p),m={};r.forEach(x=>m[x.option_id]=+x.total);
 const sum=Object.values(m).reduce((a,b)=>a+b,0);$('#p'+p.id+' .tot').textContent=bn(sum);
 el.innerHTML=[...p.options].sort((a,b)=>(m[b.id]||0)-(m[a.id]||0)).map(o=>{const n=m[o.id]||0,pc=sum?(n*100/sum):0;return `<div class="row"><div class="t"><span>${esc(o.name)}</span><span>${bn(pc.toFixed(1))}% · ${bn(n)}</span></div><div class="bg"><div class="fill" style="width:${pc}%"></div></div></div>`}).join('')}catch(e){el.textContent='ফলাফল লোড হয়নি'}}
function tick(){document.querySelectorAll('.cd').forEach(e=>{let s=Math.max(0,(new Date(e.dataset.t)-Date.now())/1e3|0);const d=s/86400|0,h=s%86400/3600|0,m=s%3600/60|0;e.textContent=`${bn(d)}দিন ${bn(h)}ঘ ${bn(m)}মি ${bn(s%60)}সে`})}
function wire(p){const art=$('#p'+p.id);let pick=null;const go=art.querySelector('.go');
 art.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{pick=b.dataset.o;art.querySelectorAll('.opt').forEach(x=>x.classList.toggle('sel',x===b));if(go)go.disabled=false});
 if(go)go.onclick=async()=>{go.disabled=true;go.textContent='অপেক্ষা করুন...';try{await castVote(p,pick);localStorage.setItem('v4j_voted_'+p.id,pick);art.outerHTML=card(p);wire(p);showRes(p)}catch(e){go.disabled=false;go.textContent='ভোট দিন';alert('ভোট দেওয়া যায়নি। হয়তো আগেই ভোট দিয়েছেন বা জরিপ শেষ।')}};
 art.querySelector('.cp').onclick=e=>{navigator.clipboard.writeText(location.href);e.target.textContent='কপি হয়েছে ✓'};
 if(myVote(p.id)||closed(p))showRes(p)}
(async()=>{try{const ps=await loadPolls();$('#polls').innerHTML=ps.length?ps.map(card).join(''):'<p class="mut">এখন কোনো জরিপ চালু নেই।</p>';ps.forEach(wire);tick();setInterval(tick,1000)}catch(e){$('#polls').innerHTML='<p class="mut">ডাটা লোড করা যায়নি। config.js ঠিক আছে কিনা দেখুন।</p>'}})();
