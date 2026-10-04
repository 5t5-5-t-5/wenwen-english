// Prefer browser fullscreen; keep an in-page enlargement for embedded browsers.
export async function toggleVideoFullscreen(video,box,doc=document){
  if(box.classList.contains('is-expanded')){box.classList.remove('is-expanded');return;}
  if(video.webkitDisplayingFullscreen){video.webkitExitFullscreen();return;}
  if(doc.fullscreenElement){await doc.exitFullscreen();return;}
  if(box.requestFullscreen&&doc.fullscreenEnabled!==false){
    try{await box.requestFullscreen();return;}catch{}
  }
  if(video.webkitEnterFullscreen){
    try{video.webkitEnterFullscreen();return;}catch{}
  }
  box.classList.add('is-expanded');
}
