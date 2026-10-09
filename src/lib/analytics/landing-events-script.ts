import { ANALYTICS_PATH, UTM_PATTERN } from "./events";

/**
 * The landing page's two events as one small inline script, so the page
 * ships no React island for them: `landing_view` once per page load and
 * `landing_cta_click` when the button is tapped. Same body, same route and
 * same rules as `track()` (track.ts): fixed values only, utm_* reduced to
 * a bucket exactly like `utmValue()`, `locale` and `display_mode` added,
 * never an identifier; sendBeacon first, then a keepalive fetch.
 *
 * The page renders it only when NEXT_PUBLIC_POSTHOG_KEY is set at build.
 * It sends nothing while the page is leaving for the app (redirect-script.ts),
 * and no second `landing_view` when the visitor arrives from the other
 * language's landing (a language switch is not a new visit).
 */
export function landingEventsScript(): string {
  return (
    `(function(){try{var d=document,h=d.documentElement;if(h.hasAttribute("data-leaving"))return;` +
    `var P=${JSON.stringify(ANALYTICS_PATH)},U=new RegExp(${JSON.stringify(UTM_PATTERN.source)});` +
    `function send(ev,props){try{var s=(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;` +
    `var p={};for(var k in props)p[k]=props[k];p.locale=h.lang==="en"?"en":"ar";p.display_mode=s?"standalone":"browser";` +
    `var b=JSON.stringify({event:ev,properties:p});` +
    `if(typeof navigator.sendBeacon==="function"&&navigator.sendBeacon(P,new Blob([b],{type:"text/plain;charset=UTF-8"})))return;` +
    `fetch(P,{method:"POST",body:b,headers:{"content-type":"text/plain;charset=UTF-8"},keepalive:true,credentials:"same-origin"}).catch(function(){})}catch(e){}}` +
    `var q=new URLSearchParams(location.search),v={},n=["utm_source","utm_medium","utm_campaign"];` +
    `for(var i=0;i<n.length;i++){var x=q.get(n[i]);if(x){x=x.trim().toLowerCase();v[n[i]]=U.test(x)?x:"other"}}` +
    `var sw=false;try{var r=new URL(d.referrer);sw=r.origin===location.origin&&/^\\/(en\\/?)?$/.test(r.pathname)&&r.pathname.replace(/\\/$/,"")!==location.pathname.replace(/\\/$/,"")}catch(e){}` +
    `if(!sw)send("landing_view",v);` +
    `d.addEventListener("click",function(e){var t=e.target;if(t&&t.closest&&t.closest("[data-cta]"))send("landing_cta_click",{})},true)}catch(e){}})();`
  );
}
