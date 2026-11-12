let accts=[],cur=null;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
try{accts=JSON.parse(localStorage.getItem("ft3_accts")||"[]");const u=localStorage.getItem("ft3_me");cur=accts.find(a=>a.u===u)||null;}catch(e){}
function save(){try{localStorage.setItem("ft3_accts",JSON.stringify(accts));}catch(e){}}
async function hash(u,p){const t=u+":"+p;try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");}catch(e){return btoa(t);}}
const P=()=>cur.people;
const head=p=>p.m?P().find(x=>x.id===p.sp):p;
let pending=null;
function collect(h,s){s.add(h.id);P().filter(x=>x.m&&x.sp===h.id).forEach(x=>s.add(x.id));P().filter(x=>!x.m&&x.par===h.id).forEach(k=>collect(k,s));}
function delSet(p){
  if(p.m)return new Set([p.id]);
  const all=new Set();collect(p,all);
  if(!all.has(cur.pid))return all;
  const s=new Set([p.id]);P().filter(x=>x.m&&x.sp===p.id).forEach(x=>s.add(x.id));return s;
}
function ask(id){pending=id;render();}
function doDel(id){
  const s=delSet(P().find(x=>x.id===id));
  cur.people=P().filter(x=>!s.has(x.id));
  P().forEach(x=>{if(x.par&&s.has(x.par))delete x.par;});
  pending=null;save();render();
}
function card(p){
  const you=p.id===cur.pid;let extra="";
  if(!you){
    if(pending===p.id){const n=delSet(p).size;extra=`<div class="conf">Remove${n>1?" +"+(n-1)+" more":""}?<br><button onclick="doDel(${p.id})">Yes</button><button class="ghost" onclick="ask(null)">No</button></div>`;}
    else extra=`<button class="x" title="Remove" onclick="ask(${p.id})">×</button>`;
  }
  return `<div class="p${you?" me":""}">${esc(p.name)}${you?" (you)":""}<small>b. ${p.born||"—"}</small>${extra}</div>`;
}
function node(h){
  const sp=P().find(p=>p.m&&p.sp===h.id),kids=P().filter(p=>!p.m&&p.par===h.id);
  return `<li><div class="unit">${card(h)}${sp?card(sp):""}<button class="plus" title="Add" onclick="pick(${h.id})">+</button></div>${kids.length?"<ul>"+kids.map(node).join("")+"</ul>":""}</li>`;
}
function render(){
  $("tree").innerHTML=P().filter(p=>!p.m&&!p.par).map(node).join("");
  const me=P().find(p=>p.id===cur.pid);
  $("ttl").textContent=me.name.split(" ").slice(-1)[0]+" Family Tree";
  $("hello").textContent="Welcome, "+me.name+"! Tap + on anyone to add relatives.";
  $("of").innerHTML=P().map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");
}
function pick(id){$("of").value=id;$("add").scrollIntoView({behavior:"smooth"});$("nm").focus();}
function show(){$("login").classList.toggle("hidden",!!cur);$("app").classList.toggle("hidden",!cur);if(cur)render();}
function view(sign){$("vSign").classList.toggle("hidden",!sign);$("vLog").classList.toggle("hidden",sign);}
function login(a){cur=a;try{localStorage.setItem("ft3_me",a.u);}catch(e){}show();}
$("toLog").onclick=e=>{e.preventDefault();view(false);};
$("toSign").onclick=e=>{e.preventDefault();view(true);};
$("sGo").onclick=async()=>{
  const err=t=>{$("sErr").textContent=t;};
  const name=$("sName").value.trim(),born=Number($("sYr").value)||null,u=$("sUser").value.trim().toLowerCase(),p=$("sPw").value;
  if(!name)return err("Please enter your full name.");
  if(u.length<3)return err("Username must be at least 3 characters.");
  if(accts.some(a=>a.u===u))return err("That username is taken.");
  if(p.length<6)return err("Password must be at least 6 characters.");
  if(p!==$("sPw2").value)return err("Passwords don’t match.");
  const pid=Date.now(),a={u,h:await hash(u,p),pid,people:[{id:pid,name,born}]};
  accts.push(a);save();["sName","sYr","sUser","sPw","sPw2"].forEach(i=>$(i).value="");err("");login(a);
};
$("lGo").onclick=async()=>{
  const u=$("lUser").value.trim().toLowerCase(),a=accts.find(x=>x.u===u);
  if(!a||a.h!==await hash(u,$("lPw").value)){$("lErr").textContent="Wrong username or password.";return;}
  $("lErr").textContent="";$("lPw").value="";login(a);
};
$("lPw").onkeydown=e=>{if(e.key==="Enter")$("lGo").click();};
$("out").onclick=()=>{cur=null;try{localStorage.removeItem("ft3_me");}catch(e){}view(false);show();};
$("save").onclick=()=>{
  const err=t=>{$("err2").textContent=t;};
  const name=$("nm").value.trim(),t=P().find(x=>x.id===Number($("of").value)),rel=$("rel").value,born=Number($("yr").value)||null;
  if(!name)return err("Please enter a name.");
  const h=head(t),id=Date.now();
  if(rel==="spouse"){
    if(P().some(p=>p.m&&p.sp===h.id))return err(h.name+" already has a spouse listed.");
    P().push({id,name,born,sp:h.id,m:1});
  }else if(rel==="parent"){
    if(h.par)return err(h.name+" already has parents listed. Add a spouse to them instead.");
    P().push({id,name,born});h.par=id;
  }else if(rel==="sibling"){
    if(!h.par)return err("Add a parent of "+h.name+" first, then add siblings.");
    P().push({id,name,born,par:h.par});
  }else P().push({id,name,born,par:h.id});
  err("");$("nm").value="";$("yr").value="";save();render();
};
view(true);show();