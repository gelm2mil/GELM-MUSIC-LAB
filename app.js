(()=> {
  "use strict";
  const $ = id => document.getElementById(id);
  const KEY = "gelm_music_lab_v1";
  let songs = [], activeId = null, pos = 0, auto = null, deferred = null;

  const sample = `¡Esta es la tierra que me vio nacer!

[VERSO 1]
Aquí comienza mi historia,
una canción para recordar.

[CORO]
¡Guate se mueve, Guate va a bailar!`;
  const lines = () => $("editorText").value.replace(/\r/g, "").split("\n");
  const song = () => songs.find(s => s.id === activeId);

  function save() {
    const s = song();
    if (!s) return;
    s.title = $("songTitle").value.trim() || "Sin título";
    s.content = $("editorText").value;
    s.position = pos;
    s.updated = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify(songs));
      $("saveStatus").textContent = "● Guardado local";
    } catch (e) {
      $("saveStatus").textContent = "Exporta TXT: almacenamiento lleno";
    }
    renderList();
  }

  function renderList() {
    const q = $("searchInput").value.toLowerCase();
    $("songList").innerHTML = "";
    $("songCount").textContent = songs.length;
    songs.filter(s => s.title.toLowerCase().includes(q)).forEach(s => {
      const b = document.createElement("button");
      b.className = "song-item" + (s.id === activeId ? " active" : "");
      const title = document.createElement("b");
      const meta = document.createElement("small");
      title.textContent = s.title;
      meta.textContent = (s.content || "").split("\n").length + " líneas";
      b.append(title, meta);
      b.addEventListener("click", () => { save(); loadSong(s); });
      $("songList").append(b);
    });
  }

  function loadSong(s) {
    stopAuto();
    activeId = s.id;
    $("songTitle").value = s.title;
    $("editorText").value = s.content || "";
    pos = Math.min(s.position || 0, lines().length - 1);
    renderReader();
    renderList();
  }

  function renderReader() {
    const arr = lines();
    pos = Math.max(0, Math.min(pos, arr.length - 1));
    $("reader").innerHTML = "";
    arr.forEach((value, i) => {
      const div = document.createElement("div");
      div.className = "line" + (i === pos ? " current" : "") +
        (/^\s*\[.+\]\s*$/.test(value) ? " section" : "");
      div.textContent = value || " ";
      div.addEventListener("click", () => selectLine(i));
      $("reader").append(div);
    });
    $("lineCounter").textContent = "Línea " + (pos + 1) + " / " + arr.length;
    const percent = arr.length ? Math.round((pos + 1) / arr.length * 100) : 0;
    $("progressBar").style.width = percent + "%";
    $("progressText").textContent = percent + "% recorrido";
    $("bookmarkText").textContent = song()?.mark != null
      ? "Marcador: línea " + (song().mark + 1) : "Sin marcador";
    $("reader").querySelector(".current")?.scrollIntoView({ block: "nearest" });
    const s = song();
    if (s) {
      s.position = pos;
      try { localStorage.setItem(KEY, JSON.stringify(songs)); } catch (e) {}
    }
  }

  function selectLine(i) { pos = i; renderReader(); save(); }
  function move(delta) { selectLine(Math.max(0, Math.min(lines().length - 1, pos + delta))); }
  function stopAuto() {
    if (auto) clearInterval(auto);
    auto = null;
    $("autoBtn").textContent = "▶ Avance";
  }
  function newSong() {
    save();
    const s = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: "Nueva canción",
      content: "[INTRO]\n\n[VERSO 1]\n\n[CORO]\n",
      position: 0, mark: null, updated: Date.now()
    };
    songs.unshift(s);
    loadSong(s);
    $("songTitle").focus();
    $("songTitle").select();
  }
  function setMode(mode) {
    document.querySelectorAll(".tab").forEach(t =>
      t.classList.toggle("active", t.dataset.mode === mode));
    $("reader").hidden = mode === "edit";
    $("editorText").hidden = mode !== "edit";
    if (mode === "edit") $("editorText").focus();
    else renderReader();
  }

  $("newBtn").addEventListener("click", newSong);
  $("openBtn").addEventListener("click", () => $("fileInput").click());
  $("fileInput").addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;
    save();
    const s = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: file.name.replace(/\.[^.]+$/, ""),
      content: await file.text(), position: 0, mark: null, updated: Date.now()
    };
    songs.unshift(s);
    loadSong(s);
    e.target.value = "";
  });
  $("saveTxtBtn").addEventListener("click", () => {
    save();
    const s = song();
    if (!s) return;
    const blob = new Blob([s.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (s.title || "manuscrito").replace(/[\\/:*?"<>|]/g, "_") + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  });
  $("songTitle").addEventListener("input", save);
  $("editorText").addEventListener("input", () => {
    pos = Math.min(pos, lines().length - 1);
    save();
  });
  $("searchInput").addEventListener("input", renderList);
  $("prevBtn").addEventListener("click", () => move(-1));
  $("nextBtn").addEventListener("click", () => move(1));
  $("markBtn").addEventListener("click", () => {
    const s = song();
    if (!s) return;
    s.mark = pos;
    renderReader();
    save();
  });
  $("autoBtn").addEventListener("click", () => {
    if (auto) { stopAuto(); return; }
    $("autoBtn").textContent = "Ⅱ Pausar";
    auto = setInterval(() => {
      if (pos >= lines().length - 1) { stopAuto(); return; }
      move(1);
    }, 2200);
  });
  document.querySelectorAll(".tab").forEach(t =>
    t.addEventListener("click", () => setMode(t.dataset.mode)));
  $("reader").addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
  });
  $("themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("gelm_theme",
      document.body.classList.contains("light") ? "light" : "dark");
  });
  if (localStorage.getItem("gelm_theme") === "light") document.body.classList.add("light");

  try { songs = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { songs = []; }
  if (!Array.isArray(songs)) songs = [];
  if (!songs.length) songs = [{
    id: "welcome", title: "Bienvenido a GELM MUSIC LAB",
    content: sample, position: 0, mark: null, updated: Date.now()
  }];
  loadSong(songs[0]);


  // Reproductor GT-GELM: catálogo Cloudflare y biblioteca completa de letras.
  const audioTracks=[];
  let currentTrack=-1, lyricFiles=[], lyricsToken=0, advancing=false;
  const audioEl=$("audioElement");
  const AUDIO_BASE="https://divine-king-c86b.chapin7839.workers.dev/";
  const LYRIC_BASE="./lirycs/";
  const audioUrl=file=>/^https?:\/\//i.test(file)?file:AUDIO_BASE+String(file).split("/").map(encodeURIComponent).join("/");
  function renderTrackSelect(){
    const sel=$("audioSelect");sel.innerHTML='<option value="">Selecciona una canción…</option>';
    audioTracks.forEach((t,i)=>sel.add(new Option(t.title+(t.category?" · "+t.category:""),String(i))));
    $("audioCount").textContent=audioTracks.length+" pistas";
    renderTrackList();
  }
  function renderTrackList(){
    const box=$("audioTrackList");if(!box)return;
    const q=($("audioSearch")?.value||"").trim().toLocaleLowerCase("es");
    box.innerHTML="";
    audioTracks.filter(t=>(t.title+" "+t.category).toLocaleLowerCase("es").includes(q)).forEach(t=>{
      const i=audioTracks.indexOf(t),b=document.createElement("button");
      b.type="button";b.className="track-item"+(i===currentTrack?" active":"");
      b.textContent=t.title+(t.category?" · "+t.category:"");
      b.addEventListener("click",()=>chooseTrack(i,true));
      box.append(b);
    });
    $("audioListCount").textContent=(box.children.length)+" canciones";
  }
  function renderLyricsOptions(){
    const sel=$("lyricsSelect"),q=$("lyricsSearch").value.trim().toLocaleLowerCase("es");
    const found=lyricFiles.filter(x=>x.name.toLocaleLowerCase("es").includes(q));
    sel.innerHTML="";
    if(!found.length){sel.add(new Option("No se encontraron letras",""));$("lyricsCount").textContent="0 manuscritos";$("lyricsViewer").textContent="Prueba con otro título.";return;}
    found.forEach(x=>sel.add(new Option(x.name,x.file)));
    $("lyricsCount").textContent=found.length+" de "+lyricFiles.length+" manuscritos";
    if(!found.some(x=>x.file===sel.value))sel.value=found[0].file;
    loadLibraryLyric(sel.value);
  }
  async function loadLibraryLyric(file){
    if(!file)return;const token=++lyricsToken;
    $("lyricsViewer").textContent="Abriendo manuscrito…";
    try{
      const r=await fetch(LYRIC_BASE+encodeURIComponent(file),{cache:"no-cache"});
      if(!r.ok)throw Error("No se pudo abrir la letra (HTTP "+r.status+").");
      const txt=await r.text();if(token===lyricsToken)$("lyricsViewer").textContent=txt;
    }catch(e){if(token===lyricsToken)$("lyricsViewer").textContent=e.message;}
  }
  function updateTrackUI(){
    $("audioSelect").value=currentTrack>=0?String(currentTrack):"";
    $("audioNowTitle").textContent=currentTrack>=0?audioTracks[currentTrack].title:"Ninguna pista seleccionada";
    renderTrackList();
  }
  async function chooseTrack(i,autoplay=false){
    if(i<0||i>=audioTracks.length)return false;
    const track=audioTracks[i];currentTrack=i;
    $("audioStatus").textContent="Preparando "+track.title+"…";
    updateTrackUI();
    // Pausar antes de cambiar la fuente evita estados colgados en móviles.
    audioEl.pause();
    audioEl.src=track.url;
    audioEl.load();
    if(autoplay){
      try{
        await audioEl.play();
        $("audioStatus").textContent="Reproduciendo · "+(i+1)+" de "+audioTracks.length;
      }catch(e){
        $("audioStatus").textContent=e?.name==="NotAllowedError"?"El navegador bloqueó el inicio. Pulsa Reproducir.":"No se pudo iniciar esta pista; prueba otra.";
        return false;
      }
    }else $("audioStatus").textContent="Lista lista · pulsa Reproducir";
    return true;
  }
  async function stepTrack(delta,autoplay=true){
    if(advancing||!audioTracks.length)return;
    advancing=true;
    try{
      const start=currentTrack<0?0:currentTrack;
      for(let n=1;n<=audioTracks.length;n++){
        const i=(start+delta*n+audioTracks.length)%audioTracks.length;
        if(await chooseTrack(i,autoplay))return;
      }
      $("audioStatus").textContent="No se pudo reproducir ninguna pista. Revisa la conexión con Cloudflare.";
    }finally{advancing=false;}
  }
  async function loadCloudLibrary(){
    $("audioStatus").textContent="Conectando con musica.json…";
    try{
      const r=await fetch("./musica.json",{cache:"no-cache"});
      if(!r.ok)throw Error("No se pudo leer musica.json (HTTP "+r.status+").");
      const data=await r.json(),list=Array.isArray(data)?data:(data.songs||data.tracks||[]);
      audioTracks.push(...list.filter(x=>x.file).map(x=>({title:x.title||x.file,file:x.file,category:x.category||"",url:audioUrl(x.file)})));
      if(!audioTracks.length)throw Error("El catálogo está vacío.");
      renderTrackSelect();updateTrackUI();
      $("audioStatus").textContent="Catálogo conectado · "+audioTracks.length+" canciones";
    }catch(e){$("audioStatus").textContent=e.message;}
  }
  async function loadLyricsLibrary(){
    try{
      const r=await fetch("./lyrics-index.json",{cache:"no-cache"});
      if(!r.ok)throw Error("No se pudo leer el índice de letras.");
      lyricFiles=await r.json();renderLyricsOptions();
    }catch(e){$("lyricsCount").textContent="Error";$("lyricsViewer").textContent=e.message;}
  }
  $("audioSelect").addEventListener("change",e=>{if(e.target.value!=="")chooseTrack(Number(e.target.value),true);});
  $("audioPlay").addEventListener("click",()=>{
    if(currentTrack<0){if(audioTracks.length)chooseTrack(0,true);return;}
    if(audioEl.paused)audioEl.play().catch(()=>{$("audioStatus").textContent="Pulsa Reproducir otra vez para iniciar.";});
    else audioEl.pause();
  });
  $("audioPrev").addEventListener("click",()=>stepTrack(-1,true));
  $("audioNext").addEventListener("click",()=>stepTrack(1,true));
  $("audioSearch").addEventListener("input",renderTrackList);
  $("audioEl" in window? "audioEl":"audioElement");
  audioEl.addEventListener("play",()=>{$("audioPlay").textContent="Ⅱ Pausar";});
  audioEl.addEventListener("pause",()=>{$("audioPlay").textContent="▶ Reproducir";});
  audioEl.addEventListener("error",()=>{
    if(currentTrack>=0)$("audioStatus").textContent="No se encontró "+audioTracks[currentTrack].file+" en Cloudflare (error "+(audioEl.error?.code||"desconocido")+"). Usa Siguiente para continuar.";
  });
  audioEl.addEventListener("timeupdate",()=>{
    const f=n=>!Number.isFinite(n)?"00:00":String(Math.floor(n/60)).padStart(2,"0")+":"+String(Math.floor(n%60)).padStart(2,"0");
    $("audioTime").textContent=f(audioEl.currentTime)+" / "+f(audioEl.duration);
  });
  audioEl.addEventListener("ended",()=>stepTrack(1,true));
  $("lyricsSearch").addEventListener("input",renderLyricsOptions);
  $("lyricsSelect").addEventListener("change",e=>loadLibraryLyric(e.target.value));
  loadCloudLibrary();loadLyricsLibrary();

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferred = e;
    $("installBtn").hidden = false;
  });
  $("installBtn").addEventListener("click", async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    $("installBtn").hidden = true;
  });
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () =>
      navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
  window.addEventListener("beforeunload", save);
})();