(()=>{'use strict';
const $=id=>document.getElementById(id);
let tracks=[],current=-1,bag=[],history=[],deferred=null,changing=false,errorLock=false;
const audio=$('audioElement'),BASE='https://divine-king-c86b.chapin7839.workers.dev/';
const url=file=>/^https?:\\/\\//i.test(String(file))?file:BASE+String(file).split('/').map(encodeURIComponent).join('/');
const time=n=>!Number.isFinite(n)?'00:00':String(Math.floor(n/60)).padStart(2,'0')+':'+String(Math.floor(n%60)).padStart(2,'0');
function refill(exclude=current){bag=tracks.map((_,i)=>i).filter(i=>i!==exclude);for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}}
function randomIndex(){if(!bag.length)refill();return bag.length?bag.pop():current;}
function update(){ $('audioSelect').value=current<0?'':String(current);$('audioNowTitle').textContent=current<0?'Ninguna pista seleccionada':tracks[current].title;}
function status(t){$('audioStatus').textContent=t;}
async function choose(i,autoplay=true,remember=true){
 if(i<0||i>=tracks.length||changing)return false;changing=true;
 if(remember&&current>=0&&current!==i)history.push(current);
 current=i;errorLock=false;update();status('Preparando · '+tracks[i].title);
 try{
  audio.pause();audio.src=tracks[i].url;
  if(autoplay){await audio.play();status('Reproduciendo · modo aleatorio');}
  else status('Lista para reproducir');
  return true;
 }catch(e){status(e.name==='NotAllowedError'?'Pulsa Reproducir para iniciar.':'No se pudo cargar la pista.');return false;}
 finally{changing=false;}
}
async function nextRandom(){if(!tracks.length)return;for(let n=0;n<tracks.length;n++){const i=randomIndex();if(await choose(i,true))return;}status('No se pudo reproducir el catálogo.');}
async function stepBack(){if(history.length){const i=history.pop();await choose(i,true,false);}else if(tracks.length){await choose(randomIndex(),true,false);}}
async function load(){
 try{status('Conectando con la biblioteca GT-GELM…');const r=await fetch('./musica.json',{cache:'no-cache'});if(!r.ok)throw Error('No se pudo leer musica.json');const data=await r.json();tracks=(Array.isArray(data)?data:(data.songs||data.tracks||[])).filter(x=>x&&x.file).map(x=>({title:x.title||x.file,file:x.file,url:url(x.file)}));if(!tracks.length)throw Error('El catálogo está vacío.');
 const sel=$('audioSelect');sel.innerHTML='<option value="">Selecciona una canción…</option>';tracks.forEach((t,i)=>sel.add(new Option(t.title,String(i))));$('audioCount').textContent=tracks.length+' pistas';refill(-1);status('Catálogo conectado · '+tracks.length+' canciones · reproducción aleatoria');}
 catch(e){status(e.message);}
}
$('audioPlay').addEventListener('click',async()=>{if(current<0){await nextRandom();return;}if(audio.paused){try{await audio.play();}catch(e){status('Pulsa nuevamente para reproducir.');}}else audio.pause();});
$('audioNext').addEventListener('click',nextRandom);$('audioPrev').addEventListener('click',stepBack);
$('audioSelect').addEventListener('change',e=>{if(e.target.value!==''){const i=Number(e.target.value);bag=bag.filter(x=>x!==i);choose(i,true);}});
audio.addEventListener('play',()=>{$('audioPlay').textContent='Ⅱ Pausar';});audio.addEventListener('pause',()=>{$('audioPlay').textContent='▶ Reproducir';});
function clock(){$('audioTime').textContent=time(audio.currentTime)+' / '+time(audio.duration);}
audio.addEventListener('timeupdate',clock);audio.addEventListener('loadedmetadata',clock);
audio.addEventListener('ended',nextRandom);
audio.addEventListener('error',()=>{if(current<0||errorLock)return;errorLock=true;status('Pista no disponible · saltando…');setTimeout(()=>{errorLock=false;nextRandom();},300);});
$('lyricsBtn').addEventListener('click',()=>window.open('./letras.html','gtGelmLyrics','popup=yes,width=980,height=820,resizable=yes,scrollbars=yes'));
$('installBtn').addEventListener('click',async()=>{if(deferred){deferred.prompt();const choice=await deferred.userChoice;if(choice?.outcome==='accepted')$('installBtn').textContent='✓ Instalando';deferred=null;return;}alert(/SamsungBrowser/i.test(navigator.userAgent)?'Samsung Internet: menú ☰ → Añadir página a → Pantalla Inicio.':'Abre el menú del navegador y elige Instalar aplicación o Añadir a pantalla de inicio.');});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;});
window.addEventListener('appinstalled',()=>{$('installBtn').textContent='✓ Instalada';$('installBtn').disabled=true;});
if('mediaSession'in navigator){try{navigator.mediaSession.setActionHandler('play',()=>audio.play());navigator.mediaSession.setActionHandler('pause',()=>audio.pause());navigator.mediaSession.setActionHandler('nexttrack',nextRandom);navigator.mediaSession.setActionHandler('previoustrack',stepBack);}catch(e){}}
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
load();
})();