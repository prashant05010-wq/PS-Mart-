/* PS Mart - Admin: Seller Rewards (Founding Seller Program).
   Koi secret key nahi. Har kaam server RPC (admin_sr_*) karta hai jo admin check karta hai. dp-common.js zaruri. */
(function(){
  var ROOT, S=null, FILTER="", SEARCH="";
  var DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var ST={pending:"Pending",achieved:"Badge only",credited:"Credited",rejected:"Rejected",investigating:"Investigating",revoked:"Revoked"};
  function e(v){return dpEsc(v);}
  function toast(t,ok){var m=document.getElementById("srAdMsg");if(m)dpMsg(m,t,ok?"ok":"bad");}
  async function act(fn,okText){try{var r=await fn();toast(okText||"Ho gaya",true);await load();return r;}catch(x){toast(x.message,false);}}
  function localVal(v){if(!v)return "";var d=new Date(v);if(isNaN(d))return "";var p=function(n){return String(n).padStart(2,"0");};return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"T"+p(d.getHours())+":"+p(d.getMinutes());}
  function iso(id){var v=document.getElementById(id).value;return v?new Date(v).toISOString():null;}

  window.adminSrInit=function(){ROOT=document.getElementById("srAdRoot");if(!ROOT)return;load();};

  async function load(){
    try{
      S=await dpRpc("admin_sr_overview");
      var sellers=await dpRpc("admin_sr_sellers",{p_search:SEARCH||null,p_limit:100});
      var ms=await dpRpc("admin_sr_milestones",{p_status:FILTER||null,p_search:SEARCH||null,p_limit:200});
      var au=await dpRpc("admin_sr_audit",{p_limit:60});
      draw(sellers,ms,au);
    }catch(x){ROOT.innerHTML='<div class="dp-msg bad">'+e(x.message)+' (SQL migration chala hai?)</div>';}
  }

  function draw(sellers,ms,au){
    var s=S.settings,t=S.totals,h='<div id="srAdMsg"></div>';
    h+='<div class="dp-card"><h3>Liability / Budget</h3><div class="dp-grid">'
      +st("Budget",dpInr(t.budget_total))+st("Budget bacha",dpInr(t.budget_left),1)+st("Pending approval",dpInr(t.pending_amount)+" ("+t.pending_count+")")
      +st("Jaanch me",dpInr(t.investigating_amount))+st("Wallet me credit",dpInr(t.credited_amount))+st("Abhi unpaid",dpInr(t.unpaid_in_wallet))
      +st("Paid (UTR ke saath)",dpInr(t.paid_amount))+st("Max liability",dpInr(t.max_liability))+'</div>'
      +'<div class="dp-hint">Max liability = credit ho chuka + pending/jaanch wale rewards. Budget poora hone par approve block ho jata hai.</div></div>';

    h+='<div class="dp-card"><h3>Program settings</h3>'
      +chk("srEn","Founding Seller Program chalu (ON hone par sellers ko rewards dikhenge)",s.enabled)
      +chk("srAuto","Auto-approve (OFF rakhna safe: har reward admin approve kare)",s.auto_approve)
      +'<label class="dp-l">Total reward budget (₹) — 0 ho to program chalu nahi hoga</label><input class="dp-in" id="srBud" type="number" min="0" step="1" value="'+e(s.budget_total)+'">'
      +'<label class="dp-l">Program shuru (optional)</label><input class="dp-in" id="srStart" type="datetime-local" value="'+localVal(s.program_start_at)+'">'
      +'<label class="dp-l">Program khatam (optional)</label><input class="dp-in" id="srEnd" type="datetime-local" value="'+localVal(s.program_end_at)+'">'
      +'<label class="dp-l">Weekly payout din</label><select class="dp-in" id="srDay">'+DAYS.map(function(d,i){return '<option value="'+i+'"'+(i==s.payout_day?" selected":"")+'>'+d+'</option>';}).join("")+'</select>'
      +'<label class="dp-l">Homepage featured ke liye minimum level</label><input class="dp-in" id="srFmin" type="number" min="1" value="'+e(s.feature_min_level)+'">'
      +'<div class="dp-hint">Minimum withdrawal abhi ₹'+e(S.min_payout)+' hai (Commission tab ki settings se badalta hai). 0% launch commission offer aur uski dates bhi Commission tab me hain, wahi use hoti hain.</div>'
      +'<button class="dp-btn" onclick="adminSrSaveSettings()">Settings save karein</button>'
      +'<button class="dp-btn" style="background:#C9922E;color:#3B2416" onclick="adminSrRunAll()">Sabhi sellers ka progress dobara jaanchein</button></div>';

    h+='<div class="dp-card"><h3>Levels aur reward amount</h3><div class="dp-hint">Amount badalne se sirf aage ke naye milestones par asar padta hai; ban chuke rewards nahi badalte.</div><div style="overflow-x:auto"><table class="dp-table" style="width:100%;font-size:13px"><tr><th>Lvl</th><th>Naam</th><th>Products</th><th>Reward ₹</th><th>Reward ON</th><th>Active</th><th>Badge</th><th></th></tr>'
      +S.tiers.map(function(x){var i=x.id;return '<tr><td><input id="tL'+i+'" type="number" value="'+x.level_no+'" style="width:46px"></td><td><input id="tN'+i+'" value="'+e(x.name)+'" style="width:120px"></td><td><input id="tM'+i+'" type="number" value="'+x.min_products+'" style="width:64px"></td><td><input id="tA'+i+'" type="number" step="0.5" value="'+x.reward_amount+'" style="width:70px"></td>'
        +'<td><input id="tR'+i+'" type="checkbox"'+(x.reward_active?" checked":"")+'></td><td><input id="tX'+i+'" type="checkbox"'+(x.active?" checked":"")+'></td>'
        +'<td><select id="tB'+i+'">'+["starter","bronze","silver","gold","elite"].map(function(b){return '<option'+(b==x.badge_key?" selected":"")+'>'+b+'</option>';}).join("")+'</select></td><td><button onclick="adminSrSaveTier('+i+')">Save</button></td></tr>';}).join("")
      +'</table></div></div>';

    h+='<div class="dp-card"><h3>Seller-wise progress</h3><input class="dp-in" id="srSearch" placeholder="Seller / shop naam khojein" value="'+e(SEARCH)+'" onkeydown="if(event.key===\'Enter\')adminSrSearch()"><button class="dp-btn" onclick="adminSrSearch()">Search</button>'
      +'<div style="overflow-x:auto;margin-top:8px"><table class="dp-table" style="width:100%;font-size:13px"><tr><th>Shop</th><th>Approved</th><th>Eligible</th><th>Level</th><th>Pending</th><th>Credited</th><th>Paid</th><th>Featured</th></tr>'
      +(sellers.length?sellers.map(function(x){return '<tr><td>'+e(x.shop_name)+'</td><td>'+x.approved+'</td><td>'+x.eligible+'</td><td>'+e(x.level_name||"—")+'</td><td>'+dpInr(x.pending)+'</td><td>'+dpInr(x.credited)+'</td><td>'+dpInr(x.paid)+'</td>'
        +'<td><button onclick="adminSrFeature(\''+e(x.seller_id)+'\','+(!x.featured)+')">'+(x.featured?"Hatayein":"Feature karein")+'</button></td></tr>';}).join(""):'<tr><td colspan="8">Koi seller nahi mila</td></tr>')+'</table></div></div>';

    h+='<div class="dp-card"><h3>Reward transactions</h3><select class="dp-in" id="srFilter" onchange="adminSrFilter()"><option value="">Sabhi</option>'
      +Object.keys(ST).map(function(k){return '<option value="'+k+'"'+(k==FILTER?" selected":"")+'>'+ST[k]+'</option>';}).join("")+'</select>'
      +'<button class="dp-btn" onclick="adminSrExport()">CSV export</button><div style="overflow-x:auto;margin-top:8px"><table class="dp-table" style="width:100%;font-size:13px"><tr><th>#</th><th>Seller</th><th>Milestone</th><th>₹</th><th>Status</th><th>Wallet</th><th>Tarikh</th><th>Action</th></tr>'
      +(ms.length?ms.map(function(m){
        var b=[];
        if(m.status==="pending"||m.status==="investigating")b.push(btn(m.id,"approve","Approve"),btn(m.id,"reject","Reject"));
        if(m.status==="pending")b.push(btn(m.id,"investigate","Jaanch"));
        if(m.status==="investigating")b.push(btn(m.id,"release","Release"));
        if(m.status==="rejected")b.push(btn(m.id,"reopen","Reopen"));
        if(["achieved","pending","investigating","credited"].indexOf(m.status)>-1)b.push(btn(m.id,"revoke","Revoke"));
        return '<tr><td>'+m.id+'</td><td>'+e(m.shop_name||m.seller_id)+'</td><td>'+e(m.tier_name)+' ('+m.products_required+')</td><td>'+dpInr(m.reward_amount)+'</td><td>'+e(ST[m.status]||m.status)+(m.admin_note?'<br><small>'+e(m.admin_note)+'</small>':"")+'</td><td>'+e(m.wallet_status||"—")+(m.txn_ref?'<br><small>UTR '+e(m.txn_ref)+'</small>':"")+'</td><td>'+dpDate(m.achieved_at)+'</td><td>'+b.join(" ")+'</td></tr>';}).join(""):'<tr><td colspan="8">Koi record nahi</td></tr>')
      +'</table></div><div class="dp-hint">Paisa bhejna aur "Paid" mark karna Referral tab ke Payouts me hota hai (UTR zaruri). Yahan se sirf reward approve/reject hota hai.</div></div>';

    h+='<div class="dp-card"><h3>Audit log (financial badlav)</h3><div style="overflow-x:auto"><table class="dp-table" style="width:100%;font-size:12px"><tr><th>Samay</th><th>Action</th><th>Detail</th></tr>'
      +(au.length?au.map(function(a){return '<tr><td>'+dpDate(a.created_at)+'</td><td>'+e(a.action)+'</td><td><code style="white-space:pre-wrap;word-break:break-word">'+e(JSON.stringify(a.new_value||a.old_value||{}))+'</code></td></tr>';}).join(""):'<tr><td colspan="3">Abhi koi entry nahi</td></tr>')+'</table></div></div>';
    ROOT.innerHTML=h;
  }
  function st(l,v,g){return '<div class="dp-stat'+(g?" gold":"")+'"><small>'+e(l)+'</small><b>'+v+'</b></div>';}
  function chk(id,l,v){return '<label class="dp-l" style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" id="'+id+'"'+(v?" checked":"")+' style="margin-top:3px"> <span>'+e(l)+'</span></label>';}
  function btn(id,a,l){return '<button onclick="adminSrAct('+id+',\''+a+'\')">'+l+'</button>';}

  window.adminSrSaveSettings=function(){act(function(){return dpRpc("admin_sr_set_settings",{p_enabled:document.getElementById("srEn").checked,p_auto:document.getElementById("srAuto").checked,p_budget:Number(document.getElementById("srBud").value),p_start:iso("srStart"),p_end:iso("srEnd"),p_payout_day:Number(document.getElementById("srDay").value),p_feature_min_level:Number(document.getElementById("srFmin").value)});},"Settings save ho gayi");};
  window.adminSrSaveTier=function(i){act(function(){return dpRpc("admin_sr_save_tier",{p_id:i,p_level_no:Number(document.getElementById("tL"+i).value),p_name:document.getElementById("tN"+i).value,p_min:Number(document.getElementById("tM"+i).value),p_amount:Number(document.getElementById("tA"+i).value),p_reward_active:document.getElementById("tR"+i).checked,p_active:document.getElementById("tX"+i).checked,p_badge:document.getElementById("tB"+i).value});},"Level save ho gaya");};
  window.adminSrRunAll=function(){act(function(){return dpRpc("admin_sr_run_all");},"Progress dobara jaanch liya gaya");};
  window.adminSrSearch=function(){SEARCH=document.getElementById("srSearch").value.trim();load();};
  window.adminSrFilter=function(){FILTER=document.getElementById("srFilter").value;load();};
  window.adminSrFeature=function(id,on){act(function(){return dpRpc("admin_sr_feature",{p_seller:id,p_on:on,p_note:null});},on?"Featured ho gaya":"Featured hata diya");};
  window.adminSrAct=function(id,a){
    var note=null;
    if(["reject","investigate","revoke"].indexOf(a)>-1){note=prompt("Wajah likhein (kam se kam 5 akshar):");if(note===null)return;}
    else if(a==="approve"&&!confirm("Ye reward seller ke wallet me jama hoga. Pakka approve karein?"))return;
    act(function(){return dpRpc("admin_sr_action",{p_id:id,p_action:a,p_note:note});},"Action ho gaya: "+a);
  };
  window.adminSrExport=async function(){
    try{
      var rows=await dpRpc("admin_sr_milestones",{p_status:FILTER||null,p_search:SEARCH||null,p_limit:2000});
      var cols=["id","seller_id","shop_name","tier_name","products_required","products_at_achievement","reward_amount","status","wallet_status","txn_ref","admin_note","achieved_at","decided_at"];
      function cell(v){v=v==null?"":String(v);if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';}
      var csv=[cols.join(",")].concat(rows.map(function(r){return cols.map(function(c){return cell(r[c]);}).join(",");})).join("\r\n");
      var a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv"}));a.download="seller-rewards-"+new Date().toISOString().slice(0,10)+".csv";document.body.appendChild(a);a.click();a.remove();
    }catch(x){toast(x.message,false);}
  };
})();
