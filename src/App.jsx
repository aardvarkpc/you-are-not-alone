import React, { useMemo, useState, useEffect } from "react";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS22WsDk6VTRkaDHD8PoQiPBVCVrTljc0TpsiKpIY9jNuUAa-Ax3leV4Qeh3jlcwXqjfLpWpsQom6P4/pub?output=csv";
const IS_IOS = /iP(hone|ad|od)/.test(navigator.userAgent);
const thumb = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

const CATEGORY_LIST = [
  "Relationships","Confidence & Self-Worth","Anxiety & Calm","Career & Purpose",
  "Productivity & Focus","Mindset & Change","Life Coaching Insights",
  "Emotional Balance","Health & Self-Care","Family & Connection"
];

function classNames(...xs){return xs.filter(Boolean).join(" ");}

function useLocalStorage(key, initialValue){
  const [v,setV]=useState(()=>{try{const i=localStorage.getItem(key);return i?JSON.parse(i):initialValue;}catch(_){return initialValue}});
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(v));}catch(_){}},[key,v]);
  return [v,setV];
}

function parseCSV(t){
  const r=[];let i=0,f='',row=[],q=false;
  const pf=()=>{row.push(f);f='';};const pr=()=>{r.push(row);row=[];};
  while(i<t.length){const c=t[i++];if(q){if(c==='"'){if(t[i]==='"'){f+='"';i++;}else{q=false}}else{f+=c}}else{if(c==='"')q=true;else if(c===',')pf();else if(c==='\n'){pf();pr();}else if(c!=='\r')f+=c}}
  if(f.length||row.length){pf();pr();}return r;
}

function parseCSVToObjects(text){
  const rows=parseCSV(text);if(!rows.length)return[];
  const headers=rows[0].map(h=>(h||'').trim().toLowerCase());
  const idx=(n)=>headers.indexOf(n);const out=[];
  for(let r=1;r<rows.length;r++){
    const cells=rows[r];
    if(!cells||cells.every(c=>((c||'').trim()==='')))continue;
    const obj={
      id:cells[idx('id')]||'',url:cells[idx('url')]||'',title:cells[idx('title')]||'',
      category:cells[idx('category')]||'',tags:(cells[idx('tags')]||''),duration:cells[idx('duration')]||''
    };
    if(obj.id||obj.url)out.push(obj);
  }
  return out;
}

function registerServiceWorker(){
  if('serviceWorker'in navigator){
    window.addEventListener('load',()=>{navigator.serviceWorker.register('/service-worker.js').catch(()=>{});});
  }
}

let deferredPrompt=null;
if(typeof window!=='undefined'){
  window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();deferredPrompt=e;});
}

const QUICK_PICK_MOODS=[
  {label:"Anxious → Calm",q:"Anxiety & Calm"},
  {label:"Low → Confident",q:"Confidence & Self-Worth"},
  {label:"Stuck → Clear",q:"Productivity & Focus"},
  {label:"Tender → Steady",q:"Emotional Balance"},
  {label:"Love → Reconnect",q:"Relationships"}
];

export default function App(){
  const[query,setQuery]=useState("");
  const[activeCats,setActiveCats]=useState([]);
  const[favorites,setFavorites]=useLocalStorage("yana_favs",[]);
  const[items,setItems]=useState([]);
  const[onlyFavs,setOnlyFavs]=useState(false);
  const[loadMsg,setLoadMsg]=useState("");

  useEffect(()=>{registerServiceWorker();},[]);

  useEffect(()=>{async function load(){
    try{
      setLoadMsg("Loading videos…");
      const res=await fetch(SHEET_CSV_URL,{cache:'no-store'});
      if(!res.ok)throw new Error(`HTTP ${res.status}`);
      const text=await res.text();
      const parsed=parseCSVToObjects(text);
      setItems(parsed);
      setLoadMsg(`Loaded ${parsed.length} videos`);
    }catch(e){setLoadMsg("Couldn't load CSV.");}
  }load();},[]);

  const filtered=useMemo(()=>{
    let list=items;
    if(onlyFavs)list=list.filter((v)=>favorites.includes(v.id));
    if(activeCats.length>0)list=list.filter((v)=>activeCats.some((c)=>(v.category||'').includes(c)));
    if(query.trim()){
      const q=query.toLowerCase();
      list=list.filter((v)=>(v.title||'').toLowerCase().includes(q)||(v.tags||'').toLowerCase().includes(q)||(v.category||'').toLowerCase().includes(q));
    }
    return list;
  },[items,query,activeCats,favorites,onlyFavs]);

  const toggleCat=(cat)=>setActiveCats((prev)=>(prev.includes(cat)?prev.filter((c)=>c!==cat):[...prev,cat]));
  const isFav=(id)=>favorites.includes(id);
  const toggleFav=(id)=>setFavorites((prev)=>(prev.includes(id)?prev.filter((v)=>v!==id):[...prev,id]));
  const clearFilters=()=>{setQuery("");setActiveCats([]);setOnlyFavs(false);};
  const shuffleOne=()=>{if(!filtered.length)return;const idx=Math.floor(Math.random()*filtered.length);document.getElementById(`card-${filtered[idx].id}`)?.scrollIntoView({behavior:'smooth',block:'center'});};
  const promptInstall=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;}};

  return(
  <div className="min-h-screen" style={{background:"#f8fafc",color:"#0f172a",padding:"24px"}}>
    <div style={{maxWidth:"1100px",margin:"0 auto"}}>

      <header style={{marginBottom:"18px",display:"flex",gap:"12px",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h1 style={{fontSize:"26px",fontWeight:800,margin:"0 0 6px"}}>You Are Not Alone</h1>
          <p style={{fontSize:"13px",opacity:.75,margin:0}}>Affirmations, insights, and real talk—right when you need it.</p>
          {loadMsg&&<p style={{fontSize:"12px",opacity:.6,marginTop:"4px"}}>{loadMsg}</p>}
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          <button onClick={promptInstall} style={{border:"1px solid #e2e8f0",background:"#fff",borderRadius:"12px",padding:"8px 12px",fontSize:"13px"}}>Install App ⤵︎</button>
          <button onClick={shuffleOne} style={{border:"1px solid #e2e8f0",background:"#fff",borderRadius:"12px",padding:"8px 12px",fontSize:"13px"}}>Surprise Me 🎲</button>
          <button onClick={clearFilters} style={{border:"1px solid #e2e8f0",background:"#fff",borderRadius:"12px",padding:"8px 12px",fontSize:"13px"}}>Clear Filters</button>
        </div>
      </header>

      <div style={{display:"flex",gap:"12px",flexWrap:"wrap",marginBottom:"12px"}}>
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search by keyword, tag, or title…" style={{flex:"1 1 320px",border:"1px solid #e2e8f0",borderRadius:"12px",padding:"8px 12px",background:"#fff"}} />
        <label style={{display:"inline-flex",alignItems:"center",gap:"8px",fontSize:"13px"}}>
          <input type="checkbox" checked={onlyFavs} onChange={(e)=>setOnlyFavs(e.target.checked)} />Show favorites only
        </label>
      </div>

      <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"10px"}}>
        {["Anxious → Calm","Low → Confident","Stuck → Clear","Tender → Steady","Love → Reconnect"].map((label,i)=>(
          <button key={label} onClick={()=>setActiveCats((prev)=>Array.from(new Set([...prev, ["Anxiety & Calm","Confidence & Self-Worth","Productivity & Focus","Emotional Balance","Relationships"][i]])))} style={{border:"1px solid #e2e8f0",background:"#fff",borderRadius:"999px",padding:"6px 10px",fontSize:"12px"}}>{label}</button>
        ))}
      </div>

      <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"16px"}}>
        {CATEGORY_LIST.map((cat)=>{
          const active=activeCats.includes(cat);
          return(
            <button key={cat} onClick={()=>toggleCat(cat)} style={{border:"1px solid",borderColor:active?"#0f172a":"#e2e8f0",background:active?"#0f172a":"#fff",color:active?"#fff":"#0f172a",borderRadius:"999px",padding:"6px 10px",fontSize:"12px"}}>{cat}</button>
          )
        })}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:"16px"}}>
        {filtered.map((v)=>(
          <article id={`card-${v.id}`} key={v.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:"16px",overflow:"hidden"}}>

            {/* iPhone-safe player block */}
            <div style={{aspectRatio:"16/9",width:"100%",position:"relative",background:"#000"}}>
              {IS_IOS ? (
                <button
                  onClick={() => window.location.href = v.url || `https://youtu.be/${v.id}`}
                  aria-label={`Play ${v.title}`}
                  style={{all:"unset",cursor:"pointer",display:"block",width:"100%",height:"100%",position:"relative"}}
                >
                  <img
                    src={thumb(v.id)}
                    alt={v.title}
                    loading="lazy"
                    style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                  />
                  <div
                    style={{
                      position:"absolute",inset:0,display:"grid",placeItems:"center",
                      background:"linear-gradient(0deg, rgba(0,0,0,.35), rgba(0,0,0,.15))"
                    }}
                  >
                    <div style={{
                      width:64,height:64,borderRadius:"50%",background:"rgba(255,255,255,.9)",
                      display:"grid",placeItems:"center",fontSize:24,fontWeight:700,color:"#e11d48"
                    }}>▶</div>
                  </div>
                </button>
              ) : (
                <iframe
                  style={{width:"100%",height:"100%",border:0}}
                  src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=0&modestbranding=1&playsinline=1&rel=0`}
                  title={v.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              )}
            </div>

            <div style={{padding:"12px"}}>
              <h3 style={{margin:"0 0 6px",fontWeight:700}}>{v.title}</h3>

              <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"6px",color:"#475569"}}>
                {(v.category||"").split('|').filter(Boolean).map((c)=>(
                  <span key={c} style={{fontSize:"11px",border:"1px solid #e2e8f0",borderRadius:"999px",padding:"2px 8px",background:"#f8fafc"}}>{c}</span>
                ))}
              </div>

              {(v.tags||"").trim()&&(
                <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"8px",color:"#64748b"}}>
                  {(v.tags||"").split('|').slice(0,8).map((t)=>(
                    <span key={t} style={{fontSize:"11px",border:"1px solid #e2e8f0",borderRadius:"999px",padding:"2px 8px"}}>#{t}</span>
                  ))}
                </div>
              )}

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <button
                  onClick={()=>{const fav=v.id;if(favorites.includes(fav)){setFavorites(favorites.filter(x=>x!==fav));}else{setFavorites([...favorites,fav]);}}}
                  style={{border:"1px solid #e2e8f0",background:favorites.includes(v.id)?"#fde68a":"#fff",borderRadius:"10px",padding:"6px 10px",fontSize:"12px"}}
                >
                  {favorites.includes(v.id)?"★ Favorited":"☆ Favorite"}
                </button>
                {v.duration?<span style={{fontSize:"11px",color:"#64748b"}}>~{v.duration}s</span>:<span/>}
              </div>
            </div>

          </article>
        ))}
      </div>

      {filtered.length===0&&(
        <div style={{textAlign:"center",padding:"40px 0",color:"#64748b"}}>
          No videos match your filters. Try clearing them or searching different terms.
        </div>
      )}
    </div>
  </div>);
}
