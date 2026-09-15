import { MapId, GameMode } from '../types/game';

export interface MapConfig {
  id: MapId;
  name: string;
  subtitle: string;
  landscapeType: string;
  biome: string;
  islandSize: number;
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  sunColor: number;
  sunPosition: [number, number, number];
  terrainPalette: {
    grassColor: number;
    dirtColor: number;
    rockColor: number;
    sandColor: number;
  };
  waterColor: number;
  foliageType: 'TEMPERATE' | 'DESERT_CACTUS' | 'SNOW_PINES' | 'TROPICAL_PALMS' | 'INDUSTRIAL';
  compounds: { name: string; x: number; z: number }[];
  tag: string;
  badge: string;
}

export const MAP_CONFIGS: Record<MapId, MapConfig> = {
  ERANGEL: {
    id: 'ERANGEL',
    name: 'Erangel Island',
    subtitle: 'Classic Grassy Battleground & Temperate Archipelago',
    landscapeType: 'Rolling Grassy Hills, Rivers & Military Compounds',
    biome: 'Temperate Forest & Coastal Plains',
    islandSize: 1200,
    skyColor: 0x7391a8,
    fogColor: 0x7391a8,
    fogDensity: 0.0016,
    sunColor: 0xfffaed,
    sunPosition: [280, 450, 180],
    terrainPalette: {
      grassColor: 0x3e682e,
      dirtColor: 0x7c664b,
      rockColor: 0x52544e,
      sandColor: 0xb29e71,
    },
    waterColor: 0x1d4e6b,
    foliageType: 'TEMPERATE',
    compounds: [
      { name: 'Military Base', x: 220, z: 220 },
      { name: 'Pochinki Town', x: -120, z: -100 },
      { name: 'School Compound', x: 60, z: -180 },
      { name: 'Georgopol Containers', x: -300, z: 180 },
      { name: 'Shooting Range', x: 200, z: -260 },
      { name: 'Shelter Ridge', x: -240, z: -280 },
    ],
    tag: 'Classic 8x8',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  MIRAMAR: {
    id: 'MIRAMAR',
    name: 'Miramar Desert',
    subtitle: 'Arid Sand Dunes, Steep Canyons & Rugged Plateaus',
    landscapeType: 'Vast Desert Dunes, Red Rock Canyons & Adobe Ruins',
    biome: 'Arid High Desert',
    islandSize: 1200,
    skyColor: 0x8ea0ad,
    fogColor: 0xc8b08e,
    fogDensity: 0.0018,
    sunColor: 0xfff0c8,
    sunPosition: [350, 500, 150],
    terrainPalette: {
      grassColor: 0xaf9262, // Dry yellow-brown scrub
      dirtColor: 0x8a5f36,  // Reddish desert clay
      rockColor: 0x936647,  // Canyon red sandstone
      sandColor: 0xd8ba85,  // Fine dune sand
    },
    waterColor: 0x22556b,
    foliageType: 'DESERT_CACTUS',
    compounds: [
      { name: 'Los Leones City', x: 180, z: 160 },
      { name: 'Pecado Arena', x: -60, z: -40 },
      { name: 'Hacienda del Patrón', x: 80, z: -140 },
      { name: 'San Martin Oasis', x: -180, z: -160 },
      { name: 'El Azahar Ruins', x: 280, z: -200 },
      { name: 'Chumacera Canyons', x: -220, z: 180 },
    ],
    tag: 'Long Range Sniping',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  VIKENDI: {
    id: 'VIKENDI',
    name: 'Vikendi Snow',
    subtitle: 'Glacial Mountain Peaks, Frozen Rivers & Pine Forests',
    landscapeType: 'Snow-Covered Slopes, Frozen Lakes & Nordic Castles',
    biome: 'Sub-Arctic Taiga & Glacial Tundra',
    islandSize: 1200,
    skyColor: 0xaec2cf,
    fogColor: 0xc4d8e5,
    fogDensity: 0.0022,
    sunColor: 0xf2f7ff,
    sunPosition: [200, 380, 240],
    terrainPalette: {
      grassColor: 0xdbe4eb, // Snow blanket
      dirtColor: 0x6e767c,  // Frozen scree
      rockColor: 0x4a535c,  // Dark slate rock
      sandColor: 0xe8eff5,  // Pure ice/frost
    },
    waterColor: 0x2f647d, // Icy blue frozen water
    foliageType: 'SNOW_PINES',
    compounds: [
      { name: 'Vikendi Castle', x: 0, z: 20 },
      { name: 'Goroka Plaza', x: -160, z: -80 },
      { name: 'Cosmodrome Launch', x: 240, z: -180 },
      { name: 'Dino Park Arena', x: -220, z: 180 },
      { name: 'Mount Kreznic Peak', x: 160, z: 240 },
      { name: 'Volnova Port', x: 120, z: -280 },
    ],
    tag: 'Frost Survival',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  SANHOK: {
    id: 'SANHOK',
    name: 'Sanhok Jungle',
    subtitle: 'Dense Monsoon Rainforest, Palm Canopies & Ancient Temples',
    landscapeType: 'Lush Emerald Jungle, River Deltas & Bamboo Groves',
    biome: 'Tropical Monsoon Rainforest',
    islandSize: 900,
    skyColor: 0x628087,
    fogColor: 0x5e7975,
    fogDensity: 0.0025,
    sunColor: 0xfffae0,
    sunPosition: [250, 420, 180],
    terrainPalette: {
      grassColor: 0x245a1b, // Deep jungle emerald moss
      dirtColor: 0x4f3621,  // Rich tropical damp soil
      rockColor: 0x3d473b,  // Mossy limestone
      sandColor: 0x8a7a58,  // River silt
    },
    waterColor: 0x1a4647,
    foliageType: 'TROPICAL_PALMS',
    compounds: [
      { name: 'Paradise Resort', x: 60, z: -80 },
      { name: 'Bootcamp Garrison', x: 0, z: 0 },
      { name: 'Ruins Temple', x: -140, z: 90 },
      { name: 'Camp Alpha Delta', x: 180, z: 160 },
      { name: 'Pai Nan Rivertown', x: -90, z: -150 },
      { name: 'Ha Tinh Docks', x: -180, z: -80 },
    ],
    tag: 'Close Quarters Guerrilla',
    badge: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
  },
  WAREHOUSE_TDM: {
    id: 'WAREHOUSE_TDM',
    name: 'Warehouse Arena',
    subtitle: 'Fast-Paced Industrial 4v4 Team Deathmatch',
    landscapeType: 'Shipping Containers, Elevated Walkways & Barricades',
    biome: 'Industrial Combat Training Arena',
    islandSize: 320,
    skyColor: 0x55606e,
    fogColor: 0x47515c,
    fogDensity: 0.003,
    sunColor: 0xffeedd,
    sunPosition: [120, 260, 100],
    terrainPalette: {
      grassColor: 0x3b4047, // Asphalt & concrete
      dirtColor: 0x4a4742,  // Gravel yard
      rockColor: 0x2e333a,  // Concrete curbs
      sandColor: 0x5a564c,  // Dirt spill
    },
    waterColor: 0x1d2e38,
    foliageType: 'INDUSTRIAL',
    compounds: [
      { name: 'Central Warehouse Depot', x: 0, z: 0 },
      { name: 'North Container Yard', x: 0, z: 80 },
      { name: 'South Loading Docks', x: 0, z: -80 },
      { name: 'East Forklift Staging', x: 80, z: 0 },
      { name: 'West Guard Tower', x: -80, z: 0 },
    ],
    tag: '4v4 Team Deathmatch',
    badge: 'bg-red-500/20 text-red-400 border-red-500/40',
  },
};

export interface ModeConfig {
  id: GameMode;
  name: string;
  tagline: string;
  description: string;
  teamSize: number;
  playerCount: number;
  iconName: string;
  hasPlayZone: boolean;
  hasRespawn: boolean;
  targetKills?: number;
  badge: string;
}

export const MODE_CONFIGS: Record<GameMode, ModeConfig> = {
  SQUAD: {
    id: 'SQUAD',
    name: 'Battle Royale: Squad (4v4v4...)',
    tagline: 'Lead your tactical 4-soldier fireteam to victory',
    description: 'Drop with 3 AI squadmates (Alpha, Bravo, Charlie). Coordinate pings, revive downed teammates, and eliminate rival 4-man squads.',
    teamSize: 4,
    playerCount: 60,
    iconName: 'Users',
    hasPlayZone: true,
    hasRespawn: false,
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  LONE_WOLF: {
    id: 'LONE_WOLF',
    name: 'Lone Wolf (Solo Battle Royale)',
    tagline: 'High-stakes solo survival free-for-all',
    description: 'Every soldier for themselves. 60 solo combatants parachute onto the island. No revives, pure survival instincts.',
    teamSize: 1,
    playerCount: 60,
    iconName: 'UserCheck',
    hasPlayZone: true,
    hasRespawn: false,
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  DEATHMATCH: {
    id: 'DEATHMATCH',
    name: 'Team Deathmatch (4v4 Warehouse)',
    tagline: 'Instant respawns & non-stop close quarters shootout',
    description: 'Two 4-player teams clash in close-quarters industrial warehouse. Instant 3-second respawns. First team to 40 kills wins the match.',
    teamSize: 4,
    playerCount: 8,
    iconName: 'Swords',
    hasPlayZone: false,
    hasRespawn: true,
    targetKills: 40,
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  SNIPER_ARENA: {
    id: 'SNIPER_ARENA',
    name: 'Sniper Marksman Duel',
    tagline: 'High-caliber sniper duels with Kar98k & AWM',
    description: 'High vantage point precision warfare. Only bolt-action sniper rifles and high-magnification scopes permitted.',
    teamSize: 1,
    playerCount: 30,
    iconName: 'Crosshair',
    hasPlayZone: true,
    hasRespawn: false,
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
};
