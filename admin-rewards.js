/* PS Mart Admin - Customer Rewards (Refer & Earn + Rewards Club). Har kaam server RPC se; har RPC admin check karta hai. */
(function(){
  var E=dpEsc,T="ov";
  function btn(t,fn,cls,args){var call=args?fn+"("+args.map(function(a){return E(JSON.stringify(a));}).join(",")+")":fn;return '<button class="dp-btn sm '+(cls||"")+'" onclick="'+call+'">'+E(t)+'</button>';}
  function tbl(h,rows){return '<div class="dp-scroll"><table class="dp-table"><thead><tr>'+h.map(function(x){return '<th>'+E(x)+'</th>';}).join("")+'</tr></thead><tbody>'+(rows.length?rows.join(""):'<tr><td colspan="'+h.length+'">Kuch nahi mila</td></tr>')+'</tbody></table></div>';}
  function friendly(m){m=String(m||"");
    if(/could not find the function|does not exist|schema cache/i.test(m))return "Customer rewards ka SQL abhi run nahi hua. 2-SUPABASE-9-customer-rewards.sql chalayein. ("+m+")";
    if(/Sirf admin/i.test(m))return "Server aapko admin nahi maan raha (is_admin() false). admin-selftest.html se check karein.";return m;}
  function err(e){alert(friendly(e.message||e));}
  async function act(fn){try{await fn();}catch(e){err(e);}draw();}
  var TABS=[["ov","⚙️ Settings & Levels"],["refs","🤝 Referrals"],["gifts","📦 Gifts"],["wallet","🎟️ Wallet Rewards"],["audit","🔍 Audit"]];
  window.adminCrInit=function(){if(document.getElementById("crRoot"))adminCrTab(T);};
  window.adminCrTab=function(t){T=t;draw();};
  async function draw(){
    var root=document.getElementById("crRoot");if(!root)return;
    root.innerHTML='<div class="dp-pills" style="flex-wrap:wrap;gap:6px">'+TABS.map(function(t){return '<button style="flex:0 0 auto;padding:8px 12px" class="'+(t[0]===T?"on":"")+'" onclick="adminCrTab(\''+t[0]+'\')">'+t[1]+'</button>';}).join("")+'</div><div id="crBody">Loading...</div>';
    var b=document.getElementById("crBody");
    try{b.innerHTML=await ({ov:vOv,refs:vRefs,gifts:vGifts,wallet:vWallet,audit:vAudit}[T])();}catch(e){b.innerHTML='<div class="dp-msg bad">'+E(friendly(e.message))+'</div>';}
  }
  function n(id,l,v,s){return '<label class="dp-l">'+l+'</label><input class="dp-in" id="'+id+'" type="number" min="0" step="'+(s||1)+'" value="'+E(v)+'">';}
  function c(id,l,v){return '<label style="display:flex;gap:10px;margin-top:12px;font-weight:600"><input type="checkbox" id="'+id+'" '+(v?"checked":"")+' style="width:22px;height:22px"> '+l+'</label>';}
  async function vOv(){
    var o=await dpRpc("admin_cr_overview"),s=o.settings,t=o.totals;
    var lv=o.levels.map(function(l){return '<tr><td><input class="dp-in" id="lN'+l.id+'" type="number" style="width:60px;padding:6px" value="'+l.level_no+'"></td><td><input class="dp-in" id="lT'+l.id+'" style="width:110px;padding:6px" value="'+E(l.name)+'"></td><td><input class="dp-in" id="lO'+l.id+'" type="number" style="width:70px;padding:6px" value="'+l.orders_needed+'"></td><td><select class="dp-in" id="lY'+l.id+'" style="padding:6px"><option value="wallet"'+(l.reward_type==="wallet"?" selected":"")+'>₹ Gift card</option><option value="gift"'+(l.reward_type==="gift"?" selected":"")+'>Saman</option></select></td><td><input class="dp-in" id="lA'+l.id+'" type="number" style="width:80px;padding:6px" value="'+l.amount+'"></td><td><input class="dp-in" id="lG'+l.id+'" style="width:150px;padding:6px" value="'+E(l.gift_name||"")+'"></td><td><input class="dp-in" id="lV'+l.id+'" type="number" style="width:70px;padding:6px" value="'+l.gift_value+'"></td><td><input type="checkbox" id="lC'+l.id+'" '+(l.active?"checked":"")+' style="width:20px;height:20px"></td><td>'+btn("Save","adminCrSaveLevel","gold",[l.id])+'</td></tr>';});
    return '<h3>Customer Rewards</h3><div class="dp-grid"><div class="dp-stat"><small>Referrals</small><b>'+t.referrals+'</b></div><div class="dp-stat"><small>Order poora</small><b>'+t.completed+'</b></div><div class="dp-stat"><small>Review chahiye</small><b>'+t.flagged+'</b></div><div class="dp-stat gold"><small>Gift card diye</small><b>'+dpInr(t.wallet_given)+'</b></div><div class="dp-stat"><small>Bhejne wale gift</small><b>'+t.gifts_to_ship+'</b></div></div>'
    +'<div class="dp-card" style="max-width:480px;margin-top:12px"><h3>Refer &amp; Earn settings</h3>'+c("cRE","Customer Refer &amp; Earn chalu",s.referral_enabled)+n("cFR","Friend ko reward (₹)",s.friend_reward,0.5)+n("cRR","Referrer ko reward (₹)",s.referrer_reward,0.5)+n("cMO","Friend ka kam se kam order (₹)",s.referral_min_order,1)+n("cCP","Ek referrer ke max rewarded referrals",s.referral_cap)
    +'<h3 style="margin-top:14px">Rewards Club settings</h3>'+c("cLE","Levels chalu",s.levels_enabled)+n("cLM","Order tabhi gina jayega jab kam se kam (₹)",s.level_min_order,1)+n("cHD","Deliver ke kitne din baad gina jaye (return window)",s.hold_days)+n("cVD","Gift card kitne din valid",s.reward_valid_days)+'<label class="dp-l">Rewards Club shuru tarikh (isse pehle ke orders nahi gine jate)</label><input class="dp-in" id="cST" type="datetime-local" value="'+E(s.club_start_at?new Date(new Date(s.club_start_at).getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16):"")+'">'
    +'<button class="dp-btn gold" onclick="adminCrSaveSet()">Save</button><div class="dp-hint">Badlav aage ke rewards par lagte hain. Har badlav audit log me jata hai.</div></div>'
    +'<h3 style="margin-top:16px">Levels (kitne order par kya gift)</h3>'+tbl(["Level #","Naam","Orders","Type","₹","Saman ka naam","Saman ki keemat ₹","Chalu","Action"],lv)
    +'<div class="dp-card" style="max-width:520px;margin-top:12px"><h4>Naya level</h4><div class="dp-row"><input class="dp-in" id="nlN" type="number" placeholder="Level #"><input class="dp-in" id="nlT" placeholder="Naam"><input class="dp-in" id="nlO" type="number" placeholder="Orders"></div><div class="dp-row" style="margin-top:8px"><select class="dp-in" id="nlY"><option value="wallet">₹ Gift card</option><option value="gift">Saman</option></select><input class="dp-in" id="nlA" type="number" placeholder="₹ amount"><input class="dp-in" id="nlG" placeholder="Saman ka naam"></div><button class="dp-btn gold" onclick="adminCrNewLevel()">Level jodein</button></div>'
    +'<div style="margin-top:14px">'+btn("Sab customers par abhi check chalao","adminCrRunAll","line")+btn("Customer ko bonus dein","adminCrBonus","line")+'<div class="dp-hint">Hold din beet jane par kuch customers ka reward tab banta hai jab wo page kholte hain ya aap yahan "check chalao" dabate hain. Roz ek baar chalana achha hai.</div></div>';
  }
  window.adminCrSaveSet=function(){function v(i){return Number(document.getElementById(i).value);}act(function(){return dpRpc("admin_cr_set_settings",{p_ref_enabled:document.getElementById("cRE").checked,p_friend:v("cFR"),p_referrer:v("cRR"),p_min_order:v("cMO"),p_cap:v("cCP"),p_levels_enabled:document.getElementById("cLE").checked,p_level_min:v("cLM"),p_hold:v("cHD"),p_valid:v("cVD"),p_start:document.getElementById("cST").value?new Date(document.getElementById("cST").value).toISOString():null});});};
  window.adminCrSaveLevel=function(id){function g(p){return document.getElementById(p+id);}act(function(){return dpRpc("admin_cr_save_level",{p_id:id,p_level_no:Number(g("lN").value),p_name:g("lT").value,p_orders:Number(g("lO").value),p_type:g("lY").value,p_amount:Number(g("lA").value),p_gift_name:g("lG").value||null,p_gift_value:Number(g("lV").value||0),p_active:g("lC").checked});});};
  window.adminCrNewLevel=function(){function g(i){return document.getElementById(i).value;}act(function(){return dpRpc("admin_cr_save_level",{p_id:null,p_level_no:Number(g("nlN")),p_name:g("nlT"),p_orders:Number(g("nlO")),p_type:g("nlY"),p_amount:Number(g("nlA")||0),p_gift_name:g("nlG")||null,p_gift_value:0,p_active:true});});};
  window.adminCrRunAll=function(){act(async function(){var r=await dpRpc("admin_cr_run_all");alert(r.customers+" customers check hue");});};
  window.adminCrBonus=function(){var u=prompt("Customer ka user id (uuid):");if(!u)return;var a=prompt("Gift card amount (₹):");if(!a)return;var w=prompt("Wajah (zaruri):");if(!w)return;act(function(){return dpRpc("admin_cr_bonus",{p_user:u.trim(),p_amount:Number(a),p_note:w});});};

  async function vRefs(){
    var o=await dpRpc("admin_cr_overview");
    return '<h3>Customer Referrals</h3><div class="dp-hint">"Review chahiye" ka matlab: referrer aur friend ka delivery address same mila. Ye sirf ishara hai, ilzaam nahi. Dekhkar Approve ya Block karein.</div>'+tbl(["Referrer → Friend","Status","Judne ki tarikh","Signals","Action"],o.referrals.map(function(r){
      return '<tr><td><b>'+E(r.referrer||"—")+'</b> → '+E(r.referred||"—")+'<br><small>'+E(r.code_used)+' · referrer ke total '+r.referrer_total+'</small></td><td>'+dpBadge(r.status==="completed"?"paid":r.status==="blocked"?"suspended":"pending")+(r.flagged?'<br>🚩':'')+'</td><td>'+dpDay(r.registered_at)+(r.completed_at?'<br><small>Poora: '+dpDay(r.completed_at)+'</small>':'')+'</td><td><small>'+E(r.flag_reason||"—")+'</small></td><td>'+(r.status==="pending"&&r.flagged?btn("Approve (reward do)","adminCrRef","green",[r.id,"approve"]):"")+(r.status==="blocked"?btn("Unblock","adminCrRef","green",[r.id,"unblock"]):(r.status!=="completed"?btn("Block","adminCrRef","red",[r.id,"block"]):""))+(r.status==="pending"&&!r.flagged?btn("Flag","adminCrRef","line",[r.id,"flag"]):"")+'</td></tr>';}));
  }
  window.adminCrRef=function(id,a){var n=null;if(a==="block"||a==="flag"){n=prompt(a==="block"?"Block ki wajah (zaruri):":"Flag ki wajah:");if(!n)return;}else if(!confirm("Pakka?"))return;act(function(){return dpRpc("admin_cr_referral_action",{p_id:id,p_action:a,p_note:n});});};

  async function vGifts(){
    var r=await dpRpc("admin_cr_rewards",{p_filter:"gifts"});
    return '<h3>Gifts (ghar bhejne wale)</h3><div class="dp-hint">Customer claim karta hai to status "claimed" hota hai. Pack karke Packed → Shipped → Delivered karte jayein. Customer ko har badlav par notification jata hai.</div>'+tbl(["Customer","Gift","Status","Pata (sirf admin ko)","Action"],r.map(function(x){
      return '<tr><td><b>'+E(x.customer||"—")+'</b><br><small>Level '+E(x.level_no||"")+' · '+dpDay(x.created_at)+'</small></td><td>'+E(x.gift_name)+'</td><td>'+dpBadge(x.status==="delivered"?"paid":x.status==="cancelled"?"suspended":"pending")+'<br><small>'+E(x.status)+'</small></td><td>'+(x.ship_name?E(x.ship_name)+'<br>'+E(x.ship_phone)+'<br><small>'+E(x.ship_address)+'</small>':'<small>Customer ne abhi claim nahi kiya</small>')+'</td><td>'+(x.status==="claimed"?btn("Packed","adminCrGift","line",[x.id,"packed"]):"")+(x.status==="packed"?btn("Shipped","adminCrGift","line",[x.id,"shipped"]):"")+(x.status==="shipped"?btn("Delivered","adminCrGift","green",[x.id,"delivered"]):"")+((x.status==="claimed"||x.status==="packed"||x.status==="unlocked")?btn("Cancel","adminCrGift","red",[x.id,"cancel"]):"")+'</td></tr>';}));
  }
  window.adminCrGift=function(id,s){var note=prompt(s==="shipped"?"Courier / tracking note (optional):":s==="cancel"?"Cancel ki wajah (zaruri):":"Note (optional):")||"";if(s==="cancel"){if(!note)return;act(function(){return dpRpc("admin_cr_void_reward",{p_reward:id,p_reason:note});});return;}act(function(){return dpRpc("admin_cr_set_gift",{p_reward:id,p_status:s,p_note:note});});};

  async function vWallet(){
    var r=await dpRpc("admin_cr_rewards",{p_filter:"wallet"});
    return '<h3>Gift card rewards</h3>'+tbl(["#","Customer","Type","Amount","Balance","Code","Status","Date","Action"],r.map(function(x){var src={referral_friend:"Welcome",referral_referrer:"Refer",level:"Level "+(x.level_no||""),admin:"Bonus"}[x.source]||x.source;return '<tr><td>'+x.id+'</td><td>'+E(x.customer||"—")+'</td><td>'+E(src)+'</td><td>'+dpInr(x.amount)+'</td><td>'+(x.balance==null?"—":dpInr(x.balance))+'</td><td><small>'+E(x.gift_code||"")+'</small></td><td>'+dpBadge(x.status==="cancelled"?"suspended":"paid")+'</td><td>'+dpDay(x.created_at)+'</td><td>'+(x.status!=="cancelled"?btn("Cancel","adminCrVoid","red",[x.id]):"")+'</td></tr>';}));
  }
  window.adminCrVoid=function(id){var w=prompt("Reward cancel karne ki wajah (zaruri). Gift card ka balance 0 ho jayega:");if(!w)return;act(function(){return dpRpc("admin_cr_void_reward",{p_reward:id,p_reason:w});});};

  async function vAudit(){
    var r=await dpRpc("admin_cr_audit",{p_limit:150});
    return '<h3>Rewards Audit Trail</h3>'+tbl(["Time","Action","Purana","Naya"],r.map(function(a){return '<tr><td>'+dpDate(a.created_at)+'</td><td>'+E(a.action)+'</td><td><small>'+E(a.old_value?JSON.stringify(a.old_value):"")+'</small></td><td><small>'+E(a.new_value?JSON.stringify(a.new_value):"")+'</small></td></tr>';}));
  }
})();
