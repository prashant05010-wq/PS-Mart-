/* PS Mart Admin - Product Setup: categories, subcategories, category-wise fields, products & variants.
   Har kaam server RPC se; har RPC admin check karta hai. Buttons ke arguments JSON se safe bheje jate hain. */
(function(){
  var E=dpEsc,T="prod",OV=null,CATSEL=null;
  var COLS=["","brand","model_number","color","size","material","weight","warranty","in_the_box","country_of_origin","manufacturer","packer","hsn_code"];
  function btn(t,fn,cls,args){var call=args?fn+"("+args.map(function(a){return E(JSON.stringify(a));}).join(",")+")":fn;return '<button class="dp-btn sm '+(cls||"")+'" onclick="'+call+'">'+E(t)+'</button>';}
  function tbl(h,rows){return '<div class="dp-scroll"><table class="dp-table"><thead><tr>'+h.map(function(x){return '<th>'+E(x)+'</th>';}).join("")+'</tr></thead><tbody>'+(rows.length?rows.join(""):'<tr><td colspan="'+h.length+'">Kuch nahi mila</td></tr>')+'</tbody></table></div>';}
  function friendly(m){m=String(m||"");
    if(/could not find the function|does not exist|schema cache/i.test(m))return "Product setup ka SQL abhi run nahi hua. 2-SUPABASE-11-category-products.sql chalayein. ("+m+")";
    if(/Sirf admin/i.test(m))return "Server aapko admin nahi maan raha (is_admin() false). admin-selftest.html se check karein.";return m;}
  function err(e){alert(friendly(e.message||e));}
  async function act(fn){try{await fn();}catch(e){err(e);}draw();}
  var TABS=[["prod","📦 Products & Variants"],["cats","🗂️ Categories"],["subs","🔖 Subcategories"],["fields","🧩 Category Fields"],["audit","🔍 Audit"]];
  window.adminPfInit=function(){if(document.getElementById("pfRoot"))adminPfTab(T);};
  window.adminPfTab=function(t){T=t;draw();};
  async function draw(){
    var root=document.getElementById("pfRoot");if(!root)return;
    root.innerHTML='<div class="dp-pills" style="flex-wrap:wrap;gap:6px">'+TABS.map(function(t){return '<button style="flex:0 0 auto;padding:8px 12px" class="'+(t[0]===T?"on":"")+'" onclick="adminPfTab(\''+t[0]+'\')">'+t[1]+'</button>';}).join("")+'</div><div id="pfBody">Loading...</div>';
    var b=document.getElementById("pfBody");
    try{if(T!=="prod"&&T!=="audit")OV=await dpRpc("admin_pf_overview");
      b.innerHTML=await ({prod:vProd,cats:vCats,subs:vSubs,fields:vFields,audit:vAudit}[T])();}
    catch(e){b.innerHTML='<div class="dp-msg bad">'+E(friendly(e.message))+'</div>';}
  }

  /* ---------- Products & Variants ---------- */
  async function vProd(){
    var f=window.__pfStatus||"",g=await dpRpc("admin_pf_groups",{p_status:f||null,p_limit:150});
    return '<h3>Products &amp; Variants</h3><div class="dp-row" style="max-width:300px"><select class="dp-in" onchange="window.__pfStatus=this.value;adminPfTab(\'prod\')"><option value="">Sab</option><option value="pending"'+(f==="pending"?" selected":"")+'>Pending</option><option value="approved"'+(f==="approved"?" selected":"")+'>Approved</option><option value="rejected"'+(f==="rejected"?" selected":"")+'>Rejected</option></select></div>'
    +'<div class="dp-hint">Ek variant approve/reject karne par us group ke baaki pending variants ka bhi wahi status ho jata hai. "Dekhein" se har variant ka price/MRP/stock badal sakte hain.</div>'
    +tbl(["Product","Seller","Category","Variants","Stock","Price","Status","Action"],g.map(function(x){
      return '<tr><td><b>'+E(x.name)+'</b><br><small>'+E(x.subcategory||"")+' · '+dpDay(x.created_at)+'</small></td><td>'+E(x.shop||"—")+'</td><td>'+E(x.category||"—")+'</td><td>'+x.variants+'</td><td>'+(Number(x.stock)===0?'<b style="color:#c62828">0</b>':x.stock)+'</td><td>'+dpInr(x.min_price)+(x.max_price!==x.min_price?' – '+dpInr(x.max_price):'')+'</td><td><small>⏳ '+x.pending+' · ✅ '+x.approved+' · ❌ '+x.rejected+'</small></td><td>'+btn("Dekhein","adminPfView","line",[x.gkey])+(x.pending>0?btn("Approve","adminPfStatus","green",[x.gkey,"approved"]):"")+(x.rejected<x.variants?btn("Reject","adminPfStatus","red",[x.gkey,"rejected"]):"")+'</td></tr>';}));
  }
  window.adminPfStatus=function(k,s){var n=null;if(s==="rejected"){n=prompt("Reject ki wajah (seller ko dikhegi, zaruri):");if(!n)return;}else if(!confirm("Is product ke saare pending variants approve karne hain?"))return;act(function(){return dpRpc("admin_pf_set_group_status",{p_gkey:k,p_status:s,p_note:n});});};
  window.adminPfView=async function(k){
    try{var v=await dpRpc("admin_pf_variants",{p_gkey:k});
      var h='<div class="dp-card" id="pfV"><h3>Variants</h3>'+tbl(["#","Variant","Price ₹","MRP ₹","Stock","Status","Action"],v.map(function(x){
        return '<tr><td>'+x.id+'</td><td><b>'+E(x.variant_label||"—")+'</b><br><small>'+E(x.name)+(x.listing_hidden?' · listing me chhupa':' · listing me dikhta')+'</small></td><td><input class="dp-in" id="vp'+x.id+'" type="number" step="0.01" style="width:90px;padding:6px" value="'+E(x.price)+'"></td><td><input class="dp-in" id="vm'+x.id+'" type="number" step="0.01" style="width:90px;padding:6px" value="'+E(x.old_price)+'"></td><td><input class="dp-in" id="vs'+x.id+'" type="number" style="width:70px;padding:6px" value="'+E(x.stock)+'"></td><td><select class="dp-in" id="vt'+x.id+'" style="padding:6px"><option'+(x.status==="pending"?" selected":"")+'>pending</option><option'+(x.status==="approved"?" selected":"")+'>approved</option><option'+(x.status==="rejected"?" selected":"")+'>rejected</option></select></td><td>'+btn("Save","adminPfSaveVar","gold",[x.id])+'</td></tr>';}))+'</div>';
      var o=document.getElementById("pfV");if(o)o.remove();document.getElementById("pfBody").insertAdjacentHTML("beforeend",h);document.getElementById("pfV").scrollIntoView({behavior:"smooth"});
    }catch(e){err(e);}
  };
  window.adminPfSaveVar=function(id){function g(p){return document.getElementById(p+id).value;}act(function(){return dpRpc("admin_pf_update_variant",{p_id:id,p_price:Number(g("vp")),p_old_price:Number(g("vm")),p_stock:parseInt(g("vs"),10),p_status:g("vt")});});};

  /* ---------- Categories ---------- */
  async function vCats(){
    return '<h3>Categories</h3>'+tbl(["#","Category","Products","Active fields"],OV.categories.map(function(c){return '<tr><td>'+c.id+'</td><td><b>'+E(c.name)+'</b></td><td>'+c.products+'</td><td>'+c.fields+'</td></tr>';}))
    +'<div class="dp-card" style="max-width:420px;margin-top:12px"><h3>Nayi category</h3><input class="dp-in" id="pcN" maxlength="60" placeholder="Category ka naam"><button class="dp-btn gold" onclick="adminPfAddCat()">Jodein</button><div class="dp-hint">Category jodne ke baad "Category Fields" me uske fields banayein. Commission rate 💹 Commission tab me set hoga.</div></div>';
  }
  window.adminPfAddCat=function(){act(function(){return dpRpc("admin_pf_add_category",{p_name:document.getElementById("pcN").value});});};
  function catSelect(fn){var cur=CATSEL||(OV.categories[0]&&OV.categories[0].id);CATSEL=cur;return '<select class="dp-in" style="max-width:300px" onchange="'+fn+'(Number(this.value))">'+OV.categories.map(function(c){return '<option value="'+c.id+'"'+(c.id===cur?" selected":"")+'>'+E(c.name)+'</option>';}).join("")+'</select>';}
  window.adminPfPickCat=function(id){CATSEL=id;draw();};

  /* ---------- Subcategories ---------- */
  async function vSubs(){
    var h='<h3>Subcategories</h3>'+catSelect("adminPfPickCat");
    var list=OV.subcategories.filter(function(s){return s.category_id===CATSEL;});
    h+=tbl(["Naam","Order","Active","Action"],list.map(function(s){return '<tr><td><input class="dp-in" id="sn'+s.id+'" style="padding:6px" value="'+E(s.name)+'"></td><td><input class="dp-in" id="so'+s.id+'" type="number" style="width:70px;padding:6px" value="'+s.sort+'"></td><td><input type="checkbox" id="sa'+s.id+'" '+(s.active?"checked":"")+' style="width:20px;height:20px"></td><td>'+btn("Save","adminPfSaveSub","gold",[s.id])+'</td></tr>';}));
    return h+'<div class="dp-card" style="max-width:420px;margin-top:12px"><h4>Nayi subcategory</h4><input class="dp-in" id="nsN" maxlength="60" placeholder="Naam"><button class="dp-btn gold" onclick="adminPfNewSub()">Jodein</button></div>';
  }
  window.adminPfSaveSub=function(id){act(function(){return dpRpc("admin_pf_save_subcat",{p_id:id,p_cat:CATSEL,p_name:document.getElementById("sn"+id).value,p_sort:parseInt(document.getElementById("so"+id).value||"100",10),p_active:document.getElementById("sa"+id).checked});});};
  window.adminPfNewSub=function(){act(function(){return dpRpc("admin_pf_save_subcat",{p_id:null,p_cat:CATSEL,p_name:document.getElementById("nsN").value,p_sort:100,p_active:true});});};

  /* ---------- Fields ---------- */
  var FEDIT=null;
  async function vFields(){
    var list=OV.fields.filter(function(f){return f.category_id===CATSEL;});
    window.__pfFields={};list.forEach(function(f){window.__pfFields[f.id]=f;});
    var f=FEDIT||{id:null,key:"",label:"",type:"text",options:[],required:false,scope:"spec",col:"",sort:100,active:true,help:"",placeholder:""};
    var h='<h3>Category-wise Fields</h3>'+catSelect("adminPfPickCat")
    +'<div class="dp-hint">Seller jab ye category chunta hai to yahi fields uske form me aate hain. "Variant" scope wale fields se size/color/RAM jaise variants bante hain (har combination ka alag stock).</div>'
    +tbl(["Order","Label (key)","Type","Scope","Required","Maps to","Active","Action"],list.map(function(x){return '<tr><td>'+x.sort+'</td><td><b>'+E(x.label)+'</b><br><small>'+E(x.key)+(x.options&&x.options.length?' · '+E(x.options.join(", ")):'')+'</small></td><td>'+E(x.type)+'</td><td>'+(x.scope==="variant"?"🔀 Variant":"Spec")+'</td><td>'+(x.required?"✅":"—")+'</td><td>'+E(x.col||"—")+'</td><td>'+(x.active?"✅":"❌")+'</td><td>'+btn("Edit","adminPfEditField","line",[x.id])+'</td></tr>';}));
    h+='<div class="dp-card" style="max-width:520px;margin-top:12px"><h4>'+(f.id?"Field edit (#"+f.id+")":"Naya field")+'</h4>'
    +'<label class="dp-l">Label (seller ko jo dikhega)</label><input class="dp-in" id="fL" maxlength="60" value="'+E(f.label)+'">'
    +'<label class="dp-l">Key (chhote akshar, jaise battery_size)</label><input class="dp-in" id="fK" maxlength="31" value="'+E(f.key)+'">'
    +'<label class="dp-l">Type</label><select class="dp-in" id="fT">'+["text","number","select","multiselect","tags","textarea","date"].map(function(t){return '<option'+(f.type===t?" selected":"")+'>'+t+'</option>';}).join("")+'</select>'
    +'<label class="dp-l">Options (select/multiselect ke liye, comma se alag)</label><input class="dp-in" id="fO" value="'+E((f.options||[]).join(", "))+'">'
    +'<label class="dp-l">Scope</label><select class="dp-in" id="fS"><option value="spec"'+(f.scope==="spec"?" selected":"")+'>Spec (product ki jaankari)</option><option value="variant"'+(f.scope==="variant"?" selected":"")+'>Variant (size/color/RAM jaisa)</option></select>'
    +'<label class="dp-l">Purane column se jodein (optional)</label><select class="dp-in" id="fC">'+COLS.map(function(c){return '<option value="'+c+'"'+((f.col||"")===c?" selected":"")+'>'+(c||"— koi nahi (sirf specifications me)")+'</option>';}).join("")+'</select>'
    +'<label class="dp-l">Order</label><input class="dp-in" id="fR" type="number" value="'+E(f.sort)+'">'
    +'<label class="dp-l">Help text (optional)</label><input class="dp-in" id="fH" maxlength="200" value="'+E(f.help||"")+'">'
    +'<label class="dp-l">Placeholder (optional)</label><input class="dp-in" id="fP" maxlength="100" value="'+E(f.placeholder||"")+'">'
    +'<label style="display:flex;gap:10px;margin-top:12px;font-weight:600"><input type="checkbox" id="fQ" '+(f.required?"checked":"")+' style="width:22px;height:22px"> Zaroori (required)</label>'
    +'<label style="display:flex;gap:10px;margin-top:8px;font-weight:600"><input type="checkbox" id="fA" '+(f.active?"checked":"")+' style="width:22px;height:22px"> Chalu</label>'
    +'<button class="dp-btn gold" onclick="adminPfSaveField()">Save</button>'+(f.id?btn("Naya field banayein (edit chhodein)","adminPfEditField","line",[null]):"")+'</div>';
    return h;
  }
  window.adminPfEditField=function(id){FEDIT=id?window.__pfFields[id]:null;draw();};
  window.adminPfSaveField=function(){
    var f=FEDIT,opts=document.getElementById("fO").value.split(",").map(function(x){return x.trim();}).filter(Boolean);
    act(async function(){await dpRpc("admin_pf_save_field",{p_id:f?f.id:null,p_cat:CATSEL,p_key:document.getElementById("fK").value,p_label:document.getElementById("fL").value,p_type:document.getElementById("fT").value,p_options:opts,p_required:document.getElementById("fQ").checked,p_scope:document.getElementById("fS").value,p_col:document.getElementById("fC").value||null,p_sort:parseInt(document.getElementById("fR").value||"100",10),p_active:document.getElementById("fA").checked,p_help:document.getElementById("fH").value||null,p_placeholder:document.getElementById("fP").value||null});FEDIT=null;});
  };

  async function vAudit(){
    var r=await dpRpc("admin_pf_audit",{p_limit:150});
    return '<h3>Product Setup Audit Trail</h3>'+tbl(["Time","Action","Detail"],r.map(function(a){return '<tr><td>'+dpDate(a.created_at)+'</td><td>'+E(a.action)+'</td><td><small>'+E(a.detail?JSON.stringify(a.detail):"")+'</small></td></tr>';}));
  }
})();
