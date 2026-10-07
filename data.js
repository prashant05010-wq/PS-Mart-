/* PS Mart - shared helpers (data.js)
   Ye file products.html, index.html, cart.html aur product.html mein load hoti hai. */
const PRODUCTS = [];

/* ---------- DELIVERY LOCATION (pincode) ---------- */
function applySavedLocation(){
  try{
    var pin=localStorage.getItem("psmart_pincode");
    document.querySelectorAll(".location-bar a").forEach(function(a){
      a.textContent=pin?("Deliver to "+pin+" - Change →"):"Select your location →";
    });
  }catch(e){}
}
function openLocation(){
  if(document.getElementById("pmLocBox"))return;
  var pin="";try{pin=localStorage.getItem("psmart_pincode")||"";}catch(e){}
  var o=document.createElement("div");o.id="pmLocBox";
  o.style.cssText="position:fixed;inset:0;background:rgba(36,21,11,.65);z-index:5000;display:flex;align-items:center;justify-content:center;padding:16px";
  o.innerHTML='<div style="background:#fff;border:2px solid #c9922e;border-radius:14px;max-width:380px;width:100%;padding:24px;font-family:Inter,Arial,sans-serif">'
   +'<h3 style="margin:0 0 6px;font-size:22px;color:#43250f">📍 Delivery location</h3>'
   +'<p style="margin:0 0 14px;color:#7c6a58;font-size:14px">Apna 6 digit pincode daaliye.</p>'
   +'<input id="pmPin" inputmode="numeric" maxlength="6" value="'+pin+'" placeholder="e.g. 226001" style="width:100%;padding:12px;border:1px solid #c9922e;border-radius:8px;font-size:16px;outline:0">'
   +'<p id="pmPinErr" style="color:#c62828;font-size:13px;margin:8px 0 0;min-height:16px"></p>'
   +'<div style="display:flex;gap:10px;margin-top:10px">'
   +'<button id="pmPinCancel" style="flex:1;padding:12px;border:1px solid #c9922e;background:#fbf6ea;color:#43250f;border-radius:8px;font-weight:700;cursor:pointer">Cancel</button>'
   +'<button id="pmPinSave" style="flex:1;padding:12px;border:0;background:linear-gradient(135deg,#f7dd9b,#f0bd50 45%,#c9922e);color:#24150b;border-radius:8px;font-weight:700;cursor:pointer">Save</button></div></div>';
  document.body.appendChild(o);
  var inp=document.getElementById("pmPin");inp.focus();
  function close(){o.remove();}
  function save(){
    var v=inp.value.trim();
    if(!/^[1-9][0-9]{5}$/.test(v)){document.getElementById("pmPinErr").textContent="Sahi 6 digit pincode daaliye.";return;}
    try{localStorage.setItem("psmart_pincode",v);}catch(e){}
    applySavedLocation();close();
  }
  document.getElementById("pmPinSave").onclick=save;
  document.getElementById("pmPinCancel").onclick=close;
  o.addEventListener("click",function(e){if(e.target===o)close();});
  inp.addEventListener("keydown",function(e){if(e.key==="Enter")save();if(e.key==="Escape")close();});
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
