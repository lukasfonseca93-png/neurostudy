import { useState, useEffect, useCallback, useRef } from "react";
import { sb } from "./supabase.js";

const AREAS = [
  { id:"neuro",  label:"Neurociências",  icon:"ti-brain",    color:"#9D95E8", bg:"#2a2840", text:"#c8c4f8" },
  { id:"biblia", label:"Estudo Bíblico", icon:"ti-book",     color:"#34C98A", bg:"#1a3028", text:"#7ee8bc" },
  { id:"ingles", label:"Inglês",         icon:"ti-language", color:"#60A5FA", bg:"#1a2840", text:"#93c5fd" },
  { id:"livros", label:"Livros",         icon:"ti-books",    color:"#F87171", bg:"#2d1a1a", text:"#fca5a5" },
  { id:"geral",  label:"Área Geral",     icon:"ti-school",   color:"#FBBF24", bg:"#2d2410", text:"#fde68a" },
];
const C = {bg:"#0f0f13",surf:"#17171f",card:"#1e1e28",bord:"#2a2a38",text:"#e8e8f2",muted:"#6b6b85",dim:"#12121a"};
const CAT_STYLE = {
  "Neuro":       {color:"#9D95E8",bg:"#2a2840",text:"#c8c4f8"},
  "Neurociências":{color:"#9D95E8",bg:"#2a2840",text:"#c8c4f8"},
  "Bíblia":      {color:"#34C98A",bg:"#1a3028",text:"#7ee8bc"},
  "Estudo Bíblico":{color:"#34C98A",bg:"#1a3028",text:"#7ee8bc"},
  "Inglês":      {color:"#60A5FA",bg:"#1a2840",text:"#93c5fd"},
  "Livros":      {color:"#F87171",bg:"#2d1a1a",text:"#fca5a5"},
  "Filosofia":   {color:"#FBBF24",bg:"#2d2410",text:"#fde68a"},
  "Geral":       {color:"#FBBF24",bg:"#2d2410",text:"#fde68a"},
  "Área Geral":  {color:"#FBBF24",bg:"#2d2410",text:"#fde68a"},
};
// Mapa canônico: area id -> label curto para revisão espaçada
const CAT_LABEL = {neuro:"Neuro",biblia:"Bíblia",ingles:"Inglês",livros:"Livros",geral:"Geral"};
const REV_LABELS = ["+1d","+10d","+30d","+90d","+180d","+360d","+720d","+1440d"];
const EBB_INTERVALS=[1,3,7,14,30,90]; // Ebbinghaus: rep 0→1d, 1→3d, 2→7d, 3→14d, 4→30d, 5+→90d
const PERIODS = ["semanal","mensal","semestral","anual"];

const DEFAULT_FOLDERS = {
  neuro:  [
    {id:"nf1",name:"Neuroanatomia e Estruturas"},
    {id:"nf2",name:"Córtex Pré-Frontal e Lobos"},
    {id:"nf3",name:"Neurotransmissores e Sinapses"},
    {id:"nf4",name:"Memória e Aprendizado"},
    {id:"nf5",name:"Emoções e Sistema Límbico"},
    {id:"nf6",name:"Módulos IPOG / VRC"},
    {id:"nf7",name:"Neurociência Comportamental"},
    {id:"nf8",name:"Podcasts Neuro"},
  ],
  biblia: [
    {id:"bf1",name:"Vida e Ministério de Jesus"},
    {id:"bf2",name:"Evangelho de João"},
    {id:"bf3",name:"Cartas e Epístolas"},
    {id:"bf4",name:"Antigo Testamento"},
    {id:"bf5",name:"Módulos IPOG"},
  ],
  ingles: [
    {id:"if1",name:"Gramática"},
    {id:"if2",name:"Vocabulário e Expressões"},
    {id:"if3",name:"Homework"},
    {id:"if4",name:"Lições Poliglota"},
    {id:"if5",name:"Francês"},
  ],
  livros: [
    {id:"lf1",name:"Neurociências e Mente"},
    {id:"lf2",name:"Desenvolvimento Pessoal"},
    {id:"lf3",name:"Filosofia e Estoicismo"},
    {id:"lf4",name:"Liderança e Comunicação"},
    {id:"lf5",name:"Outros"},
  ],
  geral:  [
    {id:"gf1",name:"Filosofia"},
    {id:"gf2",name:"Liderança e Comunicação"},
    {id:"gf3",name:"Psicologia e Comportamento"},
    {id:"gf4",name:"Produtividade e Hábitos"},
    {id:"gf5",name:"Oratória e Apresentações"},
    {id:"gf6",name:"Princípios Pessoais"},
    {id:"gf7",name:"Outros"},
  ],
};

const LS = {
  get:(k,d)=>{try{const v=localStorage.getItem("ns2_"+k);return v!=null?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem("ns2_"+k,JSON.stringify(v));}catch{}},
};

const SEED_TOPICS = [
  {id:1001,area:"neuro",folder_id:"nf2",title:"Córtex e Lobos Cerebrais",notes:"O telencéfalo é dividido em 5 lobos. Lobo Frontal: tomada de decisões, funções executivas, controle motor voluntário, Área de Broca (fala). Lobo Parietal: somatossensorial, tato, dor, temperatura, propriocepção. Lobo Occipital: córtex visual. Lobo Temporal: córtex auditivo, hipocampo, memória, Área de Wernicke. Ínsula: gustação. Corpo caloso conecta hemisférios. Tálamo: relé sensorial. Hipotálamo: homeostase, fome, sono.",tags:["córtex","lobos"],created_at:Date.now()-7*864e5,next_review:Date.now(),interval_days:0,repetitions:0,quiz_cache:null},
  {id:1002,area:"neuro",folder_id:"nf3",title:"Neurônios e Sinapses",notes:"Neurônios: dendrites, corpo celular, axônio. Potencial de ação tudo-ou-nada: limiar -55mV. Mielina acelera condução. Sinapse química: neurotransmissores na fenda. LTP: base celular da memória. Dopamina: recompensa. Serotonina: humor. Noradrenalina: alerta. Acetilcolina: memória.",tags:["neurônios","sinapses"],created_at:Date.now()-14*864e5,next_review:Date.now()+3*864e5,interval_days:3,repetitions:1,quiz_cache:null},
  {id:1003,area:"neuro",folder_id:"nf4",title:"Sonhos",notes:"Sonhos ocorrem principalmente durante o sono REM. Hipótese de consolidação de memória: o hipocampo retransmite memórias para o córtex durante o sono. Teoria da simulação de ameaças (Revonsuo). Freud: realização de desejos inconscientes. Ativação-síntese (Hobson).",tags:["sono","REM","memória"],created_at:Date.now()-20*864e5,next_review:Date.now(),interval_days:0,repetitions:4,quiz_cache:null},
  {id:1004,area:"neuro",folder_id:"nf1",title:"Sistema Sensorial",notes:"Cinco sentidos clássicos + propriocepção e vestibular. Visão: córtex occipital. Audição: córtex temporal. Tato/dor/temperatura: córtex parietal somatossensorial. Olfato: único sentido que não passa pelo tálamo. Tálamo = porteiro sensorial.",tags:["sentidos","tálamo"],created_at:Date.now()-30*864e5,next_review:Date.now()+5*864e5,interval_days:7,repetitions:3,quiz_cache:null},
  {id:1005,area:"neuro",folder_id:"nf2",title:"Funções Executivas",notes:"Localizadas no córtex pré-frontal (CPF). Planejamento, tomada de decisão, controle inibitório, memória de trabalho, flexibilidade cognitiva. dlPFC: memória de trabalho. vmPFC: emoções e decisões. OFC: recompensa. Mielinização do CPF completa só aos 25 anos.",tags:["CPF","executivo"],created_at:Date.now()-25*864e5,next_review:Date.now()+2*864e5,interval_days:3,repetitions:2,quiz_cache:null},
  {id:1006,area:"biblia",folder_id:"bf1",title:"Evangelho Linha-a-Linha – Módulo 1",notes:"Evangelhos sinóticos: Mateus, Marcos, Lucas. Hipótese das duas fontes: Marcos + fonte Q. Marcos: audiência romana. Mateus: audiência judaica. Lucas: greco-romana. João: teologia desenvolvida, Jesus como Logos.",tags:["evangelho","sinóticos"],created_at:Date.now()-5*864e5,next_review:Date.now()+1*864e5,interval_days:1,repetitions:1,quiz_cache:null},
  {id:1007,area:"ingles",folder_id:"if1",title:"Present Perfect vs Past Simple",notes:"Present Perfect (have/has + past participle): relevância no presente, experiência sem tempo definido. Marcadores: already, yet, just, ever, never, since, for. Past Simple: ação concluída em tempo específico. Marcadores: yesterday, last week, in 2020, ago.",tags:["gramática","verbos"],created_at:Date.now()-3*864e5,next_review:Date.now(),interval_days:0,repetitions:0,quiz_cache:null},
];

const SEED_REV_ROWS = [
  {id:"x1",topic:"Sonhos",cat:"Neuro",base_date:"2025-10-30",checks:[1,1,1,1,0,0,0,0],revs:["2025-10-31","2025-11-09","2025-11-29","2026-01-28","2026-04-28","2026-10-25","2027-10-20","2029-10-14"]},
  {id:"x2",topic:"Tribo de Israel",cat:"Bíblia",base_date:"2025-10-13",checks:[1,1,1,1,1,0,0,0],revs:["2025-10-14","2025-10-23","2025-11-12","2026-01-11","2026-04-11","2026-10-08","2027-10-03","2029-09-27"]},
  {id:"x3",topic:"Sistema Sensorial",cat:"Neuro",base_date:"2025-10-25",checks:[1,1,1,1,0,0,0,0],revs:["2025-10-26","2025-11-04","2025-11-24","2026-01-23","2026-04-23","2026-10-20","2027-10-15","2029-10-09"]},
  {id:"x4",topic:"Neuro da Mudança",cat:"Neuro",base_date:"2025-11-17",checks:[1,1,1,1,0,0,0,0],revs:["2025-11-18","2025-11-27","2025-12-17","2026-02-15","2026-05-16","2026-11-12","2027-11-07","2029-11-01"]},
  {id:"x10",topic:"Ele cresce",cat:"Bíblia",base_date:"2026-02-02",checks:[1,1,1,0,0,0,0,0],revs:["2026-02-03","2026-02-12","2026-03-04","2026-05-03","2026-08-01","2027-01-28","2027-07-27","2028-07-21"]},
  {id:"x12",topic:"Homework p. 30 a 50",cat:"Inglês",base_date:"2026-02-16",checks:[1,1,1,0,0,0,0,0],revs:["2026-02-17","2026-02-26","2026-03-18","2026-05-17","2026-08-15","2027-02-11","2027-08-10","2028-08-04"]},
  {id:"x13",topic:"Módulo 7 – IPOG",cat:"Neuro",base_date:"2026-02-20",checks:[1,1,1,0,0,0,0,0],revs:["2026-02-21","2026-03-02","2026-03-22","2026-05-21","2026-08-19","2027-02-15","2027-08-14","2028-08-08"]},
  {id:"x33",topic:"Neuro Tomada de Decisão",cat:"Neuro",base_date:"2026-05-06",checks:[0,0,0,0,0,0,0,0],revs:["2026-05-07","2026-05-16","2026-06-05","2026-08-04","2026-11-02","2027-05-01","2027-10-29","2028-10-23"]},
];

function calcRevDates(base){const b=new Date(base+"T12:00:00");return[1,10,30,90,180,360,720,1440].map(d=>{const n=new Date(b);n.setDate(n.getDate()+d);return n.toISOString().slice(0,10);});}
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const fd=(ts)=>{const d=new Date(ts);return`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;};
const CSS=`
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{background:#0f0f13;color:#e8e8f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;}
  ::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:#0f0f13;}::-webkit-scrollbar-thumb{background:#2a2a38;border-radius:3px;}
  .sb{width:220px;background:#17171f;border-right:0.5px solid #2a2a38;padding:1rem 0.75rem;display:flex;flex-direction:column;gap:2px;position:fixed;top:0;left:0;height:100vh;overflow-y:auto;z-index:10;}
  .main{margin-left:220px;padding:1.75rem;min-height:100vh;max-width:1300px;}
  .ni{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;cursor:pointer;font-size:14px;color:#8b8baa;transition:all 0.15s;border:none;background:none;width:100%;text-align:left;}
  .ni:hover{background:#1e1e28;color:#e8e8f2;}.ni.on{background:#1c1838;color:#9D95E8;font-weight:600;}.ni i{font-size:17px;}
  .card{background:#1e1e28;border:0.5px solid #2a2a38;border-radius:12px;padding:1.2rem;}
  .met{background:#12121a;border:0.5px solid #2a2a38;border-radius:10px;padding:1rem;}
  .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
  .g3{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;}
  .g2{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;}
  .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;border:0.5px solid #2a2a38;background:#1e1e28;color:#e8e8f2;cursor:pointer;font-size:13px;transition:all 0.15s;white-space:nowrap;}
  .btn:hover{border-color:#6b6b85;}.btn:disabled{opacity:0.4;cursor:not-allowed;}
  .btn-sm{padding:5px 11px!important;font-size:12px!important;}
  .btnp{background:#1c1838;border-color:#3d3780;color:#9D95E8;}.btnp:hover{background:#221e42;}
  .btnr{background:#2d1010;border-color:#7f2020;color:#fca5a5;}.btnr:hover{background:#3a1212;}
  .btng{background:#0d2218;border-color:#1D6B50;color:#34C98A;}.btng:hover{background:#0d2a1e;}
  .bdg{display:inline-flex;align-items:center;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:500;}
  .tag{background:#12121a;color:#6b6b85;font-size:10px;padding:2px 7px;border-radius:20px;border:0.5px solid #2a2a38;}
  .pb{height:5px;border-radius:3px;background:#2a2a38;overflow:hidden;}.pf{height:100%;border-radius:3px;transition:width 0.4s;}
  .st{font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:0.09em;color:#6b6b85;margin-bottom:9px;}
  input:not([type="checkbox"]):not([type="radio"]),textarea,select{background:#12121a;border:0.5px solid #2a2a38;color:#e8e8f2;border-radius:8px;padding:8px 12px;font-size:13px;width:100%;font-family:inherit;transition:border 0.15s;}
  input:focus,textarea:focus,select:focus{outline:none;border-color:#534AB7;}
  .ov{position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:100;}
  .mod{background:#17171f;border-radius:14px;padding:1.5rem;width:90%;max-width:560px;border:0.5px solid #2a2a38;max-height:92vh;overflow-y:auto;}
  .qo{padding:12px 15px;border-radius:8px;border:0.5px solid #2a2a38;cursor:pointer;font-size:13px;transition:all 0.15s;background:#12121a;color:#e8e8f2;text-align:left;width:100%;line-height:1.5;}
  .qo:hover:not(:disabled){border-color:#534AB7;background:#1a1a30;}.qo:disabled{cursor:default;}
  .qo.ok{background:#0d2218;border-color:#1D9E75;color:#34C98A;}.qo.no{background:#2d1010;border-color:#7f2020;color:#F87171;}
  .pc{background:#12121a;border:0.5px solid #2a2a38;border-radius:11px;padding:11px;min-width:215px;max-width:255px;flex-shrink:0;}
  .pcard{background:#1e1e28;border:0.5px solid #2a2a38;border-radius:7px;padding:10px 12px;font-size:13px;cursor:grab;display:flex;justify-content:space-between;align-items:flex-start;gap:6px;line-height:1.5;overflow:hidden;min-width:0;}
  .atab{padding:7px 14px;border-radius:7px;border:0.5px solid #2a2a38;background:#12121a;color:#6b6b85;cursor:pointer;font-size:13px;transition:all 0.15s;}.atab.on{font-weight:500;}
  table{border-collapse:collapse;width:100%;}th,td{padding:9px 11px;font-size:13px;}
  th{color:#6b6b85;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;background:#12121a;border-bottom:0.5px solid #2a2a38;}
  tr:not(:last-child) td{border-bottom:0.5px solid #2a2a38;}tr:nth-child(even) td{background:#12121a;}
  .area-header{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;cursor:pointer;border:0.5px solid #2a2a38;background:#12121a;transition:background 0.15s;margin-bottom:4px;}
  .area-header:hover{background:#1e1e28;}
  .folder-header{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;cursor:pointer;background:#17171f;border:0.5px solid #2a2a38;margin-bottom:3px;transition:background 0.15s;}
  .folder-header:hover{background:#1e1e28;}
  .inline-edit{background:transparent;border:0.5px solid transparent;border-radius:6px;padding:8px 4px;font-size:13px;line-height:1.8;color:#b0b0c8;resize:vertical;width:100%;min-height:80px;font-family:inherit;}
  .inline-edit:hover{border-color:#2a2a38;background:#0f0f13;}
  .inline-edit:focus{border-color:#534AB7;background:#0f0f13;outline:none;color:#e8e8f2;}
  .title-inline{background:transparent;border:none;border-bottom:1px solid transparent;color:#e8e8f2;font-size:15px;font-weight:600;padding:4px 0;width:100%;font-family:inherit;transition:border-color 0.15s;}
  .title-inline:focus{outline:none;border-bottom-color:#534AB7;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .chk{width:16px;height:16px;accent-color:#9D95E8;cursor:pointer;flex-shrink:0;margin-right:2px;}
  .bulk-bar{position:sticky;top:0;z-index:20;background:#1c1838;border:0.5px solid #3d3780;border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;}
  .bulk-cnt{font-size:13px;color:#9D95E8;font-weight:600;flex:1;}
`;

function PageHeader({title,sub,btn,extra}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.25rem",flexWrap:"wrap",gap:8}}>
      <div><h1 style={{fontSize:20,fontWeight:600,marginBottom:2}}>{title}</h1>{sub&&<p style={{fontSize:12,color:C.muted}}>{sub}</p>}</div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
        {extra}{btn&&<button className="btn btnp" onClick={btn.fn}><i className={`ti ${btn.icon}`} aria-hidden/>{btn.label}</button>}
      </div>
    </div>
  );
}
function ModalWrap({title,onClose,children,wide}){
  return(
    <div className="ov" onClick={onClose}>
      <div className="mod" style={wide?{maxWidth:780}:{}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
          <h2 style={{fontSize:16,fontWeight:600}}>{title}</h2>
          <button className="btn btn-sm" onClick={onClose}><i className="ti ti-x" aria-hidden/></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function TopicForm({val,set,onSave,folders,btnLabel="Salvar"}){
  const areaFolders=(folders||{})[val.area]||[];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <input placeholder="Título do tópico" value={val.title} onChange={e=>set(v=>({...v,title:e.target.value}))}/>
      <select value={val.area} onChange={e=>set(v=>({...v,area:e.target.value,folder_id:""}))}>
        {AREAS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
      </select>
      {areaFolders.length>0&&(
        <select value={val.folder_id||""} onChange={e=>set(v=>({...v,folder_id:e.target.value}))}>
          <option value="">— Sem pasta —</option>
          {areaFolders.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      )}
      <textarea rows={5} placeholder="Notas, resumo, conceitos-chave..." value={val.notes} onChange={e=>set(v=>({...v,notes:e.target.value}))}/>
      <input placeholder="Tags (separadas por vírgula)" value={val.tags} onChange={e=>set(v=>({...v,tags:e.target.value}))}/>
      <button className="btn btnp" onClick={onSave}>{btnLabel}</button>
    </div>
  );
}
function BookForm({val,set,onSave}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <input placeholder="Título do livro" value={val.title} onChange={e=>set(v=>({...v,title:e.target.value}))}/>
      <input placeholder="Autor" value={val.author} onChange={e=>set(v=>({...v,author:e.target.value}))}/>
      <select value={val.area} onChange={e=>set(v=>({...v,area:e.target.value}))}>
        {AREAS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
      </select>
      <select value={val.status} onChange={e=>set(v=>({...v,status:e.target.value}))}>
        <option value="queued">Na fila</option><option value="reading">Lendo</option><option value="completed">Concluído</option>
      </select>
      <textarea rows={2} placeholder="Notas iniciais..." value={val.notes} onChange={e=>set(v=>({...v,notes:e.target.value}))}/>
      <button className="btn btnp" onClick={onSave}>Salvar</button>
    </div>
  );
}
function GoalForm({val,set,onSave}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <select value={val.area} onChange={e=>set(v=>({...v,area:e.target.value}))}>
        {AREAS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
      </select>
      <input placeholder="Título da meta" value={val.title} onChange={e=>set(v=>({...v,title:e.target.value}))}/>
      <div style={{display:"flex",gap:8}}>
        <input type="number" placeholder="Meta" value={val.target} onChange={e=>set(v=>({...v,target:e.target.value}))} style={{flex:1}}/>
        <input placeholder="Unidade (horas, págs...)" value={val.unit} onChange={e=>set(v=>({...v,unit:e.target.value}))} style={{flex:1}}/>
      </div>
      <select value={val.period} onChange={e=>set(v=>({...v,period:e.target.value}))}>
        {PERIODS.map(p=><option key={p} value={p}>{p}</option>)}
      </select>
      <button className="btn btnp" onClick={onSave}>Criar meta</button>
    </div>
  );
}
function RevForm({val,set,onSave}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <input placeholder="Tópico estudado" value={val.topic} onChange={e=>set(v=>({...v,topic:e.target.value}))}/>
      <select value={val.cat} onChange={e=>set(v=>({...v,cat:e.target.value}))}>
        {["Neuro","Bíblia","Inglês","Filosofia","Geral"].map(c=><option key={c} value={c}>{c}</option>)}
      </select>
      <div style={{fontSize:11,color:C.muted}}>Data base (dia que estudou)</div>
      <input type="date" value={val.base_date} onChange={e=>set(v=>({...v,base_date:e.target.value}))}/>
      <button className="btn btnp" onClick={onSave}>Adicionar à revisão</button>
    </div>
  );
}

function AuthScreen(){
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [mode,setMode]=useState("login");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState(null);
  const [msg,setMsg]=useState(null);
  const handle=async(e)=>{
    e?.preventDefault();
    if(!email.trim()||!pw.trim()){setErr("Preencha e-mail e senha.");return;}
    setLoading(true);setErr(null);setMsg(null);
    try{
      if(mode==="login"){
        const{error}=await sb.auth.signInWithPassword({email:email.trim(),password:pw});
        if(error)throw error;
      }else{
        const{error}=await sb.auth.signUp({email:email.trim(),password:pw});
        if(error)throw error;
        setMsg("Cadastro realizado! Verifique seu e-mail para confirmar.");
      }
    }catch(e2){setErr(e2.message);}
    finally{setLoading(false);}
  };
  return(
    <div style={{minHeight:"100vh",background:"#0f0f13",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"}}>
      <div style={{background:"#17171f",border:"0.5px solid #2a2a38",borderRadius:16,padding:"2.5rem 2rem",width:"100%",maxWidth:400,boxShadow:"0 20px 60px #00000060"}}>
        <div style={{textAlign:"center",marginBottom:"2rem"}}>
          <div style={{fontSize:36,marginBottom:8}}>🧠</div>
          <h1 style={{color:"#e8e8f2",fontSize:22,fontWeight:700,margin:0}}>NeuroStudy</h1>
          <p style={{color:"#6b6b85",fontSize:13,marginTop:6}}>{mode==="login"?"Entre para acessar seus estudos":"Crie sua conta gratuita"}</p>
        </div>
        <form onSubmit={handle} style={{display:"flex",flexDirection:"column",gap:12}}>
          <input type="email" placeholder="Seu e-mail" value={email} onChange={e=>setEmail(e.target.value)}
            style={{background:"#12121a",border:"0.5px solid #2a2a38",borderRadius:9,padding:"11px 14px",color:"#e8e8f2",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
          <input type="password" placeholder="Senha (mín. 6 caracteres)" value={pw} onChange={e=>setPw(e.target.value)}
            style={{background:"#12121a",border:"0.5px solid #2a2a38",borderRadius:9,padding:"11px 14px",color:"#e8e8f2",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
          {err&&<div style={{background:"#2d1010",border:"0.5px solid #7f2020",borderRadius:8,padding:"9px 12px",color:"#fca5a5",fontSize:13}}>{err}</div>}
          {msg&&<div style={{background:"#0d2218",border:"0.5px solid #1D6B50",borderRadius:8,padding:"9px 12px",color:"#34C98A",fontSize:13}}>{msg}</div>}
          <button type="submit" disabled={loading}
            style={{background:"#534AB7",border:"none",borderRadius:9,padding:"12px",color:"#fff",fontSize:15,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,fontFamily:"inherit",marginTop:4}}>
            {loading?"Aguarde...":(mode==="login"?"Entrar":"Criar conta")}
          </button>
        </form>
        <div style={{textAlign:"center",marginTop:"1.25rem"}}>
          <button onClick={()=>{setMode(m=>m==="login"?"signup":"login");setErr(null);setMsg(null);}}
            style={{background:"none",border:"none",color:"#9D95E8",cursor:"pointer",fontSize:13,fontFamily:"inherit",textDecoration:"underline"}}>
            {mode==="login"?"Não tem conta? Cadastre-se aqui":"Já tem conta? Fazer login"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [session,setSession]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [loaded,setLoaded]=useState(false);
  const [view,setView]=useState(()=>LS.get("view","dashboard"));
  const [aArea,setAArea]=useState("neuro");
  const [orgTab,setOrgTab]=useState("topics");
  const [topics,setTopics]=useState(()=>LS.get("topics",[]));
  const [folders,setFolders]=useState(()=>LS.get("folders",DEFAULT_FOLDERS));
  const [revRows,setRevRows]=useState(()=>LS.get("revRows",[]));
  const [books,setBooks]=useState(()=>LS.get("books",[]));
  const [goals,setGoals]=useState(()=>LS.get("goals",[]));
  const [studyLogs,setStudyLogs]=useState(()=>LS.get("studyLogs",[]));
  const [knowledge,setKnowledge]=useState(()=>LS.get("knowledge",[]));
  const [planner,setPlanner]=useState(()=>LS.get("planner",{}));
  const [quizHistory,setQuizHistory]=useState(()=>LS.get("quizHistory",[]));
  const [quizResults,setQuizResults]=useState(()=>LS.get("quizResults",[]));// [{topicId,topicTitle,date,score,total,area}]
  const [weekStudy,setWeekStudy]=useState(()=>LS.get("weekStudy",{neuro:0,biblia:0,ingles:0,livros:0,geral:0}));
  const [weeklySchedule,setWeeklySchedule]=useState(()=>LS.get("weeklySchedule",{}));
  const [plannerTab,setPlannerTab]=useState("weekly");
  const [wInputs,setWInputs]=useState({});
  const [planEditCell,setPlanEditCell]=useState(null);
  const [planEditCat,setPlanEditCat]=useState(null);
  const [dailyTasks,setDailyTasks]=useState(()=>LS.get("dailyTasks",[]));
  const [dailyTaskInput,setDailyTaskInput]=useState("");
  const [hoursView,setHoursView]=useState("week");// day|week|month|year
  const [hoursLogs,setHoursLogs]=useState(()=>LS.get("hoursLogs",[]));// [{date:"2026-05-29",hours:2.5,category:"neuro"}]
  const [hoursInput,setHoursInput]=useState({h:"",cat:"neuro"});
  const [topicTab,setTopicTab]=useState({});
  const [topicAI,setTopicAI]=useState({});
  const [booksView,setBooksView]=useState("acervo");
  const [readingPlan,setReadingPlan]=useState(()=>LS.get("readingPlan",{entries:[]}));
  const [collapsedAreas,setCollapsedAreas]=useState(()=>new Set(LS.get("collapsedAreas",["neuro","biblia","ingles","livros","geral"])));
  const [collapsedFolders,setCollapsedFolders]=useState(()=>new Set(LS.get("collapsedFolders",[])));
  const [expanded,setExpanded]=useState(null);
  const [pendingExpand,setPendingExpand]=useState(null);
  const [editNotes,setEditNotes]=useState({});
  const [quiz,setQuiz]=useState(null);
  const [qLoad,setQLoad]=useState(false);
  const [qErr,setQErr]=useState(null);
  const [modal,setModal]=useState(null);
  const [revFilter,setRevFilter]=useState("Todas");
  const [revSearch,setRevSearch]=useState("");
  const [expandedBook,setExpandedBook]=useState(null);
  const [goalPeriod,setGoalPeriod]=useState("anual");
  const [goalNotes,setGoalNotes]=useState({});
  const [addCard,setAddCard]=useState(null);
  const [cardTxt,setCardTxt]=useState({});
  const [addCol,setAddCol]=useState(false);
  const [colTxt,setColTxt]=useState("");
  const [knowledgeFilter,setKnowledgeFilter]=useState("all");
  const [quizAreaTab,setQuizAreaTab]=useState("topics");
  const [editRevRow,setEditRevRow]=useState(null);
  const [syncMsg,setSyncMsg]=useState(null);
  const [moveModal,setMoveModal]=useState(null);
  const [moveTarget,setMoveTarget]=useState({area:"neuro",folder_id:""});
  const [selectedTopics,setSelectedTopics]=useState(()=>new Set());
  const [bulkMode,setBulkMode]=useState(false);
  const [bulkMoveModal,setBulkMoveModal]=useState(false);
  const [bulkMoveTarget,setBulkMoveTarget]=useState({area:"neuro",folder_id:""});
  const [folderModal,setFolderModal]=useState(null);
  const [folderModalName,setFolderModalName]=useState("");
  const [nt,setNt]=useState({title:"",notes:"",tags:"",area:"neuro",folder_id:"",note_content:""});
  const [nb,setNb]=useState({title:"",author:"",area:"livros",status:"queued",notes:""});
  const [ng,setNg]=useState({area:"neuro",title:"",target:"",unit:"",period:"anual"});
  const [nr,setNr]=useState({topic:"",cat:"Neuro",base_date:today()});
  const t0=today();
  const [ult,setUlt]=useState(null); // {mode:'focus'|'break',secs,running,focusMins,breakMins}
  const [ultFocusMins,setUltFocusMins]=useState(()=>LS.get("ultFocusMins",90));
  const [ultBreakMins,setUltBreakMins]=useState(()=>LS.get("ultBreakMins",20));
  const ultRef=useRef(null);
  const [captureRaw,setCaptureRaw]=useState("");
  const [topicSearch,setTopicSearch]=useState("");
  const [captureResult,setCaptureResult]=useState(null);
  const [captureLoading,setCaptureLoading]=useState(false);
  const [captureErr,setCaptureErr]=useState(null);
  const [captureInbox,setCaptureInbox]=useState(()=>LS.get("captureInbox",[]));
  const foldersTimer=useRef(null);
  const weekStudyTimer=useRef(null);
  const scheduleTimer=useRef(null);

  useEffect(()=>{if(loaded)LS.set("topics",topics);},[topics,loaded]);
  useEffect(()=>{
    if(!loaded)return;
    LS.set("folders",folders);
    saveFolders(folders);
  },[folders,loaded]);
  useEffect(()=>{if(loaded)LS.set("revRows",revRows);},[revRows,loaded]);
  useEffect(()=>{if(loaded)LS.set("books",books);},[books,loaded]);
  useEffect(()=>{if(loaded)LS.set("goals",goals);},[goals,loaded]);
  useEffect(()=>{if(loaded)LS.set("knowledge",knowledge);},[knowledge,loaded]);
  useEffect(()=>{if(loaded)LS.set("planner",planner);},[planner,loaded]);
  useEffect(()=>{
    if(!loaded)return;
    LS.set("weeklySchedule",weeklySchedule);
    saveWeeklySchedule(weeklySchedule);
  },[weeklySchedule,loaded]);
  useEffect(()=>{
    if(!loaded)return;
    LS.set("weekStudy",weekStudy);
    saveWeekStudy(weekStudy);
  },[weekStudy,loaded]);
  useEffect(()=>{if(loaded)LS.set("readingPlan",readingPlan);},[readingPlan,loaded]);
  useEffect(()=>{if(loaded)LS.set("dailyTasks",dailyTasks);},[dailyTasks,loaded]);
  useEffect(()=>{if(loaded)LS.set("hoursLogs",hoursLogs);},[hoursLogs,loaded]);
  useEffect(()=>{if(loaded)LS.set("quizResults",quizResults);},[quizResults,loaded]);
  useEffect(()=>{LS.set("view",view);},[view]);
  useEffect(()=>{LS.set("collapsedAreas",[...collapsedAreas]);},[collapsedAreas]);
  useEffect(()=>{
    if(view==="org"&&pendingExpand!==null){
      const t=topics.find(x=>x.id===pendingExpand);
      if(t){
        // Uncollapse the area
        setCollapsedAreas(p=>{const n=new Set(p);n.delete(t.area);return n;});
        setExpanded(pendingExpand);
      }
      setPendingExpand(null);
    }
  },[view,pendingExpand]);
  useEffect(()=>{LS.set("collapsedFolders",[...collapsedFolders]);},[collapsedFolders]);

  useEffect(()=>{
    if(!ult?.running){clearInterval(ultRef.current);return;}
    ultRef.current=setInterval(()=>{
      setUlt(u=>{
        if(!u||!u.running)return u;
        if(u.secs<=1){
          const focusSecs=(u.focusMins||ultFocusMins)*60;
          const breakSecs=(u.breakMins||ultBreakMins)*60;
          if(u.mode==='focus'){
            // Ciclo de foco completado — salva como log de horas
            const hrs=parseFloat(((u.focusMins||ultFocusMins)/60).toFixed(2));
            const log={id:Date.now()+"_ult",date:new Date().toISOString().slice(0,10),hours:hrs,category:"geral"};
            setHoursLogs(prev=>{const nw=[...prev,log];LS.set("hoursLogs",nw);return nw;});
            try{if(session?.user?.id)sb.from('hours_logs').insert({id:log.id,user_id:session.user.id,date:log.date,hours:log.hours,category:log.category}).then();}catch{}
            try{new Notification("🌿 Pausa! "+u.breakMins+" min de descanso");}catch{}
            return{...u,mode:'break',secs:breakSecs};
          }else{
            try{new Notification("🧠 Hora de focar! "+u.focusMins+" min");}catch{}
            return{...u,mode:'focus',secs:focusSecs};
          }
        }
        return{...u,secs:u.secs-1};
      });
    },1000);
    return()=>clearInterval(ultRef.current);
  },[ult?.running]);

  useEffect(()=>{
    sb.auth.getSession().then(({data:{session:s}})=>{setSession(s);setAuthLoading(false);});
    const{data:{subscription}}=sb.auth.onAuthStateChange((_,s)=>setSession(s));
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session){return;}
    if(LS.get("topics",[]).length===0) setTopics(SEED_TOPICS);
    if(LS.get("revRows",[]).length===0) setRevRows(SEED_REV_ROWS);
    setLoaded(true);
    (async()=>{
      try{
        const [t,r,b,g,sl,k,pl,hl,dt,qr,uf,uws,uwsc,urp]=await Promise.all([
          sb.from('topics').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false}),
          sb.from('rev_rows').select('*').eq('user_id',session.user.id).order('base_date',{ascending:false}),
          sb.from('books').select('*').eq('user_id',session.user.id).order('updated_at',{ascending:false}),
          sb.from('goals').select('*').eq('user_id',session.user.id),
          sb.from('study_logs').select('*').order('log_date',{ascending:false}).limit(90),
          sb.from('knowledge').select('*').eq('user_id',session.user.id).order('updated_at',{ascending:false}),
          sb.from('planner').select('*').eq('user_id',session.user.id),
          sb.from('hours_logs').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false}),
          sb.from('daily_tasks').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false}),
          sb.from('quiz_results').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(200),
          sb.from('user_folders').select('*').eq('user_id',session.user.id).single(),
          sb.from('user_week_study').select('*').eq('user_id',session.user.id).single(),
          sb.from('user_weekly_schedule').select('*').eq('user_id',session.user.id).single(),
          sb.from('user_reading_plan').select('*').eq('user_id',session.user.id).single(),
        ]);
        const mi=(l,r)=>{const m=new Map();l.forEach(x=>m.set(String(x.id),x));r.forEach(x=>{const ex=m.get(String(x.id));if(!ex||(x.updated_at&&(!ex.updated_at||x.updated_at>ex.updated_at)))m.set(String(x.id),x);});return[...m.values()];};
        if(t.data?.length>0){setTopics(p=>{const m=mi(p,t.data);LS.set("topics",m);return m;});}
        if(r.data?.length>0){setRevRows(p=>{const m=mi(p,r.data);LS.set("revRows",m);return m;});}
        if(b.data?.length>0){setBooks(b.data);LS.set("books",b.data);}
        if(g.data?.length>0){setGoals(g.data);LS.set("goals",g.data);}
        if(k.data?.length>0){setKnowledge(k.data);LS.set("knowledge",k.data);}
        // Tabelas individuais — sem race condition
        if(uf.data?.data&&Object.keys(uf.data.data).length>0){setFolders(uf.data.data);LS.set("folders",uf.data.data);}
        if(uws.data){const ws={neuro:uws.data.neuro||0,biblia:uws.data.biblia||0,ingles:uws.data.ingles||0,livros:uws.data.livros||0,geral:uws.data.geral||0};setWeekStudy(ws);LS.set("weekStudy",ws);}
        if(uwsc.data?.data&&Object.keys(uwsc.data.data).length>0){setWeeklySchedule(uwsc.data.data);LS.set("weeklySchedule",uwsc.data.data);}
        {const rp=urp.data?.data;if(rp&&Object.keys(rp).length>0&&(rp.stats||rp.categories||rp.schedule||rp.tips||rp.meta!=null||rp.entries?.length>0||rp.columns?.length>0||Object.keys(rp.rows||{}).length>0)){setReadingPlan(rp);LS.set("readingPlan",rp);}}
        if(pl.data?.length>0){
          const pm={};pl.data.forEach(p=>{pm[p.area]=p.cols;});
          setPlanner(pm);LS.set("planner",pm);
        }
        // Tabelas individuais — mais seguro que JSONB
        if(hl.data?.length>0){const logs=hl.data.map(l=>({id:l.id,date:l.date,hours:l.hours,category:l.category}));setHoursLogs(logs);LS.set("hoursLogs",logs);}
        if(dt.data?.length>0){const tasks=dt.data.map(x=>({id:x.id,text:x.text,done:x.done,date:x.task_date}));setDailyTasks(tasks);LS.set("dailyTasks",tasks);}
        if(qr.data?.length>0){const results=qr.data.map(x=>({id:x.id,topicId:x.topic_id,topicTitle:x.topic_title,date:x.date,score:x.score,total:x.total,area:x.area}));setQuizResults(results);LS.set("quizResults",results);}
        setSyncMsg("☁️ Sincronizado");setTimeout(()=>setSyncMsg(null),2500);
      }catch{}
    })();
  },[session]);

  const getNextRev=useCallback((row)=>{const ch=row.checks||[];for(let i=0;i<8;i++){if(!ch[i])return row.revs?.[i]||null;}return null;},[]);
  const getStatus=useCallback((row)=>{const n=getNextRev(row);if(!n)return"completo";if(n<=t0)return"vencida";if(Math.round((new Date(n)-new Date(t0))/864e5)<=3)return"proxima";return"ok";},[getNextRev,t0]);
  const due=topics.filter(t=>t.next_review&&t.next_review<=Date.now()+864e5).length;
  const filteredXl=revRows.filter(r=>{const ms=revSearch.toLowerCase();return(revFilter==="Todas"||r.cat===revFilter)&&(!ms||r.topic.toLowerCase().includes(ms));});
  const pendentesXl=revRows.filter(r=>getStatus(r)==="vencida").sort((a,b)=>(getNextRev(a)||"")>(getNextRev(b)||"")?1:-1);

  const toggleAreaCollapse=(id)=>setCollapsedAreas(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleFolderCollapse=(key)=>setCollapsedFolders(p=>{const n=new Set(p);n.has(key)?n.delete(key):n.add(key);return n;});

  const addTopic=useCallback(async()=>{
    const tags=nt.tags.split(",").map(t=>t.trim()).filter(Boolean);const id=Date.now();
    const topic={id,area:nt.area,folder_id:nt.folder_id||null,title:nt.title,notes:nt.notes,note_content:nt.note_content||null,tags,created_at:Date.now(),next_review:Date.now(),interval_days:0,repetitions:0,quiz_cache:null,user_id:session?.user?.id||null};
    setTopics(p=>[topic,...p]);setModal(null);setNt({title:"",notes:"",tags:"",area:"neuro",folder_id:"",note_content:""});
    try{await sb.from('topics').upsert({...topic,updated_at:new Date().toISOString()});}catch{}
  },[nt]);

  const saveFichamento=useCallback(async(id,field,value)=>{
    setTopics(p=>p.map(t=>{
      if(t.id!==id)return t;
      const fich={...(t.fichamento||{}),[field]:value};
      const ts=new Date().toISOString();
      sb.from('topics').update({fichamento:fich,updated_at:ts}).eq('id',id).catch(()=>{});
      return{...t,fichamento:fich,updated_at:ts};
    }));
  },[]);

  const genAIMindMap=useCallback(async(t)=>{
    setTopicAI(p=>({...p,[t.id]:{loading:true,error:null}}));
    try{
      const resp=await fetch("/api/mindmap",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({notes:t.notes||"",title:t.title})});
      const d=await resp.json();
      if(!resp.ok)throw new Error(d.error||"Erro");
      setTopicAI(p=>({...p,[t.id]:{loading:false,error:null,resumo:d.resumo,mapa:d.mapa}}));
    }catch(e){setTopicAI(p=>({...p,[t.id]:{loading:false,error:e.message}}));}
  },[]);

  const deleteTopic=useCallback(async(id)=>{
    if(!confirm("Excluir tópico?"))return;
    setTopics(p=>p.filter(t=>t.id!==id));
    try{await sb.from('topics').delete().eq('id',id);}catch{}
  },[]);

  const saveTopicEdits=useCallback(async(id,directEdits)=>{
    const edits=directEdits||editNotes[id];if(!edits)return;
    const changes={};
    if(edits.title!==undefined)changes.title=edits.title.trim()||edits.title;
    if(edits.notes!==undefined)changes.notes=edits.notes;
    if(edits.tags!==undefined)changes.tags=edits.tags.split(",").map(t=>t.trim()).filter(Boolean);
    if(!Object.keys(changes).length)return;
    const ts=new Date().toISOString();
    setTopics(p=>p.map(t=>t.id===id?{...t,...changes,updated_at:ts}:t));
    try{await sb.from('topics').update({...changes,updated_at:ts}).eq('id',id);}catch{}
  },[editNotes]);

  const moveTopic=useCallback(async()=>{
    if(!moveModal)return;
    const ts=new Date().toISOString();
    const changes={area:moveTarget.area,folder_id:moveTarget.folder_id||null,updated_at:ts};
    setTopics(p=>p.map(t=>t.id===moveModal.topicId?{...t,...changes}:t));
    setMoveModal(null);
    try{await sb.from('topics').update(changes).eq('id',moveModal.topicId);}catch{}
  },[moveModal,moveTarget]);

  const reviewTopic=useCallback(async(id,qual)=>{
    // qual: 5=fácil, 3=difícil, 1=não sabia
    const topic=topics.find(t=>t.id===id);if(!topic)return;
    let reps=topic.repetitions||0;let interval;
    if(qual>=4){// Fácil — avança na curva de Ebbinghaus
      interval=EBB_INTERVALS[Math.min(reps,EBB_INTERVALS.length-1)];
      reps=reps+1;
    }else if(qual>=2){// Difícil — mantém posição, intervalo reduzido
      interval=Math.max(1,Math.floor((EBB_INTERVALS[Math.min(reps,EBB_INTERVALS.length-1)]||1)*0.5));
    }else{// Não sabia — reinicia do zero
      interval=1;reps=0;
    }
    const next=Date.now()+interval*864e5;
    const ts=new Date().toISOString();
    setTopics(p=>p.map(t=>t.id===id?{...t,repetitions:reps,interval_days:interval,next_review:next,updated_at:ts}:t));
    try{await sb.from('topics').update({repetitions:reps,interval_days:interval,next_review:next,updated_at:ts}).eq('id',id);}catch{}
  },[topics]);

  const createFolder=(area,name)=>{if(!name.trim())return;const id="f"+Date.now();setFolders(p=>({...p,[area]:[...(p[area]||[]),{id,name:name.trim()}]}));};
  const renameFolder=(area,fid,name)=>{if(!name.trim())return;setFolders(p=>({...p,[area]:(p[area]||[]).map(f=>f.id===fid?{...f,name:name.trim()}:f)}));};
  const deleteFolder=(area,fid)=>{if(!confirm("Excluir pasta? Tópicos ficarão sem pasta."))return;setFolders(p=>({...p,[area]:(p[area]||[]).filter(f=>f.id!==fid)}));setTopics(p=>p.map(t=>t.area===area&&t.folder_id===fid?{...t,folder_id:null}:t));};

  const toggleSelectTopic=(id)=>setSelectedTopics(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const selectAllInGroup=(ids)=>setSelectedTopics(p=>{const n=new Set(p);ids.forEach(id=>n.add(id));return n;});
  const deselectAllInGroup=(ids)=>setSelectedTopics(p=>{const n=new Set(p);ids.forEach(id=>n.delete(id));return n;});
  const clearSelection=()=>{setSelectedTopics(new Set());setBulkMode(false);};

  const bulkDelete=async()=>{
    if(!selectedTopics.size)return;
    if(!confirm(`Excluir ${selectedTopics.size} tópico(s) selecionado(s)?`))return;
    const ids=[...selectedTopics];
    setTopics(p=>p.filter(t=>!ids.includes(t.id)));
    setSelectedTopics(new Set());
    try{for(const id of ids)await sb.from('topics').delete().eq('id',id);}catch{}
  };

  const [autoOrganizing,setAutoOrganizing]=useState(false);
  const autoOrganize=async()=>{
    if(!confirm(`Organizar ${topics.length} tópicos automaticamente com IA? Isso vai atualizar as áreas e pastas de todos os tópicos.`))return;
    setAutoOrganizing(true);
    try{
      const resp=await fetch("/api/organize",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({topics:topics.map(t=>({id:t.id,title:t.title,notes:(t.notes||"").slice(0,200)})),areas:AREAS,folders})});
      const{assignments}=await resp.json();
      if(!assignments)throw new Error("Sem resultado");
      const ts=new Date().toISOString();
      const updated=topics.map(t=>{
        const a=assignments[String(t.id)];
        if(!a)return t;
        return{...t,area:a.area,folder_id:a.folder_id||null,updated_at:ts};
      });
      setTopics(updated);LS.set("topics",updated);
      for(const t of updated){
        const a=assignments[String(t.id)];
        if(a)try{await sb.from('topics').update({area:a.area,folder_id:a.folder_id||null,updated_at:ts}).eq('id',t.id);}catch{}
      }
      setSyncMsg("✅ "+Object.keys(assignments).length+" tópicos organizados!");setTimeout(()=>setSyncMsg(null),4000);
    }catch(e){alert("Erro: "+e.message);}
    finally{setAutoOrganizing(false);}
  };

  const bulkMove=async()=>{
    if(!selectedTopics.size)return;
    const ids=[...selectedTopics];
    const ts=new Date().toISOString();
    const changes={area:bulkMoveTarget.area,folder_id:bulkMoveTarget.folder_id||null,updated_at:ts};
    setTopics(p=>p.map(t=>ids.includes(t.id)?{...t,...changes}:t));
    setSelectedTopics(new Set());setBulkMoveModal(false);
    try{for(const id of ids)await sb.from('topics').update(changes).eq('id',id);}catch{}
  };;

  const saveReadingPlan=useCallback(async(plan)=>{
    LS.set("readingPlan",plan);
    if(!session?.user?.id)return;
    try{await sb.from('user_reading_plan').upsert({user_id:session.user.id,data:plan,updated_at:new Date().toISOString()},{onConflict:'user_id'});}catch(e){console.error('[saveReadingPlan]',e)}
  },[session]);

  const saveFolders=useCallback(async(data)=>{
    if(!session?.user?.id)return;
    clearTimeout(foldersTimer.current);
    foldersTimer.current=setTimeout(async()=>{
      try{await sb.from('user_folders').upsert({user_id:session.user.id,data,updated_at:new Date().toISOString()},{onConflict:'user_id'});}catch(e){console.error('[saveFolders]',e)}
    },1500);
  },[session]);

  const saveWeekStudy=useCallback(async(ws)=>{
    if(!session?.user?.id)return;
    clearTimeout(weekStudyTimer.current);
    weekStudyTimer.current=setTimeout(async()=>{
      try{await sb.from('user_week_study').upsert({user_id:session.user.id,...ws,updated_at:new Date().toISOString()},{onConflict:'user_id'});}catch(e){console.error('[saveWeekStudy]',e)}
    },500);
  },[session]);

  const saveWeeklySchedule=useCallback(async(data)=>{
    if(!session?.user?.id)return;
    clearTimeout(scheduleTimer.current);
    scheduleTimer.current=setTimeout(async()=>{
      try{await sb.from('user_weekly_schedule').upsert({user_id:session.user.id,data,updated_at:new Date().toISOString()},{onConflict:'user_id'});}catch(e){console.error('[saveWeeklySchedule]',e)}
    },1500);
  },[session]);

  // ── Operações individuais por linha (não mais JSONB bulk) ──
  const dbAddHoursLog=useCallback(async(log)=>{
    if(!session?.user?.id)return;
    try{await sb.from('hours_logs').insert({id:log.id,user_id:session.user.id,date:log.date,hours:log.hours,category:log.category});}catch(e){console.error('[dbAddHoursLog]',e)}
  },[session]);
  const dbDelHoursLog=useCallback(async(id)=>{
    if(!session?.user?.id)return;
    try{await sb.from('hours_logs').delete().eq('id',id).eq('user_id',session.user.id);}catch(e){console.error('[dbDelHoursLog]',e)}
  },[session]);

  const dbUpsertDTask=useCallback(async(task)=>{
    if(!session?.user?.id)return;
    try{await sb.from('daily_tasks').upsert({id:task.id,user_id:session.user.id,text:task.text,done:task.done,task_date:task.date,updated_at:new Date().toISOString()},{onConflict:'id'});}catch(e){console.error('[dbUpsertDTask]',e)}
  },[session]);
  const dbDelDTask=useCallback(async(id)=>{
    if(!session?.user?.id)return;
    try{await sb.from('daily_tasks').delete().eq('id',id).eq('user_id',session.user.id);}catch(e){console.error('[dbDelDTask]',e)}
  },[session]);

  const dbAddQuizResult=useCallback(async(result)=>{
    if(!session?.user?.id)return;
    try{await sb.from('quiz_results').insert({id:result.id,user_id:session.user.id,topic_id:String(result.topicId||""),topic_title:result.topicTitle||"",date:result.date,score:result.score,total:result.total,area:result.area||"geral"});}catch(e){console.error('[dbAddQuizResult]',e)}
  },[session]);

  // saveSettings removido — cada dado tem sua própria função dedicada

  const toggleXlCheck=useCallback(async(rowId,idx)=>{
    const row=revRows.find(r=>r.id===rowId);if(!row)return;
    const ch=[...(row.checks||[0,0,0,0,0,0,0,0])];ch[idx]=ch[idx]?0:1;
    setRevRows(p=>p.map(r=>r.id===rowId?{...r,checks:ch}:r));
    try{await sb.from('rev_rows').update({checks:ch,updated_at:new Date().toISOString()}).eq('id',rowId);}catch{}
  },[revRows]);

  const addRevRow=useCallback(async()=>{
    const id="r"+Date.now();const revs=calcRevDates(nr.base_date);
    const row={id,topic:nr.topic,cat:nr.cat,base_date:nr.base_date,checks:[0,0,0,0,0,0,0,0],revs,user_id:session?.user?.id||null};
    setRevRows(p=>[...p,row]);setModal(null);setNr({topic:"",cat:"Neuro",base_date:t0});
    try{await sb.from('rev_rows').upsert({...row,updated_at:new Date().toISOString()});}catch{}
  },[nr,t0]);

  const deleteRevRow=useCallback(async(id)=>{
    if(!confirm("Excluir revisão?"))return;setRevRows(p=>p.filter(r=>r.id!==id));
    try{await sb.from('rev_rows').delete().eq('id',id);}catch{}
  },[]);

  const addTopicToReview=useCallback(async(topic)=>{
    const id="t"+topic.id;if(revRows.find(r=>r.id===id)){alert("Tópico já está na revisão.");return;}
    const catLabel=CAT_LABEL[topic.area]||"Geral";
    const row={id,topic:topic.title,cat:catLabel,base_date:t0,checks:[0,0,0,0,0,0,0,0],revs:calcRevDates(t0),user_id:session?.user?.id||null};
    setRevRows(p=>[...p.filter(r=>r.id!==id),row]);
    try{await sb.from('rev_rows').upsert({...row,updated_at:new Date().toISOString()});}catch{}
  },[t0,revRows]);

  const updateBook=useCallback(async(id,changes)=>{setBooks(p=>p.map(b=>b.id===id?{...b,...changes}:b));try{await sb.from('books').update({...changes,updated_at:new Date().toISOString()}).eq('id',id);}catch(e){console.error('[updateBook]',e)}},[]);
  const addBook=useCallback(async()=>{const id=Date.now();const book={id,title:nb.title,author:nb.author,area:nb.area,status:nb.status,progress:0,notes:nb.notes,chapters:[],user_id:session?.user?.id||null};setBooks(p=>[...p,book]);setModal(null);setNb({title:"",author:"",area:"livros",status:"queued",notes:""});try{await sb.from('books').upsert({...book,updated_at:new Date().toISOString()});}catch{}},[nb]);
  const deleteBook=useCallback(async(id)=>{if(!confirm("Excluir livro?"))return;setBooks(p=>p.filter(b=>b.id!==id));try{await sb.from('books').delete().eq('id',id);}catch{}},[]);
  const addChapter=useCallback(async(bId,title)=>{const book=books.find(b=>b.id===bId);if(!book)return;const ch=[...(book.chapters||[]),{id:Date.now(),title,resumo:"",perguntas:"",insights:"",created_at:Date.now()}];setBooks(p=>p.map(b=>b.id===bId?{...b,chapters:ch}:b));try{await sb.from('books').update({chapters:ch,updated_at:new Date().toISOString()}).eq('id',bId);}catch(e){console.error('[updateChapter]',e)}},[books]);
  const updateChapter=useCallback(async(bId,chId,changes)=>{const book=books.find(b=>b.id===bId);if(!book)return;const ch=(book.chapters||[]).map(c=>c.id===chId?{...c,...changes}:c);setBooks(p=>p.map(b=>b.id===bId?{...b,chapters:ch}:b));try{await sb.from('books').update({chapters:ch,updated_at:new Date().toISOString()}).eq('id',bId);}catch(e){console.error('[updateChapter]',e)}},[books]);
  const deleteChapter=useCallback(async(bId,chId)=>{if(!confirm("Excluir capítulo?"))return;const book=books.find(b=>b.id===bId);if(!book)return;const ch=(book.chapters||[]).filter(c=>c.id!==chId);setBooks(p=>p.map(b=>b.id===bId?{...b,chapters:ch}:b));try{await sb.from('books').update({chapters:ch,updated_at:new Date().toISOString()}).eq('id',bId);}catch(e){console.error('[updateChapter]',e)}},[books]);
  const renameChapter=useCallback(async(bId,chId,newTitle)=>{const book=books.find(b=>b.id===bId);if(!book)return;const ch=(book.chapters||[]).map(c=>c.id===chId?{...c,title:newTitle}:c);setBooks(p=>p.map(b=>b.id===bId?{...b,chapters:ch}:b));try{await sb.from('books').update({chapters:ch,updated_at:new Date().toISOString()}).eq('id',bId);}catch(e){console.error('[updateChapter]',e)}},[books]);
  const addChapterToReview=useCallback(async(book,ch)=>{
    const id="ch_"+ch.id;if(revRows.find(r=>r.id===id)){alert("Capítulo já está na revisão.");return;}
    const catLabel=CAT_LABEL[book.area]||"Geral";
    const row={id,topic:book.title+" — "+ch.title,cat:catLabel,base_date:t0,checks:[0,0,0,0,0,0,0,0],revs:calcRevDates(t0),user_id:session?.user?.id||null};
    setRevRows(p=>[...p.filter(r=>r.id!==id),row]);
    try{await sb.from('rev_rows').upsert({...row,updated_at:new Date().toISOString()});}catch{}
  },[t0,revRows,session]);

  const addBookToReview=useCallback(async(book)=>{const id="book_"+book.id;if(revRows.find(r=>r.id===id)){alert("Livro já está na revisão.");return;}const row={id,topic:book.title+" (Livro)",cat:CAT_LABEL[book.area]||"Geral",base_date:t0,checks:[0,0,0,0,0,0,0,0],revs:calcRevDates(t0),user_id:session?.user?.id||null};setRevRows(p=>[...p.filter(r=>r.id!==id),row]);try{await sb.from('rev_rows').upsert({...row,updated_at:new Date().toISOString()});}catch{}},[t0,revRows]);

  const addGoal=useCallback(async()=>{const id=Date.now();const goal={id,area:ng.area,title:ng.title,target:Number(ng.target),done:0,unit:ng.unit,period:ng.period,history:[],user_id:session?.user?.id||null};setGoals(p=>[...p,goal]);setModal(null);setNg({area:"neuro",title:"",target:"",unit:"",period:"anual"});try{await sb.from('goals').upsert({...goal,updated_at:new Date().toISOString()});}catch{}},[ng]);
  const updateGoalDone=useCallback(async(id,val)=>{const done=Math.max(0,Number(val));setGoals(p=>p.map(g=>g.id===id?{...g,done}:g));try{await sb.from('goals').update({done,updated_at:new Date().toISOString()}).eq('id',id);}catch{}},[]);
  const deleteGoal=useCallback(async(id)=>{if(!confirm("Excluir meta?"))return;setGoals(p=>p.filter(g=>g.id!==id));try{await sb.from('goals').delete().eq('id',id);}catch{}},[]);
  const addGoalNote=useCallback(async(gId)=>{const txt=(goalNotes[gId]||"").trim();if(!txt)return;const goal=goals.find(g=>g.id===gId);if(!goal)return;const history=[...(goal.history||[]),{date:t0,text:txt}];setGoals(p=>p.map(g=>g.id===gId?{...g,history}:g));setGoalNotes(n=>({...n,[gId]:""}));try{await sb.from('goals').update({history,updated_at:new Date().toISOString()}).eq('id',gId);}catch{}},[goals,goalNotes,t0]);

  const pd=planner[aArea]||[];
  const savePlanner=useCallback(async(area,cols)=>{setPlanner(p=>({...p,[area]:cols}));try{await sb.from('planner').upsert({area,cols,user_id:session?.user?.id||null,updated_at:new Date().toISOString()},{onConflict:'area,user_id'});}catch{}},[session]);
  const addPlannerCol=()=>{if(!colTxt.trim())return;savePlanner(aArea,[...pd,{id:Date.now(),title:colTxt,cards:[]}]);setColTxt("");setAddCol(false);};
  const addPlannerCard=(colId,txt)=>{if(!txt.trim())return;savePlanner(aArea,pd.map(c=>c.id===colId?{...c,cards:[...c.cards,{id:Date.now(),text:txt}]}:c));setAddCard(null);setCardTxt({});};
  const delPlannerCard=(colId,cardId)=>savePlanner(aArea,pd.map(c=>c.id===colId?{...c,cards:c.cards.filter(x=>x.id!==cardId)}:c));
  const delPlannerCol=(colId)=>{if(!confirm("Excluir coluna?"))return;savePlanner(aArea,pd.filter(c=>c.id!==colId));};


  const processCapture=useCallback(async(raw)=>{
    if(!raw||raw.trim().length<20){setCaptureErr("Cole pelo menos um parágrafo para processar.");return;}
    setCaptureLoading(true);setCaptureErr(null);setCaptureResult(null);
    try{
      const resp=await fetch("/api/capture",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rawNote:raw})});
      const d=await resp.json();
      if(!resp.ok)throw new Error(d.error||"Erro ao processar nota");
      setCaptureResult({...d,raw,confirmed:false});
    }catch(e){setCaptureErr("Erro: "+e.message);}
    finally{setCaptureLoading(false);}
  },[]);

  const confirmCapture=useCallback(async(result)=>{
    const tags=result.tags||[];
    const id=Date.now();
    const notes=[result.summary,...(result.keyPoints||[]).map(p=>"\u2022 "+p)].join("\n");

    const topic={id,area:result.area||"geral",folder_id:null,title:result.title,notes,note_content:result.raw,tags,created_at:Date.now(),next_review:Date.now(),interval_days:0,repetitions:0,quiz_cache:null,user_id:session?.user?.id||null};
    setTopics(p=>[topic,...p]);
    try{await sb.from('topics').upsert({...topic,updated_at:new Date().toISOString()});}catch{}
    // Auto-add to spaced review
    const revId="t"+id;
    if(!revRows.find(r=>r.id===revId)){
      const row={id:revId,topic:result.title,cat:CAT_LABEL[result.area]||"Geral",base_date:t0,checks:[0,0,0,0,0,0,0,0],revs:calcRevDates(t0),user_id:session?.user?.id||null};
      setRevRows(p=>[...p,row]);
      try{await sb.from('rev_rows').upsert({...row,updated_at:new Date().toISOString()});}catch{}
    }
    // Save to inbox log
    const entry={id,title:result.title,area:result.area,ts:Date.now()};
    setCaptureInbox(prev=>{const nw=[entry,...prev].slice(0,50);LS.set("captureInbox",nw);return nw;});
    setCaptureResult(null);setCaptureRaw("");
    setView("org");
  },[session]);

  const genQuiz=useCallback(async(item,force=false)=>{
    // sempre gera novo quiz — não usa cache para garantir respostas embaralhadas
    setQLoad(true);setQErr(null);
    try{
      const notes=item.notes||item.content||"";
      const resp=await fetch("/api/quiz",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({notes,title:item.title,noteContent:item.note_content||""})});
      const d=await resp.json();
      if(!resp.ok)throw new Error(d.error||"Erro ao gerar quiz");
      const questions=d.questions||[];
      if(!questions.length)throw new Error("Sem perguntas geradas");
      // não salva cache — cada quiz é gerado fresco com respostas embaralhadas
      setQuiz({questions,idx:0,score:0,sel:null,topicTitle:item.title,topicId:item.id,isKnowledge:!!item.isKnowledge,answered:[]});
    }catch(e){setQErr("Erro ao gerar quiz: "+e.message);}
    finally{setQLoad(false);}
  },[topics]);

  const answerQuiz=(selIdx)=>{
    if(quiz.sel!==null)return;
    const q=quiz.questions[quiz.idx];const correct=selIdx===q.ans;const score=quiz.score+(correct?1:0);
    const record={q:q.q,opts:q.opts,ans:q.ans,sel:selIdx,correct,exp:q.exp||""};
    setQuiz(q2=>({...q2,sel:selIdx,score,answered:[...(q2.answered||[]),record]}));
    setTimeout(()=>setQuiz(q2=>{
      if(q2.idx+1>=q2.questions.length){
        const topicArea=topics.find(t=>t.id===q2.topicId)?.area||"geral";
        const result={id:Date.now()+"",topicId:q2.topicId,topicTitle:q2.topicTitle,date:t0,score,total:q2.questions.length,area:topicArea};
        setQuizResults(prev=>{const nr=[result,...prev.slice(0,199)];LS.set("quizResults",nr);return nr;});
        dbAddQuizResult(result);
        setQuizHistory(h=>[{date:t0,topic:q2.topicTitle,score,total:q2.questions.length},...h.slice(0,49)]);
        return{...q2,done:true,awaitConf:!q2.isKnowledge&&!!q2.topicId};
      }
      return{...q2,idx:q2.idx+1,sel:null};
    }),1200);
  };

  const NAV=[
    {id:"dashboard",label:"Dashboard",icon:"ti-layout-dashboard"},
    {id:"capture",label:"Captura",icon:"ti-inbox"},
    {id:"progress",label:"Progresso",icon:"ti-trending-up"},
    {id:"org",label:"Organização",icon:"ti-folders"},
    {id:"review",label:"Revisão Espaçada",icon:"ti-calendar-repeat"},
    {id:"quiz",label:"Quiz Ativo",icon:"ti-help-circle"},
    {id:"books",label:"Livros",icon:"ti-book"},

  ];

  const EmergencyAI=({t})=>{
    const [open,setOpen]=useState(false);
    const ai=topicAI[t.id]||{};
    const buildOffline=()=>{
      const notes=t.notes||"";if(notes.length<30)return;
      const STOP=new Set(["a","o","e","é","de","do","da","em","um","uma","para","com","que","se","os","as","dos","das","no","na","por","mais","mas","ao","ou","não","já","isso","esse","esta","este","quando","sobre","após","entre","então","assim","muito","qual","cada","todo","toda","outros","podem","deve","pelo","pela","nos","nas","seu","sua","seus","suas","esse","essa","aquele","porque","como","onde","há","está","eram","será","foram","tinha","tem","este","estes","estas","esses","essas","ser","ter","foi","são","pelos","pelas","num","numa","também","ele","ela","eles","elas","seu","sua"]);
      const sents=notes.split(/[.!?\n]+/).map(s=>s.trim()).filter(s=>s.length>25&&s.length<400);
      const wFreq={};notes.toLowerCase().replace(/[^a-záàâãéèêíìîóòôõúùûç\s]/g," ").split(/\s+/).forEach(w=>{if(w.length>3&&!STOP.has(w))wFreq[w]=(wFreq[w]||0)+1;});
      const topKw=Object.entries(wFreq).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([w])=>w);
      const scored=sents.map((s,i)=>{const sw=s.toLowerCase().split(/\s+/);const sc=sw.reduce((sum,w)=>sum+(wFreq[w]||0),0)/Math.max(1,sw.length);return{text:s,score:sc+(i===0?3:i<2?1.5:0),idx:i};});
      const top=scored.sort((a,b)=>b.score-a.score).slice(0,5).sort((a,b)=>a.idx-b.idx);
      const COLORS=["#9D95E8","#60A5FA","#FBBF24","#34C98A"];const cs=Math.ceil(topKw.length/4);
      const ramos=COLORS.map((cor,i)=>{const chunk=topKw.slice(i*cs,(i+1)*cs);if(!chunk.length)return null;return{label:chunk[0].charAt(0).toUpperCase()+chunk[0].slice(1),cor,filhos:chunk.slice(1,5)};}).filter(Boolean);
      setTopicAI(p=>({...p,[t.id]:{loading:false,error:null,resumo:top.map(s=>s.text).join(" "),mapa:{centro:t.title,ramos},isOffline:true}}));
    };
    const renderMapa=(mapa)=>{
      if(!mapa?.ramos?.length)return null;
      const W=680,H=460,cx=W/2,cy=H/2;const ramos=mapa.ramos||[];const N=ramos.length;const lines=[];
      ramos.forEach((r,i)=>{const ang=(2*Math.PI/N*i)-Math.PI/2;const bx=cx+140*Math.cos(ang),by=cy+130*Math.sin(ang);
        lines.push(`<line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" stroke="${r.cor||"#9D95E8"}" stroke-width="2.5" opacity="0.6"/>`);
        const tw=Math.min(130,Math.max(70,r.label.length*8));
        lines.push(`<rect x="${bx-tw/2}" y="${by-14}" width="${tw}" height="28" rx="7" fill="${r.cor||"#9D95E8"}22" stroke="${r.cor||"#9D95E8"}" stroke-width="1.5"/>`);
        lines.push(`<text x="${bx}" y="${by+5}" text-anchor="middle" fill="${r.cor||"#9D95E8"}" font-size="11" font-weight="700" font-family="system-ui,sans-serif">${(r.label||"").substring(0,18)}</text>`);
        (r.filhos||[]).forEach((f,j)=>{const ns=r.filhos.length;const subAng=ang+(j-(ns-1)/2)*0.42;const sx=bx+95*Math.cos(subAng),sy=by+85*Math.sin(subAng);
          lines.push(`<line x1="${bx}" y1="${by}" x2="${sx}" y2="${sy}" stroke="${r.cor||"#9D95E8"}" stroke-width="1" opacity="0.35"/>`);
          const sw=Math.min(100,Math.max(50,f.length*7));
          lines.push(`<rect x="${sx-sw/2}" y="${sy-10}" width="${sw}" height="20" rx="5" fill="#12121a" stroke="#2a2a38" stroke-width="1"/>`);
          lines.push(`<text x="${sx}" y="${sy+4}" text-anchor="middle" fill="#a0a0b8" font-size="9.5" font-family="system-ui,sans-serif">${(f||"").substring(0,16)}</text>`);
        });
      });
      const ct=(mapa.centro||"").substring(0,22);const cw=Math.max(90,ct.length*9);
      lines.push(`<ellipse cx="${cx}" cy="${cy}" rx="${cw/2+12}" ry="22" fill="#1c1838" stroke="#9D95E8" stroke-width="2"/>`);
      lines.push(`<text x="${cx}" y="${cy+5}" text-anchor="middle" fill="#c8c4f8" font-size="12" font-weight="700" font-family="system-ui,sans-serif">${ct}</text>`);
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;background:#0c0c10;border-radius:12px;border:0.5px solid #2a2a38;">${lines.join("")}</svg>`;
    };
    return(
      <div style={{marginTop:10,borderTop:`0.5px solid ${C.bord}`}}>
        <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",padding:"8px 0",display:"flex",alignItems:"center",gap:7,color:C.muted,fontSize:12}}>
          <i className={`ti ${open?"ti-chevron-down":"ti-chevron-right"}`} style={{fontSize:12}}/>
          <i className="ti ti-shield-exclamation" style={{color:"#FBBF24"}}/>
          <span style={{color:"#FBBF24",fontWeight:500}}>Consulta de emergência</span>
          <span style={{fontSize:10,opacity:0.6,marginLeft:4}}>— use apenas se travar na revisão</span>
        </button>
        {open&&(
          <div style={{padding:"10px 0 4px",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{background:"#2d2010",border:"0.5px solid #5a4010",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#fde68a"}}>
              ⚠️ <strong>Atenção:</strong> consultar o resumo antes de tentar lembrar compromete a consolidação da memória. Use só se realmente travou.
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button className="btn btn-sm btnp" onClick={buildOffline} style={{flex:1,justifyContent:"center"}}>
                <i className="ti ti-bolt"/>Resumo Offline <span style={{fontSize:10,opacity:0.7,marginLeft:3}}>grátis</span>
              </button>
              <button className="btn btn-sm btng" onClick={()=>genAIMindMap(t)} disabled={ai.loading} style={{flex:1,justifyContent:"center"}}>
                <i className={`ti ${ai.loading?"ti-loader-2":"ti-wand"}`} style={ai.loading?{animation:"spin 1s linear infinite"}:{}}/>
                {ai.loading?"Gerando...":"Resumo com IA"}
              </button>
            </div>
            {ai.isOffline&&<div style={{fontSize:11,color:"#9D95E8",background:"#1c1838",border:"0.5px solid #3d3780",borderRadius:6,padding:"3px 10px"}}>📝 Gerado offline · frequência de termos</div>}
            {ai.error&&<div style={{background:"#2d1010",border:"0.5px solid #7f2020",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#fca5a5"}}>⚠️ {ai.error}</div>}
            {ai.resumo&&(
              <div style={{background:"#17171f",border:`0.5px solid ${C.bord}`,borderLeft:`3px solid ${ai.isOffline?"#9D95E8":"#34C98A"}`,borderRadius:"0 8px 8px 0",padding:"12px 14px"}}>
                <div style={{fontSize:11,color:ai.isOffline?"#9D95E8":"#34C98A",fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>Resumo</div>
                <ul style={{margin:0,paddingLeft:16,display:"flex",flexDirection:"column",gap:5}}>
                  {ai.resumo.split(/(?<=[.!?])\s+/).filter(Boolean).map((s,i)=>(<li key={i} style={{fontSize:13,color:C.text,lineHeight:1.7}}>{s}</li>))}
                </ul>
              </div>
            )}
            {ai.mapa&&<div><div dangerouslySetInnerHTML={{__html:renderMapa(ai.mapa)}}/></div>}
            {!(t.notes||"").trim()&&<p style={{fontSize:12,color:C.muted,textAlign:"center",padding:"0.5rem"}}>💡 Adicione notas para gerar resumo.</p>}
          </div>
        )}
      </div>
    );
  };

  const TopicRow=({t,area})=>{
    const exp=expanded===t.id;
    const isDue=t.next_review&&t.next_review<=Date.now();
    const days=t.next_review?Math.round((t.next_review-Date.now())/864e5):null;
    const linkedRev=revRows.find(r=>r.topic===t.title||r.id==="t"+t.id);
    const ed=editNotes[t.id]||{};
    return(
      <div style={{background:exp?"#12121a":C.card,border:`0.5px solid ${exp?area.color:C.bord}`,borderRadius:9,overflow:"hidden",marginBottom:3}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",cursor:"pointer"}} onClick={()=>!bulkMode&&setExpanded(exp?null:t.id)}>
          <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
            {bulkMode&&<input type="checkbox" className="chk" checked={selectedTopics.has(t.id)} onChange={()=>toggleSelectTopic(t.id)} onClick={e=>e.stopPropagation()}/>}
            <i className={`ti ${exp&&!bulkMode?"ti-chevron-up":"ti-chevron-right"}`} style={{fontSize:13,color:C.muted,flexShrink:0}} aria-hidden/>
            <span style={{fontWeight:500,fontSize:13,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:exp?"normal":"nowrap"}}>{t.title}</span>

            {linkedRev&&<span className="bdg" style={{background:"#1a2840",color:"#93c5fd",flexShrink:0}}>Rev.✓</span>}
          </div>
          <div style={{display:"flex",gap:5,marginLeft:8,flexShrink:0}} onClick={e=>e.stopPropagation()}>
            {!linkedRev&&<button className="btn btn-sm" title="Adicionar à revisão" onClick={()=>addTopicToReview(t)}><i className="ti ti-calendar-plus" aria-hidden/></button>}
            <button className="btn btn-sm" title="Mover para outra pasta/área" onClick={()=>{setMoveTarget({area:t.area,folder_id:t.folder_id||""});setMoveModal({topicId:t.id});}}><i className="ti ti-arrows-move" aria-hidden/></button>
            <button className="btn btn-sm" onClick={()=>genQuiz(t)}><i className="ti ti-help-circle" aria-hidden/></button>
            <button className="btn btn-sm btnp" onClick={()=>reviewTopic(t.id,4)}><i className="ti ti-check" aria-hidden/></button>
            <button className="btn btn-sm btnr" onClick={()=>deleteTopic(t.id)}><i className="ti ti-trash" aria-hidden/></button>
          </div>
        </div>
        {exp&&(
          <div style={{borderTop:`0.5px solid ${C.bord}`}}>
            <div style={{padding:"10px 14px 0"}}>
              <input className="title-inline"
                key={"ti"+t.id+(t.updated_at||0)}
                defaultValue={t.title}
                onBlur={e=>{if(e.target.value!==t.title)saveTopicEdits(t.id,{title:e.target.value});}}/>
            </div>
            <div style={{display:"flex",gap:5,padding:"8px 14px",borderBottom:`0.5px solid ${C.bord}`,flexWrap:"wrap"}}>
              {[{id:"notes",icon:"ti-notes",l:"Notas"},{id:"fichamento",icon:"ti-file-analytics",l:"Fichamento"},{id:"fonte",icon:"ti-notes-off",l:"Nota Fonte"}].map(tab=>{
                const active=(topicTab[t.id]||"notes")===tab.id;
                return(<button key={tab.id} onClick={()=>setTopicTab(p=>({...p,[t.id]:tab.id}))}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:7,border:`0.5px solid ${active?"#3d3780":C.bord}`,background:active?"#1c1838":"transparent",color:active?"#9D95E8":C.muted,fontSize:12,cursor:"pointer",fontWeight:active?600:400}}>
                  <i className={`ti ${tab.icon}`}/>{tab.l}
                </button>);
              })}
            </div>
            {(topicTab[t.id]||"notes")==="notes"&&(
              <div style={{padding:"10px 14px 14px"}}>
                <textarea className="inline-edit"
                  key={"ta"+t.id+(t.updated_at||0)}
                  rows={Math.max(4,(t.notes||"").split("\n").length+1)}
                  defaultValue={t.notes??""}
                  placeholder="Clique e comece a digitar..."
                  onBlur={e=>{if(e.target.value!==(t.notes||""))saveTopicEdits(t.id,{notes:e.target.value});}}/>
                <input
                  key={"tg"+t.id+(t.updated_at||0)}
                  defaultValue={(t.tags||[]).join(", ")}
                  onBlur={e=>{if(e.target.value!==(t.tags||[]).join(", "))saveTopicEdits(t.id,{tags:e.target.value});}}
                  placeholder="Tags separadas por vírgula" style={{fontSize:11,marginTop:6}}/>
                {linkedRev&&(
                  <div style={{background:"#1a2840",border:"0.5px solid #2a3850",borderRadius:8,padding:"8px 12px",marginTop:8}}>
                    <div style={{fontSize:10,color:"#93c5fd",fontWeight:500,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Revisões Espaçadas</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {(linkedRev.revs||[]).map((rev,i)=>{
                        const ch=linkedRev.checks||[];const done=ch[i]===1;const vencida=!done&&rev<=t0;
                        return(<button key={i} onClick={()=>toggleXlCheck(linkedRev.id,i)} title={`${REV_LABELS[i]} — ${rev}`}
                          style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,background:done?"#0d2218":vencida?"#2d1010":"#12121a",color:done?"#34C98A":vencida?"#fca5a5":"#6b6b85",fontWeight:done?600:400}}>
                          {REV_LABELS[i]}{done?" ✓":vencida?" !":""}
                        </button>);
                      })}
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:8,fontSize:11,color:C.muted,marginTop:8}}>
                  <span>Rep #{t.repetitions||0}</span>
                  
                  <button style={{marginLeft:"auto",background:"none",border:"none",color:"#9D95E8",cursor:"pointer",fontSize:11}} onClick={e=>{e.stopPropagation();genQuiz(t,true);}}>↺ Refazer quiz</button>
                </div>
                {/* Consulta de emergência (IA) */}
                <EmergencyAI t={t}/>
              </div>
            )}
            {topicTab[t.id]==="fichamento"&&(
              <div style={{padding:"12px 14px 16px",display:"flex",flexDirection:"column",gap:10,background:"#0f0f13"}}>
                {[
                  {k:"resumo",    l:"📋 Resumo do Tópico",  icon:"ti-notes",       color:"#9D95E8", ph:"Pontos principais, definição, o que é essencial saber..."},
                  {k:"perguntas", l:"❓ Perguntas-chave",   icon:"ti-help-circle", color:"#60A5FA", ph:"• Que problema este conceito resolve?\n• Qual a ideia central?\n• Como se aplica na prática?"},
                  {k:"insights",  l:"💡 Insights",          icon:"ti-bulb",        color:"#FBBF24", ph:"• Insight 1: ...\n• Aplicação na minha vida: ...\n• O que mudou na minha visão: ..."},
                  {k:"conexoes",  l:"🔗 Conexões",          icon:"ti-link",        color:"#34C98A", ph:"• Relaciona com: ...\n• Contrasta com: ...\n• Complementa: ..."},
                ].map(f=>{
                  const val=(t.fichamento||{})[f.k]||"";
                  return(
                    <div key={f.k} style={{background:"#17171f",border:`0.5px solid ${C.bord}`,borderLeft:`3px solid ${f.color}`,borderRadius:"0 8px 8px 0",padding:"10px 14px"}}>
                      <div style={{fontSize:11,color:f.color,fontWeight:600,marginBottom:7,display:"flex",alignItems:"center",gap:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                        <i className={`ti ${f.icon}`}/>{f.l}
                      </div>
                      <textarea
                        key={"fich-"+t.id+"-"+f.k+"-"+(t.updated_at||0)}
                        rows={Math.max(3,val.split("\n").length+1)}
                        placeholder={f.ph}
                        defaultValue={val}
                        onBlur={e=>{if(e.target.value!==val)saveFichamento(t.id,f.k,e.target.value);}}
                        style={{fontSize:13,resize:"vertical",lineHeight:1.8,background:"transparent",border:"none",padding:0,color:C.text,width:"100%",outline:"none",fontFamily:"inherit"}}/>
                    </div>
                  );
                })}
                <div style={{fontSize:11,color:C.muted,display:"flex",gap:10,paddingTop:6,borderTop:`0.5px solid ${C.bord}`}}>
                  <span>Rep #{t.repetitions||0}</span>
                  
                  <button style={{marginLeft:"auto",background:"none",border:"none",color:"#9D95E8",cursor:"pointer",fontSize:11}} onClick={e=>{e.stopPropagation();genQuiz(t,true);}}>↺ Refazer quiz</button>
                </div>
                {/* Consulta de emergência (IA) */}
                <EmergencyAI t={t}/>
              </div>
            )}
            {topicTab[t.id]==="fonte"&&(
              <div style={{padding:"12px 14px 16px",display:"flex",flexDirection:"column",gap:10,background:"#0f0f13"}}>
                {t.note_content?(
                  <>
                    <div style={{background:"#17171f",border:"0.5px solid #2a2a38",borderLeft:"3px solid #34C98A",borderRadius:"0 8px 8px 0",padding:"10px 14px"}}>
                      <div style={{fontSize:11,color:"#34C98A",fontWeight:600,marginBottom:6,display:"flex",alignItems:"center",gap:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                        <i className="ti ti-leaf"/>Nota Original (Obsidian)
                      </div>
                      <div style={{fontSize:12,color:"#a0a0b8",lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:300,overflowY:"auto"}}>{t.note_content}</div>
                    </div>
                    <div style={{fontSize:11,color:"#6b6b85",display:"flex",gap:8,alignItems:"center"}}>
                      <i className="ti ti-info-circle"/>
                      <span>Esta nota é a fonte original que gerou o tópico. O quiz usa ela como referência.</span>
                    </div>
                    <button className="btn btn-sm" style={{alignSelf:"flex-start"}} onClick={()=>genQuiz(t,true)}>
                      <i className="ti ti-help-circle"/> Gerar quiz da nota original
                    </button>
                  </>
                ):(
                  <div style={{textAlign:"center",padding:"24px 0",color:"#6b6b85"}}>
                    <i className="ti ti-inbox" style={{fontSize:28,display:"block",marginBottom:8}}/>
                    <div style={{fontSize:13,marginBottom:4}}>Nenhuma nota fonte vinculada</div>
                    <div style={{fontSize:11}}>Use a aba <strong style={{color:"#9D95E8"}}>Captura</strong> para importar uma nota do Obsidian e ela aparecerá aqui automaticamente.</div>
                  </div>
                )}
              </div>
            )}
            {/* ── consulta emergência para notas tab ── */}
            {/* placeholder — ia tab removed */}
            {topicTab[t.id]==="ia_disabled"&&(()=>{
              const ai=topicAI[t.id]||{};
              /* ── Offline extractive summarizer ── */
              const buildOffline=()=>{
                const notes=t.notes||"";if(notes.length<30)return;
                const STOP=new Set(["a","o","e","é","de","do","da","em","um","uma","para","com","que","se","os","as","dos","das","no","na","por","mais","mas","ao","ou","não","já","isso","esse","esta","este","quando","sobre","após","entre","então","assim","muito","qual","cada","todo","toda","outros","podem","deve","pelo","pela","nos","nas","seu","sua","seus","suas","esse","essa","aquele","porque","como","onde","há","está","eram","será","foram","tinha","tem","este","estes","estas","esses","essas","ser","ter","foi","são","pelos","pelas","num","numa","também","ele","ela","eles","elas","seu","sua"]);
                const sents=notes.split(/[.!?\n]+/).map(s=>s.trim()).filter(s=>s.length>25&&s.length<400);
                const wFreq={};
                notes.toLowerCase().replace(/[^a-záàâãéèêíìîóòôõúùûç\s]/g," ").split(/\s+/).forEach(w=>{if(w.length>3&&!STOP.has(w))wFreq[w]=(wFreq[w]||0)+1;});
                const topKw=Object.entries(wFreq).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([w])=>w);
                const scored=sents.map((s,i)=>{const sw=s.toLowerCase().split(/\s+/);const sc=sw.reduce((sum,w)=>sum+(wFreq[w]||0),0)/Math.max(1,sw.length);return{text:s,score:sc+(i===0?3:i<2?1.5:0),idx:i};});
                const top=scored.sort((a,b)=>b.score-a.score).slice(0,5).sort((a,b)=>a.idx-b.idx);
                const COLORS=["#9D95E8","#60A5FA","#FBBF24","#34C98A"];
                const cs=Math.ceil(topKw.length/4);
                const ramos=COLORS.map((cor,i)=>{const chunk=topKw.slice(i*cs,(i+1)*cs);if(!chunk.length)return null;return{label:chunk[0].charAt(0).toUpperCase()+chunk[0].slice(1),cor,filhos:chunk.slice(1,5)};}).filter(Boolean);
                setTopicAI(p=>({...p,[t.id]:{loading:false,error:null,resumo:top.map(s=>s.text).join(" "),mapa:{centro:t.title,ramos},isOffline:true}}));
              };
              /* ── SVG mind map renderer ── */
              const renderMapa=(mapa)=>{
                if(!mapa?.ramos?.length)return null;
                const W=680,H=460,cx=W/2,cy=H/2;
                const ramos=mapa.ramos||[];const N=ramos.length;
                const lines=[];
                ramos.forEach((r,i)=>{
                  const ang=(2*Math.PI/N*i)-Math.PI/2;
                  const bx=cx+140*Math.cos(ang),by=cy+130*Math.sin(ang);
                  lines.push(`<line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" stroke="${r.cor||"#9D95E8"}" stroke-width="2.5" opacity="0.6"/>`);
                  const tw=Math.min(130,Math.max(70,r.label.length*8));
                  lines.push(`<rect x="${bx-tw/2}" y="${by-14}" width="${tw}" height="28" rx="7" fill="${r.cor||"#9D95E8"}22" stroke="${r.cor||"#9D95E8"}" stroke-width="1.5"/>`);
                  lines.push(`<text x="${bx}" y="${by+5}" text-anchor="middle" fill="${r.cor||"#9D95E8"}" font-size="11" font-weight="700" font-family="system-ui,sans-serif">${(r.label||"").substring(0,18)}</text>`);
                  (r.filhos||[]).forEach((f,j)=>{
                    const ns=r.filhos.length;const subAng=ang+(j-(ns-1)/2)*0.42;
                    const sx=bx+95*Math.cos(subAng),sy=by+85*Math.sin(subAng);
                    lines.push(`<line x1="${bx}" y1="${by}" x2="${sx}" y2="${sy}" stroke="${r.cor||"#9D95E8"}" stroke-width="1" opacity="0.35"/>`);
                    const sw=Math.min(100,Math.max(50,f.length*7));
                    lines.push(`<rect x="${sx-sw/2}" y="${sy-10}" width="${sw}" height="20" rx="5" fill="#12121a" stroke="#2a2a38" stroke-width="1"/>`);
                    lines.push(`<text x="${sx}" y="${sy+4}" text-anchor="middle" fill="#a0a0b8" font-size="9.5" font-family="system-ui,sans-serif">${(f||"").substring(0,16)}</text>`);
                  });
                });
                const ct=(mapa.centro||"").substring(0,22);const cw=Math.max(90,ct.length*9);
                lines.push(`<ellipse cx="${cx}" cy="${cy}" rx="${cw/2+12}" ry="22" fill="#1c1838" stroke="#9D95E8" stroke-width="2"/>`);
                lines.push(`<text x="${cx}" y="${cy+5}" text-anchor="middle" fill="#c8c4f8" font-size="12" font-weight="700" font-family="system-ui,sans-serif">${ct}</text>`);
                return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;background:#0c0c10;border-radius:12px;border:0.5px solid #2a2a38;">${lines.join("")}</svg>`;
              };
              return(
                <div style={{padding:"14px",background:"#0f0f13",display:"flex",flexDirection:"column",gap:12}}>
                  {/* Botões de ação */}
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <button className="btn btn-sm btnp" onClick={buildOffline} style={{flex:1,justifyContent:"center"}}>
                      <i className="ti ti-bolt"/>Resumo Offline <span style={{fontSize:10,opacity:0.7,marginLeft:3}}>grátis · instantâneo</span>
                    </button>
                    <button className="btn btn-sm btng" onClick={()=>genAIMindMap(t)} disabled={ai.loading} style={{flex:1,justifyContent:"center"}}>
                      <i className={`ti ${ai.loading?"ti-loader-2":"ti-wand"}`} style={ai.loading?{animation:"spin 1s linear infinite"}:{}}/>
                      {ai.loading?"Gerando...":"Resumo com IA"}
                      <span style={{fontSize:10,opacity:0.7,marginLeft:3}}>requer API key</span>
                    </button>
                  </div>
                  {/* Badge offline/IA */}
                  {ai.isOffline&&<div style={{fontSize:11,color:"#9D95E8",background:"#1c1838",border:"0.5px solid #3d3780",borderRadius:6,padding:"3px 10px",alignSelf:"flex-start"}}>📝 Gerado offline · baseado em frequência de termos</div>}
                  {ai.resumo&&!ai.isOffline&&<div style={{fontSize:11,color:"#34C98A",background:"#0d2218",border:"0.5px solid #1D6B50",borderRadius:6,padding:"3px 10px",alignSelf:"flex-start"}}>✨ Gerado pela IA (Claude)</div>}
                  {ai.error&&(
                    <div style={{background:"#2d1010",border:"0.5px solid #7f2020",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#fca5a5"}}>
                      ⚠️ {ai.error} — Verifique a API key no Vercel.
                    </div>
                  )}
                  {ai.resumo&&(
                    <div style={{background:"#17171f",border:`0.5px solid ${C.bord}`,borderLeft:`3px solid ${ai.isOffline?"#9D95E8":"#34C98A"}`,borderRadius:"0 8px 8px 0",padding:"12px 14px"}}>
                      <div style={{fontSize:11,color:ai.isOffline?"#9D95E8":"#34C98A",fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em",display:"flex",alignItems:"center",gap:5}}>
                        <i className={`ti ${ai.isOffline?"ti-align-left":"ti-sparkles"}`}/>Resumo em Tópicos
                      </div>
                      <ul style={{margin:0,paddingLeft:16,display:"flex",flexDirection:"column",gap:6}}>
                        {ai.resumo.split(/(?<=[.!?])\s+/).filter(Boolean).map((s,i)=>(
                          <li key={i} style={{fontSize:13,color:C.text,lineHeight:1.7}}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ai.mapa&&(
                    <div>
                      <div style={{fontSize:11,color:"#9D95E8",fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em",display:"flex",alignItems:"center",gap:5}}>
                        <i className="ti ti-hierarchy"/>Mapa Mental
                      </div>
                      <div dangerouslySetInnerHTML={{__html:renderMapa(ai.mapa)}}/>
                    </div>
                  )}
                  {!(t.notes||"").trim()&&(
                    <p style={{fontSize:12,color:C.muted,textAlign:"center",padding:"1rem"}}>💡 Adicione notas na aba "Notas" para gerar resumo e mapa mental.</p>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  const FolderSection=({area,folder})=>{
    const fKey=`${area.id}/${folder.id}`;
    const isOpen=!collapsedFolders.has(fKey);
    const fTopics=topics.filter(t=>t.area===area.id&&t.folder_id===folder.id);
    const [renaming,setRenaming]=useState(false);
    const [renameVal,setRenameVal]=useState(folder.name);
    return(
      <div style={{marginBottom:4,border:`0.5px solid ${C.bord}`,borderRadius:9,overflow:"hidden"}}>
        <div className="folder-header" onClick={()=>!renaming&&toggleFolderCollapse(fKey)}>
          <i className={`ti ${isOpen?"ti-folder-open":"ti-folder"}`} style={{fontSize:14,color:area.color,flexShrink:0}} aria-hidden/>
          {renaming
            ?<input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&renameVal.trim()){renameFolder(area.id,folder.id,renameVal.trim());setRenaming(false);}if(e.key==="Escape")setRenaming(false);}}
                onBlur={()=>{if(renameVal.trim())renameFolder(area.id,folder.id,renameVal.trim());setRenaming(false);}}
                onClick={e=>e.stopPropagation()} style={{fontSize:13,flex:1,padding:"3px 7px"}}/>
            :<span style={{flex:1,fontSize:13,fontWeight:500}}>{folder.name}</span>
          }
          <span style={{fontSize:11,color:C.muted,flexShrink:0}}>{fTopics.length}</span>
          <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
            {bulkMode&&(()=>{const allIds=fTopics.map(t=>t.id);const allSel=allIds.length>0&&allIds.every(id=>selectedTopics.has(id));return(<button className="btn btn-sm" title={allSel?"Desmarcar todos":"Selecionar todos"} onClick={()=>allSel?deselectAllInGroup(allIds):selectAllInGroup(allIds)}><i className={`ti ${allSel?"ti-square-minus":"ti-checkbox"}`} aria-hidden/></button>);})()}
            <button className="btn btn-sm" title="Renomear" onClick={()=>{setRenaming(true);setRenameVal(folder.name);}}><i className="ti ti-pencil" aria-hidden/></button>
            <button className="btn btn-sm btnr" title="Excluir pasta" onClick={()=>deleteFolder(area.id,folder.id)}><i className="ti ti-trash" aria-hidden/></button>
          </div>
          <i className={`ti ${isOpen?"ti-chevron-up":"ti-chevron-down"}`} style={{fontSize:12,color:C.muted,flexShrink:0}} aria-hidden/>
        </div>
        {isOpen&&(
          <div style={{padding:"6px 8px",background:C.dim}}>
            {fTopics.length===0&&<div style={{fontSize:12,color:C.muted,padding:"6px 8px",fontStyle:"italic"}}>Pasta vazia</div>}
            {fTopics.map(t=><TopicRow key={t.id} t={t} area={area}/>)}
          </div>
        )}
      </div>
    );
  };

  // ── Auth guards ──
  if(authLoading) return(
    <div style={{minHeight:"100vh",background:"#0f0f13",display:"flex",alignItems:"center",justifyContent:"center",color:"#6b6b85",fontFamily:"inherit",fontSize:14}}>
      <span style={{animation:"spin 1s linear infinite",fontSize:28,display:"block"}}>⟳</span>
    </div>
  );
  if(!session) return <AuthScreen/>;

  return(
    <>
      <style>{CSS}</style>
      {syncMsg&&<div style={{position:"fixed",top:8,right:14,background:"#0d2218",color:"#34C98A",padding:"5px 12px",fontSize:11,borderRadius:8,border:"0.5px solid #1D6B50",zIndex:200}}>{syncMsg}</div>}
      <nav className="sb">
        <div style={{padding:"8px 4px 14px",borderBottom:`0.5px solid ${C.bord}`,marginBottom:8}}>
          <div style={{fontWeight:700,fontSize:15,color:"#9D95E8"}}>NeuroStudy</div>
          <div style={{fontSize:10,color:C.muted,marginTop:2}}>{topics.length} tópicos · {revRows.length} revisões</div>
        </div>
        {NAV.map(n=>(
          <button key={n.id} className={`ni${view===n.id?" on":""}`} onClick={()=>setView(n.id)}>
            <i className={`ti ${n.icon}`} aria-hidden/>{n.label}
            {n.id==="review"&&pendentesXl.length>0&&<span className="bdg" style={{background:"#2d1010",color:"#fca5a5",marginLeft:"auto"}}>{pendentesXl.length}</span>}
          </button>
        ))}
        {/* Timer Ultrádio */}
        <div style={{margin:"10px 0",padding:"10px 10px 8px",background:ult?ult.mode==='focus'?"#1c1838":"#0d2218":C.dim,borderRadius:10,border:`0.5px solid ${ult?ult.mode==='focus'?"#3d3780":"#1D6B50":C.bord}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:13}}>{ult?.mode==='break'?"🌿":"🧠"}</span>
              <span style={{fontSize:11,fontWeight:600,color:ult?.mode==='break'?"#34C98A":ult?.mode==='focus'?"#9D95E8":C.muted}}>
                {ult?ult.mode==='focus'?"Foco":"Pausa":"Timer Ultrádio"}
              </span>
            </div>
            {ult&&<button onClick={()=>{setUlt(null);clearInterval(ultRef.current);}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>}
          </div>
          {ult?(
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:700,color:ult.mode==='focus'?"#9D95E8":"#34C98A",fontVariantNumeric:"tabular-nums",letterSpacing:1}}>
                {String(Math.floor(ult.secs/60)).padStart(2,"0")}:{String(ult.secs%60).padStart(2,"0")}
              </div>
              <div style={{fontSize:9,color:C.muted,marginBottom:3}}>{ult.mode==='focus'?`${ult.focusMins||ultFocusMins}min foco`:`${ult.breakMins||ultBreakMins}min pausa`}</div>
              <div className="pb" style={{margin:"4px 0 7px"}}>
                <div className="pf" style={{width:`${ult.mode==='focus'?(1-(ult.secs/((ult.focusMins||ultFocusMins)*60)))*100:(1-(ult.secs/((ult.breakMins||ultBreakMins)*60)))*100}%`,background:ult.mode==='focus'?"#9D95E8":"#34C98A"}}/>
              </div>
              <button onClick={()=>setUlt(u=>({...u,running:!u.running}))} className="btn btn-sm" style={{fontSize:11,padding:"3px 10px",width:"100%",justifyContent:"center"}}>
                {ult.running?"⏸ Pausar":"▶ Retomar"}
              </button>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:C.muted,marginBottom:2}}>Foco (min)</div>
                  <input type="number" min="5" max="180" step="5" value={ultFocusMins}
                    onChange={e=>{const v=Math.max(5,Number(e.target.value));setUltFocusMins(v);LS.set("ultFocusMins",v);}}
                    style={{fontSize:13,fontWeight:700,textAlign:"center",padding:"4px 6px",background:"#12121a",border:`0.5px solid ${C.bord}`,borderRadius:6,color:"#9D95E8",width:"100%"}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:C.muted,marginBottom:2}}>Pausa (min)</div>
                  <input type="number" min="5" max="60" step="5" value={ultBreakMins}
                    onChange={e=>{const v=Math.max(5,Number(e.target.value));setUltBreakMins(v);LS.set("ultBreakMins",v);}}
                    style={{fontSize:13,fontWeight:700,textAlign:"center",padding:"4px 6px",background:"#12121a",border:`0.5px solid ${C.bord}`,borderRadius:6,color:"#34C98A",width:"100%"}}/>
                </div>
              </div>
              <button onClick={()=>setUlt({mode:'focus',secs:ultFocusMins*60,running:true,focusMins:ultFocusMins,breakMins:ultBreakMins})} className="btn btn-sm btnp" style={{fontSize:11,justifyContent:"center"}}>
                ▶ Iniciar foco
              </button>
            </div>
          )}
        </div>

        <div style={{marginTop:"auto",paddingTop:12,borderTop:`0.5px solid ${C.bord}`}}>
          <div style={{fontSize:10,color:C.muted,padding:"4px 9px"}}>{Object.values(weekStudy).reduce((a,b)=>a+b,0).toFixed(1)}h esta semana</div>
          <div style={{fontSize:11,color:"#6b6b85",padding:"4px 9px 6px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={session.user.email}>
            <i className="ti ti-user-circle" style={{marginRight:4}}/>{session.user.email}
          </div>
          <button className="ni" style={{color:"#fca5a5"}} onClick={()=>{if(window.confirm("Sair da conta?"))sb.auth.signOut();}}>
            <i className="ti ti-logout" style={{fontSize:15}}/>Sair
          </button>
        </div>
      </nav>
      <main className="main">

        {/* DASHBOARD */}
        {view==="dashboard"&&(()=>{
          const byArea=AREAS.map(a=>({...a,count:topics.filter(t=>t.area===a.id).length}));
          const totalWeekHrs=Object.values(weekStudy).reduce((a,b)=>a+b,0);
          const todayStr=(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');})();
          // Daily tasks helpers — operações individuais por row
          const addDTask=()=>{if(!dailyTaskInput.trim())return;const task={id:Date.now()+"",text:dailyTaskInput.trim(),done:false,date:todayStr};const nw=[...dailyTasks,task];setDailyTasks(nw);LS.set("dailyTasks",nw);dbUpsertDTask(task);setDailyTaskInput("");};
          const toggleDTask=(id)=>{const nw=dailyTasks.map(t=>t.id===id?{...t,done:!t.done}:t);setDailyTasks(nw);LS.set("dailyTasks",nw);const upd=nw.find(t=>t.id===id);if(upd)dbUpsertDTask(upd);};
          const delDTask=(id)=>{const nw=dailyTasks.filter(t=>t.id!==id);setDailyTasks(nw);LS.set("dailyTasks",nw);dbDelDTask(id);};
          const todayTasks=dailyTasks.filter(t=>t.date===todayStr);
          const doneCnt=todayTasks.filter(t=>t.done).length;
          // Hours tracker helpers — operações individuais por row
          const addHoursLog=()=>{
            const h=parseFloat(hoursInput.h);if(!h||h<=0)return;
            const log={id:Date.now()+"",date:todayStr,hours:h,category:hoursInput.cat};
            const nw=[...hoursLogs,log];setHoursLogs(nw);LS.set("hoursLogs",nw);dbAddHoursLog(log);setHoursInput({h:"",cat:"neuro"});
          };
          const delHoursLog=(id)=>{const nw=hoursLogs.filter(l=>l.id!==id);setHoursLogs(nw);LS.set("hoursLogs",nw);dbDelHoursLog(id);};
          // Aggregation helpers
          const fmt=(d)=>d.toISOString().slice(0,10);
          const today=new Date();
          const getLabel=(view,date)=>{
            if(view==="day"){const d=new Date(date+"T12:00:00");return d.toLocaleDateString("pt-BR",{weekday:"short",day:"numeric",month:"short"});}
            if(view==="week"){const d=new Date(date+"T12:00:00");return `${d.toLocaleDateString("pt-BR",{day:"numeric",month:"short"})}`;}
            if(view==="month"){const[y,m]=date.split("-");const d=new Date(y,m-1,1);return d.toLocaleDateString("pt-BR",{month:"short",year:"2-digit"});}
            return date;
          };
          let chartData=[];
          if(hoursView==="day"){
            // Last 14 days
            for(let i=13;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);const ds=fmt(d);const hrs=hoursLogs.filter(l=>l.date===ds).reduce((a,l)=>a+l.hours,0);chartData.push({label:getLabel("day",ds),hrs,date:ds,isToday:ds===todayStr});}
          }else if(hoursView==="week"){
            // Last 12 weeks
            for(let i=11;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i*7);const wStart=new Date(d);wStart.setDate(wStart.getDate()-wStart.getDay()+1);const wEnd=new Date(wStart);wEnd.setDate(wEnd.getDate()+6);const dates=[];for(let j=0;j<7;j++){const dd=new Date(wStart);dd.setDate(dd.getDate()+j);dates.push(fmt(dd));}const hrs=hoursLogs.filter(l=>dates.includes(l.date)).reduce((a,l)=>a+l.hours,0);chartData.push({label:`${wStart.getDate()}/${wStart.getMonth()+1}`,hrs,isToday:dates.includes(todayStr)});}
          }else if(hoursView==="month"){
            // Last 12 months
            for(let i=11;i>=0;i--){const d=new Date(today.getFullYear(),today.getMonth()-i,1);const prefix=fmt(d).slice(0,7);const hrs=hoursLogs.filter(l=>l.date.startsWith(prefix)).reduce((a,l)=>a+l.hours,0);const isCur=prefix===todayStr.slice(0,7);chartData.push({label:getLabel("month",prefix+"-01"),hrs,isToday:isCur});}
          }else{
            // Last 5 years
            for(let i=4;i>=0;i--){const yr=(today.getFullYear()-i)+"";const hrs=hoursLogs.filter(l=>l.date.startsWith(yr)).reduce((a,l)=>a+l.hours,0);chartData.push({label:yr,hrs,isToday:yr===(today.getFullYear()+"")});}
          }
          const maxHrs=Math.max(1,...chartData.map(d=>d.hrs));
          // Category breakdown for logs
          const catBreakdown=AREAS.map(a=>({...a,hrs:hoursLogs.reduce((s,l)=>l.category===a.id?s+l.hours:s,0)})).filter(a=>a.hrs>0);
          const totalLogHrs=catBreakdown.reduce((s,a)=>s+a.hrs,0);
          return(
            <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
              <PageHeader title="Dashboard" sub={`Hoje é ${new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}`}/>
              <div className="g4">
                {[{label:"Tópicos",val:topics.length,icon:"ti-books",color:"#9D95E8"},{label:"Revisões",val:revRows.length,icon:"ti-calendar-repeat",color:"#34C98A"},{label:"Para revisar",val:pendentesXl.length,icon:"ti-alarm",color:pendentesXl.length>0?"#F87171":"#34C98A"},{label:"Horas/semana",val:totalWeekHrs.toFixed(1),icon:"ti-clock",color:"#60A5FA"}].map(m=>(
                  <div key={m.label} className="met" style={{borderLeft:`3px solid ${m.color}`}}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:4}}><i className={`ti ${m.icon}`} style={{marginRight:4}}/>{m.label}</div>
                    <div style={{fontSize:26,fontWeight:700,color:m.color}}>{m.val}</div>
                  </div>
                ))}
              </div>

              {/* Tarefas diárias */}
              <div className="card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div className="st" style={{margin:0}}>✅ Tarefas do dia — {new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"short"})}</div>
                  {(todayTasks.length+pendentesXl.length)>0&&<span style={{fontSize:12,color:doneCnt===todayTasks.length&&pendentesXl.every(r=>(r.checks||[]).find((c,i)=>!c)===undefined)?"#34C98A":C.muted,fontWeight:600}}>{doneCnt}/{todayTasks.length} manuais</span>}
                </div>
                {/* Revisões pendentes como tarefas automáticas */}
                {pendentesXl.length>0&&(
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11,color:"#F87171",fontWeight:600,marginBottom:6,display:"flex",alignItems:"center",gap:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                      <i className="ti ti-calendar-exclamation"/>Revisões vencidas ({pendentesXl.length})
                    </div>
                    {pendentesXl.slice(0,5).map(r=>{
                      const nextIdx=(r.checks||[]).findIndex(c=>!c);
                      const cs=CAT_STYLE[r.cat]||CAT_STYLE["Geral"];
                      return(
                        <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",marginBottom:5,background:"#1a0f0f",borderRadius:8,borderLeft:"3px solid #F87171"}}>
                          <div style={{flexShrink:0,width:20,height:20,borderRadius:5,border:"2px solid #F87171",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <i className="ti ti-calendar" style={{fontSize:10,color:"#F87171"}}/>
                          </div>
                          <span className="bdg" style={{background:cs.bg,color:cs.text,flexShrink:0}}>{r.cat}</span>
                          <span style={{flex:1,fontSize:13,color:"#fca5a5",fontWeight:500}}>{r.topic}</span>
                          {nextIdx>=0&&<button className="btn btn-sm btng" onClick={()=>toggleXlCheck(r.id,nextIdx)} style={{flexShrink:0}}>✓ Feito</button>}
                          <button className="btn btn-sm btnp" onClick={()=>setView("review")} style={{flexShrink:0}}>Ver</button>
                        </div>
                      );
                    })}
                    {pendentesXl.length>5&&<div style={{fontSize:11,color:C.muted,textAlign:"center",marginTop:4}}>+{pendentesXl.length-5} revisões vencidas — <button onClick={()=>setView("review")} style={{background:"none",border:"none",color:"#9D95E8",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>ver todas →</button></div>}
                  </div>
                )}
                {/* Tarefas manuais */}
                {todayTasks.length===0&&pendentesXl.length===0&&<p style={{fontSize:13,color:C.muted,marginBottom:12,fontStyle:"italic"}}>Nenhuma tarefa ainda. Adicione sua primeira tarefa do dia!</p>}
                {todayTasks.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:6,background:t.done?"#1a1830":"#17171f",borderRadius:8,borderLeft:`3px solid ${t.done?"#9D95E8":C.bord}`,transition:"all 0.2s",cursor:"pointer"}} onClick={()=>toggleDTask(t.id)}>
                    <div style={{flexShrink:0,width:20,height:20,borderRadius:5,border:`2px solid ${t.done?"#9D95E8":C.bord}`,background:t.done?"#9D95E8":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {t.done&&<i className="ti ti-check" style={{fontSize:12,color:"#0f0f13"}}/>}
                    </div>
                    <span style={{flex:1,fontSize:14,color:t.done?C.muted:C.text,textDecoration:t.done?"line-through":"none",fontWeight:t.done?400:500}}>{t.text}</span>
                    <button onClick={e=>{e.stopPropagation();delDTask(t.id);}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,lineHeight:1,padding:"2px 4px"}}>×</button>
                  </div>
                ))}
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <input value={dailyTaskInput} onChange={e=>setDailyTaskInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addDTask()} placeholder="Nova tarefa manual..." style={{flex:1,fontSize:14}}/>
                  <button className="btn btnp" onClick={addDTask} style={{flexShrink:0}}><i className="ti ti-plus"/>Adicionar</button>
                </div>
              </div>

              {/* Horas de estudo por categoria */}
              <div className="card">
                <div className="st">Horas de estudo esta semana — por categoria</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
                  {AREAS.map(a=>(
                    <div key={a.id} style={{textAlign:"center",background:a.bg,borderRadius:10,padding:"10px 6px",border:`0.5px solid ${a.color}33`}}>
                      <i className={`ti ${a.icon}`} style={{fontSize:16,color:a.color,display:"block",marginBottom:4}} aria-hidden/>
                      <div style={{fontSize:10,color:a.text,marginBottom:6,fontWeight:500}}>{a.label.split(" ")[0]}</div>
                      <input type="number" min="0" step="0.5" value={weekStudy[a.id]||0}
                        onChange={e=>setWeekStudy(w=>({...w,[a.id]:Math.max(0,Number(e.target.value))}))}
                        style={{textAlign:"center",fontSize:22,fontWeight:700,color:a.color,background:"transparent",border:"none",width:"100%",padding:0,outline:"none"}}/>
                      <div style={{fontSize:9,color:a.text,opacity:0.6}}>horas</div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:10,display:"flex",justifyContent:"flex-end"}}>
                  <button className="btn btn-sm btnr" onClick={()=>{if(confirm("Zerar horas da semana?"))setWeekStudy({neuro:0,biblia:0,ingles:0,livros:0,geral:0});}}>
                    <i className="ti ti-refresh" aria-hidden/>Zerar semana
                  </button>
                </div>
              </div>

              {/* Tracker de horas — estilo Forest */}
              <div className="card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                  <div className="st" style={{margin:0}}>📊 Histórico de estudos</div>
                  <div style={{display:"flex",gap:4}}>
                    {[{k:"day",l:"Dias"},{k:"week",l:"Semanas"},{k:"month",l:"Meses"},{k:"year",l:"Anos"}].map(v=>(
                      <button key={v.k} onClick={()=>setHoursView(v.k)} style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${hoursView===v.k?"#9D95E8":C.bord}`,background:hoursView===v.k?"#1c1838":"transparent",color:hoursView===v.k?"#9D95E8":C.muted,fontSize:12,cursor:"pointer",fontWeight:hoursView===v.k?700:400}}>{v.l}</button>
                    ))}
                  </div>
                </div>
                {/* Bar chart */}
                <div style={{display:"flex",alignItems:"flex-end",gap:4,height:120,marginBottom:8,overflowX:"auto",paddingBottom:4}}>
                  {chartData.map((d,i)=>(
                    <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,minWidth:hoursView==="day"?28:24,gap:3}}>
                      <span style={{fontSize:9,color:d.hrs>0?"#9D95E8":C.muted,fontWeight:600}}>{d.hrs>0?d.hrs.toFixed(1):""}</span>
                      <div style={{width:"100%",background:d.isToday?"#9D95E8":d.hrs>0?"#3d3780":"#1a1a28",borderRadius:"4px 4px 0 0",height:`${Math.max(4,(d.hrs/maxHrs)*90)}px`,transition:"height 0.3s",minHeight:4,position:"relative"}} title={`${d.label}: ${d.hrs.toFixed(1)}h`}/>
                      <span style={{fontSize:9,color:d.isToday?"#9D95E8":C.muted,textAlign:"center",lineHeight:1.2,transform:"rotate(-30deg)",transformOrigin:"top center",whiteSpace:"nowrap"}}>{d.label}</span>
                    </div>
                  ))}
                </div>
                {/* Log entry */}
                <div style={{borderTop:`0.5px solid ${C.bord}`,paddingTop:12,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:13,color:C.muted,fontWeight:500}}>Registrar hoje:</span>
                  <input type="number" min="0.25" step="0.25" value={hoursInput.h} onChange={e=>setHoursInput(h=>({...h,h:e.target.value}))} placeholder="horas" style={{width:70,fontSize:13,textAlign:"center"}} onKeyDown={e=>e.key==="Enter"&&addHoursLog()}/>
                  <select value={hoursInput.cat} onChange={e=>setHoursInput(h=>({...h,cat:e.target.value}))} style={{fontSize:13,padding:"5px 8px",background:"#17171f",border:`0.5px solid ${C.bord}`,borderRadius:6,color:C.text}}>
                    {AREAS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                  <button className="btn btng" onClick={addHoursLog}><i className="ti ti-plus"/>Registrar</button>
                </div>
                {/* Recent logs */}
                {hoursLogs.filter(l=>l.date===todayStr).length>0&&(
                  <div style={{marginTop:10}}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Registros de hoje:</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {hoursLogs.filter(l=>l.date===todayStr).map(l=>{const a=AREAS.find(x=>x.id===l.category);return(
                        <span key={l.id} style={{fontSize:12,padding:"3px 10px",borderRadius:20,background:a?.bg||C.dim,color:a?.color||C.text,border:`0.5px solid ${a?.color||C.bord}`,display:"flex",alignItems:"center",gap:6}}>
                          {a?.label||l.category}: {l.hours}h
                          <button onClick={()=>delHoursLog(l.id)} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:12,lineHeight:1,opacity:0.6}}>×</button>
                        </span>
                      );})}
                    </div>
                  </div>
                )}
                {/* Category breakdown total */}
                {catBreakdown.length>0&&(
                  <div style={{marginTop:12,borderTop:`0.5px solid ${C.bord}`,paddingTop:10}}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:8}}>Total acumulado por categoria ({totalLogHrs.toFixed(1)}h)</div>
                    {catBreakdown.map(a=>(
                      <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <span style={{fontSize:11,color:a.text,background:a.bg,padding:"1px 8px",borderRadius:20,minWidth:90,textAlign:"center"}}>{a.label}</span>
                        <div style={{flex:1,height:6,background:C.dim,borderRadius:3,overflow:"hidden"}}><div style={{width:`${(a.hrs/totalLogHrs)*100}%`,height:"100%",background:a.color,borderRadius:3}}/></div>
                        <span style={{fontSize:11,color:C.muted,minWidth:32,textAlign:"right"}}>{a.hrs.toFixed(1)}h</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Retenção por área */}
              {quizResults.length>0&&(()=>{
                const retention=AREAS.map(a=>{
                  const aResults=quizResults.filter(r=>r.area===a.id).slice(0,10);
                  if(aResults.length===0)return{...a,pct:null,attempts:0};
                  const pct=Math.round(aResults.reduce((s,r)=>s+(r.score/r.total)*100,0)/aResults.length);
                  return{...a,pct,attempts:aResults.length};
                }).filter(a=>a.attempts>0);
                if(retention.length===0)return null;
                return(
                  <div className="card">
                    <div className="st">🧠 Saúde de Retenção por Área</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
                      {retention.map(a=>{
                        const health=a.pct>=80?"ótima":a.pct>=60?"boa":a.pct>=40?"fraca":"crítica";
                        const hColor=a.pct>=80?"#34C98A":a.pct>=60?"#60A5FA":a.pct>=40?"#FBBF24":"#F87171";
                        const hBg=a.pct>=80?"#0d2218":a.pct>=60?"#1a2840":a.pct>=40?"#2d2410":"#2d1010";
                        return(
                          <div key={a.id} style={{background:hBg,borderRadius:10,padding:"12px",border:`0.5px solid ${hColor}33`,display:"flex",flexDirection:"column",gap:6}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <i className={`ti ${a.icon}`} style={{color:hColor,fontSize:15}}/>
                              <span style={{fontSize:12,color:hColor,fontWeight:600}}>{a.label.split(" ")[0]}</span>
                            </div>
                            <div style={{fontSize:28,fontWeight:700,color:hColor,lineHeight:1}}>{a.pct}%</div>
                            <div className="pb"><div className="pf" style={{width:`${a.pct}%`,background:hColor}}/></div>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:hColor,opacity:0.8}}>
                              <span>{health}</span>
                              <span>{a.attempts}× quiz</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{fontSize:11,color:C.muted,marginTop:8}}>Média das últimas 10 tentativas por área · Verde ≥80% · Azul ≥60% · Amarelo ≥40% · Vermelho &lt;40%</div>
                  </div>
                );
              })()}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div className="card">
                  <div className="st">Tópicos por área</div>
                  {byArea.filter(a=>a.count>0).map(a=>(
                    <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{fontSize:11,color:a.text,background:a.bg,padding:"1px 8px",borderRadius:20,minWidth:90,textAlign:"center"}}>{a.label}</span>
                      <div style={{flex:1,height:6,background:C.dim,borderRadius:3,overflow:"hidden"}}><div style={{width:`${Math.min(100,(a.count/Math.max(1,...byArea.map(x=>x.count)))*100)}%`,height:"100%",background:a.color,borderRadius:3}}/></div>
                      <span style={{fontSize:11,color:C.muted,minWidth:20,textAlign:"right"}}>{a.count}</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="st">Próximas revisões</div>
                  {pendentesXl.length===0?<p style={{fontSize:12,color:C.muted}}>Nenhuma revisão pendente 🎉</p>:
                    pendentesXl.slice(0,5).map(r=>{const st=getStatus(r);const cs=CAT_STYLE[r.cat]||CAT_STYLE["Geral"];return(
                      <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`0.5px solid ${C.bord}`}}>
                        <div><div style={{fontSize:12,fontWeight:500}}>{r.topic}</div><span className="bdg" style={{background:cs.bg,color:cs.text}}>{r.cat}</span></div>
                        <span className="bdg" style={{background:st==="vencida"?"#2d1010":"#2d2010",color:st==="vencida"?"#fca5a5":"#fde68a"}}>{getNextRev(r)}</span>
                      </div>
                    );})}
                  {pendentesXl.length>0&&<button className="btn btn-sm btnp" style={{marginTop:8,width:"100%"}} onClick={()=>setView("review")}>Ver todas →</button>}
                </div>
              </div>

              {/* Topicos sem revisao agendada */}
              {(()=>{
                const orphans=topics.filter(t=>!revRows.find(r=>r.id==="t"+t.id||r.topic===t.title));
                if(orphans.length===0)return null;
                return(
                  <div className="card">
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <div className="st" style={{margin:0,display:"flex",alignItems:"center",gap:6}}>
                        <i className="ti ti-alert-triangle" style={{color:"#FBBF24"}}/>
                        {orphans.length} tópico{orphans.length!==1?"s":""} sem revisão espaçada
                      </div>
                      <button className="btn btn-sm" onClick={()=>setView("org")} style={{fontSize:11}}>Ver todos →</button>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {orphans.slice(0,4).map(t=>{
                        const a=AREAS.find(x=>x.id===t.area)||AREAS[4];
                        return(
                          <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:"#17171f",borderRadius:8,borderLeft:`3px solid ${a.color}`}}>
                            <span className="bdg" style={{background:a.bg,color:a.text,flexShrink:0}}>{a.label.split(" ")[0]}</span>
                            <span style={{flex:1,fontSize:13,color:C.text,fontWeight:500}}>{t.title}</span>
                            <button className="btn btn-sm btng" onClick={()=>addTopicToReview(t)} style={{flexShrink:0}}>
                              <i className="ti ti-calendar-plus"/>Agendar
                            </button>
                          </div>
                        );
                      })}
                      {orphans.length>4&&<div style={{fontSize:11,color:C.muted,textAlign:"center"}}>+{orphans.length-4} tópicos sem revisão — <button onClick={()=>setView("org")} style={{background:"none",border:"none",color:"#9D95E8",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>ver na Organização →</button></div>}
                    </div>
                  </div>
                );
              })()}

              {/* Metas ativas */}
              {goals.filter(g=>Math.round((g.done/g.target)*100)<100).length>0&&(
                <div className="card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div className="st" style={{margin:0,display:"flex",alignItems:"center",gap:6}}>
                      <i className="ti ti-target" style={{color:"#34C98A"}}/>Metas ativas
                    </div>
                    <button className="btn btn-sm" onClick={()=>setView("goals")} style={{fontSize:11}}>Gerenciar →</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {goals.filter(g=>Math.round((g.done/g.target)*100)<100).slice(0,4).map(g=>{
                      const a=AREAS.find(x=>x.id===g.area);
                      const pct=Math.min(100,Math.round((g.done/g.target)*100));
                      return(
                        <div key={g.id} style={{display:"flex",flexDirection:"column",gap:4}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span className="bdg" style={{background:a?.bg,color:a?.text}}>{a?.label?.split(" ")[0]}</span>
                              <span style={{fontSize:13,color:C.text,fontWeight:500}}>{g.title}</span>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:12,color:C.muted}}>{g.done}/{g.target} {g.unit}</span>
                              <button className="btn btn-sm btng" style={{padding:"2px 8px",fontSize:11}} onClick={()=>updateGoalDone(g.id,Math.min(g.target,g.done+1))}>+1</button>
                            </div>
                          </div>
                          <div className="pb"><div className="pf" style={{width:`${pct}%`,background:a?.color}}/></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fluxo de estudo */}
              {(()=>{
                const steps=[];
                if(pendentesXl.length>0) steps.push({icon:"ti-calendar-repeat",color:"#F87171",label:"Fazer revisões vencidas",count:pendentesXl.length,action:()=>setView("review"),cta:"Ir para Revisão"});
                const readyQuiz=topics.filter(t=>t.notes&&t.notes.length>50).slice(0,3);
                if(readyQuiz.length>0) steps.push({icon:"ti-help-circle",color:"#60A5FA",label:"Fazer quiz de um tópico",count:null,action:()=>setView("quiz"),cta:"Ir para Quiz"});
                const orphans=topics.filter(t=>!revRows.find(r=>r.id==="t"+t.id||r.topic===t.title));
                if(orphans.length>0) steps.push({icon:"ti-calendar-plus",color:"#FBBF24",label:"Agendar tópicos para revisão",count:orphans.length,action:()=>setView("org"),cta:"Organização"});
                steps.push({icon:"ti-inbox",color:"#9D95E8",label:"Capturar novo conteúdo",count:null,action:()=>setView("capture"),cta:"Ir para Captura"});
                return(
                  <div className="card">
                    <div className="st" style={{marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                      <i className="ti ti-route" style={{color:"#9D95E8"}}/>Fluxo de estudo sugerido para hoje
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {steps.map((s,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#12121a",borderRadius:8,borderLeft:`3px solid ${s.color}`}}>
                          <div style={{width:22,height:22,borderRadius:"50%",background:s.color+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <span style={{fontSize:11,fontWeight:700,color:s.color}}>{i+1}</span>
                          </div>
                          <i className={`ti ${s.icon}`} style={{color:s.color,flexShrink:0}}/>
                          <span style={{flex:1,fontSize:13,color:C.text}}>{s.label}{s.count?<span style={{color:s.color,fontWeight:600,marginLeft:4}}>({s.count})</span>:null}</span>
                          <button className="btn btn-sm" style={{flexShrink:0,borderColor:s.color+"44",color:s.color}} onClick={s.action}>{s.cta} →</button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* PROGRESSO */}

        {view==="capture"&&(()=>{
          const AREA_LABELS={"neuro":"Neurociências","biblia":"Estudo Bíblico","ingles":"Inglês","livros":"Livros","geral":"Área Geral"};
          const AREA_COLORS={"neuro":"#9D95E8","biblia":"#34C98A","ingles":"#60A5FA","livros":"#F87171","geral":"#FBBF24"};
          return(
            <div style={{maxWidth:760,margin:"0 auto",padding:"0 4px 40px"}}>
              {/* Header */}
              <div style={{marginBottom:20}}>
                <h2 style={{fontSize:20,fontWeight:700,color:"#e8e8f2",margin:0,display:"flex",alignItems:"center",gap:8}}>
                  <i className="ti ti-inbox" style={{color:"#9D95E8"}}/>Captura Rápida
                </h2>
                <p style={{fontSize:13,color:"#6b6b85",marginTop:4,marginBottom:0}}>
                  Cole qualquer texto — nota do Obsidian, trecho de livro, insight, artigo — e a IA extrai estrutura e cria um tópico de revisão automático.
                </p>
              </div>

              {/* Input area */}
              {!captureResult&&(
                <div style={{background:"#17171f",border:"0.5px solid #2a2a38",borderRadius:12,padding:16,marginBottom:16}}>
                  <div style={{fontSize:12,color:"#6b6b85",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                    <i className="ti ti-clipboard-text"/>Cole sua nota aqui
                  </div>
                  <textarea
                    value={captureRaw}
                    onChange={e=>setCaptureRaw(e.target.value)}
                    placeholder={"Cole aqui:\n• Nota do Obsidian\n• Trecho de livro ou artigo\n• Transcrição de podcast ou aula\n• Seus insights e reflexões\n\nA IA identifica o tema, extrai pontos-chave e cria um tópico pronto para revisão espaçada."}
                    rows={12}
                    style={{width:"100%",background:"#12121a",border:"0.5px solid #2a2a38",borderRadius:8,padding:"12px",color:"#e8e8f2",fontSize:13,lineHeight:1.8,resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}
                  />
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
                    <span style={{fontSize:11,color:"#6b6b85"}}>{captureRaw.length>0?captureRaw.length+" chars":""}</span>
                    <div style={{display:"flex",gap:8}}>
                      {captureRaw.trim()&&<button className="btn btn-sm" onClick={()=>setCaptureRaw("")}>Limpar</button>}
                      <button
                        className="btn btnp"
                        disabled={captureLoading||captureRaw.trim().length<20}
                        onClick={()=>processCapture(captureRaw)}
                        style={{minWidth:140,display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}
                      >
                        {captureLoading?(
                          <><i className="ti ti-loader-2" style={{animation:"spin 1s linear infinite"}}/>Processando...</>
                        ):(
                          <><i className="ti ti-sparkles"/>Processar com IA</>
                        )}
                      </button>
                    </div>
                  </div>
                  {captureErr&&<div style={{marginTop:10,padding:"8px 12px",background:"#2d1010",borderRadius:8,fontSize:12,color:"#fca5a5"}}>{captureErr}</div>}
                </div>
              )}

              {/* Result card */}
              {captureResult&&(
                <div style={{background:"#17171f",border:"1px solid #3d3780",borderRadius:12,padding:20,marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                    <div>
                      <div style={{fontSize:11,color:"#9D95E8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>
                        ✦ Nota processada — revise antes de confirmar
                      </div>
                      <h3 style={{fontSize:18,fontWeight:700,color:"#e8e8f2",margin:0}}>{captureResult.title}</h3>
                    </div>
                    <span style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,background:(AREA_COLORS[captureResult.area]||"#9D95E8")+"22",color:AREA_COLORS[captureResult.area]||"#9D95E8"}}>
                      {AREA_LABELS[captureResult.area]||captureResult.area}
                    </span>
                  </div>

                  {/* Summary */}
                  <div style={{background:"#12121a",borderRadius:8,padding:"10px 14px",marginBottom:12,borderLeft:"3px solid #9D95E8"}}>
                    <div style={{fontSize:11,color:"#9D95E8",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Resumo</div>
                    <p style={{fontSize:13,color:"#c8c4f8",lineHeight:1.7,margin:0}}>{captureResult.summary}</p>
                  </div>

                  {/* Key Points */}
                  <div style={{background:"#12121a",borderRadius:8,padding:"10px 14px",marginBottom:12}}>
                    <div style={{fontSize:11,color:"#60A5FA",fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>Pontos-chave extraídos</div>
                    {(captureResult.keyPoints||[]).map((p,i)=>(
                      <div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:13,color:"#e8e8f2",lineHeight:1.6}}>
                        <span style={{color:"#60A5FA",fontWeight:700,flexShrink:0}}>{i+1}.</span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>

                  {/* Connections */}
                  {(captureResult.connections||[]).length>0&&(
                    <div style={{background:"#12121a",borderRadius:8,padding:"10px 14px",marginBottom:12}}>
                      <div style={{fontSize:11,color:"#34C98A",fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>Conexões com outros conceitos</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {(captureResult.connections||[]).map((c,i)=>(
                          <span key={i} style={{padding:"3px 10px",borderRadius:20,background:"#1a3028",color:"#7ee8bc",fontSize:12}}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
                    {(captureResult.tags||[]).map((tag,i)=>(
                      <span key={i} style={{padding:"3px 10px",borderRadius:20,background:"#1e1e28",color:"#6b6b85",border:"0.5px solid #2a2a38",fontSize:11}}># {tag}</span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                    <button className="btn btn-sm" onClick={()=>{setCaptureResult(null);}}>
                      ← Editar nota
                    </button>
                    <button className="btn btnp" onClick={()=>confirmCapture(captureResult)} style={{display:"flex",alignItems:"center",gap:6}}>
                      <i className="ti ti-check"/>Criar tópico de revisão
                    </button>
                  </div>
                </div>
              )}

              {/* Recent captures */}
              {captureInbox.length>0&&!captureResult&&(
                <div>
                  <div style={{fontSize:12,color:"#6b6b85",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                    <i className="ti ti-history"/>Capturas recentes ({captureInbox.length})
                  </div>
                  {captureInbox.slice(0,8).map(entry=>(
                    <div key={entry.id} style={{background:"#17171f",border:"0.5px solid #2a2a38",borderRadius:8,padding:"10px 14px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:13,color:"#e8e8f2",fontWeight:500}}>{entry.title}</div>
                        <div style={{fontSize:11,color:"#6b6b85",marginTop:2}}>
                          <span style={{color:AREA_COLORS[entry.area]||"#6b6b85"}}>{AREA_LABELS[entry.area]||entry.area}</span>
                          {" · "}{new Date(entry.ts).toLocaleDateString("pt-BR",{day:"numeric",month:"short"})}
                        </div>
                      </div>
                      <button className="btn btn-sm" onClick={()=>{setView("org");}}>
                        Ver tópico <i className="ti ti-arrow-right"/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {captureInbox.length===0&&!captureResult&&!captureRaw&&(
                <div style={{textAlign:"center",padding:"32px 0",color:"#6b6b85"}}>
                  <i className="ti ti-plant" style={{fontSize:36,display:"block",marginBottom:12,color:"#34C98A"}}/>
                  <div style={{fontSize:14,fontWeight:500,color:"#a0a0b8",marginBottom:6}}>Seu Commonplace Book começa aqui</div>
                  <div style={{fontSize:12,lineHeight:1.7}}>
                    Capture qualquer coisa que aprendeu.<br/>
                    A IA transforma em material estruturado de revisão espaçada.
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {view==="progress"&&(()=>{
          // ── Streak de consistência ──
          const studiedDays=new Set(hoursLogs.map(l=>l.date));
          let streak=0;
          const chk=new Date();
          for(let i=0;i<180;i++){
            const ds=chk.toISOString().slice(0,10);
            if(studiedDays.has(ds)){streak++;chk.setDate(chk.getDate()-1);}
            else break;
          }
          // ── Conformidade revisões ──
          const allChks=revRows.flatMap(r=>(r.checks||[]).map((c,i)=>({done:c===1,date:(r.revs||[])[i]})));
          const duePast=allChks.filter(c=>c.date&&c.date<=t0);
          const compliance=duePast.length>0?Math.round(duePast.filter(c=>c.done).length/duePast.length*100):100;
          // ── Maturidade tópicos ──
          const getStage=reps=>reps>=5?'dominado':reps>=3?'consolidando':reps>=1?'aprendendo':'novo';
          const stageC={novo:'#6b6b85',aprendendo:'#FBBF24',consolidando:'#60A5FA',dominado:'#34C98A'};
          const stageL={novo:'Novo',aprendendo:'Aprendendo',consolidando:'Consolidando',dominado:'Dominado'};
          const dominated=topics.filter(t=>(t.repetitions||0)>=5).length;
          // ── Score médio ──
          const avgScore=quizResults.length>0?Math.round(quizResults.slice(0,20).reduce((s,r)=>s+(r.score/r.total)*100,0)/Math.min(20,quizResults.length)):null;
          // ── Trend semanal (8 semanas) ──
          const weeklyTrend=[];
          for(let i=7;i>=0;i--){
            const wEnd=new Date();wEnd.setDate(wEnd.getDate()-i*7);
            const wStart=new Date(wEnd);wStart.setDate(wStart.getDate()-6);
            const ws=wStart.toISOString().slice(0,10),we=wEnd.toISOString().slice(0,10);
            const wr=quizResults.filter(r=>r.date>=ws&&r.date<=we);
            const avg=wr.length>0?Math.round(wr.reduce((s,r)=>s+(r.score/r.total)*100,0)/wr.length):null;
            weeklyTrend.push({label:`${wEnd.getDate()}/${wEnd.getMonth()+1}`,avg,count:wr.length});
          }
          // ── Heatmap 90 dias ──
          const heatDays=[];
          for(let i=89;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().slice(0,10);const hrs=hoursLogs.filter(l=>l.date===ds).reduce((s,l)=>s+l.hours,0);heatDays.push({date:ds,hrs});}
          // ── Interleaving esta semana ──
          const wkStart=new Date();wkStart.setDate(wkStart.getDate()-wkStart.getDay());
          const wkStr=wkStart.toISOString().slice(0,10);
          const thisWeekAreas=[...new Set(hoursLogs.filter(l=>l.date>=wkStr).map(l=>l.category))];
          const intScore=Math.min(100,Math.round((thisWeekAreas.length/AREAS.length)*100));
          return(
            <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
              <PageHeader title="Progresso" sub="Indicadores de evolução baseados em neurociência"/>
              {/* ── Hero metrics ── */}
              <div className="g4">
                {[
                  {label:'Streak',val:streak+'d',sub:'dias consecutivos',icon:'ti-flame',color:streak>=7?'#F87171':streak>=3?'#FBBF24':'#6b6b85',bg:streak>=7?'#2d1010':streak>=3?'#2d2410':'#12121a'},
                  {label:'Revisões no prazo',val:compliance+'%',sub:`${duePast.filter(c=>c.done).length}/${duePast.length} feitas`,icon:'ti-clock-check',color:compliance>=80?'#34C98A':compliance>=60?'#FBBF24':'#F87171',bg:compliance>=80?'#0d2218':compliance>=60?'#2d2410':'#2d1010'},
                  {label:'Tópicos dominados',val:dominated,sub:`de ${topics.length} total`,icon:'ti-trophy',color:'#9D95E8',bg:'#1c1838'},
                  {label:'Score médio',val:avgScore!=null?avgScore+'%':'—',sub:'últimas 20 tentativas',icon:'ti-chart-line',color:avgScore>=80?'#34C98A':avgScore>=60?'#FBBF24':avgScore!=null?'#F87171':'#6b6b85',bg:avgScore>=80?'#0d2218':avgScore>=60?'#2d2410':avgScore!=null?'#2d1010':'#12121a'},
                ].map(m=>(
                  <div key={m.label} className="met" style={{borderLeft:`3px solid ${m.color}`,background:m.bg}}>
                    <div style={{fontSize:11,color:'#6b6b85',marginBottom:4}}><i className={`ti ${m.icon}`} style={{marginRight:4}}/>{m.label}</div>
                    <div style={{fontSize:26,fontWeight:700,color:m.color}}>{m.val}</div>
                    <div style={{fontSize:10,color:'#6b6b85',marginTop:2}}>{m.sub}</div>
                  </div>
                ))}
              </div>

              {/* ── Maturidade por área ── */}
              <div className="card">
                <div className="st">🧠 Maturidade dos tópicos por área</div>
                <div style={{display:'flex',gap:14,marginBottom:14,flexWrap:'wrap'}}>
                  {Object.entries(stageL).map(([k,l])=>(
                    <div key={k} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#8b8baa'}}>
                      <div style={{width:10,height:10,borderRadius:2,background:stageC[k]}}/>
                      {l}
                    </div>
                  ))}
                </div>
                {AREAS.map(area=>{
                  const aT=topics.filter(t=>t.area===area.id);
                  if(!aT.length)return null;
                  const st={novo:0,aprendendo:0,consolidando:0,dominado:0};
                  aT.forEach(t=>st[getStage(t.repetitions||0)]++);
                  const domPct=Math.round((st.dominado/aT.length)*100);
                  return(
                    <div key={area.id} style={{marginBottom:14}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                        <div style={{display:'flex',alignItems:'center',gap:7}}>
                          <i className={`ti ${area.icon}`} style={{color:area.color,fontSize:14}}/>
                          <span style={{fontSize:12,fontWeight:600,color:area.text}}>{area.label}</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{display:'flex',gap:8}}>
                            {Object.entries(st).filter(([,v])=>v>0).map(([k,v])=>(
                              <span key={k} style={{fontSize:10,color:stageC[k]}}>{v} {stageL[k].toLowerCase()}</span>
                            ))}
                          </div>
                          <span style={{fontSize:11,color:domPct>=50?'#34C98A':'#6b6b85',fontWeight:600}}>{domPct}%</span>
                        </div>
                      </div>
                      <div style={{display:'flex',height:12,borderRadius:6,overflow:'hidden',gap:1,background:'#12121a'}}>
                        {Object.entries(st).map(([k,v])=>v>0?(
                          <div key={k} title={`${stageL[k]}: ${v}`} style={{flex:v,background:stageC[k],transition:'flex 0.4s',minWidth:3}}/>
                        ):null)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Retenção trend SVG ── */}
              {quizResults.length>=3&&(()=>{
                const valid=weeklyTrend.filter(w=>w.avg!=null);
                if(valid.length<2)return null;
                const W=560,H=160,pL=36,pR=12,pT=16,pB=30;
                const pts=weeklyTrend.map((w,i)=>{
                  const x=pL+(i/(weeklyTrend.length-1))*(W-pL-pR);
                  const y=w.avg!=null?pT+(1-w.avg/100)*(H-pT-pB):null;
                  return{...w,x,y};
                });
                const vPts=pts.filter(p=>p.y!=null);
                const linePath=vPts.reduce((acc,p,i,arr)=>{
                  if(i===0)return`M${p.x},${p.y}`;
                  const prev=arr[i-1];const cpx=(prev.x+p.x)/2;
                  return acc+` C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
                },'');
                const fillPath=linePath+` L${vPts.at(-1).x},${H-pB} L${vPts[0].x},${H-pB} Z`;
                const diff=vPts.at(-1).avg-vPts[0].avg;
                return(
                  <div className="card">
                    <div className="st">📈 Evolução da retenção — últimas 8 semanas</div>
                    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',overflow:'visible'}}>
                      {[0,25,50,75,100].map(v=>{const y=pT+(1-v/100)*(H-pT-pB);return(<g key={v}><line x1={pL} y1={y} x2={W-pR} y2={y} stroke="#2a2a38" strokeWidth="0.5"/><text x={pL-4} y={y+4} textAnchor="end" fill="#6b6b85" fontSize="9">{v}%</text></g>);})}
                      <path d={fillPath} fill="#9D95E8" fillOpacity="0.12"/>
                      <path d={linePath} fill="none" stroke="#9D95E8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      {pts.map((p,i)=>p.y!=null&&(
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r={4} fill="#9D95E8" stroke="#17171f" strokeWidth="2"/>
                          {p.count>0&&<text x={p.x} y={p.y-9} textAnchor="middle" fill="#c8c4f8" fontSize="9" fontWeight="600">{p.avg}%</text>}
                          <text x={p.x} y={H-pB+13} textAnchor="middle" fill="#6b6b85" fontSize="8">{p.label}</text>
                        </g>
                      ))}
                    </svg>
                    <div style={{fontSize:11,color:diff>0?'#34C98A':diff<0?'#F87171':'#6b6b85',textAlign:'center',marginTop:2,fontWeight:600}}>
                      {diff>0?`▲ +${diff}% de evolução`:`${diff===0?'→ Estável':'▼ '+diff+'% de variação'}`}
                      <span style={{color:'#6b6b85',fontWeight:400,marginLeft:8}}>{valid.length} semanas com dados</span>
                    </div>
                  </div>
                );
              })()}

              {/* ── Heatmap 90 dias ── */}
              <div className="card">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div className="st" style={{margin:0}}>🗓 Consistência — últimos 90 dias</div>
                  <span style={{fontSize:11,color:'#9D95E8',fontWeight:600}}>{heatDays.filter(d=>d.hrs>0).length} dias estudados</span>
                </div>
                <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                  {heatDays.map((d,i)=>{
                    const lv=d.hrs===0?0:d.hrs<1?1:d.hrs<2?2:d.hrs<4?3:4;
                    const bg=['#12121a','#1c1838','#2d2060','#534AB7','#9D95E8'][lv];
                    return<div key={i} title={`${d.date}: ${d.hrs.toFixed(1)}h`} style={{width:11,height:11,borderRadius:2,background:bg,border:d.date===t0?'1.5px solid #9D95E8':'1.5px solid transparent',cursor:'default',flexShrink:0}}/>;
                  })}
                </div>
                <div style={{display:'flex',gap:6,marginTop:8,alignItems:'center',fontSize:10,color:'#6b6b85'}}>
                  <span>Menos</span>
                  {['#12121a','#1c1838','#2d2060','#534AB7','#9D95E8'].map((c,i)=><div key={i} style={{width:11,height:11,borderRadius:2,background:c}}/>)}
                  <span>Mais</span>
                </div>
              </div>

              {/* ── Interleaving + Revisões no prazo ── */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div className="card">
                  <div className="st">🔀 Interleaving esta semana</div>
                  <div style={{fontSize:36,fontWeight:700,color:intScore>=60?'#34C98A':intScore>=40?'#FBBF24':'#F87171',lineHeight:1,marginBottom:4}}>{intScore}%</div>
                  <div style={{fontSize:11,color:'#6b6b85',marginBottom:10}}>{thisWeekAreas.length} de {AREAS.length} áreas estudadas</div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:10}}>
                    {AREAS.map(a=>{const active=thisWeekAreas.includes(a.id);return(
                      <div key={a.id} style={{padding:'3px 9px',borderRadius:20,background:active?a.bg:'#12121a',border:`0.5px solid ${active?a.color:'#2a2a38'}`,fontSize:11,color:active?a.text:'#6b6b85'}}>
                        <i className={`ti ${a.icon}`} style={{marginRight:4,fontSize:10}}/>{a.label.split(' ')[0]}
                      </div>);
                    })}
                  </div>
                  <div style={{fontSize:10,color:'#6b6b85',lineHeight:1.5,borderTop:`0.5px solid ${C.bord}`,paddingTop:8}}>Meta: 3+ áreas/semana para máxima retenção por interleaving</div>
                </div>
                <div className="card">
                  <div className="st">⏰ Revisões no prazo por área</div>
                  {(()=>{
                    const byArea=AREAS.map(a=>{
                      const aRows=revRows.filter(r=>r.cat===a.label||r.cat===a.label.split(' ')[0]||r.cat===AREAS.find(x=>x.id===a.id)?.label);
                      const chks=aRows.flatMap(r=>(r.checks||[]).map((c,i)=>({done:c===1,date:(r.revs||[])[i]})));
                      const due=chks.filter(c=>c.date&&c.date<=t0);
                      return{...a,due:due.length,onTime:due.filter(c=>c.done).length};
                    }).filter(a=>a.due>0);
                    if(!byArea.length)return<p style={{fontSize:12,color:'#6b6b85'}}>Nenhuma revisão agendada ainda.</p>;
                    return byArea.map(a=>{
                      const pct=Math.round((a.onTime/a.due)*100);
                      return(
                        <div key={a.id} style={{marginBottom:9}}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
                            <span style={{color:a.text}}><i className={`ti ${a.icon}`} style={{marginRight:4}}/>{a.label.split(' ')[0]}</span>
                            <span style={{color:pct>=80?'#34C98A':pct>=60?'#FBBF24':'#F87171',fontWeight:600}}>{pct}%</span>
                          </div>
                          <div className="pb"><div className="pf" style={{width:`${pct}%`,background:pct>=80?'#34C98A':pct>=60?'#FBBF24':'#F87171'}}/></div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

            </div>
          );
        })()}

        {/* ORGANIZAÇÃO */}
        {view==="org"&&(()=>{
          const unlinked=topics.filter(t=>!revRows.find(r=>r.id==="t"+t.id||r.topic===t.title));
          return(
            <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
              <PageHeader title="Organização" sub={`${topics.length} tópicos · ${Object.values(folders).flat().length} pastas`}
                btn={{label:"Novo tópico",icon:"ti-plus",fn:()=>setModal("topic")}}
                extra={<>
                  <button className={`btn btn-sm${bulkMode?" btnp":""}`} onClick={()=>{if(bulkMode)clearSelection();else setBulkMode(true);}}>
                    <i className={`ti ${bulkMode?"ti-x":"ti-checklist"}`} aria-hidden/>{bulkMode?"Cancelar seleção":"Selecionar vários"}
                  </button>
                  <button className="btn btn-sm" disabled={autoOrganizing} onClick={autoOrganize} title="IA organiza todos os tópicos automaticamente">
                    <i className={`ti ${autoOrganizing?"ti-loader-2":"ti-wand"}`} style={autoOrganizing?{animation:"spin 1s linear infinite"}:{}} aria-hidden/>
                    {autoOrganizing?"Organizando...":"Auto-organizar"}
                  </button>
                </>}/>
              {bulkMode&&selectedTopics.size>0&&(
                <div className="bulk-bar">
                  <span className="bulk-cnt"><i className="ti ti-checklist" style={{marginRight:5}}/>{selectedTopics.size} selecionado(s)</span>
                  <button className="btn btn-sm btng" onClick={()=>{setBulkMoveTarget({area:"neuro",folder_id:""});setBulkMoveModal(true);}}>
                    <i className="ti ti-arrows-move" aria-hidden/>Mover todos
                  </button>
                  <button className="btn btn-sm btnr" onClick={bulkDelete}>
                    <i className="ti ti-trash" aria-hidden/>Excluir todos
                  </button>
                  <button className="btn btn-sm" onClick={()=>setSelectedTopics(new Set())}>
                    <i className="ti ti-square" aria-hidden/>Limpar seleção
                  </button>
                </div>
              )}
              <div style={{display:"flex",gap:6,marginBottom:4}}>
                <button className={`atab${orgTab==="topics"?" on":""}`} style={orgTab==="topics"?{background:"#1c1838",color:"#9D95E8",borderColor:"#3d3780"}:{}} onClick={()=>setOrgTab("topics")}><i className="ti ti-folders" style={{marginRight:4}}/>Tópicos ({topics.length})</button>
                <button className={`atab${orgTab==="knowledge"?" on":""}`} style={orgTab==="knowledge"?{background:"#1a3028",color:"#7ee8bc",borderColor:"#34C98A"}:{}} onClick={()=>setOrgTab("knowledge")}><i className="ti ti-file-text" style={{marginRight:4}}/>Base de Conhecimento ({knowledge.length})</button>
              </div>
              {orgTab==="topics"&&(
                <>
                  <div style={{position:"relative",marginBottom:4}}>
                    <i className="ti ti-search" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#6b6b85",fontSize:14,pointerEvents:"none"}}/>
                    <input
                      value={topicSearch}
                      onChange={e=>setTopicSearch(e.target.value)}
                      placeholder="Buscar tópicos por título, tags ou notas..."
                      style={{width:"100%",paddingLeft:32,paddingRight:topicSearch?32:12,background:"#17171f",border:"0.5px solid #2a2a38",borderRadius:8,height:36,fontSize:13,color:"#e8e8f2",boxSizing:"border-box"}}
                    />
                    {topicSearch&&<button onClick={()=>setTopicSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#6b6b85",cursor:"pointer",fontSize:16,padding:"0 4px"}}>×</button>}
                  </div>
                  {topicSearch.trim()&&(()=>{
                    const q=topicSearch.toLowerCase();
                    const results=topics.filter(t=>
                      (t.title||"").toLowerCase().includes(q)||
                      (t.notes||"").toLowerCase().includes(q)||
                      (t.tags||[]).some(tag=>tag.toLowerCase().includes(q))||
                      (t.note_content||"").toLowerCase().includes(q)
                    );
                    const area=(id)=>AREAS.find(a=>a.id===id)||AREAS[4];
                    return(
                      <div>
                        <div style={{fontSize:11,color:"#6b6b85",marginBottom:8}}>{results.length} resultado{results.length!==1?"s":""} para "{topicSearch}"</div>
                        {results.length===0&&<div style={{textAlign:"center",padding:"24px",color:"#6b6b85",fontSize:13}}>Nenhum tópico encontrado.</div>}
                        {results.map(t=>(
                          <div key={t.id} style={{marginBottom:4}}>
                            <TopicRow t={t} area={area(t.area)}/>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  {!topicSearch.trim()&&AREAS.map(area=>{
                const isOpen=!collapsedAreas.has(area.id);
                const aTopics=topics.filter(t=>t.area===area.id);
                const aFolders=folders[area.id]||[];
                const unfoldered=aTopics.filter(t=>!t.folder_id);
                // dueInArea removido — revisões ficam só na aba Revisão Espaçada
                return(
                  <div key={area.id} style={{border:`0.5px solid ${C.bord}`,borderRadius:12,overflow:"hidden"}}>
                    <div className="area-header" style={{background:isOpen?area.bg:C.dim,borderBottom:isOpen?`0.5px solid ${C.bord}`:"none",borderRadius:isOpen?"12px 12px 0 0":12}} onClick={()=>toggleAreaCollapse(area.id)}>
                      <i className={`ti ${isOpen?"ti-chevron-down":"ti-chevron-right"}`} style={{fontSize:14,color:area.color,flexShrink:0}} aria-hidden/>
                      <i className={`ti ${area.icon}`} style={{fontSize:16,color:area.color}} aria-hidden/>
                      <span style={{fontWeight:600,fontSize:14,color:area.text,flex:1}}>{area.label}</span>
                      <span style={{fontSize:11,color:area.text,opacity:0.7}}>{aTopics.length} tópico{aTopics.length!==1?"s":""}</span>
                      <div onClick={e=>e.stopPropagation()}>
                        <button className="btn btn-sm" title="Nova pasta" onClick={()=>{setFolderModal({mode:"create",area:area.id});setFolderModalName("");}}><i className="ti ti-folder-plus" aria-hidden/></button>
                      </div>
                    </div>
                    {isOpen&&(
                      <div style={{padding:"8px"}}>
                        {aFolders.map(folder=><FolderSection key={folder.id} area={area} folder={folder}/>)}
                        {unfoldered.length>0&&(
                          <div style={{marginTop:aFolders.length>0?8:0}}>
                            <div style={{fontSize:11,color:C.muted,padding:"4px 8px 3px",opacity:0.7}}>Sem pasta ({unfoldered.length})</div>
                            {unfoldered.map(t=><TopicRow key={t.id} t={t} area={area}/>)}
                          </div>
                        )}
                        {aTopics.length===0&&<div style={{fontSize:12,color:C.muted,padding:"8px",fontStyle:"italic"}}>Nenhum tópico nesta área ainda.</div>}
                      </div>
                    )}
                  </div>
                );
              })}
                  })}
                </>
              )}
              {orgTab==="knowledge"&&(
                <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <button className={`atab${knowledgeFilter==="all"?" on":""}`} onClick={()=>setKnowledgeFilter("all")}>Todas</button>
                    {AREAS.map(a=><button key={a.id} className={`atab${knowledgeFilter===a.id?" on":""}`} style={knowledgeFilter===a.id?{background:a.bg,color:a.text,borderColor:a.color}:{}} onClick={()=>setKnowledgeFilter(knowledgeFilter===a.id?"all":a.id)}><i className={`ti ${a.icon}`} style={{marginRight:3,fontSize:11}}/>{a.label}</button>)}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {(knowledgeFilter==="all"?knowledge:knowledge.filter(k=>k.area===knowledgeFilter)).length===0&&<div className="card" style={{color:C.muted,textAlign:"center",padding:"2rem"}}><i className="ti ti-file-off" style={{fontSize:32,display:"block",marginBottom:8}}/>Nenhum documento Obsidian importado ainda.</div>}
                    {(knowledgeFilter==="all"?knowledge:knowledge.filter(k=>k.area===knowledgeFilter)).map(k=>{
                      const a=AREAS.find(x=>x.id===k.area)||AREAS[4];const exp=expanded==="k"+k.id;
                      return(<div key={k.id} className="card" style={{borderLeft:`3px solid ${a?.color}`,cursor:"pointer"}} onClick={()=>setExpanded(exp?null:"k"+k.id)}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                          <div style={{flex:1}}><div style={{fontWeight:500,fontSize:13,marginBottom:2}}>{k.title}</div><div style={{display:"flex",gap:5}}><span className="bdg" style={{background:a?.bg,color:a?.text}}>{a?.label}</span>{k.file_name&&<span style={{fontSize:10,color:C.muted}}>{k.file_name}</span>}</div></div>
                          <button className="btn btn-sm btnp" onClick={ev=>{ev.stopPropagation();genQuiz({...k,isKnowledge:true});}}><i className="ti ti-wand" aria-hidden/>Quiz</button>
                        </div>
                        {exp&&<div style={{marginTop:10,fontSize:12,color:"#b0b0c8",lineHeight:1.8,whiteSpace:"pre-wrap",borderTop:`0.5px solid ${C.bord}`,paddingTop:10}}>{(k.content||"").slice(0,2000)}{(k.content||"").length>2000?"…":""}</div>}
                      </div>);
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        {/* ── REVIEW ── */}
        {view==="review"&&(()=>{
          return(
            <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
              <PageHeader title="Revisão Espaçada" sub={`${revRows.length} entradas · ${pendentesXl.length} pendentes`}
                btn={{label:"+ Adicionar",icon:"ti-plus",fn:()=>setModal("rev")}}/>
              {pendentesXl.length>0&&(
                <div className="card" style={{borderLeft:"3px solid #F87171"}}>
                  <div className="st" style={{color:"#fca5a5"}}>⚡ Pendentes hoje ({pendentesXl.length})</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {pendentesXl.slice(0,8).map(r=>{
                      const cs=CAT_STYLE[r.cat]||CAT_STYLE["Geral"];
                      const nextIdx=(r.checks||[]).findIndex(c=>!c);
                      return(
                        <div key={r.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`0.5px solid ${C.bord}`}}>
                          <span className="bdg" style={{background:cs.bg,color:cs.text,minWidth:54,justifyContent:"center"}}>{r.cat}</span>
                          <span style={{flex:1,fontSize:13,fontWeight:500,cursor:r.id.startsWith("t")?"pointer":"default",color:r.id.startsWith("t")?"#c8c4f8":C.text}}
                            onClick={()=>{if(r.id.startsWith("t")){const tid=parseInt(r.id.slice(1));const t=topics.find(x=>x.id===tid);if(t){setPendingExpand(tid);setView("org");}}}}
                          >{r.topic}{r.id.startsWith("t")&&<i className="ti ti-arrow-up-right" style={{fontSize:10,marginLeft:4,opacity:0.6}}/>}</span>
                          <span style={{fontSize:11,color:"#fca5a5"}}>{getNextRev(r)}</span>
                          {nextIdx>=0&&<button className="btn btn-sm btng" onClick={()=>toggleXlCheck(r.id,nextIdx)}>+ Feito</button>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {["Todas","Neuro","Bíblia","Inglês","Livros","Geral"].map(f=>(
                    <button key={f} className={`atab${revFilter===f?" on":""}`}
                      style={revFilter===f?{background:CAT_STYLE[f]?.bg||"#1c1838",color:CAT_STYLE[f]?.text||"#9D95E8",borderColor:CAT_STYLE[f]?.color||"#3d3780"}:{}}
                      onClick={()=>setRevFilter(f)}>{f}</button>
                  ))}
                </div>
                <input placeholder="Buscar tópico..." value={revSearch} onChange={e=>setRevSearch(e.target.value)} style={{width:180,padding:"6px 11px",fontSize:13}}/>
              </div>
              <div style={{overflowX:"auto"}}>
                <table>
                  <thead><tr>
                    <th style={{minWidth:180}}>Tópico</th><th>Cat.</th><th>Base</th>
                    {REV_LABELS.map(l=><th key={l} style={{textAlign:"center",minWidth:46}}>{l}</th>)}
                    <th>Ações</th>
                  </tr></thead>
                  <tbody>
                    {filteredXl.map(r=>{
                      const cs=CAT_STYLE[r.cat]||CAT_STYLE["Geral"];
                      const st=getStatus(r);
                      const isEdit=editRevRow?.id===r.id;
                      return(
                        <tr key={r.id} style={st==="vencida"?{background:"rgba(248,113,113,0.05)"}:st==="proxima"?{background:"rgba(251,191,36,0.04)"}:{}}>
                          <td>{isEdit
                            ?<input value={editRevRow.topic} onChange={e=>setEditRevRow(p=>({...p,topic:e.target.value}))} style={{fontSize:12,padding:"3px 7px"}}/>
                            :<span
                              style={{fontWeight:500,fontSize:13,cursor:r.id.startsWith("t")?"pointer":"default",color:r.id.startsWith("t")?"#c8c4f8":C.text,display:"flex",alignItems:"center",gap:4}}
                              onClick={()=>{if(r.id.startsWith("t")){const tid=parseInt(r.id.slice(1));const t=topics.find(x=>x.id===tid);if(t){setPendingExpand(tid);setView("org");}}}}
                              title={r.id.startsWith("t")?"Clique para abrir o tópico na Organização":""}
                            >
                              {r.topic}
                              {r.id.startsWith("t")&&<i className="ti ti-arrow-up-right" style={{fontSize:10,opacity:0.5}}/>}
                            </span>
                          }</td>
                          <td>{isEdit
                            ?<select value={editRevRow.cat} onChange={e=>setEditRevRow(p=>({...p,cat:e.target.value}))} style={{fontSize:12,padding:"3px 7px"}}>
                              {["Neuro","Bíblia","Inglês","Livros","Geral"].map(c=><option key={c}>{c}</option>)}
                            </select>
                            :<span className="bdg" style={{background:cs.bg,color:cs.text}}>{r.cat}</span>}
                          </td>
                          <td style={{fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{r.base_date}</td>
                          {(r.revs||[]).map((rev,i)=>{
                            const done=(r.checks||[])[i]===1;const vencida=!done&&rev<=t0;
                            return(<td key={i} style={{textAlign:"center"}}>
                              <button title={rev} onClick={()=>toggleXlCheck(r.id,i)}
                                style={{width:30,height:26,borderRadius:5,border:"none",cursor:"pointer",fontSize:12,background:done?"#0d2218":vencida?"#2d1010":"#12121a",color:done?"#34C98A":vencida?"#fca5a5":"#6b6b85"}}>
                                {done?"✓":vencida?"!":"·"}
                              </button>
                            </td>);
                          })}
                          <td>
                            <div style={{display:"flex",gap:4}}>
                              {isEdit
                                ?<><button className="btn btn-sm btng" onClick={()=>{saveEditRev(editRevRow);setEditRevRow(null);}}>✓</button>
                                  <button className="btn btn-sm" onClick={()=>setEditRevRow(null)}>✕</button></>
                                :<><button className="btn btn-sm btnp" title="Gerar quiz deste tópico" onClick={()=>{
                                    let item=null;
                                    if(r.id.startsWith("t")){item=topics.find(x=>x.id===parseInt(r.id.slice(1)));}
                                    else if(r.id.startsWith("book_")){const b=books.find(x=>x.id===parseInt(r.id.slice(5)));if(b)item={...b,title:b.title+" (Livro)",notes:b.notes||""};}
                                    else if(r.id.startsWith("ch_")){const chId=parseInt(r.id.slice(3));const b=books.find(bk=>(bk.chapters||[]).find(c=>c.id===chId));if(b){const ch=(b.chapters||[]).find(c=>c.id===chId);if(ch)item={id:ch.id,title:ch.title,notes:[ch.resumo,ch.perguntas,ch.insights].filter(Boolean).join("\n")};}}
                                    else{item={id:r.id,title:r.topic,notes:r.topic};}
                                    if(item){genQuiz(item);setView("quiz");}
                                  }}><i className="ti ti-help-circle" aria-hidden/></button>
                                  <button className="btn btn-sm" onClick={()=>setEditRevRow({...r})}><i className="ti ti-pencil" aria-hidden/></button>
                                  <button className="btn btn-sm btnr" onClick={()=>deleteRevRow(r.id)}><i className="ti ti-trash" aria-hidden/></button></>
                              }
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredXl.length===0&&<div style={{textAlign:"center",padding:"2rem",color:C.muted,fontSize:13}}>Nenhuma revisão encontrada.</div>}
              </div>
            </div>
          );
        })()}

        {/* ── QUIZ ── */}
        {view==="quiz"&&(()=>{
          if(qLoad)return<div style={{textAlign:"center",padding:"3rem",color:C.muted}}><div style={{width:32,height:32,borderRadius:"50%",border:"3px solid #9D95E8",borderTopColor:"transparent",animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}}/>Gerando quiz com IA...</div>;
          if(qErr)return<div className="card" style={{color:"#fca5a5",textAlign:"center"}}>{qErr}<br/><button className="btn" style={{marginTop:10}} onClick={()=>setQErr(null)}>Voltar</button></div>;
          if(quiz){
            if(quiz.done){
              const pct=Math.round((quiz.score/quiz.questions.length)*100);
              const topicHistory=quizResults.filter(r=>r.topicId===quiz.topicId).slice(0,8);
              return(<div style={{maxWidth:500,margin:"0 auto",display:"flex",flexDirection:"column",gap:12}}>
                <div className="card" style={{textAlign:"center",padding:"2rem"}}>
                  <div style={{fontSize:44,marginBottom:10}}>{pct>=80?"🎉":pct>=60?"💪":"📚"}</div>
                  <h2 style={{fontSize:21,fontWeight:500,marginBottom:3}}>{quiz.score}/{quiz.questions.length}</h2>
                  <p style={{color:C.muted,marginBottom:10,fontSize:12}}>{pct}% — {quiz.topicTitle}</p>
                  <div className="pb" style={{height:7,margin:"0 0 14px"}}><div className="pf" style={{width:`${pct}%`,background:pct>=80?"#34C98A":pct>=60?"#FBBF24":"#F87171"}}/></div>
                  {/* Avaliação de confiança (Metacognição) — ajusta intervalo Ebbinghaus */}
                  {quiz.awaitConf?(
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:12,color:C.muted,marginBottom:10,fontWeight:500}}>Como foi para você? <span style={{fontSize:10,opacity:0.7}}>(ajusta seu próximo intervalo de revisão)</span></div>
                      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                        {[
                          {emoji:"😊",label:"Fácil",sub:"→ +30 dias",qual:5,bg:"#0d2218",border:"#1D6B50",color:"#34C98A"},
                          {emoji:"😅",label:"Difícil",sub:"→ +7 dias",qual:3,bg:"#2d2410",border:"#5a4a10",color:"#FBBF24"},
                          {emoji:"😔",label:"Não sabia",sub:"→ reinicia",qual:1,bg:"#2d1010",border:"#7f2020",color:"#F87171"},
                        ].map(c=>(
                          <button key={c.qual} onClick={()=>{reviewTopic(quiz.topicId,c.qual);setQuiz(q=>({...q,awaitConf:false}));}}
                            style={{flex:1,minWidth:90,padding:"10px 6px",borderRadius:10,border:`1.5px solid ${c.border}`,background:c.bg,color:c.color,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"opacity 0.15s"}}>
                            <span style={{fontSize:22}}>{c.emoji}</span>
                            <span style={{fontWeight:600,fontSize:13}}>{c.label}</span>
                            <span style={{fontSize:10,opacity:0.7}}>{c.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ):(
                    <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:6}}>
                      <button className="btn btnp" onClick={()=>setQuiz(null)}>Novo quiz</button>
                      <button className="btn" onClick={()=>{setQuiz(null);setView("review");}}>Ver revisões</button>
                    </div>
                  )}
                </div>
                {topicHistory.length>1&&(
                  <div className="card">
                    <div className="st">📈 Evolução neste tópico</div>
                    <div style={{display:"flex",alignItems:"flex-end",gap:5,height:60,marginBottom:6}}>
                      {topicHistory.slice().reverse().map((r,i)=>{const p=Math.round((r.score/r.total)*100);return(
                        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                          <span style={{fontSize:9,color:p>=80?"#34C98A":p>=60?"#FBBF24":"#F87171",fontWeight:600}}>{p}%</span>
                          <div style={{width:"100%",background:p>=80?"#34C98A":p>=60?"#FBBF24":"#F87171",borderRadius:"3px 3px 0 0",height:`${Math.max(6,(p/100)*44)}px`,opacity:i===topicHistory.length-1?1:0.6}}/>
                          <span style={{fontSize:8,color:C.muted}}>{r.date.slice(5)}</span>
                        </div>);
                      })}
                    </div>
                    <div style={{fontSize:11,color:C.muted,textAlign:"center"}}>
                      {topicHistory.length} tentativas · média {Math.round(topicHistory.reduce((s,r)=>s+(r.score/r.total)*100,0)/topicHistory.length)}%
                    </div>
                  </div>
                )}
                {/* ── REVISÃO COMPLETA ── */}
                {(quiz.answered||[]).length>0&&(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontWeight:600,fontSize:14}}>📋 Revisão detalhada</span>
                      <span style={{fontSize:11,color:C.muted}}>{(quiz.answered||[]).filter(a=>!a.correct).length} erro(s)</span>
                    </div>
                    {(quiz.answered||[]).map((a,i)=>(
                      <div key={i} style={{background:a.correct?"#0d1a0f":"#1a0d0d",border:`0.5px solid ${a.correct?"#1D6B50":"#7f2020"}`,borderLeft:`3px solid ${a.correct?"#34C98A":"#F87171"}`,borderRadius:10,padding:"12px 14px"}}>
                        <div style={{display:"flex",gap:7,marginBottom:8,alignItems:"flex-start"}}>
                          <span style={{fontSize:16,flexShrink:0}}>{a.correct?"✅":"❌"}</span>
                          <p style={{fontSize:13,fontWeight:500,color:C.text,lineHeight:1.6,margin:0}}>{a.q}</p>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:a.exp?10:0}}>
                          {a.opts.map((o,j)=>{
                            const isCorrect=j===a.ans;
                            const isSelected=j===a.sel;
                            const bg=isCorrect?"#0d2218":isSelected&&!isCorrect?"#2d1010":"#12121a";
                            const border=isCorrect?"#1D9E75":isSelected&&!isCorrect?"#7f2020":"#2a2a38";
                            const color=isCorrect?"#34C98A":isSelected&&!isCorrect?"#F87171":"#8b8baa";
                            return(
                              <div key={j} style={{padding:"7px 11px",borderRadius:7,background:bg,border:`0.5px solid ${border}`,fontSize:12,color,display:"flex",gap:7,alignItems:"center"}}>
                                <span style={{flexShrink:0,fontWeight:600}}>{["A","B","C","D"][j]}.</span>
                                <span style={{flex:1}}>{o}</span>
                                {isCorrect&&<span style={{fontSize:11,color:"#34C98A",flexShrink:0}}>✓ correta</span>}
                                {isSelected&&!isCorrect&&<span style={{fontSize:11,color:"#F87171",flexShrink:0}}>✗ sua resp.</span>}
                              </div>
                            );
                          })}
                        </div>
                        {a.exp&&(
                          <div style={{background:"#12121a",borderRadius:7,padding:"9px 12px",borderLeft:"3px solid #60A5FA"}}>
                            <div style={{fontSize:10,color:"#60A5FA",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>💡 Justificativa</div>
                            <p style={{fontSize:12,color:"#b0c4de",lineHeight:1.7,margin:0}}>{a.exp}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>);
            }
            const q=quiz.questions[quiz.idx];
            return(<div style={{maxWidth:600,margin:"0 auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,fontSize:12,color:C.muted}}>
                <span>{quiz.topicTitle}</span><span>{quiz.idx+1}/{quiz.questions.length} · {quiz.score} ✓</span>
              </div>
              <div className="pb" style={{marginBottom:16}}><div className="pf" style={{width:`${((quiz.idx)/quiz.questions.length)*100}%`,background:"#9D95E8"}}/></div>
              <div className="card" style={{marginBottom:12}}><p style={{fontSize:14,lineHeight:1.7,fontWeight:500}}>{q.q}</p></div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {q.opts.map((o,i)=>{
                  let cls="qo";
                  if(quiz.sel!==null){if(i===q.ans)cls+=" ok";else if(i===quiz.sel)cls+=" no";}
                  return<button key={i} className={cls} disabled={quiz.sel!==null} onClick={()=>answerQuiz(i)}>{o}</button>;
                })}
              </div>
              <button className="btn" style={{marginTop:12}} onClick={()=>setQuiz(null)}>Sair</button>
            </div>);
          }

          // Quiz selection — grouped by area
          // Interleaving: sugestão de sessão intercalada
          const areasComTopicos=AREAS.filter(a=>topics.some(t=>t.area===a.id));
          const interleavingSuggestion=areasComTopicos.length>=2?(()=>{
            const mixed=areasComTopicos.map(a=>{const ts=topics.filter(t=>t.area===a.id);return ts[Math.floor(Math.random()*ts.length)];}).filter(Boolean).slice(0,Math.min(5,areasComTopicos.length));
            return mixed;
          })():null;
          return(
            <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
              <PageHeader title="Quiz Ativo" sub="Teste seu conhecimento com IA"/>
              {/* Banner de Interleaving */}
              {interleavingSuggestion&&interleavingSuggestion.length>=2&&(
                <div style={{background:"linear-gradient(135deg,#1c1838 0%,#0d2218 100%)",border:"0.5px solid #3d3780",borderRadius:12,padding:"14px 16px",display:"flex",gap:14,alignItems:"flex-start",flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
                      <span style={{fontSize:18}}>🔀</span>
                      <span style={{fontWeight:600,fontSize:14,color:"#9D95E8"}}>Sessão Intercalada</span>
                      <span style={{fontSize:10,background:"#1c1838",border:"0.5px solid #534AB7",borderRadius:20,padding:"2px 7px",color:"#9D95E8"}}>+40% retenção</span>
                    </div>
                    <p style={{fontSize:12,color:C.muted,marginBottom:8,lineHeight:1.6}}>A <strong style={{color:"#c8c4f8"}}>prática intercalada</strong> mistura tópicos de áreas diferentes — o cérebro trabalha mais, mas a retenção aumenta 40% vs estudar uma área só.</p>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {interleavingSuggestion.map(t=>{const a=AREAS.find(x=>x.id===t.area);return(
                        <button key={t.id} className="btn btn-sm" onClick={()=>genQuiz(t,true)}
                          style={{background:a?.bg,borderColor:a?.color+"66",color:a?.text,fontSize:11}}>
                          <i className={`ti ${a?.icon}`}/>{t.title.slice(0,20)}{t.title.length>20?"…":""}
                        </button>
                      );})}
                    </div>
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button className={`atab${quizAreaTab==="topics"?" on":""}`} style={quizAreaTab==="topics"?{background:"#1c1838",color:"#9D95E8",borderColor:"#3d3780"}:{}} onClick={()=>setQuizAreaTab("topics")}><i className="ti ti-books" style={{marginRight:4}}/>Tópicos ({topics.length})</button>
                <button className={`atab${quizAreaTab==="knowledge"?" on":""}`} style={quizAreaTab==="knowledge"?{background:"#1a3028",color:"#7ee8bc",borderColor:"#34C98A"}:{}} onClick={()=>setQuizAreaTab("knowledge")}><i className="ti ti-file-text" style={{marginRight:4}}/>Base de Conhecimento ({knowledge.length})</button>
              </div>

              {quizAreaTab==="topics"&&(
                <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                  {AREAS.map(area=>{
                    const aTopics=topics.filter(t=>t.area===area.id);
                    if(aTopics.length===0)return null;
                    const isOpen=!collapsedAreas.has("quiz_"+area.id);
                    return(
                      <div key={area.id} style={{border:`0.5px solid ${C.bord}`,borderRadius:12,overflow:"hidden"}}>
                        <div className="area-header"
                          style={{background:isOpen?area.bg:C.dim,borderBottom:isOpen?`0.5px solid ${C.bord}`:"none",borderRadius:isOpen?"12px 12px 0 0":12}}
                          onClick={()=>toggleAreaCollapse("quiz_"+area.id)}>
                          <i className={`ti ${isOpen?"ti-chevron-down":"ti-chevron-right"}`} style={{fontSize:14,color:area.color}} aria-hidden/>
                          <i className={`ti ${area.icon}`} style={{fontSize:16,color:area.color}} aria-hidden/>
                          <span style={{fontWeight:600,fontSize:14,color:area.text,flex:1}}>{area.label}</span>
                          <span style={{fontSize:11,color:area.text,opacity:0.7}}>{aTopics.length} tópico{aTopics.length!==1?"s":""}</span>
                        </div>
                        {isOpen&&(
                          <div style={{padding:"8px",display:"flex",flexDirection:"column",gap:5}}>
                            {aTopics.map(t=>{
                              const tHistory=quizResults.filter(r=>r.topicId===t.id);
                              const lastResult=tHistory[0];
                              const avgPct=tHistory.length>0?Math.round(tHistory.slice(0,5).reduce((s,r)=>s+(r.score/r.total)*100,0)/Math.min(5,tHistory.length)):null;
                              return(
                              <div key={t.id} className="card" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,padding:"10px 14px",borderLeft:`3px solid ${area.color}`}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontWeight:500,fontSize:13,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                                  <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                                    {lastResult&&<span className="bdg" style={{background:avgPct>=80?"#0d2218":avgPct>=60?"#2d2010":"#2d1010",color:avgPct>=80?"#34C98A":avgPct>=60?"#FBBF24":"#F87171"}}>
                                      {tHistory.length}× · {avgPct}%
                                    </span>}
                                    {!lastResult&&<span className="bdg" style={{background:"#17171f",color:C.muted}}>Nunca feito</span>}
                                    <span style={{fontSize:10,color:C.muted}}>{(t.notes||"").slice(0,50)}…</span>
                                  </div>
                                </div>
                                <div style={{display:"flex",gap:6,flexShrink:0}}>
                                  <button className="btn btn-sm btnp" onClick={()=>genQuiz(t,true)}><i className="ti ti-wand" aria-hidden/>Quiz</button>
                                </div>
                              </div>
                            );})}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {quizAreaTab==="knowledge"&&(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {knowledge.length===0&&<div className="card" style={{color:C.muted,textAlign:"center",padding:"2rem"}}><i className="ti ti-file-off" style={{fontSize:32,display:"block",marginBottom:8}}/>Nenhum documento Obsidian importado ainda.</div>}
                  {knowledge.map(k=>{
                    const a=AREAS.find(x=>x.id===k.area)||AREAS[4];
                    return(
                      <div key={k.id} className="card" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,borderLeft:`3px solid ${a?.color}`}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:500,fontSize:13,marginBottom:2}}>{k.title}</div>
                          <span className="bdg" style={{background:a?.bg,color:a?.text}}>{a?.label}</span>
                        </div>
                        <button className="btn btn-sm btnp" onClick={()=>genQuiz({...k,isKnowledge:true})}><i className="ti ti-wand" aria-hidden/>Quiz</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── BOOKS ── */}
        {view==="books"&&(()=>{
          const BookDetailModal=({book,onClose})=>{
            const [newChTitle,setNewChTitle]=useState("");
            const [editCh,setEditCh]=useState(null);
            const [chChanges,setChChanges]=useState({});
            const [renamingCh,setRenamingCh]=useState(null);
            const [renameVal,setRenameVal]=useState("");
            const isLinked=revRows.find(r=>r.id==="book_"+book.id);
            const bookData=books.find(b=>b.id===book.id)||book;
            return(
              <ModalWrap title={bookData.title} onClose={onClose} wide>
                <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
                  <span className="bdg" style={{background:AREAS.find(a=>a.id===bookData.area)?.bg,color:AREAS.find(a=>a.id===bookData.area)?.text}}>{AREAS.find(a=>a.id===bookData.area)?.label}</span>
                  <span style={{fontSize:12,color:C.muted}}>{bookData.author}</span>
                  <div style={{marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap"}}>
                    {["reading","queued","completed"].map(s=>(
                      <button key={s} style={{padding:"4px 10px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,background:bookData.status===s?"#1c1838":C.dim,color:bookData.status===s?"#9D95E8":C.muted}} onClick={()=>updateBook(bookData.id,{status:s})}>{{reading:"Lendo",queued:"Na fila",completed:"Concluído"}[s]}</button>
                    ))}
                    {!isLinked
                      ?<button className="btn btn-sm btnp" onClick={()=>addBookToReview(bookData)}><i className="ti ti-calendar-plus" aria-hidden/>Revisão Espaçada</button>
                      :<span style={{fontSize:12,color:"#93c5fd",display:"flex",alignItems:"center",gap:4}}><i className="ti ti-calendar-check" aria-hidden/>Na revisão ✓</span>
                    }
                  </div>
                </div>
                {bookData.status==="reading"&&(
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:3}}>
                      <span>Progresso de leitura</span>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <input type="number" min="0" max="100" value={bookData.progress||0}
                          onChange={e=>updateBook(bookData.id,{progress:Math.min(100,Math.max(0,Number(e.target.value)))})}
                          style={{width:48,fontSize:12,padding:"2px 5px",textAlign:"center"}}/><span>%</span>
                      </div>
                    </div>
                    <div className="pb"><div className="pf" style={{width:`${bookData.progress||0}%`,background:AREAS.find(a=>a.id===bookData.area)?.color}}/></div>
                  </div>
                )}
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Notas gerais do livro</div>
                  <textarea rows={3} value={bookData.notes||""} onChange={e=>updateBook(bookData.id,{notes:e.target.value})} placeholder="Contexto, expectativas, por que ler..." style={{fontSize:13,resize:"vertical"}}/>
                </div>
                <div className="st" style={{marginTop:8}}>Capítulos — Fichamento SQ4R</div>
                {(bookData.chapters||[]).length===0&&<p style={{fontSize:13,color:C.muted,marginBottom:8}}>Nenhum capítulo ainda.</p>}
                {(bookData.chapters||[]).map((ch,chIdx)=>{
                  const isExp=editCh===ch.id;
                  const vals={...ch,...(chChanges[ch.id]||{})};
                  const isRenaming=renamingCh===ch.id;
                  const isChLinked=revRows.find(r=>r.id==="ch_"+ch.id);
                  const aColor=AREAS.find(a=>a.id===bookData.area)?.color||"#9D95E8";
                  return(
                    <div key={ch.id} style={{border:`0.5px solid ${isExp?aColor:C.bord}`,borderRadius:10,marginBottom:6,overflow:"hidden"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,padding:"11px 14px",cursor:"pointer",background:isExp?"#12121a":C.dim}} onClick={()=>!isRenaming&&setEditCh(isExp?null:ch.id)}>
                        <span style={{fontSize:11,color:C.muted,fontWeight:600,flexShrink:0,minWidth:22}}>#{chIdx+1}</span>
                        <i className={`ti ${isExp?"ti-chevron-up":"ti-chevron-right"}`} style={{fontSize:12,color:C.muted,flexShrink:0}} aria-hidden/>
                        {isRenaming
                          ?<input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                              onKeyDown={e=>{if(e.key==="Enter"&&renameVal.trim()){renameChapter(bookData.id,ch.id,renameVal.trim());setRenamingCh(null);}if(e.key==="Escape")setRenamingCh(null);}}
                              onBlur={()=>{if(renameVal.trim())renameChapter(bookData.id,ch.id,renameVal.trim());setRenamingCh(null);}}
                              onClick={e=>e.stopPropagation()} style={{fontSize:13,padding:"3px 7px",flex:1}}/>
                          :<span style={{fontWeight:600,fontSize:13,flex:1,color:isExp?C.text:"#b0b0c8"}}>{ch.title}</span>
                        }
                        {isChLinked&&<span className="bdg" style={{background:"#1a2840",color:"#93c5fd",fontSize:10,flexShrink:0}}>Rev ✓</span>}
                        <div style={{display:"flex",gap:4,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                          {!isChLinked&&<button className="btn btn-sm" title="Adicionar capítulo à revisão espaçada" onClick={()=>addChapterToReview(bookData,ch)}><i className="ti ti-calendar-plus" aria-hidden/></button>}
                          {isExp&&<button className="btn btn-sm btng" onClick={()=>{updateChapter(bookData.id,ch.id,chChanges[ch.id]||{});setEditCh(null);}}><i className="ti ti-device-floppy" aria-hidden/>Salvar</button>}
                          <button className="btn btn-sm" onClick={()=>{setRenamingCh(ch.id);setRenameVal(ch.title);setEditCh(null);}}><i className="ti ti-pencil" aria-hidden/></button>
                          <button className="btn btn-sm btnr" onClick={()=>deleteChapter(bookData.id,ch.id)}><i className="ti ti-trash" aria-hidden/></button>
                        </div>
                      </div>
                      {isExp&&(
                        <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:12,background:"#0f0f13"}}>
                          {[
                            {k:"resumo",l:"📋 Resumo",icon:"ti-notes",color:"#9D95E8",ph:"O que este capítulo aborda? Principais conceitos..."},
                            {k:"perguntas",l:"❓ Perguntas-chave",icon:"ti-help-circle",color:"#60A5FA",ph:"• Que problema o autor resolve?\n• Quais são as principais ideias?\n• Como isso se aplica na prática?"},
                            {k:"insights",l:"💡 Insights & Aplicações",icon:"ti-bulb",color:"#FBBF24",ph:"• Insight 1: ...\n• Aplicação: ...\n• Conexão com outros conceitos: ..."}
                          ].map(f=>(
                            <div key={f.k} style={{background:"#17171f",border:`0.5px solid ${C.bord}`,borderLeft:`3px solid ${f.color}`,borderRadius:"0 8px 8px 0",padding:"10px 14px"}}>
                              <div style={{fontSize:12,color:f.color,fontWeight:600,marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                                <i className={`ti ${f.icon}`}/>{f.l}
                              </div>
                              <textarea
                                key={"ch-"+ch.id+"-"+f.k}
                                rows={Math.max(3,(vals[f.k]||"").split("\n").length+1)}
                                placeholder={f.ph}
                                defaultValue={vals[f.k]||""}
                                onBlur={e=>{const updated={...vals,[f.k]:e.target.value};setChChanges(c=>({...c,[ch.id]:updated}));updateChapter(bookData.id,ch.id,updated);}}
                                style={{fontSize:13,resize:"vertical",lineHeight:1.8,background:"transparent",border:"none",padding:0,color:C.text,width:"100%",outline:"none",fontFamily:"inherit"}}/>
                            </div>
                          ))}
                        <div style={{marginTop:8,paddingTop:8,borderTop:"0.5px solid #2a2a38",display:"flex",gap:8}}>
                          <button className="btn btn-sm" style={{flex:1,justifyContent:"center",display:"flex",alignItems:"center",gap:5,borderColor:"#3d3780",color:"#9D95E8"}}
                            onClick={()=>{
                              const raw=[`# ${ch.title}`,vals.resumo||"",vals.perguntas||"",vals.insights||""].filter(Boolean).join("\n\n");


                              if(raw.trim().length<30){alert("Adicione pelo menos um resumo ou insights antes de capturar.");return;}
                              onClose();
                              setCaptureRaw(raw);
                              setView("capture");
                            }}>
                            <i className="ti ti-inbox"/>Enviar para Captura
                          </button>
                          <button className="btn btn-sm" style={{flex:1,justifyContent:"center",display:"flex",alignItems:"center",gap:5,borderColor:"#1a3028",color:"#34C98A"}}
                            onClick={()=>{
                              if(!isChLinked)addChapterToReview(bookData,ch);
                              else alert("Este capítulo já está na revisão espaçada.");
                            }}>
                            <i className="ti ti-calendar-plus"/>{isChLinked?"Na revisão ✓":"Agendar revisão"}
                          </button>
                        </div>
                      </div>
                      )}
                    </div>
                  );
                })}
                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <input placeholder="Nome do novo capítulo..." value={newChTitle} onChange={e=>setNewChTitle(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&newChTitle.trim()){addChapter(bookData.id,newChTitle.trim());setNewChTitle("");}}} style={{fontSize:13}}/>
                  <button className="btn btnp" style={{flexShrink:0}} onClick={()=>{if(newChTitle.trim()){addChapter(bookData.id,newChTitle.trim());setNewChTitle("");}}}><i className="ti ti-plus" aria-hidden/>Capítulo</button>
                </div>
              </ModalWrap>
            );
          };
          const MONTHS_PT=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
          const curYear=new Date().getFullYear();
          const allMonthKeys=MONTHS_PT.map((m,i)=>`${curYear}-${m}`);
          const CAT_COLORS=["#9D95E8","#34C98A","#FBBF24","#60A5FA","#F87171","#FB923C","#A78BFA"];
          const DEFAULT_TIPS=[
            {id:"t1",title:"Crie um lugar fixo de leitura",desc:"O cérebro aprende por contexto. Uma cadeira, uma luz, um chá — sempre o mesmo. Em 2 semanas o corpo já entra em modo leitura ao sentar.",checked:false},
            {id:"t2",title:"Âncora no tempo, não na duração",desc:'Em vez de "vou ler 30 min", defina "vou ler às 21h antes de dormir". A âncora temporal é mais robusta que metas de duração.',checked:false},
            {id:"t3",title:"Mantenha as 3 trilhas separadas",desc:"Ficção à noite (lazer, não exige esforço cognitivo), espiritual em qualquer momento tranquilo, estudo nas sessões da semana. Cada livro no contexto certo.",checked:false},
            {id:"t4",title:"Kindle longe do celular",desc:"A presença do smartphone na mesma mesa reduz a capacidade de concentração — mesmo sem usar. Deixe o celular em outro cômodo durante a leitura noturna.",checked:false},
            {id:"t5",title:"Permissão para largar um livro",desc:"Se até a página 50 um livro de ficção não te prendeu, largue sem culpa. Ler um livro ruim até o fim é o maior assassino do hábito de leitura.",checked:false},
            {id:"t6",title:"Uma frase por sessão de estudo",desc:"Ao terminar cada sessão, escreva UMA frase do que ficou. Sem pressão de resumo completo. Isso consolida a memória e dá sensação de progresso real.",checked:false},
            {id:"t7",title:"Não quebre a corrente",desc:"Marque um X no Notion a cada semana que você leu — qualquer trilha, qualquer tempo. O objetivo é não ter dois X faltando seguidos. Progressão visual vicia.",checked:false},
          ];
          const planStats=readingPlan.stats||{livros:"",emAndamento:"",tempo:""};
          const planCats=readingPlan.categories||[{name:"Neurociência",color:"#9D95E8"},{name:"Ficção",color:"#34C98A"},{name:"Espiritual",color:"#FBBF24"}];
          const planSchedule=readingPlan.schedule||{};
          const planMeta=readingPlan.meta||"";
          const planTips=readingPlan.tips||DEFAULT_TIPS;
          const updatePlan=(patch)=>{const nr={...readingPlan,...patch};LS.set("readingPlan",nr);setReadingPlan(nr);saveReadingPlan(nr);};
          const saveCell=()=>{
            if(!planEditCell)return;
            const sch={...planSchedule,[planEditCell.month]:{...(planSchedule[planEditCell.month]||{}),[planEditCell.cat]:planEditCell.val}};
            updatePlan({schedule:sch});
            setPlanEditCell(null);
          };
          const toggleTip=(id)=>{
            const tips=planTips.map(t=>t.id===id?{...t,checked:!t.checked}:t);
            updatePlan({tips});
          };
          const curMonthIdx=new Date().getMonth();
          const scheduleMonths=allMonthKeys.slice(curMonthIdx);
          return(
            <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
              <PageHeader title="Livros" sub={booksView==="acervo"?"Fichamento por capítulo — SQ4R":"Plano anual de leitura"} btn={{label:"Adicionar livro",icon:"ti-plus",fn:()=>setModal("book")}}/>
              <div style={{display:"flex",gap:6}}>
                {[{id:"acervo",icon:"ti-books",l:"Acervo"},{id:"plano",icon:"ti-calendar-month",l:"Plano de Leitura"}].map(v=>{
                  const on=booksView===v.id;
                  return(<button key={v.id} className={`atab${on?" on":""}`} style={on?{background:"#2d1a1a",color:"#fca5a5",borderColor:"#7f2020"}:{}} onClick={()=>setBooksView(v.id)}>
                    <i className={`ti ${v.icon}`} style={{marginRight:4}}/>{v.l}
                  </button>);
                })}
              </div>
              {booksView==="plano"&&(
                <div style={{display:"flex",flexDirection:"column",gap:20}}>
                  {/* Stats */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                    {[
                      {key:"livros",label:"livros até dez",ph:"7"},
                      {key:"emAndamento",label:"em andamento agora",ph:"3"},
                      {key:"tempo",label:"leitura por semana",ph:"~2h"},
                    ].map(s=>(
                      <div key={s.key} style={{background:"#17171f",border:`0.5px solid ${C.bord}`,borderRadius:12,padding:"14px 10px",textAlign:"center"}}>
                        <input
                          defaultValue={planStats[s.key]||""}
                          onBlur={e=>updatePlan({stats:{...planStats,[s.key]:e.target.value}})}
                          placeholder={s.ph}
                          style={{fontSize:26,fontWeight:800,color:C.text,textAlign:"center",background:"transparent",border:"none",outline:"none",width:"100%",padding:0,fontFamily:"inherit"}}
                        />
                        <div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Cronograma */}
                  <div style={{background:"#12121a",border:`0.5px solid ${C.bord}`,borderRadius:12,padding:"16px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                      <div style={{fontWeight:700,fontSize:15,color:C.text}}>Cronograma {MONTHS_PT[curMonthIdx]} — {MONTHS_PT[11]}</div>
                      <button className="btn btn-sm btnp" onClick={()=>{const name=prompt("Nome da categoria:");if(name?.trim()){const cats=[...planCats,{name:name.trim(),color:CAT_COLORS[planCats.length%CAT_COLORS.length]}];updatePlan({categories:cats});}}}><i className="ti ti-plus"/>Categoria</button>
                    </div>
                    {/* Legend */}
                    <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:12}}>
                      {planCats.map((cat,ci)=>(
                        <div key={ci} style={{display:"flex",alignItems:"center",gap:5,fontSize:12}}>
                          <span style={{width:10,height:10,borderRadius:"50%",background:cat.color,display:"inline-block",flexShrink:0}}/>
                          <span style={{color:C.muted}}>{cat.name}</span>
                          <button onClick={()=>{if(confirm(`Remover categoria "${cat.name}"?`)){updatePlan({categories:planCats.filter((_,i)=>i!==ci)});}}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:11,padding:"0 2px",lineHeight:1}}>×</button>
                        </div>
                      ))}
                    </div>
                    {/* Table */}
                    <div style={{overflowX:"auto"}}>
                      <table style={{minWidth:Math.max(400,planCats.length*160+80),borderCollapse:"separate",borderSpacing:"0 4px"}}>
                        <thead>
                          <tr>
                            <th style={{width:46,fontSize:11,color:C.muted,fontWeight:600,textAlign:"left",paddingBottom:8,paddingLeft:4}}/>
                            {planCats.map((cat,ci)=>(
                              <th key={ci} style={{fontSize:11,color:cat.color,fontWeight:700,textTransform:"uppercase",letterSpacing:1,paddingBottom:8,paddingLeft:6,textAlign:"left"}}>{cat.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {scheduleMonths.map((mKey,mi)=>{
                            const mIdx=allMonthKeys.indexOf(mKey);
                            const isCur=mIdx===curMonthIdx;
                            const rowData=planSchedule[mKey]||{};
                            return(
                              <tr key={mKey} style={{background:isCur?"#1c183844":"transparent"}}>
                                <td style={{fontSize:12,fontWeight:700,color:isCur?"#9D95E8":C.muted,padding:"4px 4px",verticalAlign:"middle",whiteSpace:"nowrap"}}>{MONTHS_PT[mIdx]}</td>
                                {planCats.map((cat,ci)=>{
                                  const val=rowData[cat.name]||"";
                                  const isEditing=planEditCell&&planEditCell.month===mKey&&planEditCell.cat===cat.name;
                                  return(
                                    <td key={ci} style={{padding:"3px 6px",verticalAlign:"middle"}}>
                                      {isEditing?(
                                        <div style={{display:"flex",gap:4,alignItems:"center"}}>
                                          <input autoFocus value={planEditCell.val} onChange={e=>setPlanEditCell(c=>({...c,val:e.target.value}))}
                                            onKeyDown={e=>{if(e.key==="Enter")saveCell();if(e.key==="Escape")setPlanEditCell(null);}}
                                            style={{fontSize:12,padding:"4px 8px",borderRadius:20,border:`1.5px solid ${cat.color}`,background:"#17171f",color:C.text,minWidth:100,outline:"none"}}/>
                                          <button className="btn btn-sm btng" style={{padding:"3px 8px",fontSize:11}} onClick={saveCell}>Salvar</button>
                                          <button className="btn btn-sm" style={{padding:"3px 8px",fontSize:11}} onClick={()=>setPlanEditCell(null)}>✕</button>
                                        </div>
                                      ):(
                                        <div onClick={()=>setPlanEditCell({month:mKey,cat:cat.name,val})}
                                          style={{display:"inline-flex",alignItems:"center",cursor:"pointer",padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:500,
                                            background:val?cat.color+"22":"transparent",
                                            border:`1px dashed ${val?cat.color:C.bord}`,
                                            color:val?cat.color:C.muted,
                                            minWidth:80,minHeight:28,
                                            transition:"all 0.15s"}}>
                                          {val||<span style={{fontSize:11,opacity:0.5}}>+ adicionar</span>}
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Meta */}
                  <div style={{background:"#12121a",border:`0.5px solid ${C.bord}`,borderRadius:12,padding:"14px 16px"}}>
                    <div style={{fontSize:12,color:"#9D95E8",fontWeight:600,marginBottom:6}}>🎯 Meta anual</div>
                    <textarea
                      defaultValue={planMeta}
                      onBlur={e=>updatePlan({meta:e.target.value})}
                      placeholder="Meta final: 7 livros concluídos em 2026. Ritmo: 1 por trilha simultânea, sem pressão de data."
                      rows={2}
                      style={{fontSize:13,color:C.muted,background:"transparent",border:"none",outline:"none",resize:"none",width:"100%",fontFamily:"inherit",lineHeight:1.6,padding:0}}
                    />
                  </div>
                  {/* Tips */}
                  <div style={{background:"#12121a",border:`0.5px solid ${C.bord}`,borderRadius:12,overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",fontWeight:700,fontSize:14,color:C.text,borderBottom:`0.5px solid ${C.bord}`}}>Como pegar gosto pela leitura</div>
                    {planTips.map((tip,ti)=>(
                      <div key={tip.id} style={{display:"flex",gap:12,padding:"12px 16px",borderBottom:ti<planTips.length-1?`0.5px solid ${C.bord}`:"none",alignItems:"flex-start",cursor:"pointer",background:tip.checked?"#1a1830":"transparent"}}
                        onClick={()=>toggleTip(tip.id)}>
                        <div style={{flexShrink:0,width:18,height:18,borderRadius:4,border:`1.5px solid ${tip.checked?"#9D95E8":C.bord}`,background:tip.checked?"#9D95E8":"transparent",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
                          {tip.checked&&<i className="ti ti-check" style={{fontSize:11,color:"#0f0f13"}}/>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:13,color:tip.checked?"#9D95E8":C.text,textDecoration:tip.checked?"line-through":"none"}}>{tip.title}</div>
                          <div style={{fontSize:12,color:C.muted,marginTop:3,lineHeight:1.5}}>{tip.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {booksView==="acervo"&&["reading","queued","completed"].map(status=>{
                const bks=books.filter(b=>b.status===status);if(!bks.length)return null;
                const lbl={reading:"📖 Lendo agora",queued:"📚 Na fila",completed:"✅ Concluídos"};
                return(
                  <div key={status}>
                    <div className="st">{lbl[status]} ({bks.length})</div>
                    <div className="g3">
                      {bks.map(b=>{
                        const a=AREAS.find(x=>x.id===b.area);
                        const isLinked=revRows.find(r=>r.id==="book_"+b.id);
                        return(
                          <div key={b.id} className="card" style={{borderTop:`3px solid ${a?.color}`,cursor:"pointer"}} onClick={()=>setExpandedBook(b.id)}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontWeight:500,fontSize:14,lineHeight:1.3,marginBottom:2}}>{b.title}</div>
                                <div style={{fontSize:12,color:C.muted}}>{b.author}</div>
                              </div>
                              <button className="btn btn-sm btnr" style={{flexShrink:0}} onClick={e=>{e.stopPropagation();deleteBook(b.id);}}><i className="ti ti-trash" aria-hidden/></button>
                            </div>
                            {status==="reading"&&<div className="pb" style={{marginBottom:8}}><div className="pf" style={{width:`${b.progress||0}%`,background:a?.color}}/></div>}
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:4}}>
                              <span className="bdg" style={{background:a?.bg,color:a?.text,fontSize:10}}>{a?.label}</span>
                              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                                {isLinked&&<span style={{fontSize:10,color:"#93c5fd"}}>📅 Rev.</span>}
                                <span style={{fontSize:12,color:C.muted}}>{(b.chapters||[]).length} cap. · <span style={{color:"#9D95E8"}}>Abrir ↗</span></span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {books.length===0&&<div className="card" style={{textAlign:"center",padding:"2rem",color:C.muted}}><i className="ti ti-book-off" style={{fontSize:36,display:"block",marginBottom:8}}/><p>Nenhum livro ainda.</p><button className="btn btnp" style={{marginTop:12}} onClick={()=>setModal("book")}>Adicionar livro</button></div>}
              {expandedBook&&(()=>{const b=books.find(x=>x.id===expandedBook);return b?<BookDetailModal book={b} onClose={()=>setExpandedBook(null)}/>:null;})()}
            </div>
          );
        })()}

        {/* ── GOALS ── */}
        {view==="goals"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
            <PageHeader title="Metas de Estudo" sub="Acompanhe seu progresso" btn={{label:"Nova meta",icon:"ti-plus",fn:()=>setModal("goal")}}/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {PERIODS.map(p=><button key={p} className={`atab${goalPeriod===p?" on":""}`} style={goalPeriod===p?{background:"#1c1838",color:"#9D95E8",borderColor:"#3d3780"}:{}} onClick={()=>setGoalPeriod(p)}>{p}</button>)}
            </div>
            <div className="g2">
              {goals.filter(g=>g.period===goalPeriod).map(g=>{
                const a=AREAS.find(x=>x.id===g.area);const pct=Math.min(100,Math.round((g.done/g.target)*100));
                return(
                  <div key={g.id} className="card" style={{borderLeft:`3px solid ${a?.color}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <div><div style={{fontWeight:500,fontSize:13}}>{g.title}</div><span className="bdg" style={{background:a?.bg,color:a?.text,marginTop:3}}>{a?.label}</span></div>
                      <button className="btn btn-sm btnr" onClick={()=>deleteGoal(g.id)}><i className="ti ti-trash" aria-hidden/></button>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:4}}><span>{g.done}/{g.target} {g.unit}</span><span>{pct}%</span></div>
                    <div className="pb" style={{marginBottom:8}}><div className="pf" style={{width:`${pct}%`,background:pct>=100?"#34C98A":a?.color}}/></div>
                    <div style={{display:"flex",gap:6}}>
                      <input type="number" min="0" value={g.done} onChange={e=>updateGoalDone(g.id,e.target.value)} style={{flex:1,fontSize:13}}/>
                      <button className="btn btn-sm btng" onClick={()=>updateGoalDone(g.id,Math.min(g.target,g.done+1))}>+1</button>
                    </div>
                    <div style={{marginTop:8}}>
                      <div style={{display:"flex",gap:6}}><input placeholder="Anotação..." value={goalNotes[g.id]||""} onChange={e=>setGoalNotes(n=>({...n,[g.id]:e.target.value}))} style={{flex:1,fontSize:12}} onKeyDown={e=>e.key==="Enter"&&addGoalNote(g.id)}/><button className="btn btn-sm" onClick={()=>addGoalNote(g.id)}>+</button></div>
                      {(g.history||[]).slice(-3).map((h,i)=><div key={i} style={{fontSize:11,color:C.muted,marginTop:3}}>{h.date}: {h.text}</div>)}
                    </div>
                  </div>
                );
              })}
              {goals.filter(g=>g.period===goalPeriod).length===0&&<div className="card" style={{color:C.muted,textAlign:"center",gridColumn:"1/-1",padding:"2rem"}}><i className="ti ti-target" style={{fontSize:32,display:"block",marginBottom:8}}/><p>Nenhuma meta {goalPeriod} ainda.</p><button className="btn btnp" style={{marginTop:12}} onClick={()=>setModal("goal")}>Criar meta</button></div>}
            </div>
          </div>
        )}

        {/* ── PLANNER ── */}
        {view==="planner"&&(()=>{
          const WEEK_DAYS=["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
          const WEEK_KEYS=["seg","ter","qua","qui","sex","sab","dom"];
          const addWeekItem=(dayKey,txt)=>{if(!txt.trim())return;const items=[...(weeklySchedule[dayKey]||[]),{id:Date.now(),text:txt.trim(),done:false,area:""}];setWeeklySchedule(w=>({...w,[dayKey]:items}));};
          const toggleWeekItem=(dayKey,id)=>setWeeklySchedule(w=>({...w,[dayKey]:(w[dayKey]||[]).map(i=>i.id===id?{...i,done:!i.done}:i)}));
          const delWeekItem=(dayKey,id)=>setWeeklySchedule(w=>({...w,[dayKey]:(w[dayKey]||[]).filter(i=>i.id!==id)}));
          const clearWeek=()=>{if(confirm("Limpar toda a semana?"))setWeeklySchedule({});};
          const todayDow=new Date().getDay();
          const activeDayIdx=todayDow===0?6:todayDow-1;
          return(
            <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
              <PageHeader title="Planner" sub="Organização semanal e Kanban por área"/>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button className={`atab${plannerTab==="weekly"?" on":""}`} style={plannerTab==="weekly"?{background:"#1c1838",color:"#9D95E8",borderColor:"#3d3780"}:{}} onClick={()=>setPlannerTab("weekly")}><i className="ti ti-calendar-week" style={{marginRight:4}}/>Weekly Schedule</button>
                {AREAS.map(a=><button key={a.id} className={`atab${plannerTab===a.id?" on":""}`} style={plannerTab===a.id?{background:a.bg,color:a.text,borderColor:a.color}:{}} onClick={()=>{setPlannerTab(a.id);setAArea(a.id);}}><i className={`ti ${a.icon}`} style={{marginRight:3,fontSize:12}}/>{a.label}</button>)}
              </div>

              {plannerTab==="weekly"&&(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:13,color:C.muted}}>Semana atual — organize seus estudos e marque o que concluiu</span>
                    <button className="btn btn-sm btnr" onClick={clearWeek}><i className="ti ti-trash" aria-hidden/>Limpar semana</button>
                  </div>
                  {WEEK_DAYS.map((day,idx)=>{
                    const key=WEEK_KEYS[idx];
                    const items=weeklySchedule[key]||[];
                    const isToday=idx===activeDayIdx;
                    const done=items.filter(i=>i.done).length;
                    return(
                      <div key={key} style={{background:isToday?"#1c1838":"#12121a",border:`0.5px solid ${isToday?"#9D95E8":C.bord}`,borderRadius:12,overflow:"hidden"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",background:isToday?"#1e1c38":"#12121a"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            {isToday&&<span style={{fontSize:10,background:"#9D95E8",color:"#0f0f13",borderRadius:4,padding:"1px 6px",fontWeight:700}}>HOJE</span>}
                            <span style={{fontWeight:700,fontSize:15,color:isToday?"#9D95E8":C.text}}>{day}</span>
                          </div>
                          <span style={{fontSize:12,color:done===items.length&&items.length>0?"#34C98A":C.muted,fontWeight:600}}>{items.length>0?`${done}/${items.length} feitas`:""}</span>
                        </div>
                        {items.length>0&&(
                          <div style={{padding:"8px 12px",display:"flex",flexDirection:"column",gap:4}}>
                            {items.map(item=>(
                              <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,background:item.done?"#1a1830":"#17171f",borderLeft:`3px solid ${item.done?"#9D95E8":C.bord}`,cursor:"pointer",transition:"all 0.15s"}} onClick={()=>toggleWeekItem(key,item.id)}>
                                <div style={{flexShrink:0,width:18,height:18,borderRadius:4,border:`2px solid ${item.done?"#9D95E8":C.bord}`,background:item.done?"#9D95E8":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  {item.done&&<i className="ti ti-check" style={{fontSize:11,color:"#0f0f13"}}/>}
                                </div>
                                <span style={{flex:1,fontSize:14,lineHeight:1.5,color:item.done?C.muted:C.text,textDecoration:item.done?"line-through":"none",fontWeight:item.done?400:500,wordBreak:"break-word"}}>{item.text}</span>
                                <button onClick={e=>{e.stopPropagation();delWeekItem(key,item.id);}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,flexShrink:0,lineHeight:1,padding:"2px 4px"}}>×</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{padding:"6px 12px 10px",display:"flex",gap:6}}>
                          <input placeholder="+ Adicionar tarefa..." value={wInputs[key]||""}
                            onChange={e=>setWInputs(w=>({...w,[key]:e.target.value}))}
                            onKeyDown={e=>{if(e.key==="Enter"&&(wInputs[key]||"").trim()){addWeekItem(key,wInputs[key]);setWInputs(w=>({...w,[key]:""}));}}}
                            style={{flex:1,fontSize:13,padding:"6px 10px",background:"transparent",border:`0.5px solid ${C.bord}`,borderRadius:8,color:C.text}}/>
                          <button className="btn btn-sm btnp" onClick={()=>{if((wInputs[key]||"").trim()){addWeekItem(key,wInputs[key]);setWInputs(w=>({...w,[key]:""}));}}}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {plannerTab!=="weekly"&&(
                <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8,alignItems:"flex-start"}}>
                  {pd.map(col=>(
                    <div key={col.id} className="pc">
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:13,fontWeight:600,color:C.text}}>{col.title}</span>
                        <button className="btn btn-sm btnr" onClick={()=>delPlannerCol(col.id)}><i className="ti ti-trash" aria-hidden/></button>
                      </div>
                      {col.cards.map(card=>(
                        <div key={card.id} className="pcard" style={{marginBottom:5}}>
                          <span style={{flex:1,minWidth:0,lineHeight:1.5,fontSize:13,wordBreak:"break-word",overflowWrap:"break-word"}}>{card.text}</span>
                          <button onClick={()=>delPlannerCard(col.id,card.id)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>
                        </div>
                      ))}
                      {addCard===col.id
                        ?<div style={{display:"flex",flexDirection:"column",gap:5,marginTop:4}}>
                          <textarea rows={2} autoFocus placeholder="Texto do card..." value={cardTxt[col.id]||""} onChange={e=>setCardTxt(t=>({...t,[col.id]:e.target.value}))} style={{fontSize:13,resize:"vertical"}}/>
                          <div style={{display:"flex",gap:4}}>
                            <button className="btn btn-sm btng" style={{flex:1}} onClick={()=>addPlannerCard(col.id,cardTxt[col.id]||"")}>Adicionar</button>
                            <button className="btn btn-sm" style={{flex:1}} onClick={()=>setAddCard(null)}>Cancelar</button>
                          </div>
                        </div>
                        :<button className="btn" style={{width:"100%",justifyContent:"center",fontSize:12,marginTop:4}} onClick={()=>setAddCard(col.id)}><i className="ti ti-plus" aria-hidden/>Card</button>
                      }
                    </div>
                  ))}
                  <div className="pc" style={{minWidth:180,border:"1px dashed #2a2a38",background:"transparent",justifyContent:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"1rem"}}>
                    {addCol
                      ?<><input autoFocus placeholder="Nome da coluna" value={colTxt} onChange={e=>setColTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPlannerCol()} style={{fontSize:13}}/>
                        <div style={{display:"flex",gap:4,width:"100%"}}>
                          <button className="btn btn-sm btng" style={{flex:1}} onClick={addPlannerCol}>Criar</button>
                          <button className="btn btn-sm" style={{flex:1}} onClick={()=>setAddCol(false)}>✕</button>
                        </div></>
                      :<button className="btn" style={{color:C.muted}} onClick={()=>setAddCol(true)}><i className="ti ti-plus" aria-hidden/>Nova coluna</button>
                    }
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── MODALS ── */}
        {modal==="topic"&&<ModalWrap title="Novo Tópico" onClose={()=>setModal(null)}><TopicForm val={nt} set={setNt} onSave={addTopic} folders={folders}/></ModalWrap>}
        {modal==="book"&&<ModalWrap title="Novo Livro" onClose={()=>setModal(null)}><BookForm val={nb} set={setNb} onSave={addBook}/></ModalWrap>}
        {modal==="goal"&&<ModalWrap title="Nova Meta" onClose={()=>setModal(null)}><GoalForm val={ng} set={setNg} onSave={addGoal}/></ModalWrap>}
        {modal==="rev"&&<ModalWrap title="Adicionar à Revisão Espaçada" onClose={()=>setModal(null)}><RevForm val={nr} set={setNr} onSave={addRevRow}/></ModalWrap>}

        {/* ── MOVE TOPIC MODAL ── */}
        {moveModal&&(()=>{
          const aFolders=folders[moveTarget.area]||[];
          return(
            <ModalWrap title="Mover tópico para..." onClose={()=>setMoveModal(null)}>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Área de destino</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {AREAS.map(a=>(
                      <button key={a.id} className={`atab${moveTarget.area===a.id?" on":""}`}
                        style={moveTarget.area===a.id?{background:a.bg,color:a.text,borderColor:a.color}:{}}
                        onClick={()=>setMoveTarget({area:a.id,folder_id:""})}>
                        <i className={`ti ${a.icon}`} style={{marginRight:3,fontSize:12}}/>{a.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Pasta de destino</div>
                  <select value={moveTarget.folder_id||""} onChange={e=>setMoveTarget(m=>({...m,folder_id:e.target.value}))}>
                    <option value="">— Sem pasta —</option>
                    {aFolders.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn btng" style={{flex:1}} onClick={moveTopic}><i className="ti ti-check" aria-hidden/>Mover</button>
                  <button className="btn" style={{flex:1}} onClick={()=>setMoveModal(null)}>Cancelar</button>
                </div>
              </div>
            </ModalWrap>
          );
        })()}

        {bulkMoveModal&&(
          <ModalWrap title={`Mover ${selectedTopics.size} tópico(s) selecionado(s)`} onClose={()=>setBulkMoveModal(false)}>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{fontSize:12,color:C.muted}}>Área de destino</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {AREAS.map(a=>(
                  <button key={a.id} className={`atab${bulkMoveTarget.area===a.id?" on":""}`}
                    style={bulkMoveTarget.area===a.id?{background:a.bg,color:a.text,borderColor:a.color}:{}}
                    onClick={()=>setBulkMoveTarget({area:a.id,folder_id:""})}>
                    <i className={`ti ${a.icon}`} style={{marginRight:3,fontSize:12}}/>{a.label}
                  </button>
                ))}
              </div>
              <div style={{fontSize:12,color:C.muted,marginTop:4}}>Pasta de destino (opcional)</div>
              <select value={bulkMoveTarget.folder_id||""} onChange={e=>setBulkMoveTarget(v=>({...v,folder_id:e.target.value}))}>
                <option value="">— Sem pasta —</option>
                {(folders[bulkMoveTarget.area]||[]).map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <div style={{background:C.dim,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.muted}}>
                {selectedTopics.size} tópico(s) → <strong style={{color:C.text}}>{AREAS.find(a=>a.id===bulkMoveTarget.area)?.label}{bulkMoveTarget.folder_id?" / "+(folders[bulkMoveTarget.area]||[]).find(f=>f.id===bulkMoveTarget.folder_id)?.name:""}</strong>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn btng" style={{flex:1}} onClick={bulkMove}><i className="ti ti-arrows-move" aria-hidden/>Confirmar mover</button>
                <button className="btn" style={{flex:1}} onClick={()=>setBulkMoveModal(false)}>Cancelar</button>
              </div>
            </div>
          </ModalWrap>)}

        {/* ── FOLDER CREATE/RENAME MODAL ── */}
        {folderModal&&(
          <ModalWrap title={folderModal.mode==="create"?"Nova Pasta":"Renomear Pasta"} onClose={()=>setFolderModal(null)}>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <input autoFocus placeholder="Nome da pasta" value={folderModalName}
                onChange={e=>setFolderModalName(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"){
                  if(folderModal.mode==="create") createFolder(folderModal.area,folderModalName);
                  else renameFolder(folderModal.area,folderModal.folderId,folderModalName);
                  setFolderModal(null);
                }}}/>
              <div style={{display:"flex",gap:8}}>
                <button className="btn btnp" style={{flex:1}} onClick={()=>{
                  if(folderModal.mode==="create") createFolder(folderModal.area,folderModalName);
                  else renameFolder(folderModal.area,folderModal.folderId,folderModalName);
                  setFolderModal(null);
                }}>
                  <i className="ti ti-check" aria-hidden/>{folderModal.mode==="create"?"Criar pasta":"Salvar"}
                </button>
                <button className="btn" style={{flex:1}} onClick={()=>setFolderModal(null)}>Cancelar</button>
              </div>
            </div>
          </ModalWrap>
        )}

      </main>
    </>
  );
}
