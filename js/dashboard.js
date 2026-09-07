document.addEventListener("DOMContentLoaded",()=>{
let current=new Date();current.setDate(1);
const $=id=>document.getElementById(id);
const dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function houseTotal(key){const d=Wallet.data();return Object.entries(d.expenses).filter(([k])=>k.startsWith(key)).reduce((s,[,arr])=>s+arr.reduce((a,x)=>a+Number(x.amount||0),0),0)}
function lessonTotal(key){const d=Wallet.data();return ["student1","student2"].reduce((sum,st)=>sum+d.lessons[st].reduce((a,l)=>a+(d.payments[st]?.[key]?.[l.id]?Number(l.price):0),0),0)}
function render(){
const d=Wallet.data(),key=Wallet.monthKey(current),ht=houseTotal(key),lt=lessonTotal(key);
$("monthTitle").textContent=Wallet.monthLabel(key);$("houseTotal").textContent=Wallet.money(ht);$("lessonsTotal").textContent=Wallet.money(lt);$("monthlyTotal").textContent=Wallet.money(ht+lt);
$("todayPill").textContent=new Intl.DateTimeFormat("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"}).format(new Date());
let html=dayNames.map(x=>`<div class="weekday">${x}</div>`).join("");
const first=new Date(current.getFullYear(),current.getMonth(),1).getDay(),days=new Date(current.getFullYear(),current.getMonth()+1,0).getDate(),prevDays=new Date(current.getFullYear(),current.getMonth(),0).getDate();
for(let i=0;i<42;i++){const n=i-first+1;let dt;if(n<1)dt=new Date(current.getFullYear(),current.getMonth()-1,prevDays+n);else if(n>days)dt=new Date(current.getFullYear(),current.getMonth()+1,n-days);else dt=new Date(current.getFullYear(),current.getMonth(),n);
const dk=Wallet.dateKey(dt),arr=d.expenses[dk]||[],total=arr.reduce((s,x)=>s+Number(x.amount||0),0),muted=dt.getMonth()!==current.getMonth(),today=Wallet.dateKey(new Date())===dk;
html+=`<button class="day ${muted?"muted ":""}${today?"today ":""}${total?"has-expenses":""}" data-date="${dk}"><span class="day-number">${dt.getDate()}</span><div class="day-total">${Wallet.money(total)}</div></button>`;
}
$("calendar").innerHTML=html;
$("monthBreakdown").innerHTML=`<div class="break-row"><span>House expenses</span><strong>${Wallet.money(ht)}</strong></div><div class="break-row"><span>Lessons paid</span><strong>${Wallet.money(lt)}</strong></div><div class="break-row total"><span>Total</span><strong>${Wallet.money(ht+lt)}</strong></div>`;
}
function openDrawer(key){const [y,m,day]=key.split("-").map(Number);$("drawerDate").textContent=new Intl.DateTimeFormat("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}).format(new Date(y,m-1,day));$("expenseDrawer").classList.add("open");$("overlay").classList.add("show");$("expenseDrawer").dataset.date=key;resetForm();renderExpenses(key)}
function close(){ $("expenseDrawer").classList.remove("open");$("overlay").classList.remove("show")}
function resetForm(){$("expenseId").value="";$("expenseTitle").value="";$("expenseAmount").value="";$("formTitle").textContent="Add expense";$("cancelEdit").style.display="none"}
function renderExpenses(key){const d=Wallet.data(),arr=d.expenses[key]||[];$("expenseList").innerHTML=arr.length?arr.map(x=>`<div class="expense-item"><div class="expense-info"><strong>${esc(x.title)}</strong><small>${Wallet.money(x.amount)}</small></div><div class="expense-actions"><button class="mini-btn" data-edit="${x.id}">Edit</button><button class="mini-btn delete" data-delete="${x.id}">Delete</button></div></div>`).join(""):`<div class="empty">No expenses yet.<br>Add the first expense for this day.</div>`;$("dayTotal").textContent=Wallet.money(arr.reduce((s,x)=>s+Number(x.amount||0),0))}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("prevMonth").onclick=()=>{current.setMonth(current.getMonth()-1);render()};$("nextMonth").onclick=()=>{current.setMonth(current.getMonth()+1);render()};$("todayBtn").onclick=()=>{current=new Date();current.setDate(1);render()};
$("calendar").onclick=e=>{const b=e.target.closest("[data-date]");if(b)openDrawer(b.dataset.date)};
$("closeDrawer").onclick=close;$("overlay").onclick=close;
$("expenseList").onclick=e=>{const d=Wallet.data(),key=$("expenseDrawer").dataset.date;if(e.target.dataset.delete){if(!confirm("Delete this expense?"))return;d.expenses[key]=(d.expenses[key]||[]).filter(x=>x.id!==e.target.dataset.delete);if(!d.expenses[key].length)delete d.expenses[key];Wallet.save(d);renderExpenses(key);render();Wallet.toast("Expense deleted")}
if(e.target.dataset.edit){const x=(d.expenses[key]||[]).find(v=>v.id===e.target.dataset.edit);if(!x)return;$("expenseId").value=x.id;$("expenseTitle").value=x.title;$("expenseAmount").value=x.amount;$("formTitle").textContent="Edit expense";$("cancelEdit").style.display="block";$("expenseTitle").focus()}}
$("cancelEdit").onclick=resetForm;
$("expenseForm").onsubmit=e=>{e.preventDefault();const d=Wallet.data(),key=$("expenseDrawer").dataset.date,title=$("expenseTitle").value.trim(),amount=Number($("expenseAmount").value),id=$("expenseId").value;if(!title||amount<=0)return;d.expenses[key]??=[];if(id){const x=d.expenses[key].find(v=>v.id===id);if(x){x.title=title;x.amount=amount}}else d.expenses[key].push({id:Wallet.uid("expense"),title,amount});Wallet.save(d);renderExpenses(key);render();resetForm();Wallet.toast(id?"Expense updated":"Expense added")};
render();
});