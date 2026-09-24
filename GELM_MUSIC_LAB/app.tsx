import { useEffect, useMemo, useState } from "react";

type Project = {
  id: string;
  name: string;
  language: string;
  style: string;
  lyrics: string;
  duration: number;
  bpm: string;
  key: string;
  seed: string;
  createdAt: string;
};

const BANNER =
  "https://gelm2mil.github.io/GT-GELM/img/banner-principal-gtgelm.png";

const DEFAULT_STYLE =
  "Guatemalan folk-pop, emotional historical storytelling, warm acoustic guitar, traditional marimba accents, subtle native flute, organic percussion, warm orchestral strings, expressive clear male lead vocals, intimate verses, uplifting communal chorus, respectful cultural atmosphere, cinematic but natural production, medium tempo, vocals front and center, no heavy metal, no hard rock, no screaming, no distorted guitars";

const DEFAULT_LYRICS = `[INTRO]

Guatemala...
tierra de muchas voces,
tierra de muchas memorias.

[VERSE 1]

Escribe aquí la primera parte de tu canción.

[CHORUS]

Escribe aquí el coro.

[VERSE 2]

Continúa aquí la historia.

[FINAL CHORUS]

Cierra aquí tu canción.`;

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function estimateDuration(lyrics: string) {
  const words = lyrics
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (!words) return 60;

  // Estimación aproximada para planificación.
  // El motor real podrá producir una duración diferente.
  const estimated = Math.round(words / 2.25);

  return Math.min(480, Math.max(30, estimated));
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------------------------------------------------------
   UTILIDADES DE ARCHIVOS
--------------------------------------------------------- */

function safeFileName(name: string) {
  const cleaned = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "_")
    .trim();

  return cleaned || "GELM_LETRA";
}

function downloadTextFile(name: string, lyrics: string) {
  if (!lyrics.trim()) {
    return false;
  }

  const content = `GELM MUSIC LAB
GT-GELM
==============================

${lyrics.trim()}

==============================
Archivo generado por GELM MUSIC LAB
`;

  const blob = new Blob(["\uFEFF", content], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${safeFileName(name)}.txt`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);

  return true;
}

/* ---------------------------------------------------------
   APLICACIÓN
--------------------------------------------------------- */

function App() {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("Español");
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [lyrics, setLyrics] = useState("");
  const [autoDuration, setAutoDuration] = useState(true);
  const [duration, setDuration] = useState(180);
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("Auto");
  const [seed, setSeed] = useState("Aleatoria");

  const [activeTab, setActiveTab] = useState<"crear" | "biblioteca">("crear");
  const [status, setStatus] = useState("Listo para configurar.");
  const [projects, setProjects] = useState<Project[]>([]);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("gelm_music_lab_projects");

    if (!saved) return;

    try {
      setProjects(JSON.parse(saved));
    } catch {
      localStorage.removeItem("gelm_music_lab_projects");
    }
  }, []);

  const estimatedDuration = useMemo(
    () => estimateDuration(lyrics),
    [lyrics],
  );

  const finalDuration = autoDuration ? estimatedDuration : duration;

  const wordCount = lyrics
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  /* ---------------------------------------------------------
     GUARDAR PROYECTO
  --------------------------------------------------------- */

  const saveProject = () => {
    const project: Project = {
      id: makeId(),
      name: name.trim() || "Sin nombre",
      language,
      style,
      lyrics,
      duration: finalDuration,
      bpm,
      key,
      seed,
      createdAt: new Date().toLocaleString("es-GT"),
    };

    const updated = [project, ...projects].slice(0, 50);

    setProjects(updated);

    localStorage.setItem(
      "gelm_music_lab_projects",
      JSON.stringify(updated),
    );

    setSavedMessage("✓ Proyecto guardado en este navegador.");
    setStatus("Borrador guardado correctamente.");

    window.setTimeout(() => {
      setSavedMessage("");
    }, 3000);
  };

  /* ---------------------------------------------------------
     DESCARGAR LETRA TXT
  --------------------------------------------------------- */

  const downloadCurrentLyrics = () => {
    if (!lyrics.trim()) {
      setStatus("Escribe la letra antes de descargar el TXT.");
      return;
    }

    const ok = downloadTextFile(
      name.trim() || "GELM_LETRA",
      lyrics,
    );

    if (ok) {
      setSavedMessage("✓ Letra descargada como archivo TXT.");
      setStatus("Copia de la letra creada correctamente.");

      window.setTimeout(() => {
        setSavedMessage("");
      }, 3000);
    }
  };

  /* ---------------------------------------------------------
     LIMPIAR
  --------------------------------------------------------- */

  const clearProject = () => {
    setName("");
    setLanguage("Español");
    setStyle(DEFAULT_STYLE);
    setLyrics("");
    setAutoDuration(true);
    setDuration(180);
    setBpm("");
    setKey("Auto");
    setSeed("Aleatoria");
    setStatus("Formulario limpio.");
    setSavedMessage("");
  };

  /* ---------------------------------------------------------
     PREPARAR GENERACIÓN
  --------------------------------------------------------- */

  const prepareGeneration = () => {
    if (!name.trim()) {
      setStatus("Escribe primero el nombre de la canción.");
      return;
    }

    if (!lyrics.trim()) {
      setStatus("Escribe la letra antes de continuar.");
      return;
    }

    setStatus(
      `Configuración lista: ${formatDuration(finalDuration)}. Motor musical pendiente de conexión.`,
    );
  };

  /* ---------------------------------------------------------
     CARGAR PROYECTO
  --------------------------------------------------------- */

  const loadProject = (project: Project) => {
    setName(project.name);
    setLanguage(project.language);
    setStyle(project.style);
    setLyrics(project.lyrics);
    setAutoDuration(false);
    setDuration(project.duration);
    setBpm(project.bpm);
    setKey(project.key);
    setSeed(project.seed);

    setActiveTab("crear");
    setStatus(`Proyecto "${project.name}" cargado.`);
  };

  /* ---------------------------------------------------------
     DESCARGAR TXT DESDE BIBLIOTECA
  --------------------------------------------------------- */

  const downloadProjectLyrics = (project: Project) => {
    const ok = downloadTextFile(project.name, project.lyrics);

    if (ok) {
      setStatus(`TXT de "${project.name}" descargado correctamente.`);
      setSavedMessage("✓ Archivo TXT descargado.");

      window.setTimeout(() => {
        setSavedMessage("");
      }, 3000);
    }
  };

  /* ---------------------------------------------------------
     ELIMINAR
  --------------------------------------------------------- */

  const deleteProject = (id: string) => {
    const updated = projects.filter((project) => project.id !== id);

    setProjects(updated);

    localStorage.setItem(
      "gelm_music_lab_projects",
      JSON.stringify(updated),
    );

    setStatus("Proyecto eliminado de la biblioteca.");
  };

  /* ---------------------------------------------------------
     ESTILOS
  --------------------------------------------------------- */

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(2, 18, 11, 0.86)",
    color: "#eafff3",
    border: "1px solid rgba(42, 255, 133, 0.45)",
    borderRadius: "10px",
    padding: "13px 14px",
    outline: "none",
    fontSize: "14px",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "8px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#59ff9b",
    letterSpacing: "0.04em",
  };

  const panelStyle: React.CSSProperties = {
    background: "rgba(2, 20, 12, 0.88)",
    border: "1px solid rgba(42, 255, 133, 0.35)",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 0 25px rgba(0, 255, 120, 0.07)",
    backdropFilter: "blur(8px)",
  };

  /* ---------------------------------------------------------
     INTERFAZ
  --------------------------------------------------------- */

  return (
    <main
      style={{
        minHeight: "100vh",
        color: "#edfff4",
        background:
          "linear-gradient(rgba(0,12,7,0.82), rgba(0,12,7,0.94)), url(" +
          BANNER +
          ") center top / cover fixed",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "min(1120px, calc(100% - 28px))",
          margin: "0 auto",
          padding: "26px 0 50px",
        }}
      >
        <header
          style={{
            ...panelStyle,
            marginBottom: "16px",
            padding: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
            }}
          >
            <div>
              <div
                style={{
                  color: "#44ff91",
                  fontSize: "30px",
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                }}
              >
                GELM MUSIC LAB
              </div>

              <div
                style={{
                  marginTop: "5px",
                  color: "#9affbd",
                  fontSize: "13px",
                }}
              >
                Laboratorio musical · GT-GELM · V0.4
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab("crear")}
                style={{
                  ...buttonStyle(true),
                  opacity: activeTab === "crear" ? 1 : 0.72,
                }}
              >
                🎵 Crear
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("biblioteca")}
                style={{
                  ...buttonStyle(false),
                  opacity: activeTab === "biblioteca" ? 1 : 0.72,
                }}
              >
                📚 Biblioteca ({projects.length})
              </button>
            </div>
          </div>
        </header>

        {activeTab === "crear" ? (
          <>
            <section style={panelStyle}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "14px",
                }}
              >
                <div>
                  <label style={labelStyle}>
                    NOMBRE DE LA CANCIÓN
                  </label>

                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ej. LA VOZ XINKA"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    IDIOMA VOCAL
                  </label>

                  <select
                    value={language}
                    onChange={(event) =>
                      setLanguage(event.target.value)
                    }
                    style={inputStyle}
                  >
                    <option>Español</option>
                    <option>K'iche'</option>
                    <option>Kaqchikel</option>
                    <option>Q'eqchi'</option>
                    <option>Mam</option>
                    <option>Xinka</option>
                    <option>Garífuna</option>
                    <option>Instrumental</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: "14px" }}>
                <label style={labelStyle}>
                  ESTILO / MUSIC CAPTION
                </label>

                <textarea
                  value={style}
                  onChange={(event) => setStyle(event.target.value)}
                  rows={5}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ marginTop: "14px" }}>
                <label style={labelStyle}>
                  LETRA
                </label>

                <textarea
                  value={lyrics}
                  onChange={(event) =>
                    setLyrics(event.target.value)
                  }
                  rows={18}
                  placeholder="Escribe aquí la letra..."
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    lineHeight: 1.55,
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Consolas, monospace",
                  }}
                />

                <div
                  style={{
                    marginTop: "8px",
                    color: "#8dd9aa",
                    fontSize: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>{wordCount} palabras</span>

                  <span>
                    Estimación automática:{" "}
                    {formatDuration(estimatedDuration)}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "14px",
                  marginTop: "14px",
                }}
              >
                <div
                  style={{
                    ...panelStyle,
                    padding: "14px",
                  }}
                >
                  <label style={labelStyle}>
                    DURACIÓN
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "13px",
                      marginBottom: "10px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={autoDuration}
                      onChange={(event) =>
                        setAutoDuration(event.target.checked)
                      }
                    />

                    Automática según la letra
                  </label>

                  <input
                    type="number"
                    min={30}
                    max={480}
                    value={
                      autoDuration
                        ? estimatedDuration
                        : duration
                    }
                    disabled={autoDuration}
                    onChange={(event) =>
                      setDuration(
                        Number(event.target.value),
                      )
                    }
                    style={{
                      ...inputStyle,
                      opacity: autoDuration ? 0.6 : 1,
                    }}
                  />

                  <div
                    style={{
                      marginTop: "7px",
                      color: "#74ffa6",
                      fontSize: "12px",
                    }}
                  >
                    Máximo GELM: 8:00
                  </div>
                </div>

                <div
                  style={{
                    ...panelStyle,
                    padding: "14px",
                  }}
                >
                  <label style={labelStyle}>
                    BPM
                  </label>

                  <input
                    value={bpm}
                    onChange={(event) =>
                      setBpm(event.target.value)
                    }
                    placeholder="Auto"
                    style={inputStyle}
                  />

                  <div
                    style={{
                      marginTop: "7px",
                      color: "#74ffa6",
                      fontSize: "12px",
                    }}
                  >
                    Déjalo vacío para automático.
                  </div>
                </div>

                <div
                  style={{
                    ...panelStyle,
                    padding: "14px",
                  }}
                >
                  <label style={labelStyle}>
                    TONALIDAD
                  </label>

                  <select
                    value={key}
                    onChange={(event) =>
                      setKey(event.target.value)
                    }
                    style={inputStyle}
                  >
                    <option>Auto</option>
                    <option>C</option>
                    <option>D</option>
                    <option>E</option>
                    <option>F</option>
                    <option>G</option>
                    <option>A</option>
                    <option>B</option>
                  </select>
                </div>

                <div
                  style={{
                    ...panelStyle,
                    padding: "14px",
                  }}
                >
                  <label style={labelStyle}>
                    SEMILLA
                  </label>

                  <input
                    value={seed}
                    onChange={(event) =>
                      setSeed(event.target.value)
                    }
                    placeholder="Aleatoria"
                    style={inputStyle}
                  />

                  <div
                    style={{
                      marginTop: "7px",
                      color: "#74ffa6",
                      fontSize: "12px",
                    }}
                  >
                    La usaremos después para reproducibilidad.
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "16px",
                  padding: "14px",
                  borderRadius: "12px",
                  border:
                    "1px solid rgba(42,255,133,0.22)",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                <div
                  style={{
                    color: "#59ff9b",
                    fontWeight: 800,
                    marginBottom: "5px",
                  }}
                >
                  ESTADO DEL MOTOR
                </div>

                <div
                  style={{
                    color: "#c6efd3",
                    fontSize: "13px",
                  }}
                >
                  {status}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginTop: "16px",
                }}
              >
                <button
                  type="button"
                  onClick={prepareGeneration}
                  style={buttonStyle(true)}
                >
                  🚀 PREPARAR GENERACIÓN
                </button>

                <button
                  type="button"
                  onClick={saveProject}
                  style={buttonStyle(false)}
                >
                  💾 GUARDAR BORRADOR
                </button>

                <button
                  type="button"
                  onClick={downloadCurrentLyrics}
                  style={buttonStyle(false)}
                >
                  📄 DESCARGAR TXT
                </button>

                <button
                  type="button"
                  onClick={clearProject}
                  style={buttonStyle(false)}
                >
                  🧹 LIMPIAR
                </button>
              </div>

              {savedMessage && (
                <div
                  style={{
                    marginTop: "12px",
                    color: "#58ff96",
                    fontSize: "13px",
                  }}
                >
                  {savedMessage}
                </div>
              )}
            </section>

            <section
              style={{
                ...panelStyle,
                marginTop: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#59ff9b",
                  fontSize: "14px",
                  fontWeight: 800,
                }}
              >
                🎧 REPRODUCTOR GELM
              </div>

              <div
                style={{
                  marginTop: "10px",
                  color: "#88aa96",
                  fontSize: "13px",
                }}
              >
                Aquí aparecerá el audio real cuando conectemos el motor.
              </div>

              <div
                style={{
                  marginTop: "14px",
                  height: "8px",
                  borderRadius: "99px",
                  background: "rgba(100,255,160,0.1)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "0%",
                    height: "100%",
                    background: "#38ff91",
                  }}
                />
              </div>
            </section>
          </>
        ) : (
          <section style={panelStyle}>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 900,
                color: "#59ff9b",
                marginBottom: "6px",
              }}
            >
              📚 Biblioteca GELM
            </div>

            <div
              style={{
                color: "#93b9a1",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              Por ahora guarda proyectos y configuraciones.
              Más adelante aquí estarán también los audios generados.
            </div>

            {projects.length === 0 ? (
              <div
                style={{
                  padding: "30px 10px",
                  textAlign: "center",
                  color: "#789383",
                }}
              >
                Todavía no hay proyectos guardados.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "10px",
                }}
              >
                {projects.map((project) => (
                  <article
                    key={project.id}
                    style={{
                      border:
                        "1px solid rgba(42,255,133,0.2)",
                      borderRadius: "12px",
                      padding: "14px",
                      background: "rgba(0,0,0,0.18)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 900,
                            color: "#eafff3",
                          }}
                        >
                          {project.name}
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            color: "#84b996",
                            fontSize: "12px",
                          }}
                        >
                          {project.language} ·{" "}
                          {formatDuration(project.duration)} ·{" "}
                          {project.createdAt}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            loadProject(project)
                          }
                          style={buttonStyle(false)}
                        >
                          Abrir
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            downloadProjectLyrics(project)
                          }
                          style={buttonStyle(false)}
                        >
                          📄 TXT
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteProject(project.id)
                          }
                          style={buttonStyle(false)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <footer
          style={{
            marginTop: "18px",
            textAlign: "center",
            color: "#668675",
            fontSize: "11px",
          }}
        >
          GELM MUSIC LAB · GT-GELM · Laboratorio musical personal y educativo
        </footer>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------
   BOTONES
--------------------------------------------------------- */

function buttonStyle(primary: boolean): React.CSSProperties {
  return {
    border: primary
      ? "1px solid rgba(80,255,150,0.8)"
      : "1px solid rgba(70,220,130,0.35)",
    borderRadius: "10px",
    padding: "11px 15px",
    background: primary
      ? "#32f58b"
      : "rgba(5,35,21,0.8)",
    color: primary
      ? "#001b0d"
      : "#dfffea",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: primary
      ? "0 0 18px rgba(50,245,139,0.18)"
      : "none",
  };
}

export default App;
