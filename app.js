(()=> {
  "use strict";
  const $ = id => document.getElementById(id);
  const KEY = "gelm_music_lab_v1";
  let songs = [], activeId = null, pos = 0, auto = null, deferred = null, lyricFiles = [];

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
    const q = $("searchInput").value.toLocaleLowerCase("es");
    $("songList").innerHTML = "";
    const found = lyricFiles.filter(x => x.name.toLocaleLowerCase("es").includes(q));
    $("songCount").textContent = found.length;
    found.forEach(item => {
      const b = document.createElement("button");
      b.className = "song-item" + (activeId === "library:" + item.file ? " active" : "");
      const title = document.createElement("b");
      const meta = document.createElement("small");
      title.textContent = item.name;
      meta.textContent = "Abrir manuscrito";
      b.append(title, meta);
      b.addEventListener("click", () => openLibraryManuscript(item));
      $("songList").append(b);
    });
  }

  function openLibraryManuscript(item) {
    const existing = songs.find(x => x.id === "library:" + item.file);
    if (existing) { save(); loadSong(existing); return; }
    fetch("./lirycs/" + encodeURIComponent(item.file), {cache:"no-cache"})
      .then(r => { if (!r.ok) throw new Error("No se pudo abrir el manuscrito."); return r.text(); })
      .then(content => {
        save();
        const s = { id:"library:" + item.file, title:item.name, content, position:0, mark:null, updated:Date.now() };
        songs.unshift(s); loadSong(s); save();
        $("saveStatus").textContent = "● Manuscrito cargado · copia local editable";
      })
      .catch(e => { $("saveStatus").textContent = e.message; });
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


  // MOTOR DE AUDIO GT-GELM · reproducción aleatoria sin repeticiones
  const audioTracks=[];
  const audioEl=$("audioElement");
  const AUDIO_BASE="https://divine-king-c86b.chapin7839.workers.dev/";
  let currentTrack=-1, shuffleBag=[], history=[], isChanging=false, errorSkipLock=false;
  const audioUrl=file=>/^https?:\\/\\//i.test(file)?file:AUDIO_BASE+String(file).split("/").map(encodeURIComponent).join("/");
  const fmtAudio=n=>!Number.isFinite(n)? "00:00":String(Math.floor(n/60)).padStart(2,"0")+":"+String(Math.floor(n%60)).padStart(2,"0");
  function shuffleRefill(exclude=currentTrack){
    const pool=audioTracks.map((_,i)=>i).filter(i=>i!==exclude);
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    shuffleBag=pool;
  }
  function nextRandomIndex(){
    if(!shuffleBag.length)shuffleRefill(currentTrack);
    if(!shuffleBag.length)return currentTrack;
    return shuffleBag.pop();
  }
  function renderTrackSelect(){
    const sel=$("audioSelect");sel.innerHTML='<option value="">Selecciona una canción…</option>';
    audioTracks.forEach((t,i)=>sel.add(new Option(t.title+(t.category?" · "+t.category:""),String(i))));
    $("audioCount").textContent=audioTracks.length+" pistas";
  }
  function updateTrackUI(){
    $("audioSelect").value=currentTrack>=0?String(currentTrack):"";
    $("audioNowTitle").textContent=currentTrack>=0?audioTracks[currentTrack].title:"Ninguna pista seleccionada";
  }
  function status(msg){$("audioStatus").textContent=msg;}
  async function chooseTrack(i,autoplay=false,remember=true){
    if(i<0||i>=audioTracks.length||isChanging)return false;
    isChanging=true;
    const track=audioTracks[i];
    if(remember&&currentTrack>=0&&currentTrack!==i)history.push(currentTrack);
    currentTrack=i;errorSkipLock=false;
    updateTrackUI();status("Preparando · "+track.title);
    audioEl.pause();
    audioEl.src=track.url;
    audioEl.load();
    try{
      if(autoplay){
        await audioEl.play();
        status("Reproduciendo · "+(i+1)+" de "+audioTracks.length);
      }else status("Lista · pulsa Reproducir");
      return true;
    }catch(err){
      status(err?.name==="NotAllowedError"?"El navegador requiere que pulses Reproducir.":"No se pudo cargar esta pista; buscando otra…");
      return false;
    }finally{isChanging=false;}
  }
  async function playRandom(){
    if(!audioTracks.length)return;
    for(let tries=0;tries<audioTracks.length;tries++){
      const i=nextRandomIndex();
      if(await chooseTrack(i,true))return;
    }
    status("No se pudo reproducir el catálogo. Comprueba la conexión.");
  }
  async function stepTrack(direction=1,autoplay=true){
    if(isChanging||!audioTracks.length)return;
    if(direction<0&&history.length){
      const previous=history.pop();
      await chooseTrack(previous,autoplay,false);
      return;
    }
    if(direction>0){await playRandom();return;}
    const i=(currentTrack-1+audioTracks.length)%audioTracks.length;
    await chooseTrack(i,autoplay);
  }
  async function loadCloudLibrary(){
    status("Conectando con la biblioteca GT-GELM…");
    try{
      const r=await fetch("./musica.json",{cache:"no-cache"});
      if(!r.ok)throw Error("No se pudo leer musica.json (HTTP "+r.status+").");
      const data=await r.json(),list=Array.isArray(data)?data:(data.songs||data.tracks||[]);
      audioTracks.push(...list.filter(x=>x&&x.file).map(x=>({title:x.title||x.file,file:x.file,category:x.category||"",url:audioUrl(x.file)})));
      if(!audioTracks.length)throw Error("El catálogo no contiene pistas válidas.");
      shuffleRefill(-1);
      renderTrackSelect();updateTrackUI();
      $("audioCount").textContent=audioTracks.length+" pistas";
      status("Biblioteca GT-GELM conectada · "+audioTracks.length+" canciones · modo aleatorio");
    }catch(e){status(e.message);}
  }
  async function loadLyricsLibrary(){
    try{
      const r=await fetch("./lyrics-index.json",{cache:"no-cache"});
      if(!r.ok)throw Error("No se pudo leer el índice de letras.");
      lyricFiles=await r.json();renderList();
    }catch(e){$("songCount").textContent="—";$("songList").textContent=e.message;}
  }
  $("audioSelect").addEventListener("change",e=>{
    if(e.target.value!==""){
      const chosen=Number(e.target.value);
      shuffleBag=shuffleBag.filter(i=>i!==chosen);
      chooseTrack(chosen,true);
    }
  });
  $("audioPlay").addEventListener("click",async()=>{
    if(currentTrack<0){await playRandom();return;}
    if(audioEl.paused){
      try{await audioEl.play();status("Reproduciendo · "+audioTracks[currentTrack].title);}
      catch(e){status("El navegador no pudo iniciar el audio. Vuelve a pulsar Reproducir.");}
    }else audioEl.pause();
  });
  $("audioPrev").addEventListener("click",()=>stepTrack(-1,true));
  $("audioNext").addEventListener("click",()=>stepTrack(1,true));
  audioEl.addEventListener("play",()=>{$("audioPlay").textContent="Ⅱ Pausar";});
  audioEl.addEventListener("pause",()=>{$("audioPlay").textContent="▶ Reproducir";});
  audioEl.addEventListener("loadedmetadata",()=>{$("audioTime").textContent=fmtAudio(audioEl.currentTime)+" / "+fmtAudio(audioEl.duration);});
  audioEl.addEventListener("timeupdate",()=>{$("audioTime").textContent=fmtAudio(audioEl.currentTime)+" / "+fmtAudio(audioEl.duration);});
  audioEl.addEventListener("ended",()=>stepTrack(1,true));
  audioEl.addEventListener("error",()=>{
    if(currentTrack<0||errorSkipLock)return;
    errorSkipLock=true;
    status("Pista no disponible · saltando a la siguiente…");
    setTimeout(()=>{errorSkipLock=false;stepTrack(1,true);},250);
  });
  if("mediaSession" in navigator){
    try{
      navigator.mediaSession.setActionHandler("play",()=>audioEl.play());
      navigator.mediaSession.setActionHandler("pause",()=>audioEl.pause());
      navigator.mediaSession.setActionHandler("nexttrack",()=>stepTrack(1,true));
      navigator.mediaSession.setActionHandler("previoustrack",()=>stepTrack(-1,true));
    }catch(e){}
  }
  loadCloudLibrary();loadLyricsLibrary();

  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;});
  $("installBtn").addEventListener("click",async()=>{
    if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;return;}
    const ua=navigator.userAgent;
    let msg="Abre el menú del navegador y elige Instalar aplicación o Añadir a pantalla de inicio.";
    if(/SamsungBrowser/i.test(ua))msg="Samsung Internet: menú ☰ → Añadir página a → Pantalla Inicio. Si aparece Instalar aplicación, también puedes elegirla.";
    else if(/Android/i.test(ua))msg="Android: menú ⋮ → Instalar aplicación o Añadir a pantalla de inicio.";
    else if(/iPhone|iPad|iPod/i.test(ua))msg="Safari → Compartir → Añadir a pantalla de inicio.";
    alert(msg);
  });
  if("serviceWorker" in navigator&&location.protocol.startsWith("http")){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }
  window.addEventListener("beforeunload", save);
})();