(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[197],{8861:function(e,t,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/usages/traffic",function(){return r(4014)}])},7463:function(e,t,r){"use strict";r.d(t,{$:function(){return i}});var n=r(5893);function i(e){var t=e.size;if(!t)return(0,n.jsx)(n.Fragment,{children:t});for(var r=0;t>1024;)t/=1024,r++;return(0,n.jsxs)(n.Fragment,{children:[Math.round(t)," ",["B","KB","MB","GB","TB","EB"][r]]})}},4014:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return g}});var n=r(6042),i=r(9396),o=r(828),l=r(9815),s=r(5893),c=r(9008),a=r.n(c),u=r(1163),d=r(7294),f=r(8100),p=r(1272),x=r(1257),h=r(6550),j=r(7463),b=r(4685),m=r(2687),y=r(5384),v=r(9713);function g(){var e=(0,d.useContext)(p.I),t=(0,u.useRouter)(),r="1"==t.query.all,c=t.query.user,g=(0,o.Z)((0,m.Ai)("usages-traffic-view",{showDetail:!!r,sortColumn:"type",sortAsc:!0,filter:"",direction:"",type:"",date:"",zeroTraffic:!1,top:500,footer:!0}),2),N=g[0],O=g[1],w=(0,f.ZP)("/traffic"+(0,v.uM)({email:c,key:btoa(e.server.url)}),v.Pu.bind(this,e.server)),T=w.data,k=w.mutate,P=w.isValidating;(0,m.G)();return(0,s.jsxs)(x.W,{children:[(0,s.jsx)(a(),{children:(0,s.jsx)("title",{children:"Traffic Usages"})}),(0,s.jsxs)(h.H_,{title:"Daily Traffic Usages",data:N,dataSetter:O,horizontal:!0,children:[c?(0,s.jsx)(h.gN,{label:"User",className:"border-x-[1px] px-3 mr-2",children:(0,s.jsx)("span",{className:"text-gray-800 py-1 px-2 rounded-lg bg-yellow-100",children:c})}):null,(0,s.jsx)(h.gN,{label:"Date",htmlFor:"date",children:(0,s.jsxs)("select",{id:"date",className:y.W.input,children:[(0,s.jsx)("option",{value:"",children:"-"}),Object.keys(null!==T&&void 0!==T?T:{}).map((function(e){return(0,s.jsx)("option",{value:e,children:e})}))]})}),(0,s.jsx)(h.gN,{label:"Sort",htmlFor:"sortColumn",children:(0,s.jsxs)("select",{id:"sortColumn",className:y.W.input,children:[(0,s.jsx)("option",{value:"-",children:"-"}),(0,s.jsx)("option",{value:"type",children:"Type"}),(0,s.jsx)("option",{value:"name",children:"Name"}),(0,s.jsx)("option",{value:"direction",children:"Direction"}),(0,s.jsx)("option",{value:"traffic",children:"Traffic"})]})}),(0,s.jsx)(h.gN,{label:"Order",htmlFor:"sort-order",children:(0,s.jsxs)("select",{value:(null===N||void 0===N?void 0:N.sortAsc)?"asc":"desc",id:"sort-order",className:y.W.input,onChange:function(e){return O((0,i.Z)((0,n.Z)({},N),{sortAsc:"asc"==e.currentTarget.value}))},children:[(0,s.jsx)("option",{value:"asc",children:"ASC"}),(0,s.jsx)("option",{value:"desc",children:"DESC"})]})}),(0,s.jsx)(h.gN,{label:"Direction",htmlFor:"direction",children:(0,s.jsxs)("select",{id:"direction",className:y.W.input,children:[(0,s.jsx)("option",{value:"",children:"-"}),(0,s.jsx)("option",{value:"uplink",children:"UpLink"}),(0,s.jsx)("option",{value:"downlink",children:"DownLink"})]})}),(0,s.jsx)(h.gN,{label:"Type",htmlFor:"type",children:(0,s.jsxs)("select",{id:"type",className:y.W.input,children:[(0,s.jsx)("option",{value:"",children:"-"}),(0,s.jsx)("option",{value:"user",children:"User"}),(0,s.jsx)("option",{value:"outbound",children:"Outbound"}),(0,s.jsx)("option",{value:"inbound",children:"Inbound"})]})}),(0,s.jsx)(h.gN,{label:"Filter",htmlFor:"filter",children:(0,s.jsx)("input",{type:"text",id:"filter",className:y.W.input})}),(0,s.jsx)(h.gN,{label:"Select Top",htmlFor:"top",children:(0,s.jsx)("input",{type:"number",id:"top",className:y.W.input})}),(0,s.jsx)(h.gN,{label:"Zero Traffic",htmlFor:"zeroTraffic",children:(0,s.jsx)("input",{type:"checkbox",id:"zeroTraffic",className:y.W.input})}),(0,s.jsx)("div",{className:"flex flex-row",children:r?(0,s.jsx)("button",{className:y.W.button,onClick:function(){return k()},children:"Reload"}):null})]}),P?(0,s.jsx)("div",{className:"absolute bg-slate-900 text-white rounded-lg px-3 py-1 bottom-3 left-3",children:"Loading ..."}):null,(0,s.jsx)(b.i,{rows:Object.keys(null!==T&&void 0!==T?T:{}).filter((function(e){return!N.date||e==N.date})).flatMap((function(e){return(0,l.Z)(T[e].map((function(t){return(0,n.Z)({date:e},t)})).sort((0,v.KJ)(N.sortColumn,N.sortAsc)).filter((function(e){return!N.filter||e.name.includes(N.filter)})).filter((function(e){return!N.direction||e.direction==N.direction})).filter((function(e){return!N.type||e.type==N.type})).filter((function(e){return!!N.zeroTraffic||e.traffic>0})).slice(0,N.top))})),groupBy:function(e){return e.date},group:function(e){return(0,s.jsxs)("tr",{className:"bg-slate-50",children:[(0,s.jsx)("td",{}),(0,s.jsx)("td",{className:"font-bold text-lg py-1 px-2",children:e}),(0,s.jsx)("td",{colSpan:3})]})},groupFooter:function(e,t){return(0,s.jsxs)("tr",{className:"bg-slate-50",children:[(0,s.jsx)("td",{}),(0,s.jsx)("td",{colSpan:3,className:"px-3 text-gray-400",children:"Day Total"}),(0,s.jsx)("td",{className:"p-2 px-3 font-bold",children:(0,s.jsx)(j.$,{size:t.reduce((function(e,t){return e+t.traffic}),0)})})]})},loading:P,columns:["Type","Name","Direction","Traffic"],cells:function(e){return[e.type,e.name,e.direction,(0,s.jsx)(j.$,{size:e.traffic})]}})]})}},9008:function(e,t,r){e.exports=r(5443)},9396:function(e,t,r){"use strict";function n(e,t){return t=null!=t?t:{},Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):function(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}(Object(t)).forEach((function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(t,r))})),e}r.d(t,{Z:function(){return n}})},9534:function(e,t,r){"use strict";function n(e,t){if(null==e)return{};var r,n,i=function(e,t){if(null==e)return{};var r,n,i={},o=Object.keys(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||(i[r]=e[r]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(i[r]=e[r])}return i}r.d(t,{Z:function(){return n}})},828:function(e,t,r){"use strict";r.d(t,{Z:function(){return o}});var n=r(3375);var i=r(1566);function o(e,t){return function(e){if(Array.isArray(e))return e}(e)||(0,n.Z)(e,t)||(0,i.Z)(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}}},function(e){e.O(0,[966,923,774,888,179],(function(){return t=8861,e(e.s=t);var t}));var t=e.O();_N_E=t}]);