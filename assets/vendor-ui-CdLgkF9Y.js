import{r as d}from"./vendor-react-BpoVWcsa.js";import"./vendor-utils-CBET_gLG.js";let q={data:""},Q=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||q},V=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,W=/\/\*[^]*?\*\/|  +/g,P=/\n+/g,x=(e,t)=>{let r="",s="",i="";for(let o in e){let a=e[o];o[0]=="@"?o[1]=="i"?r=o+" "+a+";":s+=o[1]=="f"?x(a,o):o+"{"+x(a,o[1]=="k"?"":t)+"}":typeof a=="object"?s+=x(a,t?t.replace(/([^,])+/g,n=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,l=>/&/.test(l)?l.replace(/&/g,n):n?n+" "+l:l)):o):a!=null&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),i+=x.p?x.p(o,a):o+":"+a+";")}return r+(t&&i?t+"{"+i+"}":i)+s},b={},L=e=>{if(typeof e=="object"){let t="";for(let r in e)t+=r+L(e[r]);return t}return e},G=(e,t,r,s,i)=>{let o=L(e),a=b[o]||(b[o]=(l=>{let u=0,p=11;for(;u<l.length;)p=101*p+l.charCodeAt(u++)>>>0;return"go"+p})(o));if(!b[a]){let l=o!==e?e:(u=>{let p,c,m=[{}];for(;p=V.exec(u.replace(W,""));)p[4]?m.shift():p[3]?(c=p[3].replace(P," ").trim(),m.unshift(m[0][c]=m[0][c]||{})):m[0][p[1]]=p[2].replace(P," ").trim();return m[0]})(e);b[a]=x(i?{["@keyframes "+a]:l}:l,r?"":"."+a)}let n=r&&b.g?b.g:null;return r&&(b.g=b[a]),((l,u,p,c)=>{c?u.data=u.data.replace(c,l):u.data.indexOf(l)===-1&&(u.data=p?l+u.data:u.data+l)})(b[a],t,s,n),a},J=(e,t,r)=>e.reduce((s,i,o)=>{let a=t[o];if(a&&a.call){let n=a(r),l=n&&n.props&&n.props.className||/^go/.test(n)&&n;a=l?"."+l:n&&typeof n=="object"?n.props?"":x(n,""):n===!1?"":n}return s+i+(a??"")},"");function $(e){let t=this||{},r=e.call?e(t.p):e;return G(r.unshift?r.raw?J(r,[].slice.call(arguments,1),t.p):r.reduce((s,i)=>Object.assign(s,i&&i.call?i(t.p):i),{}):r,Q(t.target),t.g,t.o,t.k)}let M,I,B;$.bind({g:1});let v=$.bind({k:1});function X(e,t,r,s){x.p=t,M=e,I=r,B=s}function w(e,t){let r=this||{};return function(){let s=arguments;function i(o,a){let n=Object.assign({},o),l=n.className||i.className;r.p=Object.assign({theme:I&&I()},n),r.o=/ *go\d+/.test(l),n.className=$.apply(r,s)+(l?" "+l:"");let u=e;return e[0]&&(u=n.as||e,delete n.as),B&&u[0]&&B(n),M(u,n)}return i}}var _=e=>typeof e=="function",O=(e,t)=>_(e)?e(t):e,ee=(()=>{let e=0;return()=>(++e).toString()})(),H=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),te=20,S="default",R=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(a=>a.id===t.toast.id?{...a,...t.toast}:a)};case 2:let{toast:s}=t;return R(e,{type:e.toasts.find(a=>a.id===s.id)?1:0,toast:s});case 3:let{toastId:i}=t;return{...e,toasts:e.toasts.map(a=>a.id===i||i===void 0?{...a,dismissed:!0,visible:!1}:a)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(a=>a.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(a=>({...a,pauseDuration:a.pauseDuration+o}))}}},D=[],K={toasts:[],pausedAt:void 0,settings:{toastLimit:te}},y={},U=(e,t=S)=>{y[t]=R(y[t]||K,e),D.forEach(([r,s])=>{r===t&&s(y[t])})},Y=e=>Object.keys(y).forEach(t=>U(e,t)),re=e=>Object.keys(y).find(t=>y[t].toasts.some(r=>r.id===e)),j=(e=S)=>t=>{U(t,e)},ae={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},se=(e={},t=S)=>{let[r,s]=d.useState(y[t]||K),i=d.useRef(y[t]);d.useEffect(()=>(i.current!==y[t]&&s(y[t]),D.push([t,s]),()=>{let a=D.findIndex(([n])=>n===t);a>-1&&D.splice(a,1)}),[t]);let o=r.toasts.map(a=>{var n,l,u;return{...e,...e[a.type],...a,removeDelay:a.removeDelay||((n=e[a.type])==null?void 0:n.removeDelay)||(e==null?void 0:e.removeDelay),duration:a.duration||((l=e[a.type])==null?void 0:l.duration)||(e==null?void 0:e.duration)||ae[a.type],style:{...e.style,...(u=e[a.type])==null?void 0:u.style,...a.style}}});return{...r,toasts:o}},oe=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(r==null?void 0:r.id)||ee()}),E=e=>(t,r)=>{let s=oe(t,e,r);return j(s.toasterId||re(s.id))({type:2,toast:s}),s.id},f=(e,t)=>E("blank")(e,t);f.error=E("error");f.success=E("success");f.loading=E("loading");f.custom=E("custom");f.dismiss=(e,t)=>{let r={type:3,toastId:e};t?j(t)(r):Y(r)};f.dismissAll=e=>f.dismiss(void 0,e);f.remove=(e,t)=>{let r={type:4,toastId:e};t?j(t)(r):Y(r)};f.removeAll=e=>f.remove(void 0,e);f.promise=(e,t,r)=>{let s=f.loading(t.loading,{...r,...r==null?void 0:r.loading});return typeof e=="function"&&(e=e()),e.then(i=>{let o=t.success?O(t.success,i):void 0;return o?f.success(o,{id:s,...r,...r==null?void 0:r.success}):f.dismiss(s),i}).catch(i=>{let o=t.error?O(t.error,i):void 0;o?f.error(o,{id:s,...r,...r==null?void 0:r.error}):f.dismiss(s)}),e};var ie=1e3,ne=(e,t="default")=>{let{toasts:r,pausedAt:s}=se(e,t),i=d.useRef(new Map).current,o=d.useCallback((c,m=ie)=>{if(i.has(c))return;let g=setTimeout(()=>{i.delete(c),a({type:4,toastId:c})},m);i.set(c,g)},[]);d.useEffect(()=>{if(s)return;let c=Date.now(),m=r.map(g=>{if(g.duration===1/0)return;let C=(g.duration||0)+g.pauseDuration-(c-g.createdAt);if(C<0){g.visible&&f.dismiss(g.id);return}return setTimeout(()=>f.dismiss(g.id,t),C)});return()=>{m.forEach(g=>g&&clearTimeout(g))}},[r,s,t]);let a=d.useCallback(j(t),[t]),n=d.useCallback(()=>{a({type:5,time:Date.now()})},[a]),l=d.useCallback((c,m)=>{a({type:1,toast:{id:c,height:m}})},[a]),u=d.useCallback(()=>{s&&a({type:6,time:Date.now()})},[s,a]),p=d.useCallback((c,m)=>{let{reverseOrder:g=!1,gutter:C=8,defaultPosition:T}=m||{},A=r.filter(h=>(h.position||T)===(c.position||T)&&h.height),Z=A.findIndex(h=>h.id===c.id),F=A.filter((h,z)=>z<Z&&h.visible).length;return A.filter(h=>h.visible).slice(...g?[F+1]:[0,F]).reduce((h,z)=>h+(z.height||0)+C,0)},[r]);return d.useEffect(()=>{r.forEach(c=>{if(c.dismissed)o(c.id,c.removeDelay);else{let m=i.get(c.id);m&&(clearTimeout(m),i.delete(c.id))}})},[r,o]),{toasts:r,handlers:{updateHeight:l,startPause:n,endPause:u,calculateOffset:p}}},le=v`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,de=v`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ce=v`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,ue=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${le} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${de} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${ce} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,pe=v`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,me=w("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${pe} 1s linear infinite;
`,fe=v`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,ge=v`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,he=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${fe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${ge} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,ye=w("div")`
  position: absolute;
`,be=w("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,ve=v`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,xe=w("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${ve} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,we=({toast:e})=>{let{icon:t,type:r,iconTheme:s}=e;return t!==void 0?typeof t=="string"?d.createElement(xe,null,t):t:r==="blank"?null:d.createElement(be,null,d.createElement(me,{...s}),r!=="loading"&&d.createElement(ye,null,r==="error"?d.createElement(ue,{...s}):d.createElement(he,{...s})))},Ee=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Ce=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,ke="0%{opacity:0;} 100%{opacity:1;}",De="0%{opacity:1;} 100%{opacity:0;}",Oe=w("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,$e=w("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,je=(e,t)=>{let r=e.includes("top")?1:-1,[s,i]=H()?[ke,De]:[Ee(r),Ce(r)];return{animation:t?`${v(s)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${v(i)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},Ae=d.memo(({toast:e,position:t,style:r,children:s})=>{let i=e.height?je(e.position||t||"top-center",e.visible):{opacity:0},o=d.createElement(we,{toast:e}),a=d.createElement($e,{...e.ariaProps},O(e.message,e));return d.createElement(Oe,{className:e.className,style:{...i,...r,...e.style}},typeof s=="function"?s({icon:o,message:a}):d.createElement(d.Fragment,null,o,a))});X(d.createElement);var ze=({id:e,className:t,style:r,onHeightUpdate:s,children:i})=>{let o=d.useCallback(a=>{if(a){let n=()=>{let l=a.getBoundingClientRect().height;s(e,l)};n(),new MutationObserver(n).observe(a,{subtree:!0,childList:!0,characterData:!0})}},[e,s]);return d.createElement("div",{ref:o,className:t,style:r},i)},Ne=(e,t)=>{let r=e.includes("top"),s=r?{top:0}:{bottom:0},i=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:H()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...s,...i}},Ie=$`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,k=16,Pe=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:s,children:i,toasterId:o,containerStyle:a,containerClassName:n})=>{let{toasts:l,handlers:u}=ne(r,o);return d.createElement("div",{"data-rht-toaster":o||"",style:{position:"fixed",zIndex:9999,top:k,left:k,right:k,bottom:k,pointerEvents:"none",...a},className:n,onMouseEnter:u.startPause,onMouseLeave:u.endPause},l.map(p=>{let c=p.position||t,m=u.calculateOffset(p,{reverseOrder:e,gutter:s,defaultPosition:t}),g=Ne(c,m);return d.createElement(ze,{id:p.id,key:p.id,onHeightUpdate:u.updateHeight,className:p.visible?Ie:"",style:g},p.type==="custom"?O(p.message,p):i?i(p):d.createElement(Ae,{toast:p,position:c}))}))},Le=f;const Be=d.createContext(null),N={didCatch:!1,error:null};class Me extends d.Component{constructor(t){super(t),this.resetErrorBoundary=this.resetErrorBoundary.bind(this),this.state=N}static getDerivedStateFromError(t){return{didCatch:!0,error:t}}resetErrorBoundary(){const{error:t}=this.state;if(t!==null){for(var r,s,i=arguments.length,o=new Array(i),a=0;a<i;a++)o[a]=arguments[a];(r=(s=this.props).onReset)===null||r===void 0||r.call(s,{args:o,reason:"imperative-api"}),this.setState(N)}}componentDidCatch(t,r){var s,i;(s=(i=this.props).onError)===null||s===void 0||s.call(i,t,r)}componentDidUpdate(t,r){const{didCatch:s}=this.state,{resetKeys:i}=this.props;if(s&&r.error!==null&&Se(t.resetKeys,i)){var o,a;(o=(a=this.props).onReset)===null||o===void 0||o.call(a,{next:i,prev:t.resetKeys,reason:"keys"}),this.setState(N)}}render(){const{children:t,fallbackRender:r,FallbackComponent:s,fallback:i}=this.props,{didCatch:o,error:a}=this.state;let n=t;if(o){const l={error:a,resetErrorBoundary:this.resetErrorBoundary};if(typeof r=="function")n=r(l);else if(s)n=d.createElement(s,l);else if(i!==void 0)n=i;else throw a}return d.createElement(Be.Provider,{value:{didCatch:o,error:a,resetErrorBoundary:this.resetErrorBoundary}},n)}}function Se(){let e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:[],t=arguments.length>1&&arguments[1]!==void 0?arguments[1]:[];return e.length!==t.length||e.some((r,s)=>!Object.is(r,t[s]))}export{Me as E,Pe as F,f as n,Le as z};
//# sourceMappingURL=vendor-ui-CdLgkF9Y.js.map
