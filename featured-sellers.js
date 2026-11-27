/* PS Mart - Homepage "Featured Sellers" strip. Admin jise feature kare wahi dikhta hai; program OFF ho ya list khali ho to kuch nahi dikhta. */
(function(){
  function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
  async function run(){
    var box=document.getElementById("featuredSellers");
    if(!box||typeof supabaseClient==="undefined"||!window.psSrBadge)return;
    try{
      var r=await supabaseClient.rpc("public_featured_sellers");
      if(r.error||!r.data||!r.data.length)return;
      box.innerHTML='<h2 style="font:700 22px Georgia,serif;color:#3B2416;margin:0 0 10px">Featured Sellers</h2><div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:6px">'
        +r.data.map(function(s){return '<div style="flex:0 0 150px;background:#fff;border:1px solid #e6dac3;border-radius:14px;padding:12px;text-align:center;box-shadow:0 4px 12px rgba(59,36,22,.07)">'
          +window.psSrBadge(s.badge_key,s.level_no,54)+'<div style="font-weight:700;color:#3B2416;margin-top:6px;font-size:14px">'+esc(s.shop_name)+'</div><div style="font-size:12px;color:#7c6a58">'+esc(s.level_name)+'</div></div>';}).join("")+'</div>';
      box.style.display="";box.style.margin="26px 0 0";
    }catch(_){}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else run();
})();
