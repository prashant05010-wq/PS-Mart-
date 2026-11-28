/* PS Mart - ₹100 Coupon Card (coupons.html). Banner se aane par card popup me khulta hai (coupons.html#claim).
   Coupon database ka active coupon hai; asli check (min order, ek customer ek baar, limit) server par place_order me hota hai. */
(function(){
  function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
  function inr(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});}
  var css=document.createElement("style");
  css.textContent=".cc-hero{background:linear-gradient(135deg,#3B2416,#5a3520);color:#F7F1E8;border:2px dashed #C9922E;border-radius:18px;padding:18px;margin:0 0 20px;display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap;box-shadow:0 10px 26px rgba(59,36,22,.25)}"
   +".cc-hero .amt{font:800 40px Georgia,serif;color:#f0bd50;line-height:1}.cc-hero small{color:#eadfcb;display:block;margin-top:4px}"
   +".cc-code{display:inline-block;margin-top:8px;padding:6px 12px;border:1px dashed #f0bd50;border-radius:8px;font-weight:700;letter-spacing:2px;color:#f0bd50}"
   +".cc-btn{padding:13px 18px;border:0;border-radius:10px;background:#C9922E;color:#3B2416;font-weight:800;font-size:16px;cursor:pointer}"
   +".cc-ov{position:fixed;inset:0;background:rgba(30,18,10,.65);z-index:9999;display:none;align-items:center;justify-content:center;padding:16px}.cc-ov.on{display:flex}"
   +".cc-modal{background:#F7F1E8;border-radius:20px;max-width:380px;width:100%;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.4);text-align:center}"
   +".cc-modal .top{background:linear-gradient(135deg,#3B2416,#5a3520);color:#f0bd50;padding:22px 16px}.cc-modal .top b{font:800 46px Georgia,serif;display:block;line-height:1}"
   +".cc-modal .body{padding:18px;color:#3B2416}.cc-modal .body p{margin:6px 0;font-size:14px}"
   +".cc-x{background:none;border:0;color:#7c6a58;margin-top:8px;font-size:14px;cursor:pointer}";
  document.head.appendChild(css);

  function pick(list){
    return list.find(function(c){return String(c.code).toUpperCase()==="PSMART100";})
        || list.find(function(c){return c.discount_type==="fixed"&&Number(c.discount_value)===100;})
        || null;
  }
  function claim(code){
    try{localStorage.setItem("psmart-auto-apply-coupon",String(code).toUpperCase());}catch(_){}
    location.href="cart.html";
  }
  function terms(c){
    var t=[];
    if(Number(c.minimum_order)>0)t.push(inr(c.minimum_order)+" ya usse upar ke order par");
    t.push("ek customer ek baar"+(Number(c.per_user_limit)>1?" ("+c.per_user_limit+" baar)":""));
    if(c.expires_at)t.push("valid: "+new Date(c.expires_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}));
    return t.join(" · ");
  }
  async function run(){
    if(typeof supabaseClient==="undefined")return;
    var host=document.getElementById("claimHero");
    try{
      var r=await supabaseClient.from("coupons").select("*").eq("active",true);
      if(r.error||!r.data)return;
      var c=pick(r.data);
      if(!c)return;
      var amt=inr(c.discount_value);
      if(host)host.innerHTML='<div class="cc-hero"><div><div class="amt">'+amt+' OFF</div><small>'+esc(c.title||"")+'</small><span class="cc-code">'+esc(c.code)+'</span><small>'+esc(terms(c))+'</small></div><button class="cc-btn" id="ccClaim">Claim karein</button></div>';
      var ov=document.createElement("div");ov.className="cc-ov";
      ov.innerHTML='<div class="cc-modal" role="dialog" aria-label="Coupon"><div class="top"><small>PS Mart Coupon</small><b>'+amt+' OFF</b></div><div class="body"><p><b>'+esc(c.title||"")+'</b></p><p>Code: <b>'+esc(c.code)+'</b></p><p style="font-size:12px;color:#7c6a58">'+esc(terms(c))+'</p><button class="cc-btn" id="ccGo" style="width:100%;margin-top:10px">Cart me use karein</button><br><button class="cc-x" id="ccClose">Baad me</button></div></div>';
      document.body.appendChild(ov);
      function open(){ov.classList.add("on");}
      function close(){ov.classList.remove("on");}
      ov.addEventListener("click",function(e){if(e.target===ov)close();});
      document.getElementById("ccClose").onclick=close;
      document.getElementById("ccGo").onclick=function(){claim(c.code);};
      var b=document.getElementById("ccClaim");if(b)b.onclick=open;
      if(location.hash==="#claim")open();   /* banner se aaye: card turant khulta hai */
    }catch(_){}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else run();
})();
