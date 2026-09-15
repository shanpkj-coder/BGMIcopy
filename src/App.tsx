import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameInitConfig } from './game/gameEngine';
import { CameraMode, GamePhase, KillfeedEntry, PlayerStats, Stance, WeaponState, MapId, GameMode, CharacterId, SquadMember, TdmState } from './types/game';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { TacticalMapModal } from './components/TacticalMapModal';
import { VictoryDefeatModal } from './components/VictoryDefeatModal';
import { SettingsModal } from './components/SettingsModal';
import { VoiceChatHUD } from './components/VoiceChatHUD';
import { ProgressionModal } from './components/ProgressionModal';
import { XpPopupBanner, XpNotification } from './components/XpPopupBanner';
import { voiceChatSystem, VoiceChannel } from './systems/voiceChat';
import { progressionManager } from './systems/progressionSystem';
import { userAccountManager, UserProfile } from './systems/userAccount';
import { GraphicsPreset } from './game/ultraGraphics';
import { LobbyStartModal, MatchLaunchOptions } from './components/LobbyStartModal';
import { MAP_CONFIGS, MODE_CONFIGS } from './game/gameModes';
import { MousePointer, Smartphone, Monitor } from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Match Deployment State
  const [selectedMap, setSelectedMap] = useState<MapId>('ERANGEL');
  const [selectedMode, setSelectedMode] = useState<GameMode>('SQUAD');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('VICTOR');
  const [squadMembers, setSquadMembers] = useState<SquadMember[]>([]);
  const [tdmState, setTdmState] = useState<TdmState | undefined>(undefined);
  const [vehicleInfo, setVehicleInfo] = useState<{
    name: string;
    speedKmh: number;
    health: number;
    maxHealth: number;
    isOccupied: boolean;
  } | null>(null);

  // Game UI State
  const [phase, setPhase] = useState<GamePhase>('PLANE_DROP');
  const [stats, setStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    boost: 60,
    armor: 100,
    helmet: 100,
    kills: 0,
    damageDealt: 0,
    survivalTime: 0,
    distanceTraveled: 0,
  });

  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [weapons, setWeapons] = useState<WeaponState[]>([]);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponState | null>(null);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [aliveCount, setAliveCount] = useState<number>(100);
  const [altitude, setAltitude] = useState<number>(250);
  const [killfeed, setKillfeed] = useState<KillfeedEntry[]>([]);
  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [hitmarker, setHitmarker] = useState<{ show: boolean; isHeadshot: boolean }>({ show: false, isHeadshot: false });
  const [damageIndicator, setDamageIndicator] = useState<boolean>(false);
  const [isOutsideBlueZone, setIsOutsideBlueZone] = useState<boolean>(false);
  const [vehiclePrompt, setVehiclePrompt] = useState<string | null>(null);
  const [lootPrompt, setLootPrompt] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('THIRD_PERSON');
  const [stance, setStance] = useState<Stance>('STAND');
  const [zoneData, setZoneData] = useState<any>(null);

  // Voice Chat State
  const [voiceChannel, setVoiceChannel] = useState<VoiceChannel>(voiceChatSystem.channel);
  const [isSelfMuted, setIsSelfMuted] = useState<boolean>(voiceChatSystem.isSelfMuted);
  const [isDeafened, setIsDeafened] = useState<boolean>(voiceChatSystem.isDeafened);
  const [isPttActive, setIsPttActive] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [hasMicPermission, setHasMicPermission] = useState<boolean>(voiceChatSystem.hasMicPermission);
  const [squadmates, setSquadmates] = useState(voiceChatSystem.squadmates);
  const [proximityAlert, setProximityAlert] = useState<{ message: string; distance: number; bearing: number } | null>(null);

  // Progression & Royale Pass State
  const [isProgressionOpen, setIsProgressionOpen] = useState<boolean>(false);
  const [profile, setProfile] = useState(progressionManager.profile);
  const [objectives, setObjectives] = useState(progressionManager.objectives);
  const [feats, setFeats] = useState(progressionManager.feats);
  const [xpNotifications, setXpNotifications] = useState<XpNotification[]>([]);

  // Modals & UI Toggles
  const [isLobbyOpen, setIsLobbyOpen] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<UserProfile>(userAccountManager.getProfile());
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const [sensitivity, setSensitivity] = useState<number>(0.0022);
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsPreset>(userAccountManager.getProfile().preferredGraphics);
  const [forceMobileControls, setForceMobileControls] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // Sync user profile state
  useEffect(() => {
    return userAccountManager.subscribe((profile) => {
      setUserProfile(profile);
      setGraphicsQuality(profile.preferredGraphics);
    });
  }, []);

  // Detect touch capability
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
    if (isTouch) {
      setForceMobileControls(true);
    }
  }, []);

  // Sync Voice Chat UI state at 15Hz
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPttActive(voiceChatSystem.isPttActive);
      setMicLevel(voiceChatSystem.micLevel);
      setSquadmates([...voiceChatSystem.squadmates]);
      setProximityAlert(voiceChatSystem.proximityChatterAlert);
      setHasMicPermission(voiceChatSystem.hasMicPermission);
    }, 66);
    return () => clearInterval(interval);
  }, []);

  // Initialize Game Engine with Custom Match Configuration
  const initEngine = useCallback((config: GameInitConfig) => {
    if (!containerRef.current) return;

    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }

    const engine = new GameEngine(
      containerRef.current,
      {
        onStatsUpdate: (s) => setStats(s),
        onWeaponUpdate: (w, slot) => {
          setCurrentWeapon({ ...w });
          setActiveSlot(slot);
        },
        onZoneUpdate: (z) => {
          setZoneData(z);
          if (engineRef.current) {
            const dist = Math.sqrt(
              (engineRef.current.playerPos.x - z.currentCenter.x) ** 2 +
              (engineRef.current.playerPos.z - z.currentCenter.z) ** 2
            );
            setIsOutsideBlueZone(dist > z.currentRadius);
          }
        },
        onKillfeed: (entry) => {
          setKillfeed((prev) => [...prev.slice(-6), entry]);
        },
        onHitmarker: (isHeadshot) => {
          setHitmarker({ show: true, isHeadshot });
          setTimeout(() => setHitmarker({ show: false, isHeadshot: false }), 200);
        },
        onDamageTaken: () => {
          setDamageIndicator(true);
          setTimeout(() => setDamageIndicator(false), 250);
        },
        onVehiclePrompt: (prompt) => setVehiclePrompt(prompt),
        onLootPrompt: (prompt) => setLootPrompt(prompt),
        onPhaseChange: (p) => setPhase(p),
        onCompassHeading: (deg) => setCompassHeading(deg),
        onAliveUpdate: (count) => setAliveCount(count),
        onParachuteHeight: (alt) => setAltitude(alt),
        onSquadUpdate: (sq) => setSquadMembers(sq),
        onTdmUpdate: (tdm) => setTdmState({ ...tdm }),
        onVehicleUpdate: (vInfo) => setVehicleInfo(vInfo),
        onXpEarned: (popups) => {
          popups.forEach((text) => {
            const notif: XpNotification = {
              id: `xp_${Date.now()}_${Math.random()}`,
              text,
              isFeat: text.includes('Feat') || text.includes('Winner'),
            };
            setXpNotifications((prev) => [...prev.slice(-3), notif]);
            setTimeout(() => {
              setXpNotifications((prev) => prev.filter((n) => n.id !== notif.id));
            }, 3200);
          });
          // Sync profile state
          setProfile({ ...progressionManager.profile });
          setObjectives([...progressionManager.objectives]);
          setFeats([...progressionManager.feats]);
        },
      },
      config
    );

    engineRef.current = engine;
    setWeapons(engine.weapons);
    setCurrentWeapon(engine.weapons[0]);
    if (config.mapId) setSelectedMap(config.mapId);
    if (config.gameMode) setSelectedMode(config.gameMode);
    if (config.characterId) setSelectedCharacter(config.characterId);
    if (config.graphicsPreset) setGraphicsQuality(config.graphicsPreset);
  }, []);

  useEffect(() => {
    initEngine({
      mapId: selectedMap,
      gameMode: selectedMode,
      characterId: selectedCharacter,
      graphicsPreset: graphicsQuality,
    });

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [initEngine]);

  // Keyboard & Mouse Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const key = e.key.toLowerCase();

      // Push-To-Talk (T key)
      if (key === 't' && !e.repeat) {
        voiceChatSystem.setPtt(true);
      }

      // Royale Pass & Progression (P key)
      if (key === 'p') {
        setIsProgressionOpen((prev) => !prev);
      }

      // Movement & Combat
      if (key === 'w' || key === 'arrowup') engineRef.current.input.forward = true;
      if (key === 's' || key === 'arrowdown') engineRef.current.input.backward = true;
      if (key === 'a' || key === 'arrowleft') engineRef.current.input.left = true;
      if (key === 'd' || key === 'arrowright') engineRef.current.input.right = true;
      if (key === 'shift') {
        engineRef.current.input.sprint = true;
        engineRef.current.isSprinting = true;
      }
      if (key === ' ') {
        engineRef.current.input.jump = true;
        if (phase === 'PLANE_DROP') {
          engineRef.current.deployParachute();
        }
      }
      if (key === 'c') {
        const next = stance === 'CROUCH' ? 'STAND' : 'CROUCH';
        setStance(next);
        engineRef.current.setStance(next);
      }
      if (key === 'z') {
        const next = stance === 'PRONE' ? 'STAND' : 'PRONE';
        setStance(next);
        engineRef.current.setStance(next);
      }
      if (key === 'r') engineRef.current.reloadActiveWeapon();
      if (key === '1') engineRef.current.switchWeapon(0);
      if (key === '2') engineRef.current.switchWeapon(1);
      if (key === '3') engineRef.current.switchWeapon(2);
      if (key === 'f') engineRef.current.interactOrEnterVehicle();
      if (key === 'h') engineRef.current.honkVehicle();
      if (key === '5') engineRef.current.useMedkit();
      if (key === '6') engineRef.current.useEnergyDrink();
      if (key === 'v') {
        engineRef.current.toggleCameraMode();
        setCameraMode(engineRef.current.cameraMode);
      }
      if (key === 'm') setIsMapOpen((prev) => !prev);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const key = e.key.toLowerCase();

      // Release PTT
      if (key === 't') {
        voiceChatSystem.setPtt(false);
      }

      if (key === 'w' || key === 'arrowup') engineRef.current.input.forward = false;
      if (key === 's' || key === 'arrowdown') engineRef.current.input.backward = false;
      if (key === 'a' || key === 'arrowleft') engineRef.current.input.left = false;
      if (key === 'd' || key === 'arrowright') engineRef.current.input.right = false;
      if (key === 'shift') {
        engineRef.current.input.sprint = false;
        engineRef.current.isSprinting = false;
      }
      if (key === ' ') engineRef.current.input.jump = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!engineRef.current || !isPointerLocked) return;
      if (e.button === 0) {
        engineRef.current.input.fire = true;
        engineRef.current.shootWeapon();
      } else if (e.button === 2) {
        e.preventDefault();
        const nextAim = !isAiming;
        setIsAiming(nextAim);
        engineRef.current.isAiming = nextAim;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!engineRef.current) return;
      if (e.button === 0) {
        engineRef.current.input.fire = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!engineRef.current || !isPointerLocked) return;
      engineRef.current.handleMouseMove(e.movementX, e.movementY, sensitivity);
    };

    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === containerRef.current);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isPointerLocked, isAiming, stance, phase, sensitivity]);

  const requestLock = () => {
    if (containerRef.current) {
      containerRef.current.requestPointerLock();
    }
  };

  const handleMobileMove = (x: number, y: number) => {
    if (!engineRef.current) return;
    engineRef.current.input.left = x < -0.25;
    engineRef.current.input.right = x > 0.25;
    engineRef.current.input.forward = y < -0.25;
    engineRef.current.input.backward = y > 0.25;
    engineRef.current.isSprinting = y < -0.75;
  };

  const handleMobileLook = (dx: number, dy: number) => {
    if (!engineRef.current) return;
    engineRef.current.handleMouseMove(dx, dy, sensitivity * 1.5);
  };

  const handleMobileFireStart = () => {
    if (!engineRef.current) return;
    engineRef.current.input.fire = true;
    engineRef.current.shootWeapon();
  };

  const handleMobileFireEnd = () => {
    if (!engineRef.current) return;
    engineRef.current.input.fire = false;
  };

  const handleMobileAimToggle = () => {
    if (!engineRef.current) return;
    const next = !isAiming;
    setIsAiming(next);
    engineRef.current.isAiming = next;
  };

  const refreshProgression = () => {
    setProfile({ ...progressionManager.profile });
    setObjectives([...progressionManager.objectives]);
    setFeats([...progressionManager.feats]);
  };

  const handleStartMatch = (presetOrOptions?: GraphicsPreset | MatchLaunchOptions) => {
    setIsLobbyOpen(false);
    let mapId: MapId = selectedMap;
    let gameMode: GameMode = selectedMode;
    let characterId: CharacterId = selectedCharacter;
    let preset: GraphicsPreset = graphicsQuality;

    if (typeof presetOrOptions === 'object' && presetOrOptions !== null && 'mapId' in presetOrOptions) {
      mapId = presetOrOptions.mapId;
      gameMode = presetOrOptions.gameMode;
      characterId = presetOrOptions.characterId;
      preset = presetOrOptions.preset;
    } else if (typeof presetOrOptions === 'string') {
      preset = presetOrOptions;
    }

    setSelectedMap(mapId);
    setSelectedMode(gameMode);
    setSelectedCharacter(characterId);
    setGraphicsQuality(preset);
    userAccountManager.setGraphicsPreset(preset);

    initEngine({
      mapId,
      gameMode,
      characterId,
      graphicsPreset: preset,
    });
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black font-['Rajdhani',sans-serif]">
      {/* 3D WebGL Canvas Viewport */}
      <div
        id="bgmi-viewport"
        ref={containerRef}
        onClick={requestLock}
        className="w-full h-full cursor-crosshair"
      />

      {/* Floating XP & Combat Feat Popups */}
      <XpPopupBanner notifications={xpNotifications} />

      {/* Proximity & Team Voice Chat Tactical Comms Bar */}
      <VoiceChatHUD
        channel={voiceChannel}
        onChangeChannel={(ch) => {
          setVoiceChannel(ch);
          voiceChatSystem.setChannel(ch);
        }}
        isSelfMuted={isSelfMuted}
        onToggleSelfMute={() => {
          voiceChatSystem.toggleSelfMute();
          setIsSelfMuted(voiceChatSystem.isSelfMuted);
        }}
        isDeafened={isDeafened}
        onToggleDeafen={() => {
          voiceChatSystem.toggleDeafen();
          setIsDeafened(voiceChatSystem.isDeafened);
        }}
        isPttActive={isPttActive}
        micLevel={micLevel}
        squadmates={squadmates}
        onToggleSquadmateMute={(id) => {
          const s = squadmates.find((m) => m.id === id);
          if (s) {
            voiceChatSystem.setSquadmateMuted(id, !s.isMuted);
            setSquadmates([...voiceChatSystem.squadmates]);
          }
        }}
        onSquadmateVolumeChange={(id, vol) => {
          voiceChatSystem.setSquadmateVolume(id, vol);
          setSquadmates([...voiceChatSystem.squadmates]);
        }}
        proximityAlert={proximityAlert}
        onRequestMicAccess={() => {
          voiceChatSystem.requestMicAccess().then((granted) => {
            setHasMicPermission(granted);
          });
        }}
        hasMicPermission={hasMicPermission}
      />

      {/* Primary BGMI HUD */}
      {currentWeapon && (
        <HUD
          stats={stats}
          currentWeapon={currentWeapon}
          activeSlot={activeSlot}
          onSelectSlot={(slot) => engineRef.current?.switchWeapon(slot)}
          weapons={weapons}
          compassHeading={compassHeading}
          aliveCount={aliveCount}
          killfeed={killfeed}
          isAiming={isAiming}
          hitmarker={hitmarker}
          damageIndicator={damageIndicator}
          isOutsideBlueZone={isOutsideBlueZone}
          vehiclePrompt={vehiclePrompt}
          lootPrompt={lootPrompt}
          cameraMode={cameraMode}
          onToggleCamera={() => {
            if (engineRef.current) {
              engineRef.current.toggleCameraMode();
              setCameraMode(engineRef.current.cameraMode);
            }
          }}
          stance={stance}
          onSetStance={(s) => {
            setStance(s);
            engineRef.current?.setStance(s);
          }}
          onReload={() => engineRef.current?.reloadActiveWeapon()}
          onUseMedkit={() => engineRef.current?.useMedkit()}
          onUseDrink={() => engineRef.current?.useEnergyDrink()}
          onOpenMap={() => setIsMapOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProgression={() => setIsProgressionOpen(true)}
          progressionLevel={profile.level}
          progressionBp={profile.bp}
          phase={phase}
          altitude={altitude}
          onDeployChute={() => engineRef.current?.deployParachute()}
          playerName={userProfile.displayName}
          assistantName={userProfile.assistantName}
          isGoogleConnected={userProfile.isGoogleConnected}
          onOpenLobby={() => setIsLobbyOpen(true)}
          graphicsPreset={graphicsQuality}
          mapName={MAP_CONFIGS[selectedMap]?.name || 'Erangel Classic'}
          gameModeName={MODE_CONFIGS[selectedMode]?.name || 'Squad Battle Royale'}
          squadMembers={selectedMode === 'SQUAD' ? squadMembers : []}
          tdmState={selectedMode === 'DEATHMATCH' ? tdmState : undefined}
          vehicleInfo={vehicleInfo}
          onHonkHorn={() => engineRef.current?.honkVehicle()}
        />
      )}

      {/* Mobile Virtual Touch Controls */}
      {(forceMobileControls || isTouchDevice) && phase === 'PLAYING' && (
        <MobileControls
          onMove={handleMobileMove}
          onLook={handleMobileLook}
          onFireStart={handleMobileFireStart}
          onFireEnd={handleMobileFireEnd}
          onAimToggle={handleMobileAimToggle}
          isAiming={isAiming}
          onJump={() => {
            if (engineRef.current) {
              engineRef.current.input.jump = true;
              setTimeout(() => {
                if (engineRef.current) engineRef.current.input.jump = false;
              }, 150);
            }
          }}
          onStanceChange={(s) => {
            setStance(s);
            engineRef.current?.setStance(s);
          }}
          currentStance={stance}
          onReload={() => engineRef.current?.reloadActiveWeapon()}
          onInteract={() => engineRef.current?.interactOrEnterVehicle()}
          nearVehicle={!!vehiclePrompt}
        />
      )}

      {/* Pointer Lock Prompt (Desktop) */}
      {!isPointerLocked && !isTouchDevice && !isMapOpen && !isSettingsOpen && !isProgressionOpen && !isLobbyOpen && phase !== 'VICTORY' && phase !== 'DEFEAT' && (
        <div
          onClick={requestLock}
          className="absolute inset-0 z-40 bg-black/55 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer select-none"
        >
          <div className="bg-neutral-950/95 border border-amber-500/60 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm mx-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400">
              <MousePointer className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider font-['Chakra_Petch',sans-serif]">
                Click Screen to Lock Aim
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Enables smooth mouse look, tactical weapon aiming, and full battleground controls.
              </p>
            </div>
            <div className="flex flex-col gap-1 text-[11px] text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-500/30">
              <span>Press [ESC] to release cursor</span>
              <span>Hold [T] for Push-To-Talk Voice Comms</span>
              <span>Press [P] for Battle Pass & Armory</span>
              <span>Press [H] to Honk Vehicle Horn</span>
            </div>

            {/* Toggle mobile touch overlay button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setForceMobileControls(!forceMobileControls);
              }}
              className="mt-2 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 underline"
            >
              {forceMobileControls ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
              <span>{forceMobileControls ? 'Switch to PC Controls' : 'Enable On-Screen Mobile Touch HUD'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Soldier Profile, Google Account & Deployment Lobby Modal */}
      <LobbyStartModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        graphicsPreset={graphicsQuality}
        onGraphicsChange={(preset) => {
          setGraphicsQuality(preset);
          userAccountManager.setGraphicsPreset(preset);
          if (engineRef.current) {
            engineRef.current.setGraphicsQuality(preset);
          }
        }}
        selectedMap={selectedMap}
        selectedMode={selectedMode}
        selectedCharacter={selectedCharacter}
        onSelectMap={(m) => setSelectedMap(m)}
        onSelectMode={(gm) => setSelectedMode(gm)}
        onSelectCharacter={(c) => setSelectedCharacter(c)}
        onStartMatch={handleStartMatch}
        profile={userProfile}
      />

      {/* Battle Pass, Armory & Progression Modal */}
      <ProgressionModal
        isOpen={isProgressionOpen}
        onClose={() => setIsProgressionOpen(false)}
        profile={profile}
        objectives={objectives}
        feats={feats}
        onRefreshProfile={refreshProgression}
      />

      {/* Tactical Island Map Modal */}
      <TacticalMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        playerPos={{
          x: engineRef.current?.playerPos.x || 0,
          z: engineRef.current?.playerPos.z || 0,
        }}
        playerYaw={engineRef.current?.playerYaw || 0}
        zone={zoneData}
        compounds={engineRef.current?.worldData.compounds || []}
        mapId={selectedMap}
        squadmates={squadMembers.map((sq, idx) => ({
          name: sq.name,
          x: (engineRef.current?.playerPos.x || 0) + (idx === 0 ? 15 : idx === 1 ? -18 : 22),
          z: (engineRef.current?.playerPos.z || 0) + (idx === 0 ? 10 : idx === 1 ? -15 : -25),
          isAlive: sq.isAlive,
        }))}
        vehicles={
          engineRef.current?.vehicles.map((v) => ({
            name: v.stats.name,
            x: v.position.x,
            z: v.position.z,
          })) || []
        }
        airdropPos={
          engineRef.current?.airdropManager.crate
            ? {
                x: engineRef.current.airdropManager.crate.x,
                z: engineRef.current.airdropManager.crate.z,
              }
            : null
        }
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        sensitivity={sensitivity}
        onSensitivityChange={(s) => setSensitivity(s)}
        graphicsQuality={graphicsQuality}
        onGraphicsChange={(g) => {
          setGraphicsQuality(g);
          userAccountManager.setGraphicsPreset(g);
          if (engineRef.current) {
            engineRef.current.setGraphicsQuality(g);
          }
        }}
      />

      {/* Victory / Defeat Match End Summary Modal */}
      {(phase === 'VICTORY' || phase === 'DEFEAT') && (
        <VictoryDefeatModal
          type={phase}
          stats={stats}
          rank={phase === 'VICTORY' ? 1 : Math.max(2, aliveCount)}
          earnedXp={phase === 'VICTORY' ? 650 : Math.round(stats.survivalTime * 0.5) + stats.kills * 100}
          earnedBp={phase === 'VICTORY' ? 400 : 150 + stats.kills * 50}
          onOpenArmory={() => setIsProgressionOpen(true)}
          onPlayAgain={() => {
            engineRef.current?.restartGame();
            refreshProgression();
          }}
        />
      )}
    </main>
  );
}
