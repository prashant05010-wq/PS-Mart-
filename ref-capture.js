/* Referral link (?ref=CODE) ko yaad rakhta hai taaki seller registration me use ho sake. Koi secret nahi. */
(function(){
  try{
    var r=new URLSearchParams(location.search).get("ref");
    if(r&&/^[A-Za-z0-9]{4,16}$/.test(r))localStorage.setItem("ps_ref",r.toUpperCase());
  }catch(e){}
})();
