(()=>{'use strict';
const $=id=>document.getElementById(id);
const audio=$('audioElement');
const BASE='https://divine-king-c86b.chapin7839.workers.dev/';
let tracks=[],current=-1,bag=[],history=[],deferredInstall=null,playingRequest=0;
const time=n=>!Number.isFinite(n)?'00:00':String(Math.floor(n/60)).padStart(2,'0')+':'+String(Math.floor(n%60)).padStart(2,'0');
const trackURL=file=>file.startsWith('http://')||file.startsWith('https://')?file:BASE+file.split('/').map(encodeURIComponent).join('/');
function status(message){$('audioStatus').textContent=message;}
function shuffleBag(exclude=current){
 bag=tracks.map((_,i)=>i).filter(i=>i!==exclude);
 for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
}
function takeRandom(){
 if(!bag.length)shuffleBag(current);
 return bag.length?bag.pop():-1;
}
function metadata(track){
 if(!('mediaSession'in navigator)||!('MediaMetadata'in window))return;
 try{
  navigator.mediaSession.metadata=new MediaMetadata({
   title:track.title,artist:'GT-GELM',album:'Guatemala, tu nombre inmortal',
   artwork:[{src:'icons/icon.svg',sizes:'any',type:'image/svg+xml'}]
  });
  navigator.mediaSession.playbackState=audio.paused?'paused':'playing';
 }catch(e){}
}
function renderCurrent(){
 $('audioSelect').value=current<0?'':String(current);
 $('audioNowTitle').textContent=current<0?'Ninguna pista seleccionada':tracks[current]?.title||'';
}
async function playTrack(index,fromHistory=false){
 if(index<0||index>=tracks.length)return false;
 const track=tracks[index],token=++playingRequest;
 if(current>=0&&current!==index&&!fromHistory)history.push(current);
 current=index;bag=bag.filter(i=>i!==index);renderCurrent();
 status('Cargando · '+track.title);
 try{
  // Mantener un único elemento audio y cambiar únicamente su fuente, como en PLAY.
  audio.src=track.url;
  metadata(track);
  const promise=audio.play();
  if(promise&&typeof promise.then==='function')await promise;
  if(token!==playingRequest)return false;
  status('Reproduciendo · modo aleatorio');
  metadata(track);
  return true;
 }catch(error){
  if(token===playingRequest){
   status(error?.name==='NotAllowedError'?'Toca Reproducir para iniciar el audio.':'No se pudo reproducir esta pista; prueba otra.');
   metadata(track);
  }
  return false;
 }
}
async function nextRandom(){
 if(!tracks.length)return;
 let tries=tracks.length;
 while(tries--){
  const index=takeRandom();if(index<0)return;
  if(await playTrack(index))return;
 }
 status('No se pudo reproducir el catálogo. Comprueba la conexión.');
}
async function previousTrack(){
 if(history.length){const index=history.pop();await playTrack(index,true);}
 else await nextRandom();
}
async function loadCatalog(){
 try{
  status('Conectando con el catálogo GT-GELM…');
  const response=await fetch('./musica.json?rev=gtgelm118',{cache:'no-store'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const data=await response.json();
  const source=Array.isArray(data)?data:(data.songs||data.tracks||[]);
  tracks=source.filter(item=>item&&(item.url||item.file)).map(item=>({title:String(item.title||item.file||item.url),file:String(item.file||''),url:item.url?String(item.url):trackURL(String(item.file))}));
  if(!tracks.length)throw new Error('No se encontraron canciones válidas en musica.json.');
  const select=$('audioSelect');select.replaceChildren(new Option('Selecciona una canción…',''));
  tracks.forEach((track,index)=>select.add(new Option(track.title,String(index))));
  $('audioCount').textContent=tracks.length+' pistas';
  shuffleBag(-1);
  status('Catálogo conectado · '+tracks.length+' canciones');
 }catch(error){
  console.error('GT-GELM catalog:',error);
  $('audioCount').textContent='— pistas';
  status('No se pudo cargar musica.json: '+error.message);
 }
}
$('audioPlay').addEventListener('click',async()=>{
 if(current<0){await nextRandom();return;}
 if(audio.paused){
  try{await audio.play();status('Reproduciendo · modo aleatorio');metadata(tracks[current]);}
  catch(e){status('Toca nuevamente Reproducir para iniciar.');}
 }else audio.pause();
});
$('audioNext').addEventListener('click',nextRandom);
$('audioPrev').addEventListener('click',previousTrack);
$('audioSelect').addEventListener('change',event=>{
 if(event.target.value==='')return;
 const index=Number(event.target.value);
 bag=bag.filter(item=>item!==index);
 playTrack(index);
});
audio.addEventListener('play',()=>{$('audioPlay').textContent='Ⅱ Pausar';if(current>=0)metadata(tracks[current]);});
audio.addEventListener('pause',()=>{$('audioPlay').textContent='▶ Reproducir';if('mediaSession'in navigator)navigator.mediaSession.playbackState='paused';});
audio.addEventListener('ended',nextRandom);
audio.addEventListener('error',()=>{
 if(current<0)return;
 status('Pista no disponible · saltando a otra…');
 setTimeout(()=>nextRandom(),350);
});
function updateClock(){$('audioTime').textContent=time(audio.currentTime)+' / '+time(audio.duration);}
audio.addEventListener('timeupdate',updateClock);audio.addEventListener('loadedmetadata',updateClock);
$('lyricsBtn').addEventListener('click',()=>window.open('./letras.html','gtGelmLyrics','popup=yes,width=980,height=820,resizable=yes,scrollbars=yes'));
$('installBtn').addEventListener('click',async()=>{
 if(deferredInstall){
  const event=deferredInstall;deferredInstall=null;
  try{await event.prompt();const choice=await event.userChoice;if(choice?.outcome==='accepted')$('installBtn').textContent='✓ Instalada';}
  catch(e){status('No se pudo iniciar la instalación. Usa el menú del navegador.');}
 }else{
  alert('En Samsung Internet: abre el menú ⋮ y selecciona “Añadir página a” o “Instalar aplicación”, si aparece disponible.');
 }
});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;});
window.addEventListener('appinstalled',()=>{$('installBtn').textContent='✓ Instalada';});
if('mediaSession'in navigator){
 try{
  navigator.mediaSession.setActionHandler('play',()=>audio.play());
  navigator.mediaSession.setActionHandler('pause',()=>audio.pause());
  navigator.mediaSession.setActionHandler('nexttrack',nextRandom);
  navigator.mediaSession.setActionHandler('previoustrack',previousTrack);
 }catch(e){}
}
if('serviceWorker'in navigator&&location.protocol==='https:'){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(error=>console.warn('SW',error)));
}
loadCatalog();
})();