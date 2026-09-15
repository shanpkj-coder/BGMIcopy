import React, { useState } from 'react';
import { X, Volume2, VolumeX, Sliders, Monitor, Keyboard, Sparkles, Crosshair, Gauge, Car } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { GraphicsPreset } from '../game/ultraGraphics';

export interface TacticalSettings {
  masterVolume: number;
  sfxVolume: number;
  engineVolume: number;
  sensitivity: number;
  fov: number;
  crosshairColor: string;
  crosshairStyle: 'CROSS' | 'DOT' | 'CHEVRON' | 'CIRCLE';
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensitivity: number;
  onSensitivityChange: (s: number) => void;
  graphicsQuality: GraphicsPreset;
  onGraphicsChange: (g: GraphicsPreset) => void;
  fov?: number;
  onFovChange?: (f: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  sensitivity,
  onSensitivityChange,
  graphicsQuality,
  onGraphicsChange,
  fov = 65,
  onFovChange,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'AUDIO' | 'GRAPHICS' | 'CONTROLS' | 'GAMEPLAY'>('GRAPHICS');
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [masterVol, setMasterVol] = useState(80);
  const [sfxVol, setSfxVol] = useState(85);
  const [engineVol, setEngineVol] = useState(70);
  const [crosshairCol, setCrosshairCol] = useState('#22c55e');
  const [crosshairStyle, setCrosshairStyle] = useState<'CROSS' | 'DOT' | 'CHEVRON'>('CROSS');

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  const handleMasterVolChange = (v: number) => {
    setMasterVol(v);
    soundEngine.setMasterVolume(v / 100);
  };

  const handleSfxVolChange = (v: number) => {
    setSfxVol(v);
    soundEngine.setSfxVolume(v / 100);
  };

  const handleEngineVolChange = (v: number) => {
    setEngineVol(v);
    soundEngine.setEngineVolume(v / 100);
  };

  return (
    <div id="settings-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-['Rajdhani',sans-serif] select-none">
      <div className="relative w-[600px] max-w-full max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-wider uppercase font-['Chakra_Petch',sans-serif]">
                Tactical System Settings
              </h2>
              <p className="text-xs text-neutral-400">Audio, Graphics Shaders, Vehicles & Controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-neutral-800/80 bg-neutral-900/40 px-6 pt-2 gap-2 text-xs font-bold tracking-wider">
          <button
            onClick={() => setActiveTab('GRAPHICS')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'GRAPHICS'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>GRAPHICS</span>
          </button>
          <button
            onClick={() => setActiveTab('AUDIO')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'AUDIO'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>AUDIO</span>
          </button>
          <button
            onClick={() => setActiveTab('CONTROLS')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'CONTROLS'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>CONTROLS & VEHICLES</span>
          </button>
          <button
            onClick={() => setActiveTab('GAMEPLAY')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'GAMEPLAY'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>CROSSHAIR & ADS</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-140px)] flex flex-col gap-5 text-sm text-neutral-300">
          {/* TAB 1: GRAPHICS */}
          {activeTab === 'GRAPHICS' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-1">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-amber-400" />
                    <span>Graphics Preset & Volumetrics</span>
                  </div>
                  {graphicsQuality === 'EXTREME_HDR' && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                      <Sparkles className="w-3 h-3" /> Ultra Sun God-Rays Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {([
                    { id: 'LOW', label: 'Smooth', fps: '60+ FPS' },
                    { id: 'MEDIUM', label: 'Balanced', fps: 'High Res' },
                    { id: 'ULTRA', label: 'HD Ultra', fps: '3D Foliage' },
                    { id: 'EXTREME_HDR', label: 'Extreme HDR', fps: 'Rays + Waves' },
                  ] as const).map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => onGraphicsChange(preset.id as GraphicsPreset)}
                      className={`py-2.5 px-2 rounded-lg text-center transition flex flex-col items-center gap-0.5 border ${
                        graphicsQuality === preset.id
                          ? 'bg-amber-500 text-black border-amber-400 shadow-md font-bold'
                          : 'bg-black/40 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase">{preset.label}</span>
                      <span className="text-[10px] opacity-75">{preset.fps}</span>
                    </button>
                  ))}
                </div>

                <div className="text-xs text-neutral-400 mt-2 bg-black/40 p-3 rounded-lg border border-neutral-800/80">
                  {graphicsQuality === 'EXTREME_HDR' && (
                    <span className="text-amber-300">
                      ✨ Extreme HDR Mode: Volumetric Sun God-Rays, 15,000+ 3D Grass Blades, Physical Brass Shell Ejections, and Dynamic Water Reflections.
                    </span>
                  )}
                  {graphicsQuality === 'ULTRA' && (
                    <span className="text-emerald-300">
                      🌿 HD Ultra Mode: 3D Foliage, High-Res Shadow Maps, Muzzle Flash Bloom, and Water Specular Reflections.
                    </span>
                  )}
                  {graphicsQuality === 'MEDIUM' && (
                    <span className="text-blue-300">
                      ⚡ Balanced Mode: Standard Textures, Dynamic Lighting, and Optimized Shaders.
                    </span>
                  )}
                  {graphicsQuality === 'LOW' && (
                    <span className="text-neutral-400">
                      🚀 Smooth Mode: Maximum Performance, Shadows Turned Off.
                    </span>
                  )}
                </div>
              </div>

              {/* Field of View Slider */}
              <div className="flex flex-col gap-2 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-amber-400" />
                    <span className="uppercase tracking-wider">Field of View (FOV)</span>
                  </div>
                  <span className="text-amber-400 font-mono font-bold">{fov}°</span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="85"
                  step="1"
                  value={fov}
                  onChange={(e) => onFovChange && onFovChange(parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>55° (Narrow / Tactical)</span>
                  <span>65° (Standard)</span>
                  <span>85° (Ultra-Wide / Competitive)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO */}
          {activeTab === 'AUDIO' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-3">
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
                  <div>
                    <div className="font-semibold text-white">Master Sound Toggle</div>
                    <div className="text-xs text-neutral-400">Instantly silence all game audio</div>
                  </div>
                </div>
                <button
                  onClick={toggleMute}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                    isMuted ? 'bg-red-600/30 text-red-300 border border-red-500' : 'bg-amber-500 text-black font-extrabold'
                  }`}
                >
                  {isMuted ? 'MUTED' : 'ENABLED'}
                </button>
              </div>

              {/* Master Volume */}
              <div className="flex flex-col gap-2 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="uppercase tracking-wider">Master Output Volume</span>
                  <span className="text-amber-400 font-mono font-bold">{masterVol}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVol}
                  onChange={(e) => handleMasterVolChange(parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* SFX Volume */}
              <div className="flex flex-col gap-2 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="uppercase tracking-wider">Gunfire, Bullets & Footsteps SFX</span>
                  <span className="text-amber-400 font-mono font-bold">{sfxVol}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sfxVol}
                  onChange={(e) => handleSfxVolChange(parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Vehicle Engine Volume */}
              <div className="flex flex-col gap-2 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="uppercase tracking-wider">Vehicle Engine & Horn Volume</span>
                  <span className="text-amber-400 font-mono font-bold">{engineVol}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={engineVol}
                  onChange={(e) => handleEngineVolChange(parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: CONTROLS & VEHICLES */}
          {activeTab === 'CONTROLS' && (
            <div className="flex flex-col gap-4">
              {/* Aim Sensitivity */}
              <div className="flex flex-col gap-2 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="uppercase tracking-wider">Mouse Aim Sensitivity</span>
                  <span className="text-amber-400 font-mono font-bold">{(sensitivity * 1000).toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.005"
                  step="0.0002"
                  value={sensitivity}
                  onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Vehicle Driving Guide */}
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Car className="w-4 h-4" />
                  <span>All Vehicles Controls (Buggy, UAZ, Dacia, Motorbike, BRDM)</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-neutral-300">
                  <div><span className="text-amber-300 font-mono font-bold">F</span> — Enter / Dismount Vehicle</div>
                  <div><span className="text-amber-300 font-mono font-bold">W / S</span> — Accelerate / Reverse Gear</div>
                  <div><span className="text-amber-300 font-mono font-bold">A / D</span> — Steer & Corner Turn</div>
                  <div><span className="text-amber-300 font-mono font-bold">Space</span> — Handbrake Drift</div>
                  <div><span className="text-amber-300 font-mono font-bold">H</span> — Blast Vehicle Horn</div>
                  <div><span className="text-amber-300 font-mono font-bold">V</span> — Toggle 1st / 3rd Person View</div>
                </div>
              </div>

              {/* Soldier Controls */}
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Keyboard className="w-4 h-4" />
                  <span>Combat & Weapon Controls</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs text-neutral-300">
                  <div><span className="text-white font-mono font-bold">W, A, S, D</span> — Move Soldier</div>
                  <div><span className="text-white font-mono font-bold">Left Click</span> — Fire Weapon</div>
                  <div><span className="text-white font-mono font-bold">Right Click</span> — ADS Scope Zoom</div>
                  <div><span className="text-white font-mono font-bold">Shift</span> — Tactical Sprint</div>
                  <div><span className="text-white font-mono font-bold">Space</span> — Jump / Deploy Chute</div>
                  <div><span className="text-white font-mono font-bold">C / Z</span> — Crouch / Prone</div>
                  <div><span className="text-white font-mono font-bold">R</span> — Reload Weapon</div>
                  <div><span className="text-white font-mono font-bold">1, 2, 3</span> — Weapon Slots</div>
                  <div><span className="text-white font-mono font-bold">4 / 5</span> — Medkit / Energy Drink</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CROSSHAIR & ADS */}
          {activeTab === 'GAMEPLAY' && (
            <div className="flex flex-col gap-4">
              {/* Crosshair Style */}
              <div className="flex flex-col gap-3 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                <span className="text-xs font-semibold uppercase tracking-wider">HUD Crosshair Reticle</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['CROSS', 'DOT', 'CHEVRON'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setCrosshairStyle(st)}
                      className={`py-2 px-3 rounded-lg text-center text-xs font-bold border transition ${
                        crosshairStyle === st
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-black/40 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                      }`}
                    >
                      {st === 'CROSS' ? '+ Classic Cross' : st === 'DOT' ? '• Precision Dot' : '^ Tactical Chevron'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Crosshair Color */}
              <div className="flex flex-col gap-3 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                <span className="text-xs font-semibold uppercase tracking-wider">Reticle Color</span>
                <div className="flex gap-3">
                  {[
                    { color: '#22c55e', name: 'Tactical Green' },
                    { color: '#ef4444', name: 'Crimson Red' },
                    { color: '#38bdf8', name: 'Cyan Blue' },
                    { color: '#f59e0b', name: 'Amber Gold' },
                    { color: '#ffffff', name: 'Pure White' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setCrosshairCol(c.color)}
                      className={`w-10 h-10 rounded-lg border-2 transition flex items-center justify-center ${
                        crosshairCol === c.color ? 'scale-110 border-white shadow-lg' : 'border-neutral-700 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
