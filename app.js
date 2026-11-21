(()=>{'use strict';
const $=id=>document.getElementById(id);
let tracks=[],current=-1,bag=[],history=[],deferred=null,changing=false,errorLock=false,requestToken=0;
const audio=$('audioElement');
const BASE='https://divine-king-c86b.chapin7839.workers.dev/';
const url=file=>/^https?:\/\//i.test(String(file))?String(file):BASE+String(file).split('/').map(encodeURIComponent).join('/');
const time=n=>!Number.isFinite(n)?'00:00':String(Math.floor(n/60)).padStart(2,'0')+':'+String(Math.floor(n%60)).padStart(2,'0');
function refill(exclude=current){
 bag=tracks.map((_,i)=>i).filter(i=>i!==exclude);
 for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
}
function randomIndex(){if(!bag.length)refill();return bag.length?bag.pop():-1;}
function update(){
 $('audioSelect').value=current<0?'':String(current);
 $('audioNowTitle').textContent=current<0?'Ninguna pista seleccionada':tracks[current]?.title||'';
}
function status(t){$('audioStatus').textContent=t;}
async function choose(i,autoplay=true,remember=true){
 if(i<0||i>=tracks.length||changing)return false;
 changing=true;const token=++requestToken;
 if(remember&&current>=0&&current!==i)history.push(current);
 current=i;errorLock=false;update();status('Cargando · '+tracks[i].title);
 try{
  audio.pause();
  audio.src=tracks[i].url;
  audio.load();
  if(autoplay){
   await audio.play();
   if(token!==requestToken)return false;
   status('Reproduciendo · modo aleatorio');
  }else status('Lista para reproducir');
  return true;
 }catch(e){
  if(token===requestToken)status(e?.name==='NotAllowedError'?'Pulsa Reproducir para iniciar.':'No se pudo cargar: '+tracks[i].title);
  return false;
 }finally{if(token===requestToken)changing=false;}
}
async function nextRandom(){
 if(!tracks.length||changing)return;
 const attempts=tracks.length;
 for(let n=0;n<attempts;n++){
  const i=randomIndex();if(i<0)break;
  const ok=await choose(i,true);
  if(ok)return;
 }
 status('No se pudo reproducir ninguna pista. Revisa la conexión con Cloudflare.');
}
async function stepBack(){
 if(changing)return;
 if(history.length){const i=history.pop();await choose(i,true,false);}
 else await nextRandom();
}
async function load(){
 try{
  status('Conectando con la biblioteca GT-GELM…');
  const response=await fetch('./musica.json?v=1',{cache:'no-store'});
  if(!response.ok)throw new Error('musica.json respondió HTTP '+response.status);
  const data=await response.json();
  const list=Array.isArray(data)?data:(data.songs||data.tracks||[]);
  tracks=list.filter(x=>x&&x.file).map(x=>({title:String(x.title||x.file),file:String(x.file),url:url(x.file)}));
  if(!tracks.length)throw new Error('El catálogo no contiene pistas válidas.');
  const select=$('audioSelect');
  select.innerHTML='';
  select.add(new Option('Selecciona una canción…',''));
  tracks.forEach((track,i)=>select.add(new Option(track.title,String(i))));
  $('audioCount').textContent=tracks.length+' pistas';
  refill(-1);
  status('Catálogo conectado · '+tracks.length+' canciones · modo aleatorio');
 }catch(e){
  console.error('GT-GELM: error cargando musica.json',e);
  status('Error al cargar el catálogo: '+e.message);
  $('audioCount').textContent='0 pistas';
 }
}
$('audioPlay').addEventListener('click',async()=>{
 if(current<0){await nextRandom();return;}
 if(audio.paused){try{await audio.play();}catch(e){status('No se pudo iniciar. Vuelve a tocar Reproducir.');}}
 else audio.pause();
});
$('audioNext').addEventListener('click',nextRandom);
$('audioPrev').addEventListener('click',stepBack);
$('audioSelect').addEventListener('change',e=>{
 if(e.target.value!==''){
  const i=Number(e.target.value);bag=bag.filter(x=>x!==i);choose(i,true);
 }
});
audio.addEventListener('play',()=>{$('audioPlay').textContent='Ⅱ Pausar';});
audio.addEventListener('pause',()=>{$('audioPlay').textContent='▶ Reproducir';});
function clock(){$('audioTime').textContent=time(audio.currentTime)+' / '+time(audio.duration);}
audio.addEventListener('timeupdate',clock);
audio.addEventListener('loadedmetadata',clock);
audio.addEventListener('ended',()=>{if(!errorLock)nextRandom();});
audio.addEventListener('error',()=>{
 if(current<0||errorLock)return;
 errorLock=true;status('Pista no disponible · buscando otra…');
 setTimeout(()=>{errorLock=false;nextRandom();},250);
});
$('lyricsBtn').addEventListener('click',()=>window.open('./letras.html','gtGelmLyrics','popup=yes,width=980,height=820,resizable=yes,scrollbars=yes'));
$('installBtn').addEventListener('click',async()=>{
 if(deferred){
  const event=deferred;deferred=null;
  try{await event.prompt();const choice=await event.userChoice;if(choice?.outcome==='accepted')$('installBtn').textContent='✓ Instalada';}
  catch(e){status('No se pudo abrir la instalación. Usa el menú del navegador.');}
  return;
 }
 alert('Para instalar GT-GELM, abre el menú del navegador y elige “Instalar aplicación” o “Añadir a pantalla de inicio”.');
});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;});
window.addEventListener('appinstalled',()=>{$('installBtn').textContent='✓ Instalada';});
if('mediaSession'in navigator){
 try{
  navigator.mediaSession.setActionHandler('play',()=>audio.play());
  navigator.mediaSession.setActionHandler('pause',()=>audio.pause());
  navigator.mediaSession.setActionHandler('nexttrack',nextRandom);
  navigator.mediaSession.setActionHandler('previoustrack',stepBack);
 }catch(e){}
}
if('serviceWorker'in navigator&&location.protocol==='https:'){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{}));
}
load();
})();