/** Tiny static-page preference controller; it never creates a visitor identifier. */
export function consentScript(errorMessage: string): string {
  return `(function(){try{
var b=document.getElementById("analytics-consent"),s=document.getElementById("analytics-consent-status"),busy=false;
var key="backdesk:analytics-rejected",error=${JSON.stringify(errorMessage)};
function rejected(){try{return localStorage.getItem(key)==="1"}catch(e){return false}}
function remember(value){try{if(value)localStorage.setItem(key,"1");else localStorage.removeItem(key)}catch(e){}}
function show(value){b.hidden=!value;if(value)s.textContent=""}
fetch("/api/analytics-consent",{credentials:"same-origin",cache:"no-store"})
.then(function(r){return r.json()}).then(function(v){show(!v.accepted&&!rejected())})
.catch(function(){show(!rejected())});
document.addEventListener("click",function(e){
var t=e.target;if(!t||!t.closest)return;
if(t.closest("[data-analytics-preferences]")){show(true);return}
var button=t.closest("[data-analytics-choice]");if(!button||busy)return;
var action=button.getAttribute("data-analytics-choice");if(action!=="accept"&&action!=="reject")return;
busy=true;s.textContent="";
fetch("/api/analytics-consent",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({action:action})})
.then(function(r){if(!r.ok)throw Error("choice failed");return r.json()})
.then(function(v){if(v.accepted!== (action==="accept"))throw Error("choice failed");remember(action==="reject");show(false)})
.catch(function(){s.textContent=error}).finally(function(){busy=false});
});
window.addEventListener("storage",function(e){if(e.key===key){fetch("/api/analytics-consent",{credentials:"same-origin",cache:"no-store"}).then(function(r){return r.json()}).then(function(v){show(!v.accepted&&!rejected())}).catch(function(){show(!rejected())})}});
}catch(e){}})();`;
}
