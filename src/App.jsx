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
  const [weekStudy,setWeekStudy]=useState(()=>LS.get("weekStudy",{neuro:0,biblia:0,ingles:0,livros:0,geral:0}));
  const [weeklySchedule,setWeeklySchedule]=useState(()=>LS.get("weeklySchedule",{}));
  const [plannerTab,setPlannerTab]=useState("weekly");
  const [wInputs,setWInputs]=useState({});
  const [topicTab,setTopicTab]=useState({});
  const [topicAI,setTopicAI]=useState({});
  const [booksView,setBooksView]=useState("acervo");
  const [readingPlan,setReadingPlan]=useState(()=>LS.get("readingPlan",{columns:["Neurociências","Ficção","Espiritual"],rows:{}}));
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
  const settingsTimer=useRef(null);

  useEffect(()=>{if(loaded)LS.set("topics",topics);},[topics,loaded]);
  useEffect(()=>{
    if(!loaded)return;
    LS.set("folders",folders);
    saveSettings(folders,weekStudy,weeklySchedule);
  },[folders,loaded]);
  useEffect(()=>{if(loaded)LS.set("revRows",revRows);},[revRows,loaded]);
  useEffect(()=>{if(loaded)LS.set("books",books);},[books,loaded]);
  useEffect(()=>{if(loaded)LS.set("goals",goals);},[goals,loaded]);
  useEffect(()=>{if(loaded)LS.set("knowledge",knowledge);},[knowledge,loaded]);
  useEffect(()=>{if(loaded)LS.set("planner",planner);},[planner,loaded]);
  useEffect(()=>{
    if(!loaded)return;
    LS.set("weeklySchedule",weeklySchedule);
    saveSettings(folders,weekStudy,weeklySchedule);
  },[weeklySchedule,loaded]);
  useEffect(()=>{
    if(!loaded)return;
    LS.set("weekStudy",weekStudy);
    saveSettings(folders,weekStudy,weeklySchedule);
  },[weekStudy,loaded]);
  useEffect(()=>{LS.set("view",view);},[view]);
  useEffect(()=>{LS.set("collapsedAreas",[...collapsedAreas]);},[collapsedAreas]);
  useEffect(()=>{LS.set("collapsedFolders",[...collapsedFolders]);},[collapsedFolders]);

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
        const [t,r,b,g,sl,k,st,pl]=await Promise.all([
          sb.from('topics').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false}),
          sb.from('rev_rows').select('*').eq('user_id',session.user.id).order('base_date',{ascending:false}),
          sb.from('books').select('*').eq('user_id',session.user.id).order('updated_at',{ascending:false}),
          sb.from('goals').select('*').eq('user_id',session.user.id),
          sb.from('study_logs').select('*').order('log_date',{ascending:false}).limit(90),
          sb.from('knowledge').select('*').eq('user_id',session.user.id).order('updated_at',{ascending:false}),
          sb.from('user_settings').select('*').eq('user_id',session.user.id).single(),
          sb.from('planner').select('*').eq('user_id',session.user.id),
        ]);
        const mi=(l,r)=>{const m=new Map();l.forEach(x=>m.set(String(x.id),x));r.forEach(x=>{const ex=m.get(String(x.id));if(!ex||(x.updated_at&&(!ex.updated_at||x.updated_at>ex.updated_at)))m.set(String(x.id),x);});return[...m.values()];};
        if(t.data?.length>0){setTopics(p=>{const m=mi(p,t.data);LS.set("topics",m);return m;});}
        if(r.data?.length>0){setRevRows(p=>{const m=mi(p,r.data);LS.set("revRows",m);return m;});}
        if(b.data?.length>0){setBooks(b.data);LS.set("books",b.data);}
        if(g.data?.length>0){setGoals(g.data);LS.set("goals",g.data);}
        if(k.data?.length>0){setKnowledge(k.data);LS.set("knowledge",k.data);}
        if(st.data){
          if(st.data.folders){setFolders(st.data.folders);LS.set("folders",st.data.folders);}
          if(st.data.week_study){setWeekStudy(st.data.week_study);LS.set("weekStudy",st.data.week_study);}
          if(st.data.weekly_schedule){setWeeklySchedule(st.data.weekly_schedule);LS.set("weeklySchedule",st.data.weekly_schedule);}
          if(st.data.reading_plan){setReadingPlan(st.data.reading_plan);LS.set("readingPlan",st.data.reading_plan);}
        }
        if(pl.data?.length>0){
          const pm={};pl.data.forEach(p=>{pm[p.area]=p.cols;});
          setPlanner(pm);LS.set("planner",pm);
        }
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
    const topic={id,area:nt.area,folder_id:nt.folder_id||null,title:nt.title,notes:nt.notes,tags,created_at:Date.now(),next_review:Date.now(),interval_days:0,repetitions:0,quiz_cache:null,user_id:session?.user?.id||null};
    setTopics(p=>[topic,...p]);setModal(null);setNt({title:"",notes:"",tags:"",area:"neuro",folder_id:""});
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

  const saveSettings=useCallback(async(newFolders,newWeekStudy,newWeeklySchedule)=>{
    if(!session?.user?.id)return;
    clearTimeout(settingsTimer.current);
    settingsTimer.current=setTimeout(async()=>{
      try{await sb.from('user_settings').upsert({
        user_id:session.user.id,
        folders:newFolders,
        week_study:newWeekStudy,
        weekly_schedule:newWeeklySchedule,
        reading_plan:readingPlan,
        updated_at:new Date().toISOString()
      },{onConflict:'user_id'});}catch{}
    },1500);
  },[session]);

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
    const catLabel=AREAS.find(a=>a.id===topic.area)?.label||"Geral";
    const row={id,topic:topic.title,cat:catLabel,base_date:t0,checks:[0,0,0,0,0,0,0,0],revs:calcRevDates(t0),user_id:session?.user?.id||null};
    setRevRows(p=>[...p.filter(r=>r.id!==id),row]);
    try{await sb.from('rev_rows').upsert({...row,updated_at:new Date().toISOString()});}catch{}
  },[t0,revRows]);

  const updateBook=useCallback(async(id,changes)=>{setBooks(p=>p.map(b=>b.id===id?{...b,...changes}:b));try{await sb.from('books').update({...changes,updated_at:new Date().toISOString()}).eq('id',id);}catch{}},[]);
  const addBook=useCallback(async()=>{const id=Date.now();const book={id,title:nb.title,author:nb.author,area:nb.area,status:nb.status,progress:0,notes:nb.notes,chapters:[],user_id:session?.user?.id||null};setBooks(p=>[...p,book]);setModal(null);setNb({title:"",author:"",area:"livros",status:"queued",notes:""});try{await sb.from('books').upsert({...book,updated_at:new Date().toISOString()});}catch{}},[nb]);
  const deleteBook=useCallback(async(id)=>{if(!confirm("Excluir livro?"))return;setBooks(p=>p.filter(b=>b.id!==id));try{await sb.from('books').delete().eq('id',id);}catch{}},[]);
  const addChapter=useCallback(async(bId,title)=>{const book=books.find(b=>b.id===bId);if(!book)return;const ch=[...(book.chapters||[]),{id:Date.now(),title,resumo:"",perguntas:"",insights:"",created_at:Date.now()}];setBooks(p=>p.map(b=>b.id===bId?{...b,chapters:ch}:b));try{await sb.from('books').update({chapters:ch,updated_at:new Date().toISOString()}).eq('id',bId);}catch{}},[books]);
  const updateChapter=useCallback(async(bId,chId,changes)=>{const book=books.find(b=>b.id===bId);if(!book)return;const ch=(book.chapters||[]).map(c=>c.id===chId?{...c,...changes}:c);setBooks(p=>p.map(b=>b.id===bId?{...b,chapters:ch}:b));try{await sb.from('books').update({chapters:ch,updated_at:new Date().toISOString()}).eq('id',bId);}catch{}},[books]);
  const deleteChapter=useCallback(async(bId,chId)=>{if(!confirm("Excluir capítulo?"))return;const book=books.find(b=>b.id===bId);if(!book)return;const ch=(book.chapters||[]).filter(c=>c.id!==chId);setBooks(p=>p.map(b=>b.id===bId?{...b,chapters:ch}:b));try{await sb.from('books').update({chapters:ch,updated_at:new Date().toISOString()}).eq('id',bId);}catch{}},[books]);
  const renameChapter=useCallback(async(bId,chId,newTitle)=>{const book=books.find(b=>b.id===bId);if(!book)return;const ch=(book.chapters||[]).map(c=>c.id===chId?{...c,title:newTitle}:c);setBooks(p=>p.map(b=>b.id===bId?{...b,chapters:ch}:b));try{await sb.from('books').update({chapters:ch,updated_at:new Date().toISOString()}).eq('id',bId);}catch{}},[books]);
  const addChapterToReview=useCallback(async(book,ch)=>{
    const id="ch_"+ch.id;if(revRows.find(r=>r.id===id)){alert("Capítulo já está na revisão.");return;}
    const catLabel=AREAS.find(a=>a.id===book.area)?.label||"Geral";
    const row={id,topic:book.title+" — "+ch.title,cat:catLabel,base_date:t0,checks:[0,0,0,0,0,0,0,0],revs:calcRevDates(t0),user_id:session?.user?.id||null};
    setRevRows(p=>[...p.filter(r=>r.id!==id),row]);
    try{await sb.from('rev_rows').upsert({...row,updated_at:new Date().toISOString()});}catch{}
  },[t0,revRows,session]);

  const addBookToReview=useCallback(async(book)=>{const id="book_"+book.id;if(revRows.find(r=>r.id===id)){alert("Livro já está na revisão.");return;}const row={id,topic:book.title+" (Livro)",cat:AREAS.find(a=>a.id===book.area)?.label||"Geral",base_date:t0,checks:[0,0,0,0,0,0,0,0],revs:calcRevDates(t0),user_id:session?.user?.id||null};setRevRows(p=>[...p.filter(r=>r.id!==id),row]);try{await sb.from('rev_rows').upsert({...row,updated_at:new Date().toISOString()});}catch{}},[t0,revRows]);

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

  const genQuiz=useCallback(async(item,force=false)=>{
    // sempre gera novo quiz — não usa cache para garantir respostas embaralhadas
    setQLoad(true);setQErr(null);
    try{
      const notes=item.notes||item.content||"";
      const resp=await fetch("/api/quiz",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({notes,title:item.title})});
      const d=await resp.json();
      if(!resp.ok)throw new Error(d.error||"Erro ao gerar quiz");
      const questions=d.questions||[];
      if(!questions.length)throw new Error("Sem perguntas geradas");
      // não salva cache — cada quiz é gerado fresco com respostas embaralhadas
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
            <span style={{fontWeight:500,fontSize:13,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:exp?"normal":"nowrap"}}>{t.title}</span>
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
          <div style={{borderTop:`0.5px solid ${C.bord}`}}>
            <div style={{padding:"10px 14px 0"}}>
              <input className="title-inline"
                key={"ti"+t.id+(t.updated_at||0)}
                defaultValue={t.title}
                onBlur={e=>{if(e.target.value!==t.title)saveTopicEdits(t.id,{title:e.target.value});}}/>
            </div>
            <div style={{display:"flex",gap:5,padding:"8px 14px",borderBottom:`0.5px solid ${C.bord}`,flexWrap:"wrap"}}>
              {[{id:"notes",icon:"ti-notes",l:"Notas"},{id:"fichamento",icon:"ti-file-analytics",l:"Fichamento"},{id:"ia",icon:"ti-brain",l:"Visão IA"}].map(tab=>{
                const active=(topicTab[t.id]||"notes")===tab.id;
                const clr=tab.id==="ia"?"#34C98A":"#9D95E8";
                return(<button key={tab.id} onClick={()=>setTopicTab(p=>({...p,[t.id]:tab.id}))}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:7,border:`0.5px solid ${active?(tab.id==="ia"?"#1D6B50":"#3d3780"):C.bord}`,background:active?(tab.id==="ia"?"#0d2218":"#1c1838"):"transparent",color:active?clr:C.muted,fontSize:12,cursor:"pointer",fontWeight:active?600:400}}>
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
                  <span>Próx: {isDue?"hoje":t.next_review?fd(t.next_review):"—"}</span>
                  <button style={{marginLeft:"auto",background:"none",border:"none",color:"#9D95E8",cursor:"pointer",fontSize:11}} onClick={e=>{e.stopPropagation();genQuiz(t,true);}}>↺ Refazer quiz</button>
                </div>
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
                  <span>Próx: {isDue?"hoje":t.next_review?fd(t.next_review):"—"}</span>
                  <button style={{marginLeft:"auto",background:"none",border:"none",color:"#9D95E8",cursor:"pointer",fontSize:11}} onClick={e=>{e.stopPropagation();genQuiz(t,true);}}>↺ Refazer quiz</button>
                </div>
              </div>
            )}
            {/* ── ABA VISÃO IA ── */}
            {topicTab[t.id]==="ia"&&(()=>{
              const ai=topicAI[t.id]||{};
              const renderMapa=(mapa)=>{
                if(!mapa?.ramos?.length)return null;
                const W=680,H=460,cx=W/2,cy=H/2;
                const ramos=mapa.ramos||[];const N=ramos.length;
                const lines=[];
                ramos.forEach((r,i)=>{
                  const ang=(2*Math.PI/N*i)-Math.PI/2;
                  const bx=cx+140*Math.cos(ang),by=cy+130*Math.sin(ang);
                  lines.push(`<line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" stroke="${r.cor||"#9D95E8"}" stroke-width="2.5" opacity="0.6"/>`);
                  const tw=Math.min(120,Math.max(70,r.label.length*8));
                  lines.push(`<rect x="${bx-tw/2}" y="${by-14}" width="${tw}" height="28" rx="7" fill="${r.cor||"#9D95E8"}22" stroke="${r.cor||"#9D95E8"}" stroke-width="1.5"/>`);
                  lines.push(`<text x="${bx}" y="${by+5}" text-anchor="middle" fill="${r.cor||"#9D95E8"}" font-size="11" font-weight="700" font-family="system-ui,sans-serif">${(r.label||"").substring(0,18)}</text>`);
                  (r.filhos||[]).forEach((f,j)=>{
                    const ns=r.filhos.length;const subAng=ang+(j-(ns-1)/2)*0.45;
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
                  {!ai.resumo&&!ai.loading&&(
                    <div style={{textAlign:"center",padding:"2rem 1rem"}}>
                      <div style={{fontSize:36,marginBottom:10}}>🧠</div>
                      <p style={{fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.6}}>Gere um resumo inteligente e mapa mental visual a partir das suas notas.</p>
                      <button className="btn btng" onClick={()=>genAIMindMap(t)} style={{fontSize:13,padding:"9px 20px"}}>
                        <i className="ti ti-wand"/>Gerar Resumo + Mapa Mental
                      </button>
                    </div>
                  )}
                  {ai.loading&&(
                    <div style={{textAlign:"center",padding:"2rem",color:"#34C98A"}}>
                      <i className="ti ti-loader-2" style={{fontSize:28,display:"block",marginBottom:8,animation:"spin 1s linear infinite"}}/>
                      <span style={{fontSize:13}}>Analisando e gerando mapa mental...</span>
                    </div>
                  )}
                  {ai.error&&(
                    <div style={{background:"#2d1010",border:"0.5px solid #7f2020",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#fca5a5"}}>
                      ⚠️ {ai.error}
                    </div>
                  )}
                  {ai.resumo&&(
                    <div style={{background:"#17171f",border:"0.5px solid #2a2a38",borderLeft:"3px solid #34C98A",borderRadius:"0 8px 8px 0",padding:"12px 14px"}}>
                      <div style={{fontSize:11,color:"#34C98A",fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em",display:"flex",alignItems:"center",gap:5}}>
                        <i className="ti ti-sparkles"/>Resumo Gerado pela IA
                      </div>
                      <p style={{fontSize:13,color:C.text,lineHeight:1.8,margin:0}}>{ai.resumo}</p>
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
                  {ai.resumo&&(
                    <button className="btn btn-sm" style={{alignSelf:"flex-end",color:C.muted}} onClick={()=>genAIMindMap(t)}>
                      <i className="ti ti-refresh"/>Regenerar
                    </button>
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
            {n.id==="org"&&due>0&&<span className="bdg" style={{background:"#2d2010",color:"#fde68a",marginLeft:"auto"}}>{due}</span>}
          </button>
        ))}
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
                                onBlur={e=>setChChanges(c=>({...c,[ch.id]:{...vals,[f.k]:e.target.value}}))}
                                style={{fontSize:13,resize:"vertical",lineHeight:1.8,background:"transparent",border:"none",padding:0,color:C.text,width:"100%",outline:"none",fontFamily:"inherit"}}/>
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
          const MONTHS_PT=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
          const curYear=new Date().getFullYear();
          const allMonthKeys=MONTHS_PT.map((m,i)=>`${curYear}-${m}`);
          const updatePlanCell=(rowKey,col,val)=>{
            const nr={...readingPlan,rows:{...readingPlan.rows,[rowKey]:{...(readingPlan.rows[rowKey]||{}),[col]:val}}};
            setReadingPlan(nr);
            saveSettings(folders,weekStudy,weeklySchedule);
          };
          const addPlanCol=()=>{const name=prompt("Nome da categoria:");if(name?.trim()&&!readingPlan.columns.includes(name.trim()))setReadingPlan(p=>({...p,columns:[...p.columns,name.trim()]}));};
          const removePlanCol=(col)=>{if(confirm(`Remover coluna "${col}"?`))setReadingPlan(p=>({...p,columns:p.columns.filter(c=>c!==col)}));};
          const CAT_COLORS=["#9D95E8","#60A5FA","#FBBF24","#34C98A","#F87171","#FB923C","#A78BFA"];
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
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                    <p style={{fontSize:13,color:C.muted}}>Planejamento mensal de leitura — edite cada célula livremente.</p>
                    <button className="btn btn-sm btnp" onClick={addPlanCol}><i className="ti ti-plus"/>Nova categoria</button>
                  </div>
                  <div style={{overflowX:"auto",borderRadius:12,border:`0.5px solid ${C.bord}`}}>
                    <table style={{minWidth:Math.max(600,(readingPlan.columns||[]).length*160+100)}}>
                      <thead>
                        <tr>
                          <th style={{width:58,background:"#12121a",color:C.muted,textAlign:"center",padding:"10px 8px",fontWeight:600,fontSize:12,borderRight:`0.5px solid ${C.bord}`}}>Mês</th>
                          {(readingPlan.columns||[]).map((col,ci)=>(
                            <th key={col} style={{background:"#12121a",padding:"10px 12px",textAlign:"left",whiteSpace:"nowrap"}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"space-between"}}>
                                <span style={{color:CAT_COLORS[ci%CAT_COLORS.length],fontWeight:600,fontSize:13}}>{col}</span>
                                <button onClick={()=>removePlanCol(col)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,lineHeight:1,padding:"0 2px"}}>×</button>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allMonthKeys.map((mKey,mi)=>{
                          const rowData=readingPlan.rows[mKey]||{};
                          const isCurrentMonth=new Date().getMonth()===mi;
                          return(
                            <tr key={mKey} style={{background:isCurrentMonth?"#1a1830":"transparent"}}>
                              <td style={{textAlign:"center",fontWeight:700,fontSize:13,color:isCurrentMonth?"#9D95E8":C.muted,padding:"6px 8px",borderRight:`0.5px solid ${C.bord}`,background:isCurrentMonth?"#1c1838":"#12121a",verticalAlign:"middle"}}>
                                {MONTHS_PT[mi]}
                              </td>
                              {(readingPlan.columns||[]).map((col,ci)=>(
                                <td key={col} style={{padding:4,verticalAlign:"top",borderLeft:mi===0?`0.5px solid ${C.bord}`:"none"}}>
                                  <textarea
                                    key={`rp-${mKey}-${col}`}
                                    defaultValue={rowData[col]||""}
                                    onBlur={e=>{if(e.target.value!==(rowData[col]||""))updatePlanCell(mKey,col,e.target.value);}}
                                    placeholder="—"
                                    rows={3}
                                    style={{
                                      width:"100%",minWidth:140,fontSize:12,lineHeight:1.6,
                                      background:rowData[col]?"#17171f":"transparent",
                                      border:`0.5px solid ${rowData[col]?CAT_COLORS[ci%CAT_COLORS.length]+"44":"transparent"}`,
                                      borderRadius:6,padding:"6px 8px",color:C.text,resize:"none",
                                      fontFamily:"inherit",outline:"none",transition:"border 0.15s",
                                      borderLeft:rowData[col]?`2px solid ${CAT_COLORS[ci%CAT_COLORS.length]}`:undefined
                                    }}
                                    onFocus={e=>{e.target.style.border=`0.5px solid ${CAT_COLORS[ci%CAT_COLORS.length]}`;}}
                                    onBlurCapture={e=>{if(!e.target.value)e.target.style.border="0.5px solid transparent";}}
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
              }
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
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <span style={{fontSize:13,color:C.muted}}>Semana atual — organize o que vai estudar e marque o que concluiu</span>
                    <button className="btn btn-sm btnr" onClick={clearWeek}><i className="ti ti-trash" aria-hidden/>Limpar semana</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(120px,1fr))",gap:8,overflowX:"auto"}}>
                    {WEEK_DAYS.map((day,idx)=>{
                      const key=WEEK_KEYS[idx];
                      const items=weeklySchedule[key]||[];
                      const isToday=idx===activeDayIdx;
                      const done=items.filter(i=>i.done).length;
                      return(
                        <div key={key} style={{background:isToday?"#1c1838":C.surf,border:`0.5px solid ${isToday?"#3d3780":C.bord}`,borderRadius:10,padding:"10px 8px",minWidth:120}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                            <span style={{fontSize:12,fontWeight:700,color:isToday?"#9D95E8":C.text}}>{day}</span>
                            {items.length>0&&<span style={{fontSize:10,color:done===items.length?"#34C98A":C.muted}}>{done}/{items.length}</span>}
                          </div>
                          {items.map(item=>(
                            <div key={item.id} style={{display:"flex",alignItems:"flex-start",gap:5,marginBottom:5,opacity:item.done?0.5:1}}>
                              <input type="checkbox" checked={item.done} onChange={()=>toggleWeekItem(key,item.id)} style={{marginTop:2,accentColor:"#9D95E8",flexShrink:0}}/>
                              <span style={{fontSize:12,flex:1,minWidth:0,lineHeight:1.5,textDecoration:item.done?"line-through":"none",color:item.done?C.muted:C.text,wordBreak:"break-word",overflowWrap:"break-word"}}>{item.text}</span>
                              <button onClick={()=>delWeekItem(key,item.id)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,flexShrink:0,lineHeight:1}}>×</button>
                            </div>
                          ))}
                          <div style={{marginTop:4}}>
                            <input placeholder="+ adicionar..." value={wInputs[key]||""}
                              onChange={e=>setWInputs(w=>({...w,[key]:e.target.value}))}
                              onKeyDown={e=>{if(e.key==="Enter"&&(wInputs[key]||"").trim()){addWeekItem(key,wInputs[key]);setWInputs(w=>({...w,[key]:""}));}}}
                              style={{fontSize:11,padding:"4px 6px",width:"100%",background:"transparent",border:"0.5px solid #2a2a38",borderRadius:5,color:C.text}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
