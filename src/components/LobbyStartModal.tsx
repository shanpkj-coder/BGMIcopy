import React, { useState, useEffect } from 'react';
import { UserAccountProfile, userAccountManager } from '../systems/userAccount';
import { GraphicsPreset } from '../game/ultraGraphics';
import { MapId, GameMode, CharacterId, VehicleType } from '../types/game';
import { MAP_CONFIGS } from '../game/gameModes';
import { MODE_CONFIGS } from '../game/gameModes';
import { CHARACTERS } from '../game/characters';
import { VEHICLE_CONFIGS } from '../game/vehicle';
import {
  Shield,
  Sparkles,
  Zap,
  Globe,
  Radio,
  CheckCircle2,
  Edit2,
  Check,
  Play,
  X,
  Cpu,
  RefreshCw,
  LogOut,
  Map as MapIcon,
  Swords,
  User,
  Car,
  ChevronRight
} from 'lucide-react';

export interface MatchLaunchOptions {
  mapId: MapId;
  gameMode: GameMode;
  characterId: CharacterId;
  preset: GraphicsPreset;
}

interface LobbyStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMatch: (presetOrOptions?: GraphicsPreset | MatchLaunchOptions) => void;
  graphicsPreset?: GraphicsPreset;
  onGraphicsChange?: (preset: GraphicsPreset) => void;
  onProfileUpdated?: () => void;
  profile?: UserAccountProfile;
  selectedMap?: MapId;
  selectedMode?: GameMode;
  selectedCharacter?: CharacterId;
  onSelectMap?: (m: MapId) => void;
  onSelectMode?: (gm: GameMode) => void;
  onSelectCharacter?: (c: CharacterId) => void;
}

export const LobbyStartModal: React.FC<LobbyStartModalProps> = ({
  isOpen,
  onClose,
  onStartMatch,
  graphicsPreset,
  onGraphicsChange,
  onProfileUpdated,
  profile: initialProfile,
  selectedMap: initialMap = 'ERANGEL',
  selectedMode: initialMode = 'SQUAD',
  selectedCharacter: initialChar = 'VICTOR',
  onSelectMap,
  onSelectMode,
  onSelectCharacter,
}) => {
  const [profile, setProfile] = useState<UserAccountProfile>(initialProfile || userAccountManager.profile);
  const [selectedPreset, setSelectedPreset] = useState<GraphicsPreset>(
    graphicsPreset || initialProfile?.preferredGraphics || userAccountManager.profile.preferredGraphics || 'EXTREME_HDR'
  );
  const [activeTab, setActiveTab] = useState<'DEPLOY' | 'MAPS' | 'MODES' | 'CHARACTERS' | 'VEHICLES' | 'GRAPHICS'>('DEPLOY');
  const [currentMap, setCurrentMap] = useState<MapId>(initialMap);
  const [currentMode, setCurrentMode] = useState<GameMode>(initialMode);
  const [currentChar, setCurrentChar] = useState<CharacterId>(initialChar);
  const [selectedVehiclePreview, setSelectedVehiclePreview] = useState<VehicleType>('BUGGY');

  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(profile.playerName);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (graphicsPreset) setSelectedPreset(graphicsPreset);
  }, [graphicsPreset]);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setNameInput(initialProfile.playerName);
    }
  }, [initialProfile]);

  if (!isOpen) return null;

  const handleSelectPreset = (pId: GraphicsPreset) => {
    setSelectedPreset(pId);
    userAccountManager.setGraphicsPreset(pId);
    if (onGraphicsChange) onGraphicsChange(pId);
  };

  const handleSelectMap = (mapId: MapId) => {
    setCurrentMap(mapId);
    if (onSelectMap) onSelectMap(mapId);
  };

  const handleSelectMode = (mode: GameMode) => {
    setCurrentMode(mode);
    if (onSelectMode) onSelectMode(mode);
    // If TDM chosen, suggest warehouse map
    if (mode === 'DEATHMATCH' && currentMap !== 'WAREHOUSE_TDM') {
      setCurrentMap('WAREHOUSE_TDM');
      if (onSelectMap) onSelectMap('WAREHOUSE_TDM');
    }
  };

  const handleSelectChar = (charId: CharacterId) => {
    setCurrentChar(charId);
    if (onSelectCharacter) onSelectCharacter(charId);
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      userAccountManager.updatePlayerName(nameInput.trim());
      setProfile({ ...userAccountManager.profile });
      setIsEditingName(false);
      if (onProfileUpdated) onProfileUpdated();
    }
  };

  const handleToggleGoogle = () => {
    if (profile.isGoogleConnected) {
      userAccountManager.disconnectGoogle();
    } else {
      userAccountManager.connectGoogle('shanpkj@gmail.com', profile.playerName);
    }
    setProfile({ ...userAccountManager.profile });
    if (onProfileUpdated) onProfileUpdated();
  };

  const handleCloudSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      userAccountManager.syncCloud();
      setProfile({ ...userAccountManager.profile });
      setIsSyncing(false);
    }, 600);
  };

  const handleDeploy = () => {
    onStartMatch({
      mapId: currentMap,
      gameMode: currentMode,
      characterId: currentChar,
      preset: selectedPreset,
    });
  };

  const mapInfo = MAP_CONFIGS[currentMap] || MAP_CONFIGS.ERANGEL;
  const modeInfo = MODE_CONFIGS[currentMode] || MODE_CONFIGS.SQUAD;
  const charInfo = CHARACTERS[currentChar] || CHARACTERS.VICTOR;

  return (
    <div
      id="lobby-start-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-['Rajdhani',sans-serif] select-none"
    >
      <div className="relative w-[860px] max-w-full max-h-[94vh] overflow-y-auto bg-neutral-950 border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col">
        {/* Top Banner & Header */}
        <div className="relative px-6 pt-5 pb-3 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 via-amber-950/40 to-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 font-extrabold text-xl shadow-lg">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white uppercase tracking-wider font-['Chakra_Petch',sans-serif]">
                  BATTLEGROUNDS MOBILE ROYALE
                </h1>
                <span className="bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest shadow">
                  PRO EXPANSION
                </span>
              </div>
              <p className="text-xs text-neutral-400 flex items-center gap-2">
                <span>Maps, Modes, Operatives & Vehicles Command Center</span>
                <span className="text-neutral-600">•</span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono">
                  <Radio className="w-3 h-3 animate-pulse" /> Ping: 22ms (Server Online)
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition"
            title="Close / Return to Game"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tactical Tabs Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/60 px-6 pt-2.5 gap-1.5 overflow-x-auto">
          {[
            { id: 'DEPLOY', label: 'LOBBY COMMAND', icon: Play },
            { id: 'MAPS', label: '5 MAPS & BIOMES', icon: MapIcon },
            { id: 'MODES', label: 'GAME MODES', icon: Swords },
            { id: 'CHARACTERS', label: 'CHARACTERS & PERKS', icon: User },
            { id: 'VEHICLES', label: 'VEHICLES FLEET', icon: Car },
            { id: 'GRAPHICS', label: 'GRAPHICS & ACCOUNT', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2.5 px-3.5 border-b-2 text-xs font-bold tracking-wider transition flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'border-amber-400 text-amber-400 font-extrabold bg-amber-400/5'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-6 text-neutral-200">
          {/* TAB 1: DEPLOY (MAIN DASHBOARD) */}
          {activeTab === 'DEPLOY' && (
            <div className="flex flex-col gap-5">
              {/* Quick Summary Cards (Map, Mode, Character) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Active Map Card */}
                <div
                  onClick={() => setActiveTab('MAPS')}
                  className="bg-neutral-900/80 border border-neutral-800 hover:border-amber-400/60 p-4 rounded-xl cursor-pointer transition group"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5 font-bold text-amber-400">
                      <MapIcon className="w-3.5 h-3.5" /> Selected Map
                    </span>
                    <span className="text-[10px] text-amber-400 group-hover:translate-x-0.5 transition">Change →</span>
                  </div>
                  <div className="text-base font-bold text-white font-['Chakra_Petch',sans-serif]">
                    {mapInfo.name}
                  </div>
                  <div className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{mapInfo.landscapeType}</div>
                  <div className="mt-2 text-[10px] font-semibold text-neutral-300 font-mono">
                    Biome: <span className="text-amber-300">{mapInfo.biome}</span>
                  </div>
                </div>

                {/* Active Mode Card */}
                <div
                  onClick={() => setActiveTab('MODES')}
                  className="bg-neutral-900/80 border border-neutral-800 hover:border-amber-400/60 p-4 rounded-xl cursor-pointer transition group"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5 font-bold text-red-400">
                      <Swords className="w-3.5 h-3.5" /> Combat Mode
                    </span>
                    <span className="text-[10px] text-amber-400 group-hover:translate-x-0.5 transition">Change →</span>
                  </div>
                  <div className="text-base font-bold text-white font-['Chakra_Petch',sans-serif]">
                    {modeInfo.name}
                  </div>
                  <div className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{modeInfo.tagline}</div>
                  <div className="mt-2 text-[10px] font-semibold text-neutral-300 font-mono">
                    Capacity: <span className="text-amber-300">{modeInfo.playerCount} Players</span>
                  </div>
                </div>

                {/* Active Character Card */}
                <div
                  onClick={() => setActiveTab('CHARACTERS')}
                  className="bg-neutral-900/80 border border-neutral-800 hover:border-amber-400/60 p-4 rounded-xl cursor-pointer transition group"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5 font-bold text-blue-400">
                      <User className="w-3.5 h-3.5" /> Operative Soldier
                    </span>
                    <span className="text-[10px] text-amber-400 group-hover:translate-x-0.5 transition">Change →</span>
                  </div>
                  <div className="text-base font-bold text-white font-['Chakra_Petch',sans-serif]">
                    {charInfo.name} — {charInfo.title}
                  </div>
                  <div className="text-xs text-amber-300 line-clamp-1 mt-0.5">Perk: {charInfo.perkName}</div>
                  <div className="mt-2 text-[10px] font-semibold text-neutral-400 font-mono">
                    Role: <span className="text-blue-300">{charInfo.role}</span>
                  </div>
                </div>
              </div>

              {/* Operative Dossier & Google Account */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Player Dossier */}
                <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Operative Dossier
                    </span>
                    <span className="bg-neutral-800 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30">
                      {profile.tier}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-neutral-800 border-2 border-amber-400 flex items-center justify-center font-extrabold text-xl text-amber-300">
                      {profile.playerName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditingName ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            maxLength={20}
                            className="bg-neutral-950 border border-amber-400 px-2 py-1 rounded text-sm text-white font-bold w-full focus:outline-none"
                            autoFocus
                          />
                          <button onClick={handleSaveName} className="p-1.5 bg-amber-500 text-black rounded">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-white tracking-wide truncate">{profile.playerName}</h2>
                          <button onClick={() => setIsEditingName(true)} className="text-neutral-400 hover:text-amber-400">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="text-xs text-neutral-400 font-mono">UID: {profile.uid}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Level {profile.level} Crown Operative</span>
                    <span className="font-bold text-amber-400">BP: {profile.bpCoins}</span>
                  </div>
                </div>

                {/* Google Account Integration */}
                <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Google Cloud Progression
                    </span>
                    {profile.isGoogleConnected && (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-neutral-300">
                    {profile.isGoogleConnected ? (
                      <div className="flex flex-col gap-1">
                        <div className="font-mono text-emerald-300">{profile.googleEmail}</div>
                        <div className="text-neutral-500 text-[11px]">Synced: {profile.cloudSyncTime}</div>
                      </div>
                    ) : (
                      <div className="text-neutral-400">
                        Connect Google account to sync loadouts, XP, achievements and stats across devices.
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between">
                    {profile.isGoogleConnected ? (
                      <>
                        <button
                          onClick={handleCloudSync}
                          disabled={isSyncing}
                          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs flex items-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
                          <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
                        </button>
                        <button onClick={handleToggleGoogle} className="text-xs text-neutral-400 hover:text-red-400">
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleToggleGoogle}
                        className="px-3.5 py-1.5 bg-white text-neutral-900 font-bold rounded text-xs hover:bg-neutral-200 transition"
                      >
                        Connect Google Account
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MAPS & LANDSCAPES */}
          {activeTab === 'MAPS' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-neutral-400">
                Select your drop zone. Each map features unique heightmaps, foliage biomes, compounds, and lighting conditions.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(Object.keys(MAP_CONFIGS) as MapId[]).map((mId) => {
                  const m = MAP_CONFIGS[mId];
                  const isSelected = currentMap === mId;
                  return (
                    <div
                      key={mId}
                      onClick={() => handleSelectMap(mId)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400 shadow-lg ring-1 ring-amber-400'
                          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${m.badge}`}>
                            {m.tag}
                          </span>
                          {isSelected && (
                            <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
                              <Check className="w-4 h-4" /> ACTIVE
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-white font-['Chakra_Petch',sans-serif]">{m.name}</h3>
                        <div className="text-xs text-amber-300/80 mb-2">{m.subtitle}</div>
                        <p className="text-xs text-neutral-400 mb-3">{m.landscapeType}</p>
                      </div>

                      <div className="pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                        <span>Biome: {m.biome}</span>
                        <span>Scale: {m.islandSize}m</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: GAME MODES */}
          {activeTab === 'MODES' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-neutral-400">
                Choose your tactical battleground objective. Play with AI squadmates, lone-wolf solo, or 4v4 instant respawn team deathmatch.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(Object.keys(MODE_CONFIGS) as GameMode[]).map((gmId) => {
                  const gm = MODE_CONFIGS[gmId];
                  const isSelected = currentMode === gmId;
                  return (
                    <div
                      key={gmId}
                      onClick={() => handleSelectMode(gmId)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400 shadow-lg ring-1 ring-amber-400'
                          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${gm.badge}`}>
                            {gm.teamSize === 4 ? '4-PLAYER FIRETEAM' : 'SOLO COMBAT'}
                          </span>
                          {isSelected && (
                            <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
                              <Check className="w-4 h-4" /> ACTIVE
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-white font-['Chakra_Petch',sans-serif]">{gm.name}</h3>
                        <div className="text-xs text-amber-300/80 mb-2">{gm.tagline}</div>
                        <p className="text-xs text-neutral-400 mb-3">{gm.description}</p>
                      </div>

                      <div className="pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                        <span>Lobby: {gm.playerCount} Players</span>
                        <span>Respawns: {gm.hasRespawn ? '3s Instant' : 'None'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: CHARACTERS & PERKS */}
          {activeTab === 'CHARACTERS' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-neutral-400">
                Select your elite soldier operative. Each character brings tactical combat perks and articulated skeletal visuals.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(Object.keys(CHARACTERS) as CharacterId[]).map((cId) => {
                  const ch = CHARACTERS[cId];
                  const isSelected = currentChar === cId;
                  return (
                    <div
                      key={cId}
                      onClick={() => handleSelectChar(cId)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400 shadow-lg ring-1 ring-amber-400'
                          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">
                            {ch.role}
                          </span>
                          {isSelected && (
                            <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
                              <Check className="w-4 h-4" /> SELECTED
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-white font-['Chakra_Petch',sans-serif]">
                          {ch.name} — <span className="text-neutral-400 text-xs font-normal">{ch.title}</span>
                        </h3>
                        <p className="text-xs text-neutral-400 my-2">{ch.lore}</p>
                        <div className="bg-black/40 p-2 rounded-lg border border-neutral-800 mb-2">
                          <div className="text-xs font-bold text-amber-300">★ Perk: {ch.perkName}</div>
                          <div className="text-[11px] text-neutral-400">{ch.perkDescription}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: VEHICLES FLEET */}
          {activeTab === 'VEHICLES' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-neutral-400">
                Full military vehicle arsenal scattered throughout compounds and roads. Drive buggies, off-road jeeps, muscle sedans, motorbikes, or heavy armored carriers!
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(Object.keys(VEHICLE_CONFIGS) as VehicleType[]).map((vType) => {
                  const v = VEHICLE_CONFIGS[vType];
                  const isSelected = selectedVehiclePreview === vType;
                  return (
                    <div
                      key={vType}
                      onClick={() => setSelectedVehiclePreview(vType)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400 shadow-lg'
                          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-800 text-cyan-300 border border-neutral-700">
                            {v.seats} SEATER
                          </span>
                          <span className="text-xs font-mono text-amber-400">{v.maxSpeed * 3.6} KM/H MAX</span>
                        </div>
                        <h3 className="text-base font-bold text-white font-['Chakra_Petch',sans-serif]">{v.name}</h3>
                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                          <div className="bg-black/40 p-2 rounded border border-neutral-800">
                            <span className="text-neutral-500 block text-[10px]">ARMOR / HEALTH</span>
                            <span className="font-bold text-emerald-400">{v.maxHealth} HP</span>
                          </div>
                          <div className="bg-black/40 p-2 rounded border border-neutral-800">
                            <span className="text-neutral-500 block text-[10px]">ACCELERATION</span>
                            <span className="font-bold text-amber-300">{v.accel} m/s²</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2.5 mt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
                        Press <span className="text-amber-300 font-bold">F</span> to enter / dismount • <span className="text-amber-300 font-bold">H</span> for horn
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: GRAPHICS PRESETS */}
          {activeTab === 'GRAPHICS' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-neutral-400">
                Customize 3D visual fidelity, volumetric god-rays, 3D instanced grass, water reflections, and particle effects.
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {([
                  { id: 'LOW', label: 'Smooth', fps: '60+ FPS', desc: 'Optimized shadows off' },
                  { id: 'MEDIUM', label: 'Balanced', fps: 'High Res', desc: 'Standard lighting & trees' },
                  { id: 'ULTRA', label: 'HD Ultra', fps: '3D Foliage', desc: '3D Grass & bloom' },
                  { id: 'EXTREME_HDR', label: 'Extreme HDR', fps: 'God-Rays', desc: 'Sun rays + wave physics' },
                ] as const).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id as GraphicsPreset)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition ${
                      selectedPreset === p.id
                        ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-lg'
                        : 'bg-neutral-900/60 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold uppercase">{p.label}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">{p.desc}</div>
                    </div>
                    <div className="mt-3 text-[10px] font-mono uppercase tracking-wider">{p.fps}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Launch Bar */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/90 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="font-bold text-white">{mapInfo.name}</span>
            <span className="text-neutral-600">•</span>
            <span className="text-amber-400">{modeInfo.name}</span>
            <span className="text-neutral-600">•</span>
            <span className="text-blue-400">{charInfo.name}</span>
          </div>

          <button
            onClick={handleDeploy}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition font-['Chakra_Petch',sans-serif]"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>DEPLOY TO BATTLEGROUND</span>
          </button>
        </div>
      </div>
    </div>
  );
};
