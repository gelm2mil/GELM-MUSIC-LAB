(()=>{'use strict';
const $=id=>document.getElementById(id),audio=$('audio');
let songs=[],bag=[],current=-1,history=[],installPrompt=null;
const status=t=>$('status').textContent=t;
function refill(){bag=songs.map((_,i)=>i).filter(i=>i!==current);for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}}
function choose(){if(!bag.length)refill();return bag.pop()??0;}
function media(song){if(!('mediaSession'in navigator))return;try{navigator.mediaSession.metadata=new MediaMetadata({title:song.title,artist:'GT-GELM',album:'Guatemala, tu nombre inmortal'});navigator.mediaSession.playbackState=audio.paused?'paused':'playing';}catch(_){}}
async function playIndex(i,autoplay=true){if(!songs.length)return;if(current>=0&&current!==i)history.push(current);current=i;const s=songs[i];audio.src=s.url;$('title').textContent=s.title;$('counter').textContent='Pista '+String(s.id).padStart(3,'0')+' · '+(i+1)+' de '+songs.length;$('toggle').textContent='Ⅱ Pausar';media(s);if(autoplay){try{await audio.play();status('REPRODUCIENDO');}catch(e){$('toggle').textContent='▶ Reproducir';status(e.name==='NotAllowedError'?'TOCA REPRODUCIR PARA COMENZAR':'NO SE PUDO CARGAR · REVISA LA CONEXIÓN');}}else{$('toggle').textContent='▶ Reproducir';status('LISTO · TOCA REPRODUCIR');}}
function next(){if(!songs.length)return;playIndex(choose());}
function previous(){if(!songs.length)return;const i=history.pop();if(Number.isInteger(i)){current=i;const s=songs[i];audio.src=s.url;$('title').textContent=s.title;$('counter').textContent='Pista '+String(s.id).padStart(3,'0')+' · '+(i+1)+' de '+songs.length;audio.play().then(()=>status('REPRODUCIENDO')).catch(()=>status('TOCA REPRODUCIR'));}else{audio.currentTime=0;if(audio.paused)toggle();}}
async function toggle(){if(audio.paused){if(current<0){await playIndex(choose());return;}try{await audio.play();status('REPRODUCIENDO');$('toggle').textContent='Ⅱ Pausar';media(songs[current]);}catch(_){status('TOCA REPRODUCIR OTRA VEZ');}}else audio.pause();}
$('toggle').addEventListener('click',toggle);$('next').addEventListener('click',next);$('prev').addEventListener('click',previous);
audio.addEventListener('play',()=>{$('toggle').textContent='Ⅱ Pausar';if('mediaSession'in navigator)navigator.mediaSession.playbackState='playing';});
audio.addEventListener('pause',()=>{$('toggle').textContent='▶ Reproducir';if('mediaSession'in navigator)navigator.mediaSession.playbackState='paused';});
audio.addEventListener('ended',next);
audio.addEventListener('error',()=>{status('PISTA NO DISPONIBLE · PROBANDO OTRA');setTimeout(next,700);});
audio.addEventListener('loadedmetadata',()=>media(songs[current]));
if('mediaSession'in navigator){for(const [a,h] of Object.entries({play:()=>{if(audio.paused)audio.play().then(()=>status('REPRODUCIENDO')).catch(()=>status('TOCA REPRODUCIR'));},pause:()=>audio.pause(),nexttrack:next,previoustrack:previous,seekto:d=>{if(Number.isFinite(d.seekTime))audio.currentTime=d.seekTime;}})){try{navigator.mediaSession.setActionHandler(a,h);}catch(_){}}}
fetch('./musica.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('No se pudo leer musica.json');return r.json();}).then(data=>{songs=data.filter(s=>s.url&&/^https:\/\//.test(s.url));if(!songs.length)throw Error('Catálogo vacío');$('counter').textContent=songs.length+' canciones disponibles';status('CATÁLOGO LISTO · ALEATORIO');playIndex(choose(),false);}).catch(e=>{status('ERROR AL LEER EL CATÁLOGO');$('title').textContent=e.message;});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('install').hidden=false;});
$('install').addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('install').hidden=true;});
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();