/* PS Mart - Seller Rewards & Achievements.
   Koi secret key nahi. Sab hisaab server (RPC sr_my_rewards) karta hai; yahan sirf dikhaya jata hai. */
(function(){
  function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
  function inr(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});}
  function day(v){if(!v)return "—";var d=new Date(v);return isNaN(d)?"—":d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});}
  var DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var PAL={starter:["#f7f1e8","#d9c7a5","#3B2416"],bronze:["#e6b27a","#a86a2f","#4a2a10"],silver:["#f1f3f6","#9aa4b2","#2f3a48"],gold:["#ffe08a","#C9922E","#3B2416"],elite:["#f0bd50","#3B2416","#f7f1e8"]};

  /* Professional SVG badge: shield + ring + level chevrons (emoji nahi) */
  window.psSrBadge=function(key,level,size){
    var p=PAL[key]||PAL.starter,id="g"+Math.random().toString(36).slice(2,8),n=Math.max(1,Math.min(5,level||1)),stars="";
    for(var i=0;i<n;i++){var x=50+(i-(n-1)/2)*11;stars+='<path d="M'+x+' 66l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="'+p[2]+'" transform="translate('+(-x)+' 0) scale(1) translate('+x+' 0)" opacity=".95"/>';}
    return '<svg class="sr-badge" width="'+(size||84)+'" height="'+(size||84)+'" viewBox="0 0 100 110" role="img" aria-label="Seller level '+n+'">'
      +'<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+p[0]+'"/><stop offset="1" stop-color="'+p[1]+'"/></linearGradient></defs>'
      +'<path d="M50 4 90 18v34c0 26-17 44-40 54C27 96 10 78 10 52V18z" fill="url(#'+id+')" stroke="'+(key==="elite"?"#f0bd50":"#3B2416")+'" stroke-width="3"/>'
      +'<path d="M50 14 80 25v27c0 20-12 34-30 42C32 86 20 72 20 52V25z" fill="none" stroke="'+p[2]+'" stroke-opacity=".35" stroke-width="1.5"/>'
      +'<text x="50" y="52" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="30" fill="'+p[2]+'">'+n+'</text>'
      +'<g>'+stars+'</g></svg>';
  };

  function statusPill(h){
    if(h.status==="credited"){
      if(h.wallet_status==="paid")return '<span class="sr-pill ok">Paid</span>'+(h.txn_ref?'<br><small>UTR: '+esc(h.txn_ref)+'</small>':'');
      if(h.wallet_status==="in_payout")return '<span class="sr-pill info">Payout process me</span>';
      if(h.wallet_status==="reversed")return '<span class="sr-pill bad">Reversed</span>';
      return '<span class="sr-pill ok">Wallet me jama</span>';
    }
    return {pending:'<span class="sr-pill wait">Verification pending</span>',achieved:'<span class="sr-pill ok">Badge mila</span>',
      investigating:'<span class="sr-pill wait">Jaanch me</span>',rejected:'<span class="sr-pill bad">Reject</span>',revoked:'<span class="sr-pill bad">Wapas liya gaya</span>'}[h.status]||esc(h.status);
  }

  function msg(d){
    var n=d.next,e=d.products.eligible;
    if(!n)return "Badhai ho! Aap sabse upar ke level par hain. Aise hi achhe products dalte rahiye.";
    var left=n.remaining,rw=Number(n.reward)>0?(" ₹"+n.reward+" reward aur"):"";
    return "Aapke "+e+"/"+n.min_products+" approved products hain. "+left+" aur eligible product upload karke"+rw+" "+esc(n.name)+" badge unlock karein.";
  }

  function full(d,root){
    if(!d.enabled){root.innerHTML='<div class="sr-card">Seller Rewards program abhi chalu nahi hai.</div>';return;}
    if(d.approved===false){root.innerHTML='<div class="sr-card">'+esc(d.message||"Admin approval ke baad rewards chalu honge.")+'</div>';return;}
    var lv=d.level,key=lv?lv.badge_key:"starter",t=d.totals,w=d.wallet,r=d.referral,p=d.payout,n=d.next;
    var h='<div class="sr-hero">'+window.psSrBadge(key,lv?lv.level_no:1,92)+'<div style="flex:1;min-width:0"><small>Aapka level</small><h2>'+esc(lv?lv.name:"Shuruaat")+'</h2>'
      +'<div class="sr-bar"><i style="width:'+Number(d.progress_pct||0)+'%"></i></div><div class="sr-msg">'+msg(d)+'</div></div></div>';

    h+='<div class="sr-card"><h3>Meri kamayi</h3><div class="sr-grid">'
      +'<div class="sr-stat gold"><small>Wallet me available</small><b>'+inr(w.rewards_available)+'</b></div>'
      +'<div class="sr-stat"><small>Verification pending</small><b>'+inr(t.pending)+'</b></div>'
      +'<div class="sr-stat"><small>Payout process me</small><b>'+inr(t.in_payout)+'</b></div>'
      +'<div class="sr-stat"><small>Paid (UTR ke saath)</small><b>'+inr(t.paid)+'</b></div></div>'
      +'<div class="sr-note">Total upload rewards: '+inr(t.earned)+' · Approved products: '+d.products.approved+' · Eligible (ginti me): '+d.products.eligible+'</div></div>';

    h+='<div class="sr-card"><h3>Levels aur rewards</h3><ul class="sr-ladder">'+d.tiers.map(function(x){
      return '<li class="'+(x.achieved?"":"off")+'">'+window.psSrBadge(x.badge_key,x.level_no,44)+'<div class="t"><b>Level '+x.level_no+': '+esc(x.name)+'</b><span>'+x.min_products+' approved products'+(x.achieved?' · Mil gaya':'')+'</span></div><div class="r">'+(Number(x.reward)>0?inr(x.reward):"Badge")+'</div></li>';}).join("")+'</ul></div>';

    h+='<div class="sr-card"><h3>Wallet aur payout</h3><div class="sr-grid">'
      +'<div class="sr-stat"><small>Rewards wallet</small><b>'+inr(w.rewards_available)+'</b></div>'
      +'<div class="sr-stat"><small>Sales wallet</small><b>'+(w.sales_available==null?"—":inr(w.sales_available))+'</b></div>'
      +'<div class="sr-stat"><small>Payout din</small><b>'+esc(DAYS[p.day]||"—")+'</b></div>'
      +'<div class="sr-stat"><small>Agla payout</small><b>'+day(p.next_date)+'</b></div></div>'
      +'<div class="sr-note">Kam se kam withdrawal '+inr(p.min_payout)+'. Admin har hafte '+esc(DAYS[p.day])+' ko payout process karta hai aur UTR ke baad hi reward "Paid" dikhta hai.</div>'
      +'<a class="sr-btn gold" href="seller-refer.html">Rewards withdraw karein</a> <a class="sr-btn" href="seller-wallet.html">Sales wallet</a></div>';

    h+='<div class="sr-card"><h3>Referral reward</h3><div class="sr-grid">'
      +'<div class="sr-stat"><small>Referred sellers</small><b>'+r.total+'</b></div><div class="sr-stat"><small>Milestone poora</small><b>'+r.milestone_done+'</b></div>'
      +'<div class="sr-stat"><small>Referral reward</small><b>'+inr(r.earned)+'</b></div><div class="sr-stat"><small>Referral paid</small><b>'+inr(r.paid)+'</b></div></div>'
      +'<div class="sr-note">Referral reward alag hai aur tab milta hai jab referred seller 50 eligible approved products tak pahunche.</div><a class="sr-btn" href="seller-refer.html">Refer &amp; Earn</a></div>';

    h+='<div class="sr-card"><h3>Achievement history</h3>'+(d.history.length?'<div class="sr-scroll"><table class="sr-hist"><tr><th>Tarikh</th><th>Milestone</th><th>Reward</th><th>Status</th></tr>'
      +d.history.map(function(x){return '<tr><td>'+day(x.achieved_at)+'</td><td>'+esc(x.tier_name)+'<br><small>'+x.products_required+' products</small></td><td>'+(Number(x.reward_amount)>0?inr(x.reward_amount):"—")+'</td><td>'+statusPill(x)+'</td></tr>';}).join("")+'</table></div>':'<div class="sr-note">Abhi koi milestone nahi. Pehla milestone ke liye products upload karte rahiye.</div>')+'</div>';

    h+='<div class="sr-note">Sirf admin-approved, live aur genuine products ginti me aate hain. Duplicate, copied, fake ya low-quality products ginti me nahi aate. Har reward admin verification, program ke niyam aur uplabdh budget par nirbhar hai. PS Mart orders ya sales ki koi guarantee nahi deta. Aap PS Mart ke saath apne dusre platforms par bhi bech sakte hain.</div>';
    root.innerHTML=h;
  }

  function mini(d,box){
    if(!d||!d.enabled||d.approved===false){box.style.display="none";return;}
    var lv=d.level,n=d.next,key=lv?lv.badge_key:"starter";
    box.querySelector(".sr-mini-body").innerHTML='<div class="sr-mini">'+window.psSrBadge(key,lv?lv.level_no:1,56)+'<div style="flex:1;min-width:0"><b>'+esc(lv?lv.name:"Shuruaat")+'</b>'
      +'<div class="bar"><i style="width:'+Number(d.progress_pct||0)+'%"></i></div><small>'+(n?d.products.eligible+"/"+n.min_products+" products · agla: "+esc(n.name):"Sabse upar ka level")+'</small></div></div>';
    box.style.display="";
  }

  async function run(){
    var root=document.getElementById("srRoot"),card=document.getElementById("srCard");
    if(!root&&!card)return;
    try{
      var au=await supabaseClient.auth.getUser();
      if(!au.data||!au.data.user){if(root)location.replace("login.html");return;}
      var r=await supabaseClient.rpc("sr_my_rewards");
      if(r.error)throw new Error(r.error.message);
      if(r.data&&r.data.error)throw new Error(r.data.error);
      if(root)full(r.data,root);
      if(card)mini(r.data,card);
    }catch(e){
      if(root)root.innerHTML='<div class="sr-card">Rewards abhi load nahi ho paye ('+esc(e.message)+'). Thodi der baad try karein.</div>';
      if(card)card.style.display="none";
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else run();
})();
