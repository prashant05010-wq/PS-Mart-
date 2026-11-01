/* Referral links ko yaad rakhta hai. Koi secret nahi.
   ?ref=CODE  -> seller referral (seller registration me use hota hai)
   ?cref=CODE -> customer Refer & Earn (naye customer par login ke baad apne aap lagta hai) */
(function(){
  try{
    var q=new URLSearchParams(location.search);
    var r=q.get("ref"); if(r&&/^[A-Za-z0-9]{4,16}$/.test(r))localStorage.setItem("ps_ref",r.toUpperCase());
    var c=q.get("cref"); if(c&&/^[A-Za-z0-9]{4,16}$/.test(c))localStorage.setItem("ps_cref",c.toUpperCase());
  }catch(e){}
  /* customer referral: login hone par ek baar lagao */
  var tries=0,t=setInterval(async function(){
    tries++; if(tries>40){clearInterval(t);return;}
    try{
      var code=localStorage.getItem("ps_cref"); if(!code){clearInterval(t);return;}
      if(typeof supabaseClient==="undefined")return;
      var u=await supabaseClient.auth.getUser(); if(!u.data||!u.data.user)return;
      clearInterval(t);
      var r=await supabaseClient.rpc("customer_referral_apply",{p_code:code});
      /* kisi bhi jawab par dobara koshish nahi (success ya saaf inkaar) */
      if(!r.error)localStorage.removeItem("ps_cref");
    }catch(e){}
  },750);
})();
