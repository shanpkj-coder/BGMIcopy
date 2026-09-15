import React from 'react';
import { CameraMode, KillfeedEntry, PlayerStats, Stance, WeaponState, SquadMember, TdmState } from '../types/game';
import {
  Shield,
  HardHat,
  Crosshair,
  Zap,
  Compass,
  MapPin,
  AlertTriangle,
  Eye,
  RefreshCw,
  Car,
  User,
  Sparkles,
  ShieldCheck,
  Users,
  Volume2,
  Trophy,
  Swords,
  Radio
} from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  currentWeapon: WeaponState;
  activeSlot: number;
  onSelectSlot: (slot: number) => void;
  weapons: WeaponState[];
  compassHeading: number;
  aliveCount: number;
  killfeed: KillfeedEntry[];
  isAiming: boolean;
  hitmarker: { show: boolean; isHeadshot: boolean };
  damageIndicator: boolean;
  isOutsideBlueZone: boolean;
  vehiclePrompt: string | null;
  lootPrompt: string | null;
  cameraMode: CameraMode;
  onToggleCamera: () => void;
  stance: Stance;
  onSetStance: (s: Stance) => void;
  onReload: () => void;
  onUseMedkit: () => void;
  onUseDrink: () => void;
  onOpenMap: () => void;
  onOpenSettings: () => void;
  onOpenProgression: () => void;
  progressionLevel?: number;
  progressionBp?: number;
  phase: string;
  altitude: number;
  onDeployChute: () => void;
  playerName?: string;
  assistantName?: string;
  isGoogleConnected?: boolean;
  onOpenLobby?: () => void;
  graphicsPreset?: string;
  // Expansion props
  mapName?: string;
  gameModeName?: string;
  squadMembers?: SquadMember[];
  tdmState?: TdmState;
  vehicleInfo?: {
    name: string;
    speedKmh: number;
    health: number;
    maxHealth: number;
    isOccupied: boolean;
  } | null;
  onHonkHorn?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  currentWeapon,
  activeSlot,
  onSelectSlot,
  weapons,
  compassHeading,
  aliveCount,
  killfeed,
  isAiming,
  hitmarker,
  damageIndicator,
  isOutsideBlueZone,
  vehiclePrompt,
  lootPrompt,
  cameraMode,
  onToggleCamera,
  stance,
  onSetStance,
  onReload,
  onUseMedkit,
  onUseDrink,
  onOpenMap,
  onOpenSettings,
  onOpenProgression,
  progressionLevel = 4,
  progressionBp = 1200,
  phase,
  altitude,
  onDeployChute,
  playerName = 'Shan PKJ',
  assistantName = 'Antigravity AI (Google DeepMind)',
  isGoogleConnected = false,
  onOpenLobby,
  graphicsPreset = 'EXTREME_HDR',
  mapName = 'Erangel Classic',
  gameModeName = 'Squad Battle Royale',
  squadMembers = [],
  tdmState,
  vehicleInfo,
  onHonkHorn,
}) => {
  const compassMarkers = [
    { deg: 0, label: 'N' },
    { deg: 45, label: 'NE' },
    { deg: 90, label: 'E' },
    { deg: 135, label: 'SE' },
    { deg: 180, label: 'S' },
    { deg: 225, label: 'SW' },
    { deg: 270, label: 'W' },
    { deg: 315, label: 'NW' },
  ];

  return (
    <div id="game-hud-overlay" className="absolute inset-0 pointer-events-none select-none overflow-hidden font-['Rajdhani',sans-serif]">
      {/* 1. Outside Blue Zone Electric Blur Overlay */}
      {isOutsideBlueZone && (
        <div className="absolute inset-0 border-8 border-cyan-500/70 shadow-[inset_0_0_80px_rgba(6,182,212,0.6)] animate-pulse pointer-events-none z-10" />
      )}

      {/* 2. Damage Taken Flash Overlay */}
      {damageIndicator && (
        <div className="absolute inset-0 bg-red-600/30 border-8 border-red-600 shadow-[inset_0_0_100px_rgba(220,38,38,0.8)] pointer-events-none z-10 animate-ping" />
      )}

      {/* 3. Top Center Compass Ribbon */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
        <div className="bg-black/60 backdrop-blur-sm px-6 py-1 rounded-full border border-yellow-500/30 flex items-center gap-6 text-white text-sm shadow-lg overflow-hidden w-72 justify-center">
          <div className="flex items-center gap-5">
            {compassMarkers.map((m) => {
              const diff = ((m.deg - compassHeading + 540) % 360) - 180;
              if (Math.abs(diff) > 40) return null;
              return (
                <div key={m.deg} className="flex flex-col items-center">
                  <span className={`font-bold text-xs ${m.label.length === 1 ? 'text-amber-400 font-extrabold' : 'text-slate-300'}`}>
                    {m.label}
                  </span>
                  <span className="text-[10px] text-slate-400">{m.deg}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-amber-400 mt-0.5" />
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-amber-400 font-bold text-xs tracking-wider">{compassHeading}°</span>
          <span className="text-neutral-500 text-[10px]">•</span>
          <span className="text-neutral-300 font-mono text-[10px] bg-black/50 px-2 py-0.5 rounded border border-neutral-800">
            {mapName}
          </span>
        </div>
      </div>

      {/* 4. Top Left Alive, Kill Counter & Soldier Profile Badge */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Player Profile & Google Account Badge */}
          <button
            onClick={onOpenLobby}
            className="pointer-events-auto bg-neutral-900/90 hover:bg-neutral-850 backdrop-blur-md border border-amber-500/40 hover:border-amber-400 px-3 py-1.5 rounded-lg flex items-center gap-2.5 shadow-xl transition group text-left"
            title="Soldier Profile, Google Account & Deployment Settings"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-black font-extrabold text-xs shadow-md">
              {playerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white group-hover:text-amber-300 transition font-['Chakra_Petch',sans-serif]">
                  {playerName}
                </span>
                {isGoogleConnected ? (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                    <ShieldCheck className="w-2.5 h-2.5" /> Google
                  </span>
                ) : (
                  <span className="text-[9px] font-semibold text-neutral-400 bg-neutral-800 px-1.5 py-0.2 rounded">
                    Guest
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                <span className="text-amber-400/90 font-medium">Mode: {gameModeName}</span>
              </div>
            </div>
          </button>

          {/* Alive & Kill Counters */}
          <div className="bg-neutral-900/85 backdrop-blur-md border border-neutral-700/60 rounded-md px-3.5 py-1.5 flex items-center gap-3 shadow-xl">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <span className="text-xs uppercase tracking-wider text-neutral-400">Alive</span>
              <span className="text-lg font-['Chakra_Petch',sans-serif] font-bold text-amber-400">{aliveCount}</span>
            </div>
            <div className="w-[1px] h-4 bg-neutral-700" />
            <div className="flex items-center gap-1.5 text-red-400 font-bold">
              <span className="text-xs uppercase tracking-wider text-neutral-400">Kills</span>
              <span className="text-lg font-['Chakra_Petch',sans-serif] font-bold text-red-500">{stats.kills}</span>
            </div>
          </div>

          {/* Tactical Map Trigger Button */}
          <button
            onClick={onOpenMap}
            className="pointer-events-auto bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold tracking-wide transition shadow-lg"
            title="Open Tactical Map (M)"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>MAP (M)</span>
          </button>
        </div>

        {/* Squad Status Widget (Active in SQUAD mode) */}
        {squadMembers && squadMembers.length > 0 && (
          <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800/90 rounded-lg p-2 flex flex-col gap-1.5 w-60 shadow-xl pointer-events-auto">
            <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold uppercase tracking-wider border-b border-neutral-800/80 pb-1">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> 4-Man Squad Status
              </span>
              <span className="text-neutral-500">Fireteam Alpha</span>
            </div>
            {/* Player 1 (You) */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-[10px]">
                  1
                </span>
                <span className="font-bold text-white text-[11px] truncate max-w-[90px]">{playerName}</span>
              </div>
              <div className="w-20 bg-neutral-800 h-2 rounded-full overflow-hidden border border-neutral-700">
                <div className="bg-emerald-400 h-full transition-all duration-200" style={{ width: `${stats.health}%` }} />
              </div>
            </div>
            {/* AI Squadmates */}
            {squadMembers.map((sq, i) => (
              <div key={sq.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-neutral-700 text-neutral-200 flex items-center justify-center font-bold text-[10px]">
                    {i + 2}
                  </span>
                  <span className={`text-[11px] truncate max-w-[90px] ${sq.isAlive ? 'text-neutral-300' : 'text-neutral-500 line-through'}`}>
                    {sq.name}
                  </span>
                </div>
                <div className="w-20 bg-neutral-800 h-2 rounded-full overflow-hidden border border-neutral-700">
                  <div
                    className={`h-full transition-all duration-200 ${
                      sq.health > 50 ? 'bg-emerald-400' : sq.health > 20 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${sq.health}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Team Deathmatch (TDM) Live Scoreboard */}
        {tdmState && (
          <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-700 rounded-lg p-2.5 flex items-center gap-4 w-72 shadow-2xl pointer-events-auto">
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[10px] font-bold text-blue-400 uppercase">Blue Team</span>
              <span className="text-2xl font-bold font-['Chakra_Petch',sans-serif] text-white">
                {tdmState.blueScore}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-neutral-400 uppercase">Target</span>
              <span className="text-xs font-mono text-amber-400 font-bold">{tdmState.targetScore}</span>
              <span className="text-[10px] font-mono text-neutral-400 mt-0.5">{tdmState.timeRemaining}</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[10px] font-bold text-red-400 uppercase">Red Team</span>
              <span className="text-2xl font-bold font-['Chakra_Petch',sans-serif] text-red-400">
                {tdmState.redScore}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Top Right Killfeed & Settings */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          {/* Battle Pass / Armory Progression Button */}
          <button
            onClick={onOpenProgression}
            className="pointer-events-auto bg-gradient-to-r from-amber-500/20 to-yellow-500/10 hover:from-amber-500/30 hover:to-yellow-500/20 text-amber-300 border border-amber-400/50 px-3 py-1.5 rounded-lg transition shadow-lg flex items-center gap-2 font-bold text-xs"
            title="Royale Pass, Objectives & Armory (P)"
          >
            <span className="w-5 h-5 rounded bg-amber-500 text-black flex items-center justify-center font-extrabold text-[10px]">
              L{progressionLevel}
            </span>
            <span className="tracking-wider uppercase hidden sm:inline">PASS & ARMORY [P]</span>
            <span className="text-amber-400 font-mono text-[11px] bg-black/40 px-1.5 py-0.5 rounded">
              {progressionBp} BP
            </span>
          </button>

          <button
            onClick={onOpenSettings}
            className="pointer-events-auto bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 p-2 rounded-md transition shadow-lg"
            title="Settings"
          >
            <Compass className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* Live Killfeed */}
        <div className="flex flex-col items-end gap-1 w-72 pointer-events-none mt-1">
          {killfeed.slice(-4).map((entry) => (
            <div
              key={entry.id}
              className={`px-3 py-1 rounded text-xs backdrop-blur-md flex items-center gap-1.5 border shadow-md animate-fade-in ${
                entry.isPlayerKiller
                  ? 'bg-amber-500/25 border-amber-500/60 text-amber-200'
                  : entry.isPlayerVictim
                  ? 'bg-red-600/30 border-red-500/70 text-red-200'
                  : 'bg-black/60 border-neutral-800 text-neutral-300'
              }`}
            >
              <span className="font-bold">{entry.killer}</span>
              <span className="text-neutral-400 text-[10px] mx-0.5">eliminated</span>
              <span className="font-semibold text-neutral-200">{entry.victim}</span>
              <span className="text-amber-400 text-[10px] ml-1 bg-black/40 px-1 py-0.5 rounded font-mono">
                {entry.weapon}
              </span>
              {entry.isHeadshot && (
                <span className="text-red-400 text-[10px] font-bold">☠ HEADSHOT</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. Parachute Descent Alt meter */}
      {phase === 'PLANE_DROP' && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3">
          <div className="bg-black/75 border border-amber-500/50 backdrop-blur-md px-6 py-2 rounded-lg text-center shadow-2xl">
            <div className="text-xs uppercase tracking-widest text-neutral-400">Altitude Above Ground</div>
            <div className="text-3xl font-['Chakra_Petch',sans-serif] font-bold text-amber-400">{altitude} m</div>
          </div>
          <button
            onClick={onDeployChute}
            className="pointer-events-auto bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-extrabold px-6 py-2.5 rounded-lg tracking-wider text-sm shadow-xl flex items-center gap-2 uppercase transition"
          >
            Deploy Parachute (Space)
          </button>
        </div>
      )}

      {/* 7. Center Crosshair / ADS Scope Overlay */}
      {phase === 'PLAYING' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isAiming ? (
            <div className="relative w-[540px] h-[540px] max-w-[85vw] max-h-[85vw] rounded-full border-[3px] border-black/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[18px] border-neutral-900/60 pointer-events-none" />
              <div className="absolute w-full h-[1px] bg-red-600/80" />
              <div className="absolute h-full w-[1px] bg-red-600/80" />
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,1)] z-10" />
              <div className="absolute top-1/2 translate-y-6 w-8 h-[1px] bg-red-500/70" />
              <div className="absolute top-1/2 translate-y-12 w-6 h-[1px] bg-red-500/70" />
              <div className="absolute top-1/2 translate-y-18 w-4 h-[1px] bg-red-500/70" />
              <div className="absolute top-1/2 translate-y-24 w-2 h-[1px] bg-red-500/70" />
              <span className="absolute top-4 text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                {currentWeapon.config.scopeName}
              </span>
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <div className="absolute w-4 h-[1.5px] bg-white/85 -left-5" />
              <div className="absolute w-4 h-[1.5px] bg-white/85 -right-5" />
              <div className="absolute h-4 w-[1.5px] bg-white/85 -top-5" />
              <div className="absolute h-4 w-[1.5px] bg-white/85 -bottom-5" />

              {hitmarker.show && (
                <div className={`absolute w-7 h-7 flex items-center justify-center animate-ping ${hitmarker.isHeadshot ? 'text-red-500' : 'text-amber-300'}`}>
                  <div className="w-6 h-6 border-2 border-current rotate-45" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 8. Tactical Prompts (Vehicle & Loot) */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto z-20">
        {vehiclePrompt && (
          <div className="bg-amber-500/90 text-black font-extrabold px-5 py-2 rounded-lg border border-amber-300 shadow-2xl flex items-center gap-2 text-sm tracking-wider uppercase animate-bounce">
            <Car className="w-4 h-4" />
            <span>{vehiclePrompt}</span>
          </div>
        )}
        {lootPrompt && (
          <div className="bg-neutral-900/90 text-amber-300 font-bold px-4 py-1.5 rounded-lg border border-amber-500/50 shadow-xl text-xs tracking-wide">
            {lootPrompt}
          </div>
        )}
      </div>

      {/* 9. Vehicle Speedometer & Horn HUD (Active when driving) */}
      {vehicleInfo && vehicleInfo.isOccupied && (
        <div className="absolute bottom-24 right-6 bg-neutral-950/90 backdrop-blur-md border border-amber-500/60 rounded-2xl p-4 shadow-2xl flex flex-col gap-2.5 w-60 pointer-events-auto z-20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-4 h-4" /> {vehicleInfo.name}
            </span>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-mono">DRIVING</span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-['Chakra_Petch',sans-serif] text-white">
              {Math.round(vehicleInfo.speedKmh)}
            </span>
            <span className="text-xs font-bold text-neutral-400">KM/H</span>
          </div>

          {/* Vehicle Health Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Vehicle Armor</span>
              <span className="font-mono text-emerald-400">{Math.round(vehicleInfo.health)} HP</span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden border border-neutral-700">
              <div
                className="bg-emerald-400 h-full transition-all duration-75"
                style={{ width: `${(vehicleInfo.health / vehicleInfo.maxHealth) * 100}%` }}
              />
            </div>
          </div>

          {/* Vehicle Actions: Horn & Exit */}
          <div className="flex gap-2 mt-1">
            <button
              onClick={onHonkHorn}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
              title="Blast Vehicle Horn (H)"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>HORN (H)</span>
            </button>
          </div>
        </div>
      )}

      {/* 10. Bottom Bar: Health, Armor, Stance, Weapons */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-20">
        {/* Left: Health, Armor, Boost & Consumables */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Quick Consumables Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={onUseMedkit}
              className="bg-neutral-900/85 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition shadow-lg"
              title="Use First Aid (+75 HP) [Key 4]"
            >
              <span className="text-emerald-400 font-extrabold">+</span>
              <span>MEDKIT [4]</span>
            </button>
            <button
              onClick={onUseDrink}
              className="bg-neutral-900/85 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition shadow-lg"
              title="Use Energy Drink (+40 Boost) [Key 5]"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>BOOST [5]</span>
            </button>
            <button
              onClick={onToggleCamera}
              className="bg-neutral-900/85 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition shadow-lg"
              title="Toggle Camera Mode (V)"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>{cameraMode === 'FIRST_PERSON' ? '1ST PERSON [V]' : '3RD PERSON [V]'}</span>
            </button>
          </div>

          {/* Health & Armor Bars */}
          <div className="bg-neutral-950/90 backdrop-blur-md border border-neutral-700/80 rounded-lg p-3 w-80 shadow-2xl flex flex-col gap-2">
            {/* Health Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-bold uppercase tracking-wider">Health</span>
                <span className="text-white font-mono font-bold">{Math.round(stats.health)} / 100</span>
              </div>
              <div className="w-full bg-neutral-800 h-3 rounded overflow-hidden border border-neutral-700">
                <div
                  className={`h-full transition-all duration-150 ${
                    stats.health > 50 ? 'bg-emerald-500' : stats.health > 25 ? 'bg-amber-500' : 'bg-red-600 animate-pulse'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, stats.health))}%` }}
                />
              </div>
            </div>

            {/* Boost Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-amber-400 font-bold uppercase tracking-wider">Boost Regeneration</span>
                <span className="text-amber-400 font-mono">{Math.round(stats.boost)}%</span>
              </div>
              <div className="w-full bg-neutral-850 h-1.5 rounded overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, stats.boost))}%` }}
                />
              </div>
            </div>

            {/* Armor & Helmet status */}
            <div className="flex items-center gap-3 pt-1 border-t border-neutral-850 text-xs">
              <div className="flex items-center gap-1 text-neutral-300">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-mono text-[11px]">{Math.round(stats.armor)}%</span>
              </div>
              <div className="flex items-center gap-1 text-neutral-300">
                <HardHat className="w-3.5 h-3.5 text-yellow-400" />
                <span className="font-mono text-[11px]">{Math.round(stats.helmet)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Stance Badges (Stand / Crouch / Prone) */}
        <div className="flex items-center gap-1.5 pointer-events-auto mb-1">
          {(['STAND', 'CROUCH', 'PRONE'] as Stance[]).map((s) => (
            <button
              key={s}
              onClick={() => onSetStance(s)}
              className={`px-3 py-1 rounded text-xs font-bold transition uppercase tracking-wider border ${
                stance === s
                  ? 'bg-amber-500 text-black border-amber-400 shadow-lg'
                  : 'bg-black/60 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Right: Weapon Slots & Ammo Counter */}
        <div className="flex items-end gap-3 pointer-events-auto">
          {/* Secondary weapons quick switch */}
          <div className="flex flex-col gap-1.5">
            {weapons.map((w, idx) => (
              <button
                key={w.config.id}
                onClick={() => onSelectSlot(idx)}
                className={`px-3 py-1.5 rounded-md text-left transition border flex items-center justify-between gap-4 w-40 ${
                  activeSlot === idx
                    ? 'bg-neutral-900/90 border-amber-400/80 text-white shadow-lg'
                    : 'bg-black/60 border-neutral-800/80 text-neutral-400 hover:bg-neutral-900/60'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-xs tracking-wide">{w.config.name}</span>
                  <span className="text-[10px] text-neutral-500 font-mono">{w.config.ammoType}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono">
                    {w.currentAmmo}
                    <span className="text-neutral-500 font-normal">/{w.reserveAmmo}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Active Weapon Hero Ammo Card */}
          <div className="bg-neutral-950/90 backdrop-blur-md border border-neutral-700/80 rounded-lg p-3 w-48 shadow-2xl flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold text-sm tracking-wider uppercase">
                {currentWeapon.config.name}
              </span>
              <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300 font-mono">
                {currentWeapon.config.auto ? 'AUTO' : 'SINGLE'}
              </span>
            </div>

            {/* Large Ammo Counter */}
            <div className="flex items-baseline gap-1.5 my-0.5">
              <span className="text-3xl font-['Chakra_Petch',sans-serif] font-extrabold text-white">
                {currentWeapon.currentAmmo}
              </span>
              <span className="text-lg font-['Chakra_Petch',sans-serif] text-neutral-400 font-medium">
                / {currentWeapon.reserveAmmo}
              </span>
            </div>

            {/* Reload button & progress */}
            {currentWeapon.isReloading ? (
              <div className="flex flex-col gap-1 mt-1">
                <div className="text-[10px] text-amber-400 font-bold animate-pulse uppercase tracking-wider">
                  Reloading...
                </div>
                <div className="w-full h-1 bg-neutral-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-75"
                    style={{ width: `${currentWeapon.reloadProgress * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={onReload}
                className="mt-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-1 rounded text-[11px] font-bold flex items-center justify-center gap-1 transition"
                title="Reload Weapon (R)"
              >
                <RefreshCw className="w-3 h-3 text-neutral-400" />
                <span>RELOAD (R)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
