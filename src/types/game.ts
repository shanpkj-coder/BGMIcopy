export type GamePhase = 'LOBBY' | 'PLANE_DROP' | 'PLAYING' | 'VICTORY' | 'DEFEAT';

export type CameraMode = 'THIRD_PERSON' | 'FIRST_PERSON' | 'VEHICLE';

export type Stance = 'STAND' | 'CROUCH' | 'PRONE';

export type MapId = 'ERANGEL' | 'MIRAMAR' | 'VIKENDI' | 'SANHOK' | 'WAREHOUSE_TDM';

export type GameMode = 'SQUAD' | 'LONE_WOLF' | 'DEATHMATCH' | 'SNIPER_ARENA';

export type CharacterId = 'VICTOR' | 'SARA' | 'CARLO' | 'RILEY' | 'VANGUARD';

export type VehicleType = 'BUGGY' | 'UAZ' | 'DACIA' | 'MOTORBIKE' | 'BRDM';

export interface SquadMember {
  id: string;
  name: string;
  callsign: string;
  number: number; // 1, 2, 3, 4
  health: number;
  maxHealth: number;
  isAlive: boolean;
  isKnocked: boolean;
  kills: number;
  distance: number;
  status: 'FOLLOWING' | 'ENGAGING' | 'REVIVING' | 'DOWNED';
}

export interface TdmState {
  friendlyScore: number;
  enemyScore: number;
  targetScore: number;
  timeLeft: number;
  streak: number;
  respawnCountdown: number;
}

export interface GameSettings {
  // Audio
  masterVolume: number;
  sfxVolume: number;
  engineVolume: number;
  voiceVolume: number;
  isMuted: boolean;
  // Controls & Crosshair
  sensitivity: number;
  adsSensitivity: number;
  invertY: boolean;
  crosshairColor: string;
  crosshairStyle: 'DOT' | 'CROSS' | 'CIRCLE' | 'TACTICAL';
  // Graphics & Display
  fov: number; // 65 to 105
  fpsLimit: number; // 30, 60, 90, 120, 0 (unlimited)
  showFpsCounter: boolean;
  shadowsEnabled: boolean;
  bloomEnabled: boolean;
  grassEnabled: boolean;
  // Gameplay
  autoPickup: boolean;
  showDamageNumbers: boolean;
  hitmarkerSound: boolean;
}

export interface WeaponConfig {
  id: string;
  name: string;
  category: 'AR' | 'SNIPER' | 'DMR' | 'SMG' | 'SHOTGUN' | 'LMG' | 'SPECIAL';
  ammoType: '5.56mm' | '7.62mm' | '.300 Mag' | '9mm' | '.45 ACP' | '12 Gauge' | 'Rocket';
  magazineSize: number;
  damage: number;
  fireRate: number; // shots per sec
  recoil: number;
  bulletSpeed: number;
  zoomFov: number; // in degrees
  scopeName: string;
  auto: boolean;
  color: string;
  description?: string;
}

export interface WeaponState {
  config: WeaponConfig;
  currentAmmo: number;
  reserveAmmo: number;
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  boost: number; // 0 to 100
  armor: number; // 0 to 100
  helmet: number; // 0 to 100
  kills: number;
  damageDealt: number;
  survivalTime: number;
  distanceTraveled: number;
}

export interface PlayZone {
  phase: number;
  currentRadius: number;
  targetRadius: number;
  currentCenter: { x: number; z: number };
  targetCenter: { x: number; z: number };
  timeRemaining: number; // seconds
  isShrinking: boolean;
  damagePerSec: number;
}

export interface KillfeedEntry {
  id: string;
  killer: string;
  victim: string;
  weapon: string;
  isHeadshot: boolean;
  isPlayerKiller: boolean;
  isPlayerVictim: boolean;
  time: number;
}

export interface AirDropCrate {
  x: number;
  y: number;
  z: number;
  groundY: number;
  isGrounded: boolean;
  hasBeenLooted: boolean;
}

export interface GroundLoot {
  id: string;
  type: 'AMMO' | 'MEDKIT' | 'ENERGY_DRINK' | 'WEAPON' | 'ARMOR';
  name: string;
  x: number;
  y: number;
  z: number;
  data?: any;
}
