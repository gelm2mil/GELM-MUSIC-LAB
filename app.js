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


  // Reproductor GT-GELM conectado al catálogo y audios de Cloudflare.
  const audioTracks=[];
  let currentTrack=-1,currentLyrics=[],timedLyrics=false;
  const audioEl=$("audioElement");
  const AUDIO_BASE="https://divine-king-c86b.chapin7839.workers.dev/";
  const LYRIC_BASE="./lyrics/";
  function parseLrc(text){
    const out=[],re=/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\](.*)/g;let m;
    while((m=re.exec(text))!==null){const f=(m[3]||"0").padEnd(3,"0");out.push({time:+m[1]*60 + +m[2] + +f/1000,text:m[4].trim()});}
    return out.sort((a,b)=>a.time-b.time);
  }
  function renderTrackSelect(){
    const sel=$("audioSelect");sel.innerHTML='<option value="">Selecciona una canción…</option>';
    audioTracks.forEach((t,i)=>{const o=document.createElement("option");o.value=i;o.textContent=t.title+(t.category?" · "+t.category:"");sel.append(o);});
    $("audioCount").textContent=audioTracks.length+" pistas";
  }
  function showLyricsAt(time){
    const box=$("syncLyrics");
    if(!currentLyrics.length){box.textContent="No hay letra asociada a esta canción en la carpeta lyrics.";return;}
    let idx=0;
    if(timedLyrics){for(let i=0;i<currentLyrics.length;i++){if(currentLyrics[i].time<=time)idx=i;else break;}}
    else if(audioEl.duration)idx=Math.min(currentLyrics.length-1,Math.floor(time/audioEl.duration*currentLyrics.length));
    box.innerHTML="";
    for(let i=Math.max(0,idx-1);i<Math.min(currentLyrics.length,idx+3);i++){
      const d=document.createElement("div");d.textContent=currentLyrics[i].text;if(i===idx)d.className="lyric-active";box.append(d);
    }
    box.querySelector(".lyric-active")?.scrollIntoView({block:"nearest"});
  }
  async function loadTrackLyrics(track){
    currentLyrics=[];timedLyrics=false;
    const stem=(track.file||"").replace(/\.[^.]+$/,"");
    const names=[stem+".lrc",stem+".txt"];
    for(const name of names){
      try{
        const res=await fetch(LYRIC_BASE+encodeURIComponent(name),{cache:"no-cache"});
        if(!res.ok)continue;
        const txt=await res.text(),lrc=/\.lrc$/i.test(name);
        const parsed=lrc?parseLrc(txt):txt.replace(/\r/g,"").split("\n").map(x=>x.trim()).filter(Boolean).map(text=>({text}));
        if(parsed.length){currentLyrics=parsed;timedLyrics=lrc;return;}
      }catch(e){}
    }
  }
  async function chooseTrack(i,play=false){
    if(i<0||i>=audioTracks.length)return;
    currentTrack=i;const t=audioTracks[i];audioEl.src=t.url;
    $("audioSelect").value=String(i);$("audioNowTitle").textContent=t.title;
    $("audioStatus").textContent="Cargando canción y letra…";
    currentLyrics=[];showLyricsAt(0);await loadTrackLyrics(t);showLyricsAt(0);
    $("audioStatus").textContent="Cloudflare conectado · "+audioTracks.length+" canciones";
    if(play){try{await audioEl.play();}catch(e){$("audioStatus").textContent="Pulsa Reproducir para iniciar.";}}
  }
  async function loadCloudLibrary(){
    $("audioStatus").textContent="Conectando con musica.json…";
    try{
      const res=await fetch("./musica.json",{cache:"no-cache"});if(!res.ok)throw Error("HTTP "+res.status);
      const data=await res.json(),list=Array.isArray(data)?data:(data.songs||data.tracks||[]);
      if(!list.length)throw Error("El catálogo está vacío.");
      audioTracks.push(...list.filter(x=>x.file).map(x=>({title:x.title||x.file,file:x.file,category:x.category||"",url:AUDIO_BASE+encodeURIComponent(x.file)})));
      renderTrackSelect();$("audioStatus").textContent="Biblioteca Cloudflare conectada · "+audioTracks.length+" canciones";
      $("syncLyrics").textContent="Selecciona una canción. La letra se buscará en /lyrics usando el nombre exacto del MP3.";
      if(audioTracks.length)await chooseTrack(0,false);
    }catch(e){$("audioStatus").textContent="No se pudo cargar musica.json: "+e.message;}
  }
  $("audioSelect").addEventListener("change",e=>chooseTrack(Number(e.target.value),false));
  $("audioPlay").addEventListener("click",async()=>{
    if(currentTrack<0&&audioTracks.length)await chooseTrack(0,false);
    if(audioEl.paused){try{await audioEl.play();}catch(e){}}else audioEl.pause();
  });
  $("audioPrev").addEventListener("click",()=>{if(audioTracks.length)chooseTrack((currentTrack-1+audioTracks.length)%audioTracks.length,true);});
  $("audioNext").addEventListener("click",()=>{if(audioTracks.length)chooseTrack((currentTrack+1)%audioTracks.length,true);});
  audioEl.addEventListener("play",()=>$("audioPlay").textContent="Ⅱ Pausar");
  audioEl.addEventListener("pause",()=>$("audioPlay").textContent="▶ Reproducir");
  audioEl.addEventListener("timeupdate",()=>{
    const f=n=>!Number.isFinite(n)?"00:00":String(Math.floor(n/60)).padStart(2,"0")+":"+String(Math.floor(n%60)).padStart(2,"0");
    $("audioTime").textContent=f(audioEl.currentTime)+" / "+f(audioEl.duration);showLyricsAt(audioEl.currentTime);
  });
  audioEl.addEventListener("ended",()=>{if(audioTracks.length)chooseTrack((currentTrack+1)%audioTracks.length,true);});
  loadCloudLibrary();

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