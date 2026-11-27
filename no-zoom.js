/* PS Mart - Zoom lock (app jaisa): pinch-zoom, double-tap zoom aur Ctrl+scroll zoom band.
   Sirf zoom rokta hai; scroll, tap aur click normal chalte hain. */
(function(){
  try{
    var m=document.querySelector('meta[name="viewport"]');
    var want="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
    if(!m){m=document.createElement("meta");m.name="viewport";document.head.appendChild(m);}
    m.setAttribute("content",want);
    var st=document.createElement("style");
    st.textContent="html,body{touch-action:pan-x pan-y;-webkit-text-size-adjust:100%;text-size-adjust:100%}input,select,textarea,button,a{touch-action:manipulation}";
    document.head.appendChild(st);
    ["gesturestart","gesturechange","gestureend"].forEach(function(ev){document.addEventListener(ev,function(e){e.preventDefault();},{passive:false});});
    document.addEventListener("touchmove",function(e){if(e.touches&&e.touches.length>1&&e.cancelable)e.preventDefault();},{passive:false});
    window.addEventListener("wheel",function(e){if(e.ctrlKey&&e.cancelable)e.preventDefault();},{passive:false});
  }catch(_){}
})();
