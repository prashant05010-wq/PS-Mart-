/* PS Mart Admin - Commission Management + Referral Management (naya file).
   Har kaam server RPC se hota hai; har RPC admin check karta hai. Buttons ke arguments JSON se safe bheje jate hain. */
(function(){
  var E=dpEsc,CT="rates",RT="refs";
  function btn(t,fn,cls,args){var call=args?fn+"("+args.map(function(a){return E(JSON.stringify(a));}).join(",")+")":fn;return '<button class="dp-btn sm '+(cls||"")+'" onclick="'+call+'">'+E(t)+'</button>';}
  function tbl(head,rows){return '<div class="dp-scroll"><table class="dp-table"><thead><tr>'+head.map(function(h){return '<th>'+E(h)+'</th>';}).join("")+'</tr></thead><tbody>'+(rows.length?rows.join(""):'<tr><td colspan="'+head.length+'">Kuch nahi mila</td></tr>')+'</tbody></table></div>';}
  function friendly(m){m=String(m||"");
    if(/could not find the function|does not exist|schema cache/i.test(m))return "Commission/Referral ka SQL abhi run nahi hua. 2-SUPABASE-7-commission-referral.sql chalayein. ("+m+")";
    if(/Sirf admin/i.test(m))return "Server aapko admin nahi maan raha (is_admin() false). admin-selftest.html se check karein.";
    return m;}
  function err(e){alert(friendly(e.message||e));}
  async function act(fn,redraw){try{await fn();}catch(e){err(e);}redraw();}
  function pills(list,cur,fn){return '<div class="dp-pills" style="flex-wrap:wrap;gap:6px">'+list.map(function(t){return '<button style="flex:0 0 auto;padding:8px 12px" class="'+(t[0]===cur?"on":"")+'" onclick="'+fn+'(\''+t[0]+'\')">'+t[1]+'</button>';}).join("")+'</div>';}
  function rule(r){return {intro:"0% offer",promo:"Promo",category:"Category",default:"Default",legacy:"Purana",mixed:"Mixed"}[r]||r;}

  /* ===================== COMMISSION ===================== */
  var CTABS=[["rates","📊 Category Rates"],["promo","🏷️ Promo"],["offer","🎁 New Seller Offer"],["set","⚙️ Settings"],["sellers","👤 Seller Report"],["orders","🧾 Order Report"],["audit","🔍 Audit"]];
  window.adminCmInit=function(){var r=document.getElementById("cmRoot");if(r)adminCmTab(CT);};
  window.adminCmTab=function(t){CT=t;drawC();};
  async function drawC(){
    var root=document.getElementById("cmRoot");if(!root)return;
    root.innerHTML=pills(CTABS,CT,"adminCmTab")+'<div id="cmBody">Loading...</div>';
    var body=document.getElementById("cmBody");
    try{body.innerHTML=await ({rates:cRates,promo:cPromo,offer:cOffer,set:cSet,sellers:cSellers,orders:cOrders,audit:cAudit}[CT])();}
    catch(e){body.innerHTML='<div class="dp-msg bad">'+E(friendly(e.message))+'</div>';}
  }
  async function cRates(){
    var o=await dpRpc("admin_cm_overview");
    return '<h3>Category-wise Commission</h3><div class="dp-hint">Jis category ka rate yahan set nahi hai, uspar Default rate ('+E(o.default_rate)+'%) lagta hai (Settings tab ke "Marketplace Settings" se badalta hai). Naya rate sirf aage ke delivered orders par lagta hai. Purane orders ka rate fix rehta hai.</div>'
    +tbl(["Category","Rate %","Active","Action"],o.categories.map(function(c){return '<tr><td>'+E(c.name)+' <small>#'+c.id+'</small></td><td><input class="dp-in" id="cr'+c.id+'" type="number" min="0" max="100" step="0.1" style="width:90px;padding:6px" value="'+E(c.rate==null?"":c.rate)+'" placeholder="default"></td><td><input type="checkbox" id="ca'+c.id+'" '+(c.active||c.rate==null?"checked":"")+' style="width:20px;height:20px"></td><td>'+btn("Save","adminCmSaveRate","gold",[c.id])+'</td></tr>';}))
    +'<div class="dp-card" style="max-width:420px;margin-top:14px"><h3>Nayi category jodein</h3><input class="dp-in" id="ncN" placeholder="Category ka naam (jaise Toys)" maxlength="60"><input class="dp-in" id="ncR" type="number" min="0" max="100" step="0.1" placeholder="Commission %" style="margin-top:8px"><button class="dp-btn gold" onclick="adminCmAddCat()">Jodein</button><div class="dp-hint">Seller ke product form me ye category tabhi dikhegi jab wo form categories database se padhe.</div></div>';
  }
  window.adminCmSaveRate=function(id){var v=document.getElementById("cr"+id).value;if(v==="")return alert("Rate daalein");act(function(){return dpRpc("admin_cm_set_rate",{p_cat:id,p_rate:Number(v),p_active:document.getElementById("ca"+id).checked});},drawC);};
  window.adminCmAddCat=function(){act(function(){return dpRpc("admin_cm_add_category",{p_name:document.getElementById("ncN").value,p_rate:Number(document.getElementById("ncR").value)});},drawC);};

  async function cPromo(){
    var o=await dpRpc("admin_cm_overview"),cats=o.categories;
    var now=new Date(),end=new Date(now.getTime()+7*86400000);
    function loc(d){var z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,16);}
    return '<h3>Promotional Commission</h3>'+tbl(["Naam","Kahan","Rate","Kab se – kab tak","Status","Action"],o.promos.map(function(p){
      var sc=p.scope==="all"?"Sabhi":p.scope==="category"?"Category #"+p.category_id:"Seller "+String(p.seller_id).slice(0,8);var live=p.active&&new Date(p.starts_at)<=now&&new Date(p.ends_at)>now;
      return '<tr><td>'+E(p.name)+'</td><td>'+E(sc)+'</td><td>'+E(p.rate)+'%</td><td>'+dpDate(p.starts_at)+'<br>'+dpDate(p.ends_at)+'</td><td>'+(live?dpBadge("approved"):p.active?dpBadge("pending"):dpBadge("suspended"))+'</td><td>'+btn(p.active?"Band":"Chalu","adminCmTogglePromo",p.active?"red":"green",[p.id,!p.active])+'</td></tr>';}))
    +'<div class="dp-card" style="max-width:460px;margin-top:14px"><h3>Nayi promo</h3>'
    +'<input class="dp-in" id="pN" placeholder="Promo ka naam" maxlength="80"><label class="dp-l">Kis par lagu</label><select class="dp-in" id="pS" onchange="adminCmPromoScope()"><option value="all">Sabhi products</option><option value="category">Ek category</option><option value="seller">Ek seller</option></select>'
    +'<select class="dp-in" id="pC" style="margin-top:8px;display:none">'+cats.map(function(c){return '<option value="'+c.id+'">'+E(c.name)+'</option>';}).join("")+'</select>'
    +'<input class="dp-in" id="pSel" placeholder="Seller ID (uuid, Seller Report se copy)" style="margin-top:8px;display:none">'
    +'<label class="dp-l">Promo commission %</label><input class="dp-in" id="pR" type="number" min="0" max="100" step="0.1">'
    +'<label class="dp-l">Shuru</label><input class="dp-in" id="pA" type="datetime-local" value="'+loc(now)+'"><label class="dp-l">Khatam</label><input class="dp-in" id="pE" type="datetime-local" value="'+loc(end)+'">'
    +'<button class="dp-btn gold" onclick="adminCmSavePromo()">Promo banayein</button><div class="dp-hint">Agar promo aur category rate dono lagu hon to seller ko sabse kam rate milta hai. Seller ka 0% intro offer sabse upar rehta hai.</div></div>';
  }
  window.adminCmPromoScope=function(){var v=document.getElementById("pS").value;document.getElementById("pC").style.display=v==="category"?"block":"none";document.getElementById("pSel").style.display=v==="seller"?"block":"none";};
  window.adminCmSavePromo=function(){var sc=document.getElementById("pS").value;act(function(){return dpRpc("admin_cm_save_promo",{p_id:null,p_name:document.getElementById("pN").value||"Promo",p_scope:sc,p_cat:sc==="category"?Number(document.getElementById("pC").value):null,p_seller:sc==="seller"?document.getElementById("pSel").value.trim():null,p_rate:Number(document.getElementById("pR").value),p_start:new Date(document.getElementById("pA").value).toISOString(),p_end:new Date(document.getElementById("pE").value).toISOString(),p_active:true});},drawC);};
  window.adminCmTogglePromo=function(id,on){act(function(){return dpRpc("admin_cm_toggle_promo",{p_id:id,p_active:on});},drawC);};

  async function cOffer(){
    var o=await dpRpc("admin_cm_offers");
    return '<h3>Naye Seller ka Introductory Offer</h3><div class="dp-hint">Offer seller ke approve hone ki tarikh se shuru hota hai. Offer ka din/rate Settings tab me badalta hai. Pehle se approved sellers ko offer nahi diya gaya; yahan se de sakte hain.</div>'
    +tbl(["Seller","Status","Approve tarikh","Offer","Action"],o.map(function(s){return '<tr><td><b>'+E(s.shop_name)+'</b><br><small>'+E(s.seller_id)+'</small></td><td>'+E(s.status)+'</td><td>'+dpDay(s.approved_at)+'</td><td>'+(s.offer_eligible?(s.active?dpBadge("approved")+'<br>'+dpDay(s.offer_start)+' – '+dpDay(s.offer_end):'Khatam: '+dpDay(s.offer_end)):'<small>'+E(s.note||"Nahi")+'</small>')+'</td><td>'+(s.status==="approved"?(s.active?btn("Band karein","adminCmOffer","red",[s.seller_id,false]):btn("Offer dein","adminCmOffer","green",[s.seller_id,true])):"")+'</td></tr>';}));
  }
  window.adminCmOffer=function(id,on){if(!confirm(on?"Is seller ko introductory offer dena hai?":"Is seller ka offer band karna hai?"))return;act(function(){return dpRpc("admin_cm_set_offer",{p_seller:id,p_eligible:on,p_end:null});},drawC);};

  async function cSet(){
    var o=await dpRpc("admin_cm_overview"),s=o.settings;
    function n(id,l,v,step){return '<label class="dp-l">'+l+'</label><input class="dp-in" id="'+id+'" type="number" step="'+(step||1)+'" min="0" value="'+E(v)+'">';}
    function c(id,l,v){return '<label style="display:flex;gap:10px;margin-top:12px;font-weight:600"><input type="checkbox" id="'+id+'" '+(v?"checked":"")+' style="width:22px;height:22px"> '+l+'</label>';}
    return '<h3>Commission &amp; Referral Settings</h3><div class="dp-card" style="max-width:460px">'
    +c("sIE","Naye seller ka introductory offer chalu",s.intro_enabled)+n("sID","Offer ke din",s.intro_days)+n("sIR","Offer ke dauran commission %",s.intro_rate,0.1)
    +c("sRE","Referral program chalu",s.referral_enabled)+n("sMP","Reward ke liye genuine approved products",s.milestone_products)+n("sMR","Milestone reward (₹)",s.milestone_reward,0.5)+n("sSP","Referrer ko PS Mart commission ka %",s.share_percent,0.1)+n("sSD","Commission sharing ke din",s.share_days)+n("sHD","Reward kitne din rukega (return window)",s.hold_days)+n("sMN","Minimum referral payout (₹)",s.min_payout,1)
    +'<button class="dp-btn gold" onclick="adminCmSaveSet()">Save</button><div class="dp-hint">Badlav sirf aage ke naye sellers/orders par lagte hain. Har badlav audit log me likha jata hai.</div></div>';
  }
  window.adminCmSaveSet=function(){function v(i){return Number(document.getElementById(i).value);}act(function(){return dpRpc("admin_cm_set_settings",{p_intro_enabled:document.getElementById("sIE").checked,p_intro_days:v("sID"),p_intro_rate:v("sIR"),p_referral_enabled:document.getElementById("sRE").checked,p_milestone_products:v("sMP"),p_milestone_reward:v("sMR"),p_share_percent:v("sSP"),p_share_days:v("sSD"),p_hold_days:v("sHD"),p_min_payout:v("sMN")});},drawC);};

  async function cSellers(){
    var r=await dpRpc("admin_cm_seller_report"),tot=r.reduce(function(a,x){return a+Number(x.commission);},0);
    return '<h3>Seller-wise Commission</h3><div class="dp-hint">Kul commission (active): <b>'+dpInr(tot)+'</b></div>'+tbl(["Seller","Orders","Bikri","Commission","Avg rate","Reverse hui"],r.map(function(x){return '<tr><td><b>'+E(x.shop_name)+'</b><br><small>'+E(x.seller_id)+'</small></td><td>'+x.orders+'</td><td>'+dpInr(x.gross)+'</td><td>'+dpInr(x.commission)+'</td><td>'+E(x.effective_rate)+'%</td><td>'+dpInr(x.reversed)+'</td></tr>';}));
  }
  async function cOrders(){
    var r=await dpRpc("admin_cm_order_report",{p_limit:150,p_seller:null});
    return '<h3>Order-wise Commission</h3>'+tbl(["Order","Seller","Bikri","Rate / Rule","Commission","Status","Action"],r.map(function(x){return '<tr><td>#'+E(x.order_id)+'<br><small>'+dpDate(x.created_at)+'</small></td><td>'+E(x.shop_name||"—")+'</td><td>'+dpInr(x.gross)+'</td><td>'+E(x.rate_applied)+'%<br><small>'+E(rule(x.rule))+'</small></td><td>'+dpInr(x.commission_amount-x.adjusted_amount)+(Number(x.adjusted_amount)>0?'<br><small>adjust: -'+dpInr(x.adjusted_amount)+'</small>':'')+'</td><td>'+dpBadge(x.status==="active"?"approved":"reversed")+'</td><td>'+(x.status==="active"?btn("Partial refund","adminCmPartial","line",[x.id]):"")+'</td></tr>';}))
    +'<div style="margin-top:12px">'+btn("Missing records dobara banayein","adminCmBackfill","line")+'<div class="dp-hint">Agar kisi delivered order ka commission record na bana ho to ye bana deta hai.</div></div>';
  }
  window.adminCmPartial=function(id){var g=prompt("Kitni bikri-rakam (₹) refund hui? (product price, commission nahi)");if(!g)return;var w=prompt("Wajah (zaruri):");if(!w)return;act(function(){return dpRpc("admin_cm_partial_refund",{p_txn:id,p_refunded_gross:Number(g),p_reason:w});},drawC);};
  window.adminCmBackfill=function(){act(async function(){var r=await dpRpc("admin_cm_backfill");alert(r.created+" naye record bane");},drawC);};
  async function cAudit(){
    var r=await dpRpc("admin_cm_audit",{p_limit:150});
    return '<h3>Commission Audit Trail</h3>'+tbl(["Time","Action","Purana","Naya"],r.map(function(a){return '<tr><td>'+dpDate(a.created_at)+'</td><td>'+E(a.action)+'</td><td><small>'+E(a.old_value?JSON.stringify(a.old_value):"")+'</small></td><td><small>'+E(a.new_value?JSON.stringify(a.new_value):"")+'</small></td></tr>';}));
  }

  /* ===================== REFERRAL ===================== */
  var RTABS=[["refs","🤝 Referrals"],["wallet","👛 Wallet / Rewards"],["pay","💸 Payouts"],["codes","🔗 Codes"]];
  window.adminRefInit=function(){var r=document.getElementById("refRoot");if(r)adminRefTab(RT);};
  window.adminRefTab=function(t){RT=t;drawR();};
  async function drawR(){
    var root=document.getElementById("refRoot");if(!root)return;
    root.innerHTML=pills(RTABS,RT,"adminRefTab")+'<div id="refBody2">Loading...</div>';
    var body=document.getElementById("refBody2");
    try{body.innerHTML=await ({refs:rRefs,wallet:rWallet,pay:rPay,codes:rCodes}[RT])();}
    catch(e){body.innerHTML='<div class="dp-msg bad">'+E(friendly(e.message))+'</div>';}
  }
  var OV=null;
  async function rRefs(){
    OV=await dpRpc("admin_ref_overview");var t=OV.totals;
    return '<h3>Referral Management</h3><div class="dp-grid"><div class="dp-stat"><small>Referrals</small><b>'+t.referrals+'</b></div><div class="dp-stat"><small>Flagged</small><b>'+t.flagged+'</b></div><div class="dp-stat"><small>Blocked</small><b>'+t.blocked+'</b></div><div class="dp-stat gold"><small>Pending rewards</small><b>'+dpInr(t.pending_rewards)+'</b></div><div class="dp-stat"><small>Available</small><b>'+dpInr(t.available_rewards)+'</b></div><div class="dp-stat"><small>Paid</small><b>'+dpInr(t.paid_rewards)+'</b></div></div>'
    +'<div class="dp-hint" style="margin:10px 0">"Signals" sirf jaanch ke liye ishaare hain, kisi par ilzaam nahi. Reward approve karne se pehle "Saboot" dekhein.</div>'
    +tbl(["Referrer → Referred","Status","Products","Milestone","90 din","Kamayi","Signals","Action"],OV.rows.map(function(r){
      var sig=[];if(r.same_day_referrals>=4)sig.push(r.same_day_referrals+" referral 24 ghante me");if(r.approved_products>0&&r.genuine_products<r.approved_products)sig.push((r.approved_products-r.genuine_products)+" duplicate/flagged product");if(r.flagged)sig.push("🚩 "+(r.flag_reason||"flagged"));
      return '<tr><td><b>'+E(r.referrer)+'</b> → '+E(r.referred)+'<br><small>'+dpDay(r.registered_at)+' · '+E(r.code_used)+'</small></td><td>'+dpBadge(r.status==="blocked"?"suspended":r.status==="approved"?"approved":"pending")+'</td><td>'+r.approved_products+' (genuine '+r.genuine_products+')</td><td>'+(r.milestone_status?dpBadge(r.milestone_status):"—")+'</td><td>'+(r.share_start?dpDay(r.share_start)+' – '+dpDay(r.share_end):"—")+'</td><td>'+dpInr(r.earned)+'</td><td><small>'+E(sig.join(", ")||"—")+'</small></td><td>'+btn("Saboot","adminRefEvidence","line",[r.id])+(r.status==="blocked"?btn("Unblock","adminRefBlock","green",[r.id,false]):btn("Block","adminRefBlock","red",[r.id,true]))+btn(r.flagged?"Flag hatao":"Flag","adminRefFlag","line",[r.id,!r.flagged])+btn("Referrer sudhaarein","adminRefCorrect","line",[r.referred_id])+'</td></tr>';}));
  }
  window.adminRefEvidence=async function(id){
    try{var d=await dpRpc("admin_ref_evidence",{p_referral:id});
      var h='<div class="dp-card" id="evBox"><h3>Saboot: referral #'+id+'</h3><div class="dp-hint">Products ko "Fake/Duplicate" flag karne par wo count se bahar ho jate hain.</div>'
      +tbl(["ID","Naam","Status","Dikkat","Action"],d.products.map(function(p){return '<tr><td>'+p.id+'</td><td>'+E(p.name)+'<br><small>'+E(p.model_number||"")+'</small></td><td>'+E(p.status)+'</td><td>'+(p.duplicate?"Duplicate ":"")+(p.flagged?"🚩 Flagged":"")+'</td><td>'+(p.flagged?btn("Flag hatao","adminRefFlagProduct","line",[p.id,false,id]):btn("Fake/Duplicate","adminRefFlagProduct","red",[p.id,true,id]))+'</td></tr>';}))
      +'<h4>Reward transactions</h4>'+tbl(["#","Type","Amount","Status","Action"],d.transactions.map(function(x){return '<tr><td>'+x.id+'</td><td>'+E(x.kind)+'</td><td>'+dpInr(x.amount)+'<br><small>'+E(x.evidence?JSON.stringify(x.evidence):"")+'</small></td><td>'+dpBadge(x.status)+'</td><td>'+(x.status==="pending"?btn("Approve","adminRefTx","green",[x.id,"approve"])+btn("Reject","adminRefTx","red",[x.id,"reject"]):"")+'</td></tr>';}))+'</div>';
      var b=document.getElementById("evBox");if(b)b.remove();document.getElementById("refBody2").insertAdjacentHTML("beforeend",h);document.getElementById("evBox").scrollIntoView({behavior:"smooth"});
    }catch(e){err(e);}
  };
  window.adminRefFlagProduct=function(pid,on,rid){var why=on?prompt("Wajah (fake / duplicate / misleading):"):null;if(on&&!why)return;act(function(){return dpRpc("admin_ref_flag_product",{p_product:pid,p_on:on,p_reason:why});},function(){adminRefEvidence(rid);});};
  window.adminRefBlock=function(id,on){var w=on?prompt("Block karne ki wajah (zaruri):"):"";if(on&&!w)return;if(!on&&!confirm("Unblock karna hai?"))return;act(function(){return dpRpc("admin_ref_block",{p_referral:id,p_block:on,p_reason:w});},drawR);};
  window.adminRefFlag=function(id,on){var w=on?prompt("Flag ki wajah:"):null;if(on&&!w)return;act(function(){return dpRpc("admin_ref_flag",{p_referral:id,p_flagged:on,p_reason:w});},drawR);};
  window.adminRefCorrect=function(referred){var n=prompt("Naye referrer ka Seller ID (uuid):");if(!n)return;var w=prompt("Sudhaar ki wajah (zaruri):");if(!w)return;act(function(){return dpRpc("admin_ref_correct_referrer",{p_referred:referred,p_new_referrer:n.trim(),p_reason:w});},drawR);};
  window.adminRefTx=function(id,a){var n=null;if(a==="reject"){n=prompt("Reject ki wajah (zaruri):");if(!n)return;}else if(!confirm("Is reward ko approve karna hai? Ye seller ke Available balance me judega."))return;act(function(){return dpRpc("admin_ref_set_tx",{p_tx:id,p_action:a,p_note:n});},drawR);};

  async function rWallet(){
    var r=await dpRpc("admin_ref_wallet",{p_limit:200});
    return '<h3>Referral Wallet Transactions</h3>'+tbl(["#","Kamane wala","Type","Amount","Status","Referred / Order","Date","Action"],r.map(function(x){return '<tr><td>'+x.id+'</td><td>'+E(x.earner)+'</td><td>'+E(x.kind)+'</td><td>'+dpInr(x.amount)+'</td><td>'+dpBadge(x.status)+(x.payout_id?'<br><small>payout #'+x.payout_id+'</small>':'')+'</td><td>'+E(x.referred||"")+(x.order_id?' #'+E(x.order_id):'')+'<br><small>'+E(x.note||"")+'</small></td><td>'+dpDate(x.created_at)+'</td><td>'+(x.status==="pending"&&!x.payout_id?btn("Approve","adminRefTx","green",[x.id,"approve"])+btn("Reject","adminRefTx","red",[x.id,"reject"]):"")+'</td></tr>';}))
    +'<div style="margin-top:12px">'+btn("Manual adjustment","adminRefAdjust","line")+'<div class="dp-hint">Galti sudhaarne ke liye. Record delete nahi hota, nayi adjustment row judti hai.</div></div>';
  }
  window.adminRefAdjust=function(){var s=prompt("Seller ID (uuid):");if(!s)return;var a=prompt("Amount (₹). Katne ke liye minus, jaise -50:");if(!a)return;var n=prompt("Wajah (zaruri):");if(!n)return;act(function(){return dpRpc("admin_ref_adjust",{p_seller:s.trim(),p_amount:Number(a),p_note:n});},drawR);};

  async function rPay(){
    var r=await dpRpc("admin_ref_payouts");
    return '<h3>Referral Payouts</h3><div class="dp-hint">Pehle paisa bhejein, phir UTR/reference ke saath <b>Paid</b> mark karein. Reference ke bina Paid nahi hota.</div>'+tbl(["#","Seller","Amount","UPI","Status","Reference","Action"],r.map(function(p){return '<tr><td>'+p.id+'</td><td><b>'+E(p.shop_name)+'</b><br><small>'+dpDate(p.created_at)+'</small></td><td>'+dpInr(p.amount)+'</td><td>'+E(p.upi_id)+'</td><td>'+dpBadge(p.status==="processing"?"pending":p.status)+'<br><small>'+E(p.status)+'</small></td><td>'+E(p.txn_ref||"—")+'</td><td>'+((p.status==="pending")?btn("Processing","adminRefPay","line",[p.id,"processing"]):"")+((p.status==="pending"||p.status==="processing")?btn("Paid","adminRefPay","green",[p.id,"paid"])+btn("Failed","adminRefPay","red",[p.id,"failed"]):"")+(p.status==="paid"?btn("Reverse","adminRefPay","red",[p.id,"reversed"]):"")+'</td></tr>';}));
  }
  window.adminRefPay=function(id,s){var ref=null,note=null;
    if(s==="paid"){ref=prompt("Payment confirm hone ke baad Transaction Reference / UTR likhein:");if(!ref)return;if(!confirm("Pakka? Seller ko 'Paid' dikhega. Ref: "+ref))return;}
    else if(s==="failed"||s==="reversed"){note=prompt("Wajah:");if(!note)return;}
    act(function(){return dpRpc("admin_ref_set_payout",{p_id:id,p_status:s,p_ref:ref,p_note:note});},drawR);};

  async function rCodes(){
    if(!OV)OV=await dpRpc("admin_ref_overview");
    return '<h3>Referral Codes</h3>'+tbl(["Seller","Code","Banaya"],OV.codes.map(function(c){return '<tr><td>'+E(c.shop)+'</td><td><b>'+E(c.code)+'</b></td><td>'+dpDate(c.created_at)+'</td></tr>';}));
  }
})();
