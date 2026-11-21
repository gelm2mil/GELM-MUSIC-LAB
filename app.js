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


  // Reproductor compacto: archivos importados permanecen en memoria de esta sesión.
  const audioTracks = [];
  const audioUrls = [];
  let currentTrack = -1, currentLyrics = [], timedLyrics = false;
  const audioEl = $("audioElement");
  function cleanName(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/\\.[^.]+$/,"").replace(/^\\d+[-_ ]*/,"").replace(/[^a-z0-9]+/g," ").trim(); }
  function renderTrackSelect() {
    const sel=$("audioSelect"); sel.innerHTML='<option value="">Selecciona una canción…</option>';
    audioTracks.forEach((t,i)=>{const o=document.createElement("option");o.value=i;o.textContent=t.title;sel.append(o);});
    $("audioCount").textContent=audioTracks.length+" pistas";
  }
  function parseLrc(text) {
    const out=[]; const re=/\\[(\\d{1,2}):(\\d{2})(?:[.:](\\d{1,3}))?\\](.*)/g; let m;
    while((m=re.exec(text))!==null){const frac=(m[3]||"0").padEnd(3,"0");out.push({time:Number(m[1])*60+Number(m[2])+Number(frac)/1000,text:m[4].trim()});}
    return out.sort((a,b)=>a.time-b.time);
  }
  function showLyricsAt(time) {
    const box=$("syncLyrics");
    if(!currentLyrics.length){box.textContent="No hay letra asociada a esta pista. Importa su TXT o LRC.";return;}
    let idx=0;
    if(timedLyrics){for(let i=0;i<currentLyrics.length;i++){if(currentLyrics[i].time<=time)idx=i;else break;}}
    else if(audioEl.duration){idx=Math.min(currentLyrics.length-1,Math.floor(time/audioEl.duration*currentLyrics.length));}
    box.innerHTML="";
    const start=Math.max(0,idx-1),end=Math.min(currentLyrics.length,idx+3);
    for(let i=start;i<end;i++){const d=document.createElement("div");d.textContent=currentLyrics[i].text; if(i===idx)d.className="lyric-active";box.append(d);}
    const active=box.querySelector(".lyric-active"); if(active)active.scrollIntoView({block:"nearest"});
  }
  function chooseTrack(i,play=false) {
    if(i<0||i>=audioTracks.length)return;
    currentTrack=i; const t=audioTracks[i]; audioEl.src=t.url;
    $("audioSelect").value=String(i); $("audioNowTitle").textContent=t.title;
    currentLyrics=t.lyrics||[];timedLyrics=!!t.timed;showLyricsAt(0);
    if(play)audioEl.play().then(()=>$("audioPlay").textContent="Ⅱ Pausar").catch(()=>$("audioStatus").textContent="El navegador bloqueó la reproducción; pulsa Play.");
  }
  $("catalogInput").addEventListener("change",async e=>{
    const f=e.target.files[0];if(!f)return;
    try{const data=JSON.parse(await f.text());const arr=Array.isArray(data)?data:(data.songs||data.tracks||[]);
      $("audioStatus").textContent=arr.length+" registros de catálogo cargados. Ahora importa la carpeta MP3.";
      window.gelmCatalog=arr;
    }catch(err){$("audioStatus").textContent="No se pudo leer el JSON. Revisa su formato.";}
    e.target.value="";
  });
  $("audioFilesInput").addEventListener("change",e=>{
    audioUrls.forEach(URL.revokeObjectURL);audioUrls.length=0;audioTracks.length=0;
    const files=Array.from(e.target.files||[]).filter(f=>f.type.startsWith("audio/")||/\\.mp3$/i.test(f.name));
    const catalog=window.gelmCatalog||[];
    files.forEach(f=>{
      const stem=f.name.replace(/\\.[^.]+$/,"");
      const match=catalog.find(x=>cleanName(x.file)===cleanName(f.name))||catalog.find(x=>cleanName(x.title)===cleanName(stem));
      const url=URL.createObjectURL(f);audioUrls.push(url);
      audioTracks.push({title:match?.title||stem.replace(/^\\d+[-_ ]*/,"").replace(/[-_]/g," "),file:f.name,url,lyrics:[],timed:false});
    });
    renderTrackSelect();$("audioStatus").textContent=audioTracks.length+" MP3 listos en este navegador.";
    if(audioTracks.length)chooseTrack(0,false);
    e.target.value="";
  });
  $("lyricFilesInput").addEventListener("change",async e=>{
    const files=Array.from(e.target.files||[]);
    for(const f of files){const stem=cleanName(f.name);const track=audioTracks.find(t=>cleanName(t.file)===stem||cleanName(t.title)===stem);if(!track)continue;
      const text=await f.text();track.timed=/\\.lrc$/i.test(f.name);track.lyrics=track.timed?parseLrc(text):text.replace(/\\r/g,"").split("\\n").filter(x=>x.trim()).map(x=>({text:x}));
    }
    if(currentTrack>=0){currentLyrics=audioTracks[currentTrack].lyrics;timedLyrics=audioTracks[currentTrack].timed;showLyricsAt(audioEl.currentTime||0);}
    $("audioStatus").textContent="Letras asociadas cuando coincide el nombre del archivo.";
    e.target.value="";
  });
  $("audioSelect").addEventListener("change",e=>chooseTrack(Number(e.target.value),false));
  $("audioPlay").addEventListener("click",()=>{if(!audioEl.src&&audioTracks.length)chooseTrack(0,false);if(audioEl.paused)audioEl.play().then(()=>$("audioPlay").textContent="Ⅱ Pausar").catch(()=>{});else audioEl.pause();});
  $("audioPrev").addEventListener("click",()=>{if(audioTracks.length)chooseTrack((currentTrack-1+audioTracks.length)%audioTracks.length,true);});
  $("audioNext").addEventListener("click",()=>{if(audioTracks.length)chooseTrack((currentTrack+1)%audioTracks.length,true);});
  audioEl.addEventListener("play",()=>$("audioPlay").textContent="Ⅱ Pausar");
  audioEl.addEventListener("pause",()=>$("audioPlay").textContent="▶ Reproducir");
  audioEl.addEventListener("timeupdate",()=>{const fmt=n=>{if(!Number.isFinite(n))return "00:00";return String(Math.floor(n/60)).padStart(2,"0")+":"+String(Math.floor(n%60)).padStart(2,"0");};$("audioTime").textContent=fmt(audioEl.currentTime)+" / "+fmt(audioEl.duration);showLyricsAt(audioEl.currentTime);});
  audioEl.addEventListener("ended",()=>{if(audioTracks.length)chooseTrack((currentTrack+1)%audioTracks.length,true);});
\n  window.addEventListener("beforeinstallprompt", e => {
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