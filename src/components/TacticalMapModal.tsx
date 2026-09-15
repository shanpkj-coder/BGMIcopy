import React from 'react';
import { X, MapPin, Radio, Car, Package, Users } from 'lucide-react';
import { PlayZone, MapId } from '../types/game';
import { MAP_CONFIGS } from '../game/gameModes';

interface TacticalMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerPos: { x: number; z: number };
  playerYaw: number;
  zone: PlayZone | null;
  compounds: { name: string; x: number; z: number }[];
  vehiclePos?: { x: number; z: number };
  vehicles?: { name: string; x: number; z: number }[];
  airdropPos?: { x: number; z: number } | null;
  mapId?: MapId;
  squadmates?: { name: string; x: number; z: number; isAlive: boolean }[];
}

export const TacticalMapModal: React.FC<TacticalMapModalProps> = ({
  isOpen,
  onClose,
  playerPos,
  playerYaw,
  zone,
  compounds,
  vehiclePos,
  vehicles,
  airdropPos,
  mapId = 'ERANGEL',
  squadmates = [],
}) => {
  if (!isOpen) return null;

  const mapConfig = MAP_CONFIGS[mapId] || MAP_CONFIGS.ERANGEL;
  const mapSize = mapConfig.islandSize;
  const toMapCoord = (coord: number) => {
    return ((coord + mapSize / 2) / mapSize) * 100;
  };

  const getThemeColors = () => {
    switch (mapId) {
      case 'MIRAMAR':
        return { bg: '#3b2512', land: '#a07042', stroke: '#c28b55', water: '#6d4826' };
      case 'VIKENDI':
        return { bg: '#172554', land: '#e2e8f0', stroke: '#94a3b8', water: '#38bdf8' };
      case 'SANHOK':
        return { bg: '#064e3b', land: '#15803d', stroke: '#22c55e', water: '#0284c7' };
      case 'WAREHOUSE_TDM':
        return { bg: '#09090b', land: '#27272a', stroke: '#52525b', water: '#18181b' };
      case 'ERANGEL':
      default:
        return { bg: '#1c2826', land: '#3e5a32', stroke: '#597b4b', water: '#2563eb' };
    }
  };

  const theme = getThemeColors();

  return (
    <div id="tactical-map-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="relative w-[680px] max-w-full bg-neutral-950 border border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-['Rajdhani',sans-serif]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <h2 className="text-base font-bold text-white tracking-wider uppercase font-['Chakra_Petch',sans-serif]">
                Tactical Radar • {mapConfig.name} ({mapConfig.biome})
              </h2>
              <p className="text-[11px] text-neutral-400">Scale: {mapConfig.islandSize}m x {mapConfig.islandSize}m Grid</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Canvas Frame */}
        <div className="relative w-full aspect-square overflow-hidden border border-neutral-800" style={{ backgroundColor: theme.bg }}>
          {/* Topographical grid lines */}
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-25">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="border border-white/30" />
            ))}
          </div>

          {/* Map Landmass Graphic */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {mapId === 'WAREHOUSE_TDM' ? (
              // Arena bounding box & catwalks
              <>
                <rect x="20" y="20" width="60" height="60" fill={theme.land} stroke={theme.stroke} strokeWidth="1.2" />
                <line x1="20" y1="50" x2="80" y2="50" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="8" fill="none" stroke="#f59e0b" strokeWidth="0.8" />
              </>
            ) : (
              // Island Landmasses
              <>
                <path
                  d="M 15 25 Q 35 10 65 15 Q 85 22 88 50 Q 82 78 65 85 Q 40 88 20 80 Q 12 55 15 25 Z"
                  fill={theme.land}
                  stroke={theme.stroke}
                  strokeWidth="0.8"
                />
                <path
                  d="M 50 78 Q 70 75 80 82 Q 78 92 60 92 Q 48 90 50 78 Z"
                  fill={theme.land}
                  stroke={theme.stroke}
                  strokeWidth="0.8"
                />
                <path
                  d="M 18 50 L 50 50 L 75 35 M 50 50 L 50 82"
                  stroke="#292524"
                  strokeWidth="1.5"
                  strokeDasharray="2,1"
                  fill="none"
                />
              </>
            )}
          </svg>

          {/* Play Zones (Blue Circle & White Next Circle) */}
          {zone && mapId !== 'WAREHOUSE_TDM' && (
            <>
              {/* White Safe Zone Circle */}
              <div
                className="absolute rounded-full border-2 border-white/80 pointer-events-none transition-all duration-500 shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                style={{
                  left: `${toMapCoord(zone.nextCenter.x)}%`,
                  top: `${toMapCoord(zone.nextCenter.z)}%`,
                  width: `${(zone.nextRadius * 2 / mapSize) * 100}%`,
                  height: `${(zone.nextRadius * 2 / mapSize) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
              {/* Blue Deadly Shrinking Zone Circle */}
              <div
                className="absolute rounded-full border-2 border-cyan-400 pointer-events-none shadow-[0_0_16px_rgba(6,182,212,0.8)]"
                style={{
                  left: `${toMapCoord(zone.currentCenter.x)}%`,
                  top: `${toMapCoord(zone.currentCenter.z)}%`,
                  width: `${(zone.currentRadius * 2 / mapSize) * 100}%`,
                  height: `${(zone.currentRadius * 2 / mapSize) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </>
          )}

          {/* Named Compound Locations */}
          {compounds.map((c) => (
            <div
              key={c.name}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
              style={{
                left: `${toMapCoord(c.x)}%`,
                top: `${toMapCoord(c.z)}%`,
              }}
            >
              <div className="w-2 h-2 rounded-full bg-amber-400 border border-black shadow-md" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/75 px-1.5 py-0.2 rounded border border-neutral-700 mt-0.5 whitespace-nowrap shadow">
                {c.name}
              </span>
            </div>
          ))}

          {/* Vehicles on Map */}
          {vehicles && vehicles.map((v, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{
                left: `${toMapCoord(v.x)}%`,
                top: `${toMapCoord(v.z)}%`,
              }}
            >
              <div className="w-5 h-5 rounded-full bg-amber-500 text-black border border-white flex items-center justify-center shadow-lg">
                <Car className="w-3 h-3" />
              </div>
            </div>
          ))}

          {/* Fallback single vehiclePos */}
          {!vehicles && vehiclePos && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{
                left: `${toMapCoord(vehiclePos.x)}%`,
                top: `${toMapCoord(vehiclePos.z)}%`,
              }}
            >
              <div className="w-5 h-5 rounded-full bg-amber-500 text-black border border-white flex items-center justify-center shadow-lg">
                <Car className="w-3 h-3" />
              </div>
            </div>
          )}

          {/* Airdrop Crate Marker */}
          {airdropPos && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10 animate-bounce"
              style={{
                left: `${toMapCoord(airdropPos.x)}%`,
                top: `${toMapCoord(airdropPos.z)}%`,
              }}
            >
              <div className="w-6 h-6 rounded bg-red-600 border-2 border-blue-500 text-white flex items-center justify-center shadow-xl">
                <Package className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-black text-amber-300 bg-black/90 px-1 rounded uppercase mt-0.5">
                AIRDROP
              </span>
            </div>
          )}

          {/* Friendly Squadmates on Map */}
          {squadmates.map((sq, idx) => (
            <div
              key={sq.name}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-20"
              style={{
                left: `${toMapCoord(sq.x)}%`,
                top: `${toMapCoord(sq.z)}%`,
              }}
            >
              <div className="w-4 h-4 rounded-full bg-blue-500 text-white border border-white flex items-center justify-center font-bold text-[9px] shadow-md">
                {idx + 2}
              </div>
            </div>
          ))}

          {/* Player Position & Direction Arrow */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-30"
            style={{
              left: `${toMapCoord(playerPos.x)}%`,
              top: `${toMapCoord(playerPos.z)}%`,
            }}
          >
            <div
              className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[14px] border-b-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]"
              style={{
                transform: `rotate(${playerYaw + Math.PI}rad)`,
              }}
            />
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-black -mt-2 shadow-md" />
            <span className="text-[9px] font-black text-amber-300 bg-black/90 px-1 rounded uppercase mt-0.5 font-mono">
              YOU
            </span>
          </div>
        </div>

        {/* Footer Legend */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900/90 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>You</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Squadmates</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Blue Zone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border border-white" />
              <span>Safe Zone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Car className="w-3 h-3 text-amber-400" />
              <span>Vehicles</span>
            </div>
          </div>

          <span className="font-mono text-[11px] text-neutral-500">Press M or ESC to Close</span>
        </div>
      </div>
    </div>
  );
};
