/* PS Mart Admin - Delivery Management (naya file). Saare kaam server RPC se hote hain; har RPC admin check karta hai. */
(function(){
  var root=null,TAB="req",PARTNERS=[];
  var TABS=[["req","📝 Registration"],["part","👥 Partners"],["assign","🧾 Assign"],["mon","📡 Monitoring"],["earn","💵 Earnings"],["pay","💸 Weekly Payout"],["set","⚙️ Rates"],["audit","🔍 Audit"]];
  var E=dpEsc;
  function tbl(head,rows){return '<div class="dp-scroll"><table class="dp-table"><thead><tr>'+head.map(function(h){return '<th>'+E(h)+'</th>';}).join("")+'</tr></thead><tbody>'+(rows.length?rows.join(""):'<tr><td colspan="'+head.length+'">Kuch nahi mila</td></tr>')+'</tbody></table></div>';}
  function btn(t,fn,cls){return '<button class="dp-btn sm '+(cls||"")+'" onclick="'+fn+'">'+E(t)+'</button>';}
  function err(e){alert(friendly(e.message||e));}
  async function act(fn){try{await fn();}catch(e){err(e);}await draw();}
  function ymd(d){return d.toISOString().slice(0,10);}
  function weekRange(){var n=new Date(Date.now()+5.5*3600*1000),dow=(n.getUTCDay()+6)%7,s=new Date(n.getTime()-dow*86400000),e=new Date(s.getTime()+6*86400000);return [ymd(s),ymd(e)];}

  window.adminDpInit=function(){
    root=document.getElementById("dpAdminRoot");if(!root)return;
    root.innerHTML='<div class="dp-pills" style="flex-wrap:wrap;gap:6px">'+TABS.map(function(t){return '<button style="flex:0 0 auto;padding:8px 12px" id="dpt-'+t[0]+'" onclick="adminDpTab(\''+t[0]+'\')">'+t[1]+'</button>';}).join("")+'</div><div id="dpBody">Loading...</div>';
    adminDpTab(TAB);
  };
  window.adminDpTab=function(t){TAB=t;TABS.forEach(function(x){var b=document.getElementById("dpt-"+x[0]);if(b)b.classList.toggle("on",x[0]===t);});draw();};
  async function draw(){
    var body=document.getElementById("dpBody");if(!body)return;
    try{
      PARTNERS=await dpRpc("admin_dp_list",{p_status:null});
      body.innerHTML=await ({req:vReq,part:vPart,assign:vAssign,mon:vMon,earn:vEarn,pay:vPay,set:vSet,audit:vAudit}[TAB])();
    }catch(e){body.innerHTML='<div class="dp-msg bad">'+E(friendly(e.message))+'</div>';}
  }
  function friendly(m){
    m=String(m||"");
    if(/could not find the function|does not exist|schema cache/i.test(m))return "Delivery ka SQL Supabase me abhi run nahi hua (ya adhura run hua). 2-SUPABASE-1-delivery.sql dobara run karein. ("+m+")";
    if(/Sirf admin/i.test(m))return "Server aapko admin nahi maan raha (is_admin() false). admin-selftest.html kholkar check karein. ("+m+")";
    return m;
  }

  /* ---- Registration requests ---- */
  async function vReq(){
    var rows=PARTNERS.filter(function(p){return p.status==="pending";}).map(function(p){
      return '<tr><td><b>'+E(p.full_name)+'</b><br>'+E(p.partner_code)+'</td><td>'+E(p.mobile)+'<br>'+E(p.email)+'</td><td>'+E([p.address,p.city,p.pin_code].filter(Boolean).join(", "))+'</td><td>ID doc: '+(p.id_doc_path?"✅":"❌")+'<br>Photo: '+(p.photo_path?"✅":"❌")+'<br>'+(p.id_doc_path?btn("Doc dekhein","adminDpDoc(\''+p.id+'\',\'id\')","line"):"")+(p.photo_path?btn("Photo","adminDpDoc(\''+p.id+'\',\'photo\')","line"):"")+'</td><td>'+dpDate(p.created_at)+'</td><td>'+btn("Approve","adminDpSet(\''+p.id+'\',\'approved\')","green")+btn("Reject","adminDpSet(\''+p.id+'\',\'rejected\')","red")+'</td></tr>';});
    return '<h3>Registration Requests</h3>'+tbl(["Naam","Contact","Address","Verification","Date","Action"],rows);
  }
  window.adminDpDoc=async function(id,kind){
    var p=PARTNERS.find(function(x){return x.id===id;});var path=p&&(kind==="id"?p.id_doc_path:p.photo_path);
    var u=await dpSignedUrl(path);if(!u)return alert("File nahi khul paayi");window.open(u,"_blank","noopener");
  };
  window.adminDpSet=function(id,status){
    var note="";
    if(status!=="approved"){note=prompt(status==="rejected"?"Reject karne ki wajah (partner ko dikhegi):":"Suspend karne ki wajah:");if(note===null)return;}
    else if(!confirm("Is partner ko approve karna hai?"))return;
    act(function(){return dpRpc("admin_dp_set_status",{p_id:id,p_status:status,p_note:note});});
  };

  /* ---- Partners ---- */
  async function vPart(){
    var q=(window.__dpq||"").toLowerCase();
    var rows=PARTNERS.filter(function(p){return p.status!=="pending"&&(!q||(p.full_name+p.partner_code+p.mobile+p.email).toLowerCase().indexOf(q)>-1);}).map(function(p){
      return '<tr><td><b>'+E(p.full_name)+'</b><br>'+E(p.partner_code)+(p.is_seller_person?'<br><small>Seller team</small>':'')+'</td><td>'+E(p.mobile)+'<br>'+E(p.email)+'</td><td>'+dpBadge(p.status)+'</td><td>'+dpBadge(p.bank_status)+'</td><td>'+Number(p.deliveries||0)+'</td><td>'
      +(p.status==="approved"?btn("Suspend","adminDpSet(\''+p.id+'\',\'suspended\')","red"):btn("Reactivate","adminDpSet(\''+p.id+'\',\'approved\')","green"))
      +btn("Bank","adminDpBank(\''+p.id+'\')","line")+(p.id_doc_path?btn("ID doc","adminDpDoc(\''+p.id+'\',\'id\')","line"):"")+'</td></tr>';});
    return '<h3>Partners</h3><input class="dp-in" placeholder="Naam / ID / mobile se search" value="'+E(window.__dpq||"")+'" oninput="window.__dpq=this.value;adminDpTab(\'part\')" style="max-width:360px;margin-bottom:10px">'+tbl(["Partner","Contact","Status","Bank","Deliveries","Action"],rows);
  }
  window.adminDpBank=async function(id){
    try{var b=await dpRpc("admin_dp_bank",{p_id:id});
      if(!b.added)return alert("Bank details add nahi hui.");
      var ok=confirm("Account: "+b.account_name+"\nNumber: "+b.account_number+"\nIFSC: "+b.ifsc+(b.upi_id?"\nUPI: "+b.upi_id:"")+"\n\n(Ye dekhna audit log me record hua.)\n\nOK = Verified mark karein, Cancel = abhi nahi");
      if(ok)await dpRpc("admin_dp_set_bank_status",{p_id:id,p_status:"verified"});
      else if(confirm("Bank details REJECT karni hain?"))await dpRpc("admin_dp_set_bank_status",{p_id:id,p_status:"rejected"});
      draw();
    }catch(e){err(e);}
  };

  /* ---- Order assignment ---- */
  async function vAssign(){
    var o=await dpRpc("admin_dp_ready_orders");
    var approved=PARTNERS.filter(function(p){return p.status==="approved";});
    var opts='<option value="">Partner chuniye</option><optgroup label="PS Mart Partners">'+approved.filter(function(p){return !p.is_seller_person;}).map(function(p){return '<option value="psmart:'+p.id+'">'+E(p.full_name)+' ('+E(p.partner_code)+')</option>';}).join("")+'</optgroup><optgroup label="Seller ke delivery log">'+approved.filter(function(p){return p.is_seller_person;}).map(function(p){return '<option value="seller:'+p.id+'">'+E(p.full_name)+' ('+E(p.partner_code)+')</option>';}).join("")+'</optgroup>';
    var rows=o.map(function(r){
      var has=r.assignment_id;
      return '<tr><td>#'+E(r.order_id)+'<br><small>'+E(r.status)+'</small></td><td>'+E(r.shop_name||"—")+'<br><small>Method: '+(r.seller_method==="own"?"Seller ka apna":"PS Mart")+'</small></td><td>'+(r.has_label?"✅ Label":"❌ Label nahi")+'</td><td>'+(has?E(r.partner_name||"")+'<br>'+dpBadge(r.assignment_status)+'<br><small>'+(r.delivery_type==="psmart"?"PS Mart":"Seller")+'</small>':"—")+'</td><td>'
      +(r.assignment_status==="delivered"?"Delivered":'<select class="dp-in" id="sel-'+E(r.seller_order_id)+'" style="padding:8px;font-size:14px">'+opts+'</select>'+btn(has?"Reassign":"Assign","adminDpAssign(\''+E(r.seller_order_id)+'\','+(has?1:0)+')","gold")
      +(has&&(r.assignment_status==="failed"||r.assignment_status==="scanned"||r.assignment_status==="assigned")?btn("Reschedule","adminDpResched("+r.assignment_id+")","line"):""))+'</td></tr>';});
    return '<h3>Dispatch ke liye ready orders</h3><div class="dp-hint">Partner assign karne se pehle seller ne label/QR banaya hona chahiye.</div>'+tbl(["Order","Seller","Label","Abhi ka assignment","Action"],rows);
  }
  window.adminDpAssign=function(so,re){
    var v=(document.getElementById("sel-"+so)||{}).value;if(!v)return alert("Partner chuniye");
    var p=v.split(":");act(function(){return dpRpc(re?"admin_dp_reassign":"admin_dp_assign",{p_so:so,p_person:p[1],p_type:p[0]});});
  };
  window.adminDpResched=function(aid){
    var d=prompt("Nayi delivery date/time (YYYY-MM-DD HH:MM, IST):",ymd(new Date(Date.now()+86400000))+" 11:00");if(!d)return;
    var t=new Date(d.replace(" ","T")+":00+05:30");if(isNaN(t))return alert("Date galat hai");
    var n=prompt("Note (optional):")||"";act(function(){return dpRpc("admin_dp_reschedule",{p_assignment_id:aid,p_when:t.toISOString(),p_note:n});});
  };

  /* ---- Monitoring ---- */
  async function vMon(){
    var m=await dpRpc("admin_dp_monitor",{p_limit:100}),ev=await dpRpc("admin_dp_events",{p_limit:100});
    var c=m.counts||{};
    var h='<h3>Delivery Monitoring</h3><div class="dp-grid">'+["assigned","scanned","delivered","failed","rescheduled"].map(function(k){return '<div class="dp-stat"><small>'+E(dpStatusLabel(k))+'</small><b>'+Number(c[k]||0)+'</b></div>';}).join("")+'</div>';
    h+='<h4>Deliveries</h4>'+tbl(["Order","Partner","Type","Status","QR scan","OTP galat","Time","Action"],(m.rows||[]).map(function(r){
      return '<tr><td>#'+E(r.order_id)+'</td><td>'+E(r.partner_name)+'<br><small>'+E(r.partner_code)+'</small></td><td>'+(r.delivery_type==="psmart"?"PS Mart":"Seller")+'</td><td>'+dpBadge(r.status)+(r.fail_reason?'<br><small>'+E(r.fail_reason)+'</small>':'')+(r.reschedule_request?'<br><small>🔁 '+E(r.reschedule_request)+'</small>':'')+'</td><td>'+(r.scanned_at?dpDate(r.scanned_at):"—")+'</td><td>'+Number(r.otp_fails||0)+'</td><td>'+dpDate(r.delivered_at||r.assigned_at)+'</td><td>'+((r.status==="failed"||r.reschedule_request)?btn("Reschedule","adminDpResched("+r.id+")","line"):"")+'</td></tr>';}));
    h+='<h4 style="margin-top:18px">QR / OTP / Event records</h4>'+tbl(["Time","Event","Order","Partner","Detail"],(ev||[]).map(function(e){return '<tr><td>'+dpDate(e.created_at)+'</td><td>'+E(e.event)+'</td><td>'+E(e.order_id||"—")+'</td><td>'+E(e.partner_name||"—")+'</td><td>'+E(e.reason||"")+'</td></tr>';}));
    return h;
  }

  /* ---- Earnings ---- */
  async function vEarn(){
    var per=window.__dpper||"week",r=await dpRpc("admin_dp_earnings_report",{p_period:per});
    var tot=r.reduce(function(a,x){return a+Number(x.period_earned);},0);
    return '<h3>Earnings Reports</h3><div class="dp-row" style="max-width:360px"><select class="dp-in" onchange="window.__dpper=this.value;adminDpTab(\'earn\')"><option value="day"'+(per==="day"?" selected":"")+'>Daily (aaj)</option><option value="week"'+(per==="week"?" selected":"")+'>Weekly (is hafte)</option><option value="month"'+(per==="month"?" selected":"")+'>Monthly (is mahine)</option></select></div><div class="dp-hint">Seller ke apne delivery log is report me nahi aate (alag rakhe gaye hain). Kul period earning: <b>'+dpInr(tot)+'</b></div>'
    +tbl(["Partner","Deliveries","Period earning","Pending","Paid","Action"],r.map(function(x){return '<tr><td><b>'+E(x.full_name)+'</b><br>'+E(x.partner_code)+'</td><td>'+Number(x.deliveries)+'</td><td>'+dpInr(x.period_earned)+'</td><td>'+dpInr(x.pending_total)+'</td><td>'+dpInr(x.paid_total)+'</td><td>'+btn("Detail","adminDpEarnDetail(\''+x.person_id+'\')","line")+btn("Payout banayein","adminDpPayout(\''+x.person_id+'\')","gold")+'</td></tr>';}));
  }
  window.adminDpEarnDetail=async function(pid){
    try{var r=await dpRpc("admin_dp_person_earnings",{p_person:pid});
      document.getElementById("dpBody").insertAdjacentHTML("beforeend",'<div class="dp-card" id="dpDetail"><h3>Earning detail</h3>'+tbl(["#","Order","Type","Amount","Status","Date","Action"],r.map(function(e){return '<tr><td>'+e.id+'</td><td>'+E(e.order_id||"—")+'</td><td>'+E(e.kind)+'</td><td>'+dpInr(e.amount)+'</td><td>'+dpBadge(e.status)+'</td><td>'+dpDate(e.earned_at)+'</td><td>'+((e.status==="pending"||e.status==="paid")&&e.kind!=="adjustment"?btn("Reverse","adminDpReverse("+e.id+")","red"):"")+'</td></tr>';}))+'</div>');
      document.getElementById("dpDetail").scrollIntoView({behavior:"smooth"});
    }catch(e){err(e);}
  };
  window.adminDpReverse=function(id){var w=prompt("Reverse karne ki wajah (zaruri):");if(!w)return;act(function(){return dpRpc("admin_dp_reverse_earning",{p_earning:id,p_reason:w});});};
  window.adminDpPayout=async function(pid){
    var wr=weekRange(),s=prompt("Payout period shuru (YYYY-MM-DD):",wr[0]);if(!s)return;var e=prompt("Payout period khatam (YYYY-MM-DD):",wr[1]);if(!e)return;
    try{var el=await dpRpc("admin_dp_eligible",{p_person:pid,p_start:s,p_end:e});
      if(!Number(el.amount))return alert("Is period me eligible earning nahi hai.");
      if(!confirm("Eligible: "+el.count+" entries, kul "+dpInr(el.amount)+"\n\nPayout record banana hai? (Ye abhi 'Paid' nahi hoga. Paisa bhejne ke baad 'Weekly Payout' tab me reference ke saath Paid mark karein.)"))return;
      await dpRpc("admin_dp_create_payout",{p_person:pid,p_start:s,p_end:e});alert("Payout record ban gaya (Pending).");adminDpTab("pay");
    }catch(x){err(x);}
  };

  /* ---- Weekly payout ---- */
  async function vPay(){
    var r=await dpRpc("admin_dp_payouts",{p_person:null});
    return '<h3>Weekly Payout Management</h3><div class="dp-hint">Paid mark karne se pehle paisa bhej dein aur transaction reference/UTR yahan save karein. Reference ke bina Paid nahi hota.</div>'
    +tbl(["#","Partner","Period","Amount","Status","Reference","Action"],r.map(function(p){return '<tr><td>'+p.id+'</td><td><b>'+E(p.full_name)+'</b><br>'+E(p.partner_code)+'</td><td>'+dpDay(p.period_start)+' – '+dpDay(p.period_end)+'</td><td>'+dpInr(p.amount)+'</td><td>'+dpBadge(p.status)+(p.paid_at?'<br><small>'+dpDate(p.paid_at)+'</small>':'')+'</td><td>'+E(p.txn_ref||"—")+'</td><td>'+(p.status==="pending"?btn("Mark Paid","adminDpPaid("+p.id+")","green")+btn("Cancel","adminDpCancelPay("+p.id+")","red"):"")+'</td></tr>';}));
  }
  window.adminDpPaid=function(id){var t=prompt("Payment confirm hone ke baad Transaction Reference / UTR likhein:");if(!t)return;if(!confirm("Pakka? Ref: "+t+"\nPartner ko 'Paid' dikhega."))return;act(function(){return dpRpc("admin_dp_mark_payout_paid",{p_payout:id,p_txn_ref:t});});};
  window.adminDpCancelPay=function(id){if(!confirm("Payout cancel karna hai? Earnings wapas pending ho jayengi."))return;act(function(){return dpRpc("admin_dp_cancel_payout",{p_payout:id,p_note:"cancelled by admin"});});};

  /* ---- Rates ---- */
  async function vSet(){
    var s=await dpRpc("admin_dp_settings");
    return '<h3>Delivery Earning Rates</h3><div class="dp-card" style="max-width:420px"><label class="dp-l">Ek successful delivery ka rate (₹)</label><input class="dp-in" id="dpRate" type="number" min="0" step="0.5" value="'+E(s.rate_per_delivery)+'"><label class="dp-l">Incentive: ek din me itni deliveries par (0 = band)</label><input class="dp-in" id="dpThr" type="number" min="0" value="'+E(s.incentive_threshold)+'"><label class="dp-l">Incentive amount (₹)</label><input class="dp-in" id="dpInc" type="number" min="0" step="0.5" value="'+E(s.incentive_amount)+'"><button class="dp-btn gold" onclick="adminDpSaveSet()">Save</button><div class="dp-hint">Naya rate sirf aage ki deliveries par lagega. Purani earnings nahi badalti.</div></div>';
  }
  window.adminDpSaveSet=function(){act(function(){return dpRpc("admin_dp_set_settings",{p_rate:Number(document.getElementById("dpRate").value),p_threshold:parseInt(document.getElementById("dpThr").value||"0",10),p_incentive:Number(document.getElementById("dpInc").value||0)});});};

  /* ---- Audit ---- */
  async function vAudit(){
    var r=await dpRpc("admin_dp_audit",{p_limit:150});
    return '<h3>Admin Audit Trail</h3>'+tbl(["Time","Action","Target","Details"],r.map(function(a){return '<tr><td>'+dpDate(a.created_at)+'</td><td>'+E(a.action)+'</td><td>'+E(a.target||"")+'</td><td><small>'+E(a.details?JSON.stringify(a.details):"")+'</small></td></tr>';}));
  }
})();
