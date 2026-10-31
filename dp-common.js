/* PS Mart - Delivery system common helpers. Koi secret key nahi. app.js se supabaseClient aata hai. */
(function(){
  window.dpEsc=function(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");};
  window.dpInr=function(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});};
  window.dpDate=function(v){if(!v)return "—";var d=new Date(v);if(isNaN(d))return "—";return d.toLocaleString("en-IN",{day:"2-digit",month:"short",year:"2-digit",hour:"2-digit",minute:"2-digit"});};
  window.dpDay=function(v){if(!v)return "—";var d=new Date(v);if(isNaN(d))return String(v);return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});};
  /* RPC call: error aaye to Error throw (message Hinglish me aata hai) */
  window.dpRpc=async function(name,args){
    var r=await supabaseClient.rpc(name,args||{});
    if(r.error){throw new Error(r.error.message||"Kuch gadbad hui");}
    return r.data;
  };
  window.dpMsg=function(el,text,type){
    if(typeof el==="string")el=document.getElementById(el);if(!el)return;
    el.innerHTML=text?'<div class="dp-msg '+(type||"info")+'">'+dpEsc(text)+'</div>':"";
  };
  window.dpStatusLabel=function(s){
    var m={assigned:"Assigned",scanned:"QR Scanned",delivered:"Delivered",failed:"Delivery Failed",rescheduled:"Rescheduled",reassigned:"Reassigned",cancelled:"Cancelled",pending:"Pending",approved:"Approved",rejected:"Rejected",suspended:"Suspended",in_payout:"Payout me",paid:"Paid",reversed:"Reversed",verified:"Verified",not_added:"Add nahi hua"};
    return m[s]||s||"—";
  };
  window.dpBadge=function(s){return '<span class="dp-badge '+dpEsc(s)+'">'+dpEsc(dpStatusLabel(s))+'</span>';};
  /* private file ka temporary link (5 min) */
  window.dpSignedUrl=async function(path){
    if(!path)return null;
    var r=await supabaseClient.storage.from("delivery-docs").createSignedUrl(path,300);
    return r.error?null:r.data.signedUrl;
  };
})();
