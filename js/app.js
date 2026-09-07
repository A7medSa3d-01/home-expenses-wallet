(() => {
const KEY="home_wallet_v1";
const defaults={settings:{student1:"Student 1",student2:"Student 2",currency:"EGP",darkMode:false},expenses:{},lessons:{student1:[],student2:[]},payments:{}};
function load(){try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(defaults)}catch{return structuredClone(defaults)}}
function save(data){localStorage.setItem(KEY,JSON.stringify(data))}
function data(){return load()}
function uid(prefix="id"){return prefix+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7)}
function money(n){const d=data(); return `${new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number(n)||0)} ${d.settings.currency||"EGP"}`}
function monthKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`}
function dateKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
function monthLabel(key){const [y,m]=key.split("-").map(Number);return new Intl.DateTimeFormat("en-US",{month:"long",year:"numeric"}).format(new Date(y,m-1,1))}
function applySettings(){const d=data();document.querySelectorAll("[data-student-label]").forEach(e=>e.textContent=d.settings[e.dataset.studentLabel]);document.querySelectorAll("[data-current-student]").forEach(e=>e.textContent=d.settings[document.body.dataset.student]||"Student");document.title=document.title.replace(/Student [12]/,d.settings[document.body.dataset.student]||"Student");document.documentElement.classList.toggle("dark",!!d.settings.darkMode)}
function toast(msg){const el=document.getElementById("toast");if(!el)return;el.textContent=msg;el.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove("show"),1800)}
function initMenu(){const b=document.getElementById("menuBtn"),s=document.getElementById("sidebar");if(!b||!s)return;b.onclick=()=>s.classList.toggle("open")}
function init(){applySettings();initMenu()}
window.Wallet={KEY,defaults,load,save,data,uid,money,monthKey,dateKey,monthLabel,applySettings,toast};
document.addEventListener("DOMContentLoaded",init);
})();