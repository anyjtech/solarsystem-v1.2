import React from "react";
import { Planet } from "../types";
import { planetsData } from "../data";
import { Lightbulb, Thermometer, Calendar, Milestone, Moon, Wind, Layers, Info, RotateCw } from "lucide-react";
import { PlanetInspector } from "./PlanetInspector";

interface PlanetDetailsProps {
  planet: Planet | null;
  isPaused: boolean;
}

export const PlanetDetails: React.FC<PlanetDetailsProps> = ({ planet, isPaused }) => {
  // If no planet is selected, display solar overview (Matahari) and navigation handbook
  if (!planet) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        {/* Navigation Handbook Guide */}
        <div className="p-6 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl">
          <h2 className="text-xs font-mono font-bold text-cyan-400 tracking-[0.2em] mb-4 uppercase flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" /> PANDUAN NAVIGASI
          </h2>
          <ul className="text-xs text-slate-300 space-y-3 list-none p-0 font-sans">
            <li className="flex items-start gap-2.5">
              <span className="text-cyan-400 font-mono">▸</span>
              <span><strong>Rotasi Kamera:</strong> Drag mouse di kanvas ke kiri-kanan atau atas-bawah untuk mengubah visualisasi sudut pandang 3D solar plane.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-cyan-400 font-mono">▸</span>
              <span><strong>Sistem Zoom:</strong> Gunakan wheel scroll mouse atau tombol HUD di pojok kanan simulator untuk memperbesar detail objek.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-cyan-400 font-mono">▸</span>
              <span><strong>Inspeksi Planet:</strong> Klik langsung pada planet di kanvas untuk melacak koordinat orbit dan membuka panel instrumen.</span>
            </li>
          </ul>
        </div>

        {/* Central Object Overview: The Sun (Matahari) */}
        <div className="p-8 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-2xl flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-orange-400 uppercase font-bold tracking-[0.2em]">
                Bintang Induk
              </span>
              <h2 className="text-5xl font-black italic text-white tracking-tighter mt-1 uppercase">
                MATAHARI
              </h2>
              <p className="text-xs text-gray-500 font-mono tracking-wider mt-1">Sol / Astronomical Origin</p>
            </div>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed font-sans">
            Matahari adalah bintang pusat Tata Surya kita. Sebagai bola plasma fusi nuklir raksasa, energinya menopang seluruh kehidupan di Bumi. Gravitasinya yang ekstrem bertindak sebagai penopang utama kestabilan orbit seluruh planet.
          </p>

          {/* Core specs customized details grid */}
          <div className="grid grid-cols-2 gap-5 border-t border-white/10 pt-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Suhu Inti</span>
              <span className="text-lg font-mono text-white">~15,000,000 °C</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Diameter</span>
              <span className="text-lg font-mono text-white">1,392,700 KM</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Massa</span>
              <span className="text-lg font-mono text-white">1.989 × 10³⁰ KG</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Siklus Rotasi</span>
              <span className="text-lg font-mono text-white">25.4 Hari</span>
            </div>
          </div>

          {/* Interactive Button */}
          <button className="mt-2 w-full py-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-200 text-xs font-bold uppercase tracking-widest transition-all rounded font-mono">
            Eksplorasi Radiasi Termal
          </button>
        </div>
      </div>
    );
  }

  // Active planet presentation sheet
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 3D Planet Close up Renderer Inside Sidebar */}
      <PlanetInspector planet={planet} isPaused={isPaused} />

      {/* Main Stats Description */}
      <div className="p-8 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-2xl flex flex-col gap-6">
        
        {/* Title Block */}
        <div>
          <span className="text-[10px] uppercase font-bold tracking-[0.2em]" style={{ color: planet.color }}>
            Planet Ke-{planetsData.indexOf(planet) + 1} dari Matahari
          </span>
          <h2 className="text-5xl font-black italic text-white tracking-tighter uppercase mt-1">
            {planet.name}
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1 tracking-wider">
            Orbit Coordinates · {planet.englishName.toUpperCase()}
          </p>
        </div>

        {/* Short introduction bio */}
        <p className="text-sm text-gray-400 leading-relaxed font-sans">
          {planet.description}
        </p>

        {/* Dynamic stat grids - split border lines */}
        <div className="grid grid-cols-2 gap-5 border-t border-white/10 pt-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Diameter</span>
            <span className="text-lg font-mono text-white">{planet.realSize.toUpperCase()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Suhu Rata-rata</span>
            <span className="text-lg font-mono text-white">{planet.temperature}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Periode Orbit</span>
            <span className="text-lg font-mono text-white">{planet.realOrbitPeriod}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Rotasi</span>
            <span className="text-lg font-mono text-white">{planet.realRotationPeriod}</span>
          </div>
        </div>

        {/* Satellites naturally integrated */}
        <div className="flex flex-col gap-2 border-t border-white/10 pt-5">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1">
            <Moon className="w-3.5 h-3.5 text-gray-500" /> Satelit Alami ({planet.moonsCount})
          </span>
          {planet.moonsCount > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {planet.moonsList.map((moon, ii) => (
                <span key={ii} className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-slate-300 border border-white/5">
                  {moon}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 italic text-xs">Tidak memiliki satelit alami</span>
          )}
        </div>

        {/* Atmosphere tags list */}
        {planet.atmosphere.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-white/10 pt-5">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-gray-500" /> Komposisi Atmosfer
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {planet.atmosphere.map((gas, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded bg-white/5 text-slate-300 text-[10px] font-mono border border-white/5"
                >
                  {gas}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Geology section */}
        <div className="flex flex-col gap-2 border-t border-white/10 pt-5">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Kondisi Geologi</span>
          <p className="text-xs text-gray-400 lead-relaxed">
            {planet.geology}
          </p>
        </div>

        {/* Fun Fact Sheet */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex gap-3 items-start transition-all hover:bg-white/10">
          <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0 animate-pulse" />
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-bold text-slate-200">Tahukah Anda?</span>
            <span className="text-slate-300 font-sans leading-relaxed">
              {planet.funFact}
            </span>
          </div>
        </div>

        {/* Exploration Call to action */}
        <button
          className="mt-2 w-full py-4 text-xs font-bold uppercase tracking-widest transition-all rounded font-mono border"
          style={{
            backgroundColor: `${planet.color}22`,
            borderColor: `${planet.color}55`,
            color: planet.color,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${planet.color}35`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${planet.color}22`;
          }}
        >
          Mulai Eksplorasi Permukaan {planet.name.toUpperCase()}
        </button>

      </div>
    </div>
  );
};
