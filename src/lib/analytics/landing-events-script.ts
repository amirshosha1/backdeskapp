import { ANALYTICS_PATH, UTM_KEYS, UTM_PATTERN } from "./events";

/**
 * The landing page's two events as one small inline script, so the page
 * ships no React island for them: `landing_view` once per page load and
 * `landing_cta_click` when the button is tapped. Same body, same route and
 * same rules as `track()` (track.ts): fixed values only, utm_* reduced to
 * a bucket exactly like `utmValue()`, `locale` and `display_mode` added,
 * never an identifier; sendBeacon first, then a keepalive fetch. It also
 * appends the visit's utm_* labels to the button's link, so they cross the
 * page load into the app (flow-events.ts, campaign-tags.ts) without any
 * cookie or storage.
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
    `var q=new URLSearchParams(location.search),v={},n=${JSON.stringify(UTM_KEYS)},ps=[];` +
    `for(var i=0;i<n.length;i++){var x=q.get(n[i]);if(x){x=x.trim().toLowerCase();v[n[i]]=U.test(x)?x:"other";ps.push(n[i]+"="+v[n[i]])}}` +
    // The button's link carries the labels into the app (a full page load): they stay in the URL, never in storage.
    `if(ps.length){var as=d.querySelectorAll("[data-cta]");for(var j=0;j<as.length;j++){var hr=as[j].getAttribute("href");if(hr)as[j].setAttribute("href",hr+(hr.indexOf("?")<0?"?":"&")+ps.join("&"))}}` +
    `var sw=false;try{var r=new URL(d.referrer);sw=r.origin===location.origin&&/^\\/(en\\/?)?$/.test(r.pathname)&&r.pathname.replace(/\\/$/,"")!==location.pathname.replace(/\\/$/,"")}catch(e){}` +
    `if(!sw)send("landing_view",v);` +
    `d.addEventListener("click",function(e){var t=e.target;if(t&&t.closest&&t.closest("[data-cta]"))send("landing_cta_click",{})},true)}catch(e){}})();`
  );
}
