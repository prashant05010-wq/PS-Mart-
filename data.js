/* PS Mart - shared helpers (data.js)
   Ye file products.html, index.html, cart.html aur product.html mein load hoti hai. */
const PRODUCTS = [];

/* ---------- DELIVERY ADDRESS (poora form) ---------- */
var PM_STATES=["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"];

function getAddress(){try{return JSON.parse(localStorage.getItem("psmart_address")||"null");}catch(e){return null;}}

function applySavedLocation(){
  var a=getAddress(),txt="Select your location →";
  if(a){txt="Deliver to "+a.name+", "+a.city+" "+a.pincode+" - Change →";}
  document.querySelectorAll(".location-bar a").forEach(function(l){l.textContent=txt;});
}

function openLocation(){
  if(document.getElementById("pmLocBox"))return;
  var a=getAddress()||{};
  function v(k){return String(a[k]||"").replace(/"/g,"&quot;");}
  var f="width:100%;padding:11px 12px;border:1px solid #c9922e;border-radius:8px;font-size:15px;outline:0;background:#fff;font-family:inherit";
  var l="display:block;font-size:12px;font-weight:700;color:#7c6a58;margin:12px 0 5px";
  var opts=PM_STATES.map(function(s){return '<option'+(a.state===s?' selected':'')+'>'+s+'</option>';}).join("");
  var o=document.createElement("div");o.id="pmLocBox";
  o.style.cssText="position:fixed;inset:0;background:rgba(36,21,11,.65);z-index:5000;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto";
  o.innerHTML='<div style="background:#fff;border:2px solid #c9922e;border-radius:14px;max-width:480px;width:100%;padding:22px;margin:auto;font-family:Inter,Arial,sans-serif;color:#2a1a0e">'
  +'<h3 style="margin:0;font-size:24px;color:#43250f;font-family:Georgia,serif">📍 Delivery Address</h3>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">'
  +'<div><label style="'+l+'">Full Name *</label><input id="pmName" style="'+f+'" value="'+v("name")+'" placeholder="Aapka naam"></div>'
  +'<div><label style="'+l+'">Mobile Number *</label><input id="pmMobile" inputmode="numeric" maxlength="10" style="'+f+'" value="'+v("mobile")+'" placeholder="10 digit number"></div>'
  +'<div><label style="'+l+'">Pincode *</label><input id="pmPin" inputmode="numeric" maxlength="6" style="'+f+'" value="'+v("pincode")+'" placeholder="6 digit pincode"></div>'
  +'<div><label style="'+l+'">City / District *</label><input id="pmCity" style="'+f+'" value="'+v("city")+'"></div></div>'
  +'<label style="'+l+'">State *</label><select id="pmState" style="'+f+'"><option value="">Select state</option>'+opts+'</select>'
  +'<label style="'+l+'">Flat, House no., Building, Company *</label><input id="pmHouse" style="'+f+'" value="'+v("house")+'">'
  +'<label style="'+l+'">Area, Street, Sector, Village *</label><input id="pmArea" style="'+f+'" value="'+v("area")+'">'
  +'<label style="'+l+'">Landmark (optional)</label><input id="pmLand" style="'+f+'" value="'+v("landmark")+'" placeholder="Jaise: school ke paas">'
  +'<label style="'+l+'">Address Type</label><div style="display:flex;gap:18px;font-size:14px">'
  +'<label style="cursor:pointer"><input type="radio" name="pmType" value="Home"'+(a.type!=="Work"?' checked':'')+'> Home</label>'
  +'<label style="cursor:pointer"><input type="radio" name="pmType" value="Work"'+(a.type==="Work"?' checked':'')+'> Work</label></div>'
  +'<p id="pmErr" style="color:#c62828;font-size:13px;margin:10px 0 0;min-height:16px"></p>'
  +'<div style="display:flex;gap:10px;margin-top:8px">'
  +'<button id="pmCancel" style="flex:1;padding:13px;border:1px solid #c9922e;background:#fbf6ea;color:#43250f;border-radius:8px;font-weight:700;cursor:pointer">Cancel</button>'
  +'<button id="pmSave" style="flex:2;padding:13px;border:0;background:linear-gradient(135deg,#f7dd9b,#f0bd50 45%,#c9922e);color:#24150b;border-radius:8px;font-weight:700;cursor:pointer">Save Address</button></div></div>';
  document.body.appendChild(o);
  var $=function(id){return document.getElementById(id);};
  $("pmName").focus();
  function close(){o.remove();}
  /* pincode daalte hi city/state bharne ki koshish (agar internet API mile) */
  $("pmPin").addEventListener("input",function(){
    var p=this.value.replace(/\D/g,"");this.value=p;
    if(p.length===6&&typeof fetch==="function"){
      fetch("https://api.postalpincode.in/pincode/"+p).then(function(r){return r.json();}).then(function(d){
        var po=d&&d[0]&&d[0].PostOffice&&d[0].PostOffice[0];
        if(po){if(!$("pmCity").value)$("pmCity").value=po.District||"";
          if(!$("pmState").value&&PM_STATES.indexOf(po.State)>-1)$("pmState").value=po.State;}
      }).catch(function(){});
    }
  });
  $("pmMobile").addEventListener("input",function(){this.value=this.value.replace(/\D/g,"");});
  function save(){
    var d={name:$("pmName").value.trim(),mobile:$("pmMobile").value.trim(),pincode:$("pmPin").value.trim(),
      city:$("pmCity").value.trim(),state:$("pmState").value,house:$("pmHouse").value.trim(),
      area:$("pmArea").value.trim(),landmark:$("pmLand").value.trim(),
      type:(document.querySelector('input[name="pmType"]:checked')||{}).value||"Home"};
    var e="";
    if(d.name.length<3)e="Poora naam daaliye.";
    else if(!/^[6-9][0-9]{9}$/.test(d.mobile))e="Sahi 10 digit mobile number daaliye (6-9 se shuru).";
    else if(!/^[1-9][0-9]{5}$/.test(d.pincode))e="Sahi 6 digit pincode daaliye.";
    else if(!d.city)e="City / District daaliye.";
    else if(!d.state)e="State chuniye.";
    else if(!d.house)e="Flat / House no. daaliye.";
    else if(!d.area)e="Area / Street daaliye.";
    if(e){$("pmErr").textContent=e;return;}
    try{localStorage.setItem("psmart_address",JSON.stringify(d));}catch(x){}
    applySavedLocation();close();
    document.dispatchEvent(new CustomEvent("psmart:address",{detail:d}));
  }
  $("pmSave").onclick=save;$("pmCancel").onclick=close;
  o.addEventListener("click",function(e){if(e.target===o)close();});
  document.addEventListener("keydown",function esc(e){if(e.key==="Escape"){close();document.removeEventListener("keydown",esc);}});
}

/* ---------- WISHLIST (browser mein save, key: "wishlist") ---------- */
function getWishlist(){try{return JSON.parse(localStorage.getItem("wishlist")||"[]");}catch(e){return [];}}
function toggleWishlist(id,btn){
  id=String(id);var w=getWishlist(),i=w.indexOf(id);
  if(i>-1){w.splice(i,1);}else{w.push(id);}
  try{localStorage.setItem("wishlist",JSON.stringify(w));}catch(e){}
  if(btn){btn.textContent=i>-1?"♡":"♥";}
}
function syncWishlistHearts(){
  var w=getWishlist();
  document.querySelectorAll('button[onclick*="toggleWishlist"]').forEach(function(b){
    var m=(b.getAttribute("onclick")||"").match(/toggleWishlist\('([^']+)'/);
    if(m){b.textContent=w.indexOf(m[1])>-1?"♥":"♡";}
  });
}
document.addEventListener("DOMContentLoaded",function(){
  applySavedLocation();
  var t=null;
  new MutationObserver(function(){clearTimeout(t);t=setTimeout(syncWishlistHearts,80);})
    .observe(document.body,{childList:true,subtree:true});
});
