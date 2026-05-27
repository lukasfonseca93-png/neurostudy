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
  "Neuro":    {color:"#9D95E8",bg:"#2a2840",text:"#c8c4f8"},
  "Bíblia":   {color:"#34C98A",bg:"#1a3028",text:"#7ee8bc"},
  "Inglês":   {color:"#60A5FA",bg:"#1a2840",text:"#93c5fd"},
  "Filosofia":{color:"#FBBF24",bg:"#2d2410",text:"#fde68a"},
  "Geral":    {color:"#F87171",bg:"#2d1a1a",text:"#fca5a5"},
};
const REV_LABELS = ["+1d","+10d","+30d","+90d","+180d","+360d","+720d","+1440d"];
const PERIODS = ["semanal","mensal","semestral","anual"];

const DEFAULT_FOLDERS = {
  neuro:  [{id:"nf1",name:"História e Conceitos Gerais"},{id:"nf2",name:"Lobos e Córtex"},{id:"nf3",name:"Neurotransmissores e Sinapses"},{id:"nf4",name:"Memória e Aprendizado"},{id:"nf5",name:"Emoções e Comportamento"},{id:"nf6",name:"Módulos IPOG / VRC"}],
  biblia: [{id:"bf1",name:"Evangelhos Sinóticos"},{id:"bf2",name:"Evangelho de João"},{id:"bf3",name:"Cartas e Epístolas"},{id:"bf4",name:"Antigo Testamento"},{id:"bf5",name:"Módulos IPOG"}],
  ingles: [{id:"if1",name:"Gramática"},{id:"if2",name:"Vocabulário e Expressões"},{id:"if3",name:"Homework"},{id:"if4",name:"Lições Poliglota"}],
  livros: [{id:"lf1",name:"Neurociências e Mente"},{id:"lf2",name:"Desenvolvimento Pessoal"},{id:"lf3",name:"Filosofia e Estoicismo"},{id:"lf4",name:"Liderança e Comunicação"},{id:"lf5",name:"Outros"}],
  geral:  [{id:"gf1",name:"Filosofia"},{id:"gf2",name:"Liderança e Comunicação"},{id:"gf3",name:"Psicologia e Comportamento"},{id:"gf4",name:"Outros"}],
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
const today=()=>new Date().toISOString().slice(0,10);
const fd=(ts)=>{const d=new Date(ts);return`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;};
const CSS=`
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{background:#0f0f13;color:#e8e8f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;}
  ::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:#0f0f13;}::-webkit-scrollbar-thumb{background:#2a2a38;border-radius:3px;}
  .sb{width:220px;background:#17171f;border-right:0.5px solid #2a2a38;padding:1rem 0.75rem;display:flex;flex-direction:column;gap:2px;position:fixed;top:0;left:0;height:100vh;overflow-y:auto;z-index:10;}
  .main{margin-left:220px;padding:1.75rem;min-height:100vh;max-width:1300px;}
  .ni{display:flex;align-items:center;gap:9px;padding:7px 9px;border-radius:8px;cursor:pointer;font-size:13px;color:#6b6b85;transition:all 0.15s;border:none;background:none;width:100%;text-align:left;}
  .ni:hover{background:#1e1e28;color:#e8e8f2;}.ni.on{background:#1c1838;color:#9D95E8;font-weight:500;}.ni i{font-size:16px;}
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
  input,textarea,select{background:#12121a;border:0.5px solid #2a2a38;color:#e8e8f2;border-radius:8px;padding:8px 12px;font-size:13px;width:100%;font-family:inherit;transition:border 0.15s;}
  input:focus,textarea:focus,select:focus{outline:none;border-color:#534AB7;}
  .ov{position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:100;}
  .mod{background:#17171f;border-radius:14px;padding:1.5rem;width:90%;max-width:560px;border:0.5px solid #2a2a38;max-height:92vh;overflow-y:auto;}
  .qo{padding:12px 15px;border-radius:8px;border:0.5px solid #2a2a38;cursor:pointer;font-size:13px;transition:all 0.15s;background:#12121a;color:#e8e8f2;text-align:left;width:100%;line-height:1.5;}
  .qo:hover:not(:disabled){border-color:#534AB7;background:#1a1a30;}.qo:disabled{cursor:default;}
  .qo.ok{background:#0d2218;border-color:#1D9E75;color:#34C98A;}.qo.no{background:#2d1010;border-color:#7f2020;color:#F87171;}
  .pc{background:#12121a;border:0.5px solid #2a2a38;border-radius:11px;padding:11px;min-width:215px;max-width:255px;flex-shrink:0;}
  .pcard{background:#1e1e28;border:0.5px solid #2a2a38;border-radius:7px;padding:10px 12px;font-size:13px;cursor:grab;display:flex;justify-content:space-between;align-items:flex-start;gap:6px;line-height:1.5;}
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

export default function App(){
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
  const [weekStudy,setWeekStudy]=useState(()=>LS.get("weekStudy",{neuro:0,biblia:0,ingles:0,livros:0,geral:0}));
  const [collapsedAreas,setCollapsedAreas]=useState(()=>new Set(LS.get("collapsedAreas",[])));
  const [collapsedFolders,setCollapsedFolders]=useState(()=>new Set(LS.get("collapsedFolders",[])));
  const [expanded,setExpanded]=useState(null);
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
  const [nt,setNt]=useState({title:"",notes:"",tags:"",area:"neuro",folder_id:""});
  const [nb,setNb]=useState({title:"",author:"",area:"livros",status:"queued",notes:""});
  const [ng,setNg]=useState({area:"neuro",title:"",target:"",unit:"",period:"anual"});
  const [nr,setNr]=useState({topic:"",cat:"Neuro",base_date:today()});
  const t0=today();

  useEffect(()=>{if(loaded)LS.set("topics",topics);},[topics,loaded]);
  useEffect(()=>{if(loaded)LS.set("folders",folders);},[folders,loaded]);
  useEffect(()=>{if(loaded)LS.set("revRows",revRows);},[revRows,loaded]);
  useEffect(()=>{if(loaded)LS.set("books",books);},[books,loaded]);
  useEffect(()=>{if(loaded)LS.set("goals",goals);},[goals,loaded]);
  useEffect(()=>{if(loaded)LS.set("knowledge",knowledge);},[knowledge,loaded]);
  useEffect(()=>{if(loaded)LS.set("planner",planner);},[planner,loaded]);
  useEffect(()=>{if(loaded)LS.set("weekStudy",weekStudy);},[weekStudy,loaded]);
  useEffect(()=>{LS.set("view",view);},[view]);
  useEffect(()=>{LS.set("collapsedAreas",[...collapsedAreas]);},[collapsedAreas]);
  useEffect(()=>{LS.set("collapsedFolders",[...collapsedFolders]);},[collapsedFolders]);

  useEffect(()=>{
    if(LS.get("topics",[]).length===0) setTopics(SEED_TOPICS);
    if(LS.get("revRows",[]).length===0) setRevRows(SEED_REV_ROWS);
    setLoaded(true);
    (async()=>{
      try{
        const [t,r,b,g,sl,k]=await Promise.all([
          sb.from('topics').select('*').order('created_at',{ascending:false}),
          sb.from('rev_rows').select('*').order('base_date',{ascending:false}),
          sb.from('books').select('*').order('updated_at',{ascending:false}),
          sb.from('goals').select('*'),
          sb.from('study_logs').select('*').order('log_date',{ascending:false}).limit(90),
          sb.from('knowledge').select('*').order('updated_at',{ascending:false}),
        ]);
        const mi=(l,r)=>{const m=new Map();l.forEach(x=>m.set(String(x.id),x));r.forEach(x=>{const ex=m.get(String(x.id));if(!ex||(x.updated_at&&(!ex.updated_at||x.updated_at>ex.updated_at)))m.set(String(x.id),x);});return[...m.values()];};
        if(t.data?.length>0){setTopics(p=>{const m=mi(p,t.data);LS.set("topics",m);return m;});}
        if(r.data?.length>0){setRevRows(p=>{const m=mi(p,r.data);LS.set("revRows",m);return m;});}
        if(b.data?.length>0){setBooks(b.data);LS.set("books",b.data);}
        if(g.data?.length>0){setGoals(g.data);LS.set("goals",g.data);}
        if(k.data?.length>0){setKnowledge(k.data);LS.set("knowledge",k.data);}
        setSyncMsg("☁️ Sincronizado");setTimeout(()=>setSyncMsg(null),2500);
      }catch{}
    })();
  },[]);

  const getNextRev=useCallback((row)=>{const ch=row.checks||[];for(let i=0;i<8;i++){if(!ch[i])return row.revs?.[i]||null;}return null;},[]);
  const getStatus=useCallback((row)=>{const n=getNextRev(row);if(!n)return"completo";if(n<=t0)return"vencida";if(Math.round((new Date(n)-new Date(t0))/864e5)<=3)return"proxima";return"ok";},[getNextRev,t0]);
  const due=topics.filter(t=>t.next_review&&t.next_review<=Date.now()+864e5).length;
  const filteredXl=revRows.filter(r=>{const ms=revSearch.toLowerCase();return(revFilter==="Todas"||r.cat===revFilter)&&(!ms||r.topic.toLowerCase().includes(ms));});
  const pendentesXl=revRows.filter(r=>getStatus(r)==="vencida"||getStatus(r)==="proxima").sort((a,b)=>(getNextRev(a)||"")>(getNextRev(b)||"")?1:-1);

  const toggleAreaCollapse=(id)=>setCollapsedAreas(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleFolderCollapse=(key)=>setCollapsedFolders(p=>{const n=new Set(p);n.has(key)?n.delete(key):n.add(key);return n;});

  const addTopic=useCallback(async()=>{
    const tags=nt.tags.split(",").map(t=>t.trim()).filter(Boolean);const id=Date.now();
    const topic={id,area:nt.area,folder_id:nt.folder_id||null,title:nt.title,notes:nt.notes,tags,created_at:Date.now(),next_review:Date.now(),interval_days:0,repetitions:0,quiz_cache:null};
    setTopics(p=>[topic,...p]);setModal(null);setNt({title:"",notes:"",tags:"",area:"neuro",folder_id:""});
    try{await sb.from('topics').upsert({...topic,updated_at:new Date().toISOString()});}catch{}
  },[nt]);

  const deleteTopic=useCallback(async(id)=>{
    if(!confirm("Excluir tópico?"))return;
    setTopics(p=>p.filter(t=>t.id!==id));
    try{await sb.from('topics').delete().eq('id',id);}catch{}
  },[]);

  const saveTopicEdits=useCallback(async(id)=>{
    const edits=editNotes[id];if(!edits)return;
    const changes={};
    if(edits.title!==undefined)changes.title=edits.title;
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
    const topic=topics.find(t=>t.id===id);if(!topic)return;
    const ef=Math.max(1.3,(topic.ef||2.5)+(0.1-(5-qual)*(0.08+(5-qual)*0.02)));
    const interval=topic.repetitions===0?1:topic.repetitions===1?6:Math.round((topic.interval_days||1)*ef);
    const next=Date.now()+interval*864e5;
    const updated={...topic,repetitions:(topic.repetitions||0)+1,interval_days:interval,next_review:next,ef};
    const ts=new Date().toISOString();
    setTopics(p=>p.map(t=>t.id===id?{...updated,updated_at:ts}:t));
    try{await sb.from('topics').update({repetitions:updated.repetitions,interval_days:interval,next_review:next,ef,updated_at:ts}).eq('id',id);}catch{}
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

  const bulkMove=async()=>{
    if(!selectedTopics.size)return;
    const ids=[...selectedTopics];
    const ts=new Date().toISOString();
    const changes={area:bulkMoveTarget.area,folder_id:bulkMoveTarget.folder_id||null,updated_at:ts};
    setTopics(p=>p.map(t=>ids.includes(t.id)?{...t,...changes}:t));
    setSelectedTopics(new Set());setBulkMoveModal(false);
    try{for(const id of ids)await sb.from('topics').update(changes).eq('id',id);}catch{}
  };;

  const toggleXlCheck=useCallback(async(rowId,idx)=>{
    const row=revRows.find(r=>r.id===rowId);if(!row)return;
    const ch=[...(row.checks||[0,0,0,0,0,0,0,0])];ch[idx]=ch[idx]?0:1;
    setRevRows(p=>p.map(r=>r.id===rowId?{...r,checks:ch}:r));
    try{await sb.from('rev_rows').update({checks:ch,updated_at:new Date().toISOString()}).eq('id',rowId);}catch{}
  },[revRows]);

  const addRevRow=useCallback(async()=>{
    const id="r"+Date.now();const revs=calcRevDates(nr.base_date);
    const row={id,topic:nr.topic,cat:nr.cat,base_date:nr.base_date,checks:[0,0,0,0,0,0,0,0],revs};
    setRevRows(p=>[...p,row]);setModal(null);setNr({topic:"",cat:"Neuro",base_date:t0});
    try{await sb.from('rev_rows').upsert({...row,updated_at:new Date().toISOString()});}catch{}
  },[nr,t0]);

  const deleteRevRow=useCallback(async(id)=>{
    if(!confirm("Excluir revisão?"))return;setRevRows(p=>p.filter(r=>r.id!==id));
    try{await sb.from('rev_rows').delete().eq('id',id);}catch{}
  },[]);

  const addTopicToReview=useCallback(async(topic)=>{
    const id="t"+topic.id;if(revRows.find(r=>r.id===id)){alert("Tópico já está na revisão.");return;}
    const catLabel=AREAS.find(a=>a.id===topic.area)?.label||"Geral";
    const row={id,topic:topic.title,cat:catLabel,base_date:t0,checks:[0,0,0,0,0,0,0,0],revs:calcRevDates(t0)};
    setRevRows(p=>[...p.filter(r=>r.id!==id),row]);
    try{await sb.from('rev_rows').upsert({...row,updated_at:new Date().toISOString()});}catch{}
  },[t0,revRows]);

  const updateBook=useCallback(async(id,changes)=>{setBooks(p=>p.map(b=>b.id===id?{...b,...changes}:b));try{await sb.from('books').update({...changes,updated_at:new Date().toISOString()}).eq('id',id);}catch{}},[]);
  const addBook=useCallback(async()=>{const id=Date.now();const book={id,title:nb.title,author:nb.author,area:nb.area,status:nb.status,progress:0,notes:nb.notes,chapters:[]};setBooks(p=>[...p,book]);setModal(null);setNb({title:"",author:"",area:"livros",status:"queued",notes:""});try{await sb.from('books').upsert({...book,updated_at:new Date().toISOString()});}catch{}},[nb]);
  const deleteBook=useCallback(async(id)=>{if(!confirm("Excluir livro?"))return;setBooks(p=>p.filter(b=>b.id!==id));try{await sb.from('books').delete().eq('id',id);}catch{}},[]);
  const addChapter=useCallback(async(bId,title)=>{const book=books.find(b=>b.id===bId);if(!book)return;const ch=[...(book.chapters||[]),{id:Date.now(),title,resumo:"",perguntas:"",insights:"",created_at:Date.now()}];setBooks(p=>p.map(b=>b.id===bId?{...b,chapters:ch}:b));try{await sb.from('books').update({chapters:ch,updated_at:new Date().toISOString()}).eq('id',bId);}catch{}},[books]);
  const updateChapter=useCallback(async(bId,chId,changes)=>{const book=books.find(b=>b.id===bId);if(!book)return;const ch=(book.chapters||[]).map(c=>c.id===chId?{...c,...changes}:c);setBooks(p=>p.map(b=>b.id===bId?{...b,chapters:ch}:b));try{await sb.from('books').update({chapters:ch,updated_at:new Date().toISOString()}).eq('id',bId);}catch{}},[books]);
  const deleteChapter=useCallback(async(bId,chId)=>{if(!confirm("Excluir capítulo?"))return;const book=books.find(b=>b.id===bId);if(!book)return;const ch=(book.chapters||[]).filter(c=>c.id!==chId);setBooks(p=>p.map(b=>b.id===bId?{...b,chapters:ch}:b));try{await sb.from('books').update({chapters:ch,updated_at:new Date().toISOString()}).eq('id',bId);}catch{}},[books]);
  const renameChapter=useCallback(async(bId,chId,newTitle)=>{const book=books.find(b=>b.id===bId);if(!book)return;const ch=(book.chapters||[]).map(c=>c.id===chId?{...c,title:newTitle}:c);setBooks(p=>p.map(b=>b.id===bId?{...b,chapters:ch}:b));try{await sb.from('books').update({chapters:ch,updated_at:new Date().toISOString()}).eq('id',bId);}catch{}},[books]);
  const addBookToReview=useCallback(async(book)=>{const id="book_"+book.id;if(revRows.find(r=>r.id===id)){alert("Livro já está na revisão.");return;}const row={id,topic:book.title+" (Livro)",cat:AREAS.find(a=>a.id===book.area)?.label||"Geral",base_date:t0,checks:[0,0,0,0,0,0,0,0],revs:calcRevDates(t0)};setRevRows(p=>[...p.filter(r=>r.id!==id),row]);try{await sb.from('rev_rows').upsert({...row,updated_at:new Date().toISOString()});}catch{}},[t0,revRows]);

  const addGoal=useCallback(async()=>{const id=Date.now();const goal={id,area:ng.area,title:ng.title,target:Number(ng.target),done:0,unit:ng.unit,period:ng.period,history:[]};setGoals(p=>[...p,goal]);setModal(null);setNg({area:"neuro",title:"",target:"",unit:"",period:"anual"});try{await sb.from('goals').upsert({...goal,updated_at:new Date().toISOString()});}catch{}},[ng]);
  const updateGoalDone=useCallback(async(id,val)=>{const done=Math.max(0,Number(val));setGoals(p=>p.map(g=>g.id===id?{...g,done}:g));try{await sb.from('goals').update({done,updated_at:new Date().toISOString()}).eq('id',id);}catch{}},[]);
  const deleteGoal=useCallback(async(id)=>{if(!confirm("Excluir meta?"))return;setGoals(p=>p.filter(g=>g.id!==id));try{await sb.from('goals').delete().eq('id',id);}catch{}},[]);
  const addGoalNote=useCallback(async(gId)=>{const txt=(goalNotes[gId]||"").trim();if(!txt)return;const goal=goals.find(g=>g.id===gId);if(!goal)return;const history=[...(goal.history||[]),{date:t0,text:txt}];setGoals(p=>p.map(g=>g.id===gId?{...g,history}:g));setGoalNotes(n=>({...n,[gId]:""}));try{await sb.from('goals').update({history,updated_at:new Date().toISOString()}).eq('id',gId);}catch{}},[goals,goalNotes,t0]);

  const pd=planner[aArea]||[];
  const savePlanner=useCallback(async(area,cols)=>{setPlanner(p=>({...p,[area]:cols}));try{await sb.from('planner').upsert({area,cols,updated_at:new Date().toISOString()});}catch{}},[]);
  const addPlannerCol=()=>{if(!colTxt.trim())return;savePlanner(aArea,[...pd,{id:Date.now(),title:colTxt,cards:[]}]);setColTxt("");setAddCol(false);};
  const addPlannerCard=(colId,txt)=>{if(!txt.trim())return;savePlanner(aArea,pd.map(c=>c.id===colId?{...c,cards:[...c.cards,{id:Date.now(),text:txt}]}:c));setAddCard(null);setCardTxt({});};
  const delPlannerCard=(colId,cardId)=>savePlanner(aArea,pd.map(c=>c.id===colId?{...c,cards:c.cards.filter(x=>x.id!==cardId)}:c));
  const delPlannerCol=(colId)=>{if(!confirm("Excluir coluna?"))return;savePlanner(aArea,pd.filter(c=>c.id!==colId));};

  const genQuiz=useCallback(async(item,force=false)=>{
    if(!force&&item.quiz_cache){setQuiz({questions:item.quiz_cache,idx:0,score:0,sel:null,topicTitle:item.title,topicId:item.id,isKnowledge:false});return;}
    setQLoad(true);setQErr(null);
    try{
      const notes=item.notes||item.content||"";
      const resp=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer PLACEHOLDER"},body:JSON.stringify({model:"gpt-3.5-turbo",temperature:0.7,messages:[{role:"system",content:"Crie 5 perguntas de múltipla escolha em português. Responda APENAS com JSON: [{\"q\":\"...\",\"opts\":[\"A...\",...],\"ans\":0},...]."},{role:"user",content:notes.slice(0,3000)}]})});
      const d=await resp.json();const raw=d.choices?.[0]?.message?.content||"[]";
      const questions=JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0]||"[]");
      if(!questions.length)throw new Error("Sem perguntas geradas");
      if(!item.isKnowledge)setTopics(p=>p.map(t=>t.id===item.id?{...t,quiz_cache:questions}:t));
      setQuiz({questions,idx:0,score:0,sel:null,topicTitle:item.title,topicId:item.id,isKnowledge:!!item.isKnowledge});
    }catch(e){setQErr("Erro ao gerar quiz: "+e.message);}
    finally{setQLoad(false);}
  },[topics]);

  const answerQuiz=(selIdx)=>{
    if(quiz.sel!==null)return;
    const q=quiz.questions[quiz.idx];const correct=selIdx===q.ans;const score=quiz.score+(correct?1:0);
    setQuiz(q2=>({...q2,sel:selIdx,score}));
    setTimeout(()=>setQuiz(q2=>{
      if(q2.idx+1>=q2.questions.length){setQuizHistory(h=>[{date:t0,topic:q2.topicTitle,score,total:q2.questions.length},...h.slice(0,49)]);if(q2.topicId&&!q2.isKnowledge)reviewTopic(q2.topicId,correct?4:2);return{...q2,done:true};}
      return{...q2,idx:q2.idx+1,sel:null};
    }),1200);
  };

  const NAV=[
    {id:"dashboard",label:"Dashboard",icon:"ti-layout-dashboard"},
    {id:"org",label:"Organização",icon:"ti-folders"},
    {id:"review",label:"Revisão Espaçada",icon:"ti-calendar-repeat"},
    {id:"quiz",label:"Quiz Ativo",icon:"ti-help-circle"},
    {id:"books",label:"Livros",icon:"ti-book"},
    {id:"goals",label:"Metas",icon:"ti-target"},
    {id:"planner",label:"Planner",icon:"ti-layout-kanban"},
  ];

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
            <span style={{fontWeight:500,fontSize:13,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:exp?"normal":"nowrap"}}>{ed.title??t.title}</span>
            {isDue&&<span className="bdg" style={{background:"#2d1010",color:"#fca5a5",flexShrink:0}}>Revisar!</span>}
            {!isDue&&days!==null&&days<=3&&days>=0&&<span className="bdg" style={{background:"#2d2010",color:"#fde68a",flexShrink:0}}>Em {days}d</span>}
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
          <div style={{padding:"8px 14px 14px",borderTop:`0.5px solid ${C.bord}`}}>
            <input className="title-inline" value={ed.title??t.title}
              onChange={e=>setEditNotes(n=>({...n,[t.id]:{...n[t.id],title:e.target.value}}))}
              onBlur={()=>saveTopicEdits(t.id)} style={{marginBottom:8}}/>
            <textarea className="inline-edit"
              rows={Math.max(4,((ed.notes??t.notes)||"").split("\n").length+1)}
              value={ed.notes??t.notes??""}
              placeholder="Clique e comece a digitar..."
              onChange={e=>setEditNotes(n=>({...n,[t.id]:{...n[t.id],notes:e.target.value}}))}
              onBlur={()=>saveTopicEdits(t.id)}/>
            <input value={ed.tags!==undefined?ed.tags:(t.tags||[]).join(", ")}
              onChange={e=>setEditNotes(n=>({...n,[t.id]:{...n[t.id],tags:e.target.value}}))}
              onBlur={()=>saveTopicEdits(t.id)}
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
              <span>Próx: {isDue?"hoje":t.next_review?fd(t.next_review):"—"}</span>
              {t.quiz_cache&&<span style={{color:"#34C98A"}}>Quiz ✓</span>}
              <button style={{marginLeft:"auto",background:"none",border:"none",color:"#9D95E8",cursor:"pointer",fontSize:11}} onClick={e=>{e.stopPropagation();genQuiz(t,true);}}>↺ Refazer quiz</button>
            </div>
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
            {n.id==="org"&&due>0&&<span className="bdg" style={{background:"#2d2010",color:"#fde68a",marginLeft:"auto"}}>{due}</span>}
          </button>
        ))}
        <div style={{marginTop:"auto",paddingTop:12,borderTop:`0.5px solid ${C.bord}`}}>
          <div style={{fontSize:10,color:C.muted,padding:"4px 9px"}}>{Object.values(weekStudy).reduce((a,b)=>a+b,0).toFixed(1)}h esta semana</div>
        </div>
      </nav>
      <main className="main">

        {/* DASHBOARD */}
        {view==="dashboard"&&(()=>{
          const byArea=AREAS.map(a=>({...a,count:topics.filter(t=>t.area===a.id).length}));
          const totalWeekHrs=Object.values(weekStudy).reduce((a,b)=>a+b,0);
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
              <div className="card">
                <div className="st">Horas de estudo esta semana — edite diretamente</div>
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
                  {unlinked.length>0&&<span style={{fontSize:11,color:"#fde68a",background:"#2d2010",padding:"3px 9px",borderRadius:20}}>{unlinked.length} sem revisão</span>}
                  <button className={`btn btn-sm${bulkMode?" btnp":""}`} onClick={()=>{if(bulkMode)clearSelection();else setBulkMode(true);}}>
                    <i className={`ti ${bulkMode?"ti-x":"ti-checklist"}`} aria-hidden/>{bulkMode?"Cancelar seleção":"Selecionar vários"}
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
              {orgTab==="topics"&&AREAS.map(area=>{
                const isOpen=!collapsedAreas.has(area.id);
                const aTopics=topics.filter(t=>t.area===area.id);
                const aFolders=folders[area.id]||[];
                const unfoldered=aTopics.filter(t=>!t.folder_id);
                const dueInArea=aTopics.filter(t=>t.next_review&&t.next_review<=Date.now()).length;
                return(
                  <div key={area.id} style={{border:`0.5px solid ${C.bord}`,borderRadius:12,overflow:"hidden"}}>
                    <div className="area-header" style={{background:isOpen?area.bg:C.dim,borderBottom:isOpen?`0.5px solid ${C.bord}`:"none",borderRadius:isOpen?"12px 12px 0 0":12}} onClick={()=>toggleAreaCollapse(area.id)}>
                      <i className={`ti ${isOpen?"ti-chevron-down":"ti-chevron-right"}`} style={{fontSize:14,color:area.color,flexShrink:0}} aria-hidden/>
                      <i className={`ti ${area.icon}`} style={{fontSize:16,color:area.color}} aria-hidden/>
                      <span style={{fontWeight:600,fontSize:14,color:area.text,flex:1}}>{area.label}</span>
                      <span style={{fontSize:11,color:area.text,opacity:0.7}}>{aTopics.length} tópico{aTopics.length!==1?"s":""}</span>
                      {dueInArea>0&&<span className="bdg" style={{background:"#2d1010",color:"#fca5a5"}}>{dueInArea} p/revisar</span>}
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
                          <span style={{flex:1,fontSize:13,fontWeight:500}}>{r.topic}</span>
                          <span style={{fontSize:11,color:"#fca5a5"}}>{getNextRev(r)}</span>
                          {nextIdx>=0&&<button className="btn btn-sm btng" onClick={()=>toggleXlCheck(r.id,nextIdx)}>✓ Feito</button>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {["Todas","Neuro","Bíblia","Inglês","Filosofia","Geral"].map(f=>(
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
                          <td>{isEdit?<input value={editRevRow.topic} onChange={e=>setEditRevRow(p=>({...p,topic:e.target.value}))} style={{fontSize:12,padding:"3px 7px"}}/>:<span style={{fontWeight:500,fontSize:13}}>{r.topic}</span>}</td>
                          <td>{isEdit
                            ?<select value={editRevRow.cat} onChange={e=>setEditRevRow(p=>({...p,cat:e.target.value}))} style={{fontSize:12,padding:"3px 7px"}}>
                              {["Neuro","Bíblia","Inglês","Filosofia","Geral"].map(c=><option key={c}>{c}</option>)}
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
                                :<><button className="btn btn-sm" onClick={()=>setEditRevRow({...r})}><i className="ti ti-pencil" aria-hidden/></button>
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
              return(<div style={{maxWidth:500,margin:"0 auto"}}>
                <div className="card" style={{textAlign:"center",padding:"2rem"}}>
                  <div style={{fontSize:44,marginBottom:10}}>{pct>=80?"🎉":pct>=60?"💪":"📚"}</div>
                  <h2 style={{fontSize:21,fontWeight:500,marginBottom:3}}>{quiz.score}/{quiz.questions.length}</h2>
                  <p style={{color:C.muted,marginBottom:10,fontSize:12}}>{pct}% — {quiz.topicTitle}</p>
                  <div className="pb" style={{height:7,margin:"0 0 14px"}}><div className="pf" style={{width:`${pct}%`,background:pct>=80?"#34C98A":pct>=60?"#FBBF24":"#F87171"}}/></div>
                  <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                    <button className="btn btnp" onClick={()=>setQuiz(null)}>Novo quiz</button>
                    <button className="btn" onClick={()=>{setQuiz(null);setView("review");}}>Ver revisões</button>
                  </div>
                </div>
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
          return(
            <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
              <PageHeader title="Quiz Ativo" sub="Teste seu conhecimento com IA"/>
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
                            {aTopics.map(t=>(
                              <div key={t.id} className="card" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,padding:"10px 14px",borderLeft:`3px solid ${area.color}`}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontWeight:500,fontSize:13,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                                    {t.quiz_cache&&<span className="bdg" style={{background:"#0d2218",color:"#34C98A"}}>Quiz salvo ✓</span>}
                                    <span style={{fontSize:10,color:C.muted}}>{(t.notes||"").slice(0,60)}…</span>
                                  </div>
                                </div>
                                <div style={{display:"flex",gap:6,flexShrink:0}}>
                                  {t.quiz_cache&&<button className="btn btn-sm btng" onClick={()=>genQuiz(t)}>▶ Iniciar</button>}
                                  <button className="btn btn-sm btnp" onClick={()=>genQuiz(t,true)}><i className="ti ti-wand" aria-hidden/>Gerar</button>
                                </div>
                              </div>
                            ))}
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
                {(bookData.chapters||[]).map(ch=>{
                  const isExp=editCh===ch.id;
                  const vals={...ch,...(chChanges[ch.id]||{})};
                  const isRenaming=renamingCh===ch.id;
                  return(
                    <div key={ch.id} style={{border:`0.5px solid ${C.bord}`,borderRadius:8,marginBottom:6,overflow:"hidden"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",cursor:"pointer",background:isExp?"#1c1838":C.dim}} onClick={()=>!isRenaming&&setEditCh(isExp?null:ch.id)}>
                        <i className={`ti ${isExp?"ti-chevron-up":"ti-chevron-right"}`} style={{fontSize:13,color:C.muted,flexShrink:0}} aria-hidden/>
                        {isRenaming
                          ?<input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                              onKeyDown={e=>{if(e.key==="Enter"&&renameVal.trim()){renameChapter(bookData.id,ch.id,renameVal.trim());setRenamingCh(null);}if(e.key==="Escape")setRenamingCh(null);}}
                              onBlur={()=>{if(renameVal.trim())renameChapter(bookData.id,ch.id,renameVal.trim());setRenamingCh(null);}}
                              onClick={e=>e.stopPropagation()} style={{fontSize:13,padding:"3px 7px",flex:1}}/>
                          :<span style={{fontWeight:500,fontSize:13,flex:1}}>{ch.title}</span>
                        }
                        <div style={{display:"flex",gap:4,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                          {isExp&&<button className="btn btn-sm btng" onClick={()=>{updateChapter(bookData.id,ch.id,chChanges[ch.id]||{});setEditCh(null);}}><i className="ti ti-device-floppy" aria-hidden/>Salvar</button>}
                          <button className="btn btn-sm" onClick={()=>{setRenamingCh(ch.id);setRenameVal(ch.title);setEditCh(null);}}><i className="ti ti-pencil" aria-hidden/></button>
                          <button className="btn btn-sm btnr" onClick={()=>deleteChapter(bookData.id,ch.id)}><i className="ti ti-trash" aria-hidden/></button>
                        </div>
                      </div>
                      {isExp&&(
                        <div style={{padding:"12px",display:"flex",flexDirection:"column",gap:10}}>
                          {[{k:"resumo",l:"Resumo",ph:"O que este capítulo aborda?"},{k:"perguntas",l:"Perguntas-chave",ph:"Que perguntas este capítulo responde?"},{k:"insights",l:"Insights & Aplicações",ph:"O que vai aplicar?"}].map(f=>(
                            <div key={f.k} style={{background:"#12121a",border:"0.5px solid #2a2a38",borderRadius:8,padding:12}}>
                              <div style={{fontSize:11,color:"#9D95E8",fontWeight:500,marginBottom:6}}>{f.l}</div>
                              <textarea rows={3} placeholder={f.ph} value={vals[f.k]||""} onChange={e=>setChChanges(c=>({...c,[ch.id]:{...vals,[f.k]:e.target.value}}))} style={{fontSize:13,resize:"vertical"}}/>
                            </div>
                          ))}
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
          return(
            <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
              <PageHeader title="Livros" sub="Fichamento por capítulo — SQ4R" btn={{label:"Adicionar livro",icon:"ti-plus",fn:()=>setModal("book")}}/>
              {["reading","queued","completed"].map(status=>{
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
        {view==="planner"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
            <PageHeader title="Planner Kanban" sub="Organize seus estudos por área"/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {AREAS.map(a=><button key={a.id} className={`atab${aArea===a.id?" on":""}`} style={aArea===a.id?{background:a.bg,color:a.text,borderColor:a.color}:{}} onClick={()=>setAArea(a.id)}><i className={`ti ${a.icon}`} style={{marginRight:3,fontSize:12}}/>{a.label}</button>)}
            </div>
            <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8,alignItems:"flex-start"}}>
              {pd.map(col=>(
                <div key={col.id} className="pc">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:13,fontWeight:600,color:C.text}}>{col.title}</span>
                    <button className="btn btn-sm btnr" onClick={()=>delPlannerCol(col.id)}><i className="ti ti-trash" aria-hidden/></button>
                  </div>
                  {col.cards.map(card=>(
                    <div key={card.id} className="pcard" style={{marginBottom:5}}>
                      <span style={{flex:1,lineHeight:1.5,fontSize:13}}>{card.text}</span>
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
          </div>
        )}

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
