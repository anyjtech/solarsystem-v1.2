import { useState, useEffect } from "react";
import { planetsData } from "./data";
import { SolarSystemCanvas } from "./components/SolarSystemCanvas";
import { PlanetDetails } from "./components/PlanetDetails";
import { Globe, RefreshCw, Compass, Clock, Eclipse } from "lucide-react";

export default function App() {
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [liveTime, setLiveTime] = useState<string>("");

  // Live cosmic clock to simulate interstellar telemetry logs
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activePlanet = planetsData.find((p) => p.id === selectedPlanetId) || null;

  return (
    <div className="min-h-screen bg-[#020205] text-[#E0E0E0] flex flex-col font-sans relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Background visual style overlay - deep stellar gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-950/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-indigo-950/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Primary Header Segment */}
      <header className="border-b border-white/5 bg-[#020205]/70 backdrop-blur-md sticky top-0 z-50 px-6 md:px-12 py-5 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 shadow-lg shadow-cyan-950/50 animate-pulse">
            <Eclipse className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-4xl font-extralight tracking-[0.2em] text-white leading-none uppercase">
            SOLAR SYSTEM SIM
            </h1>
            <span className="text-[10px] uppercase tracking-[0.35em] text-cyan-400 mt-2 block font-mono font-bold">
              AstroOs v1.2
            </span>
          </div>
        </div>

        {/* Live Interstellar clock */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-gray-500 text-[9px] uppercase tracking-[0.2em]">Misi Telemetri</span>
            <span className="text-slate-300 font-mono text-[11px] font-bold">UTC-7 · LIVE</span>
          </div>
          <div className="p-2.5 px-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-400 font-bold tracking-wider">{liveTime || "00:00:00"}</span>
          </div>
        </div>
      </header>

      {/* Main Body Segment */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 z-10">
        
        {/* Planet QUICK SELECTOR CAROUSEL shelf */}
        <section className="flex flex-col gap-2 p-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-500" /> PILIH PLANET TERDEKAT
            </span>
            {selectedPlanetId && (
              <button
                onClick={() => setSelectedPlanetId(null)}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3" /> KEMBALI KE MATAHARI (CENTER)
              </button>
            )}
          </div>
          
          <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x select-none">
            {/* Matahari quick trigger */}
            <button
              onClick={() => setSelectedPlanetId(null)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border text-xs font-mono font-semibold shrink-0 snap-align-start transition-all cursor-pointer ${
                selectedPlanetId === null
                  ? "bg-amber-500/10 border-amber-400/50 text-amber-300 ring-2 ring-amber-400/20 shadow-lg"
                  : "bg-white/5 border-white/10 text-amber-400 hover:bg-white/10 hover:text-amber-300 hover:border-white/25"
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
              MATAHARI
            </button>

            {/* Planets loop */}
            {planetsData.map((planet, index) => {
              const isSelected = selectedPlanetId === planet.id;
              return (
                <button
                  key={planet.id}
                  onClick={() => setSelectedPlanetId(planet.id)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border text-xs font-mono shrink-0 snap-align-start transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 font-bold ring-2 ring-cyan-400/20 shadow-lg"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {/* Miniature colored dot */}
                  <span
                    className="w-3 h-3 rounded-full border border-white/15"
                    style={{
                      backgroundColor: planet.color,
                      boxShadow: `0 0 10px ${planet.color}`,
                    }}
                  />
                  <span>
                    {String(index + 1).padStart(2, "0")} · {planet.name.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Dynamic Bento-Grid Layout (Canvas + Sidebar Details) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Interactive Stage Box (7 Cols out of 12) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <SolarSystemCanvas
              selectedPlanetId={selectedPlanetId}
              onSelectPlanet={setSelectedPlanetId}
              speedMultiplier={speedMultiplier}
              setSpeedMultiplier={setSpeedMultiplier}
              isPaused={isPaused}
              setIsPaused={setIsPaused}
            />
            {/* Quick tips label */}
            <div className="px-5 py-4 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 text-[11px] text-gray-400 leading-relaxed font-sans">
              💡 <strong>Tips Eksplorasi:</strong> Coba seret (drag) mouse di atas kanvas 3D untuk memiringkan posisi teleskop kamera atau melakukan scroll untuk memperbesar detail objek planet. Sistem pelacakan terpusat kami akan melacak pergerakan dinamis planet secara real-time.
            </div>
          </div>

          {/* Detailed statistics side bar (5 Cols out of 12) */}
          <div className="lg:col-span-5 xl:col-span-4 h-full">
            <PlanetDetails planet={activePlanet} isPaused={isPaused} />
          </div>

        </div>

      </main>

      {/* Professional subtle footer */}
      <footer className="border-t border-white/5 bg-[#020205] py-8 px-6 text-center text-xs text-gray-500 font-mono select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>
            © 2026 COSMOS SIMULATOR · PROYEKSI ORTOGRAFIS 3D KINESTETIK TATA SURYA
          </span>
          <span className="flex items-center gap-2 text-[11px] text-gray-400">
            GRAVITASI ASING: <strong className="text-cyan-400">AKTIF</strong> · TELEMETRI ORBITAL: <strong className="text-cyan-400">KOSMIS</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}

