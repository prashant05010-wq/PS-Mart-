/* PS Mart - Admin: Coupons (list / add / edit / DELETE). Har kaam server RPC (admin_coupon*) se, jo admin check karta hai. dp-common.js zaruri. */
(function(){
  var ROOT, LIST=[], EDIT=null;
  function e(v){return dpEsc(v);}
  function msg(t,ok){var m=document.getElementById("cpMsg");if(m)dpMsg(m,t,ok?"ok":"bad");}
  function dval(v){if(!v)return "";var d=new Date(v);if(isNaN(d))return "";var p=function(n){return String(n).padStart(2,"0");};return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());}
  function num(id){var v=document.getElementById(id).value.trim();return v===""?null:Number(v);}

  window.adminCouponsInit=function(){ROOT=document.getElementById("cpRoot");if(!ROOT)return;load();};

  async function load(){
    try{LIST=await dpRpc("admin_coupons");draw();}
    catch(x){ROOT.innerHTML='<div class="dp-msg bad">'+e(x.message)+' (07-coupons-admin.sql chala hai?)</div>';}
  }
  function disc(c){return c.discount_type==="fixed"?dpInr(c.discount_value)+" OFF":Number(c.discount_value)+"% OFF";}

  function draw(){
    var c=EDIT?LIST.find(function(x){return String(x.id)===String(EDIT);})||{}:{};
    var h='<div id="cpMsg"></div><div class="dp-card"><h3>'+(EDIT?"Coupon badlein":"Naya coupon")+'</h3>'
      +'<label class="dp-l">Code (A-Z aur 0-9, jaise PSMART100)</label><input class="dp-in" id="cpCode" value="'+e(c.code||"")+'" maxlength="20">'
      +'<label class="dp-l">Title</label><input class="dp-in" id="cpTitle" value="'+e(c.title||"")+'">'
      +'<label class="dp-l">Description (optional)</label><input class="dp-in" id="cpDesc" value="'+e(c.description||"")+'">'
      +'<label class="dp-l">Type</label><select class="dp-in" id="cpType"><option value="fixed"'+(c.discount_type!=="percentage"?" selected":"")+'>Fixed (₹)</option><option value="percentage"'+(c.discount_type==="percentage"?" selected":"")+'>Percentage (%)</option></select>'
      +'<label class="dp-l">Discount value</label><input class="dp-in" id="cpVal" type="number" min="1" step="0.01" value="'+e(c.discount_value||"")+'">'
      +'<label class="dp-l">Minimum order (₹)</label><input class="dp-in" id="cpMin" type="number" min="0" value="'+e(c.minimum_order==null?0:c.minimum_order)+'">'
      +'<label class="dp-l">Maximum discount (₹, percentage ke liye; khali = koi limit nahi)</label><input class="dp-in" id="cpMax" type="number" min="1" value="'+e(c.maximum_discount==null?"":c.maximum_discount)+'">'
      +'<label class="dp-l">Kul kitni baar use ho sakta hai (khali = bina limit)</label><input class="dp-in" id="cpLim" type="number" min="1" value="'+e(c.usage_limit==null?"":c.usage_limit)+'">'
      +'<label class="dp-l">Ek customer kitni baar</label><input class="dp-in" id="cpPer" type="number" min="1" value="'+e(c.per_user_limit||1)+'">'
      +'<label class="dp-l">Khatam hone ki tarikh (khali = kabhi nahi)</label><input class="dp-in" id="cpExp" type="date" value="'+dval(c.expires_at)+'">'
      +'<label class="dp-l" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="cpAct"'+(c.active===false?"":" checked")+'> Chalu (customers ko dikhega)</label>'
      +'<button class="dp-btn" onclick="adminCouponSave()">'+(EDIT?"Badlav save karein":"Coupon banayein")+'</button>'
      +(EDIT?'<button class="dp-btn" style="background:#7c6a58" onclick="adminCouponEdit(null)">Raddh karein</button>':"")+'</div>';

    h+='<div class="dp-card"><h3>Sabhi coupons ('+LIST.length+')</h3><div style="overflow-x:auto"><table class="dp-table" style="width:100%;font-size:13px"><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Use</th><th>Per customer</th><th>Expiry</th><th>Status</th><th></th></tr>'
      +(LIST.length?LIST.map(function(x){
        var exp=x.expires_at&&new Date(x.expires_at)<new Date();
        return '<tr><td><b>'+e(x.code)+'</b><br><small>'+e(x.title||"")+'</small></td><td>'+disc(x)+'</td><td>'+dpInr(x.minimum_order||0)+'</td>'
          +'<td>'+Number(x.used_count||0)+(x.usage_limit!=null?' / '+x.usage_limit:' / ∞')+'</td><td>'+Number(x.per_user_limit||1)+'</td>'
          +'<td>'+(x.expires_at?dpDate(x.expires_at):"—")+(exp?' <small style="color:#c62828">(khatam)</small>':"")+'</td><td>'+(x.active?"Chalu":"Band")+'</td>'
          +'<td style="white-space:nowrap"><button onclick="adminCouponEdit(\''+e(x.id)+'\')">Edit</button> <button onclick="adminCouponToggle(\''+e(x.id)+'\')">'+(x.active?"Band":"Chalu")+'</button> <button style="color:#c62828" onclick="adminCouponDelete(\''+e(x.id)+'\')">Delete</button></td></tr>';}).join(""):'<tr><td colspan="8">Abhi koi coupon nahi</td></tr>')
      +'</table></div><div class="dp-hint">Delete karne par coupon hamesha ke liye hat jata hai. Pehle ke orders par koi asar nahi padta. Agar sirf rokna ho to "Band" dabayein.</div></div>';
    ROOT.innerHTML=h;
  }

  function save(c,over){
    return dpRpc("admin_coupon_save",{
      p_id:c.id==null?null:String(c.id),p_code:c.code,p_title:c.title,p_description:c.description||null,p_type:c.discount_type,p_value:Number(c.discount_value),
      p_min:c.minimum_order==null?0:Number(c.minimum_order),p_max:c.maximum_discount==null?null:Number(c.maximum_discount),
      p_limit:c.usage_limit==null?null:Number(c.usage_limit),p_per_user:Number(c.per_user_limit||1),
      p_expires:c.expires_at||null,p_active:over&&over.active!==undefined?over.active:c.active});
  }
  window.adminCouponEdit=function(id){EDIT=id;draw();if(id)ROOT.scrollIntoView();};
  window.adminCouponSave=async function(){
    try{
      var exp=document.getElementById("cpExp").value;
      await save({id:EDIT,code:document.getElementById("cpCode").value,title:document.getElementById("cpTitle").value,description:document.getElementById("cpDesc").value,
        discount_type:document.getElementById("cpType").value,discount_value:num("cpVal"),minimum_order:num("cpMin"),maximum_discount:num("cpMax"),
        usage_limit:num("cpLim"),per_user_limit:num("cpPer"),expires_at:exp?new Date(exp+"T23:59:59").toISOString():null,active:document.getElementById("cpAct").checked});
      EDIT=null;await load();msg("Coupon save ho gaya",true);
    }catch(x){msg(x.message,false);}
  };
  window.adminCouponToggle=async function(id){
    var c=LIST.find(function(x){return String(x.id)===String(id);});if(!c)return;
    try{await save(c,{active:!c.active});await load();msg(c.active?"Coupon band kar diya":"Coupon chalu kar diya",true);}catch(x){msg(x.message,false);}
  };
  window.adminCouponDelete=async function(id){
    var c=LIST.find(function(x){return String(x.id)===String(id);});if(!c)return;
    if(!confirm("Coupon "+c.code+" hamesha ke liye delete karna hai?"))return;
    try{await dpRpc("admin_coupon_delete",{p_id:String(id)});if(String(EDIT)===String(id))EDIT=null;await load();msg("Coupon delete ho gaya",true);}catch(x){msg(x.message,false);}
  };
})();
