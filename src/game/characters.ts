import { CharacterId } from '../types/game';

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  title: string;
  role: string;
  lore: string;
  perkName: string;
  perkDescription: string;
  avatarUrl: string;
  style: {
    camoColor: number;
    vestColor: number;
    helmetColor: number;
    accentColor: number;
    skinTone: number;
    hasCape?: boolean;
    hasHeadset?: boolean;
    hasGhillieLeaves?: boolean;
    hasHeavyPlates?: boolean;
    hasCap?: boolean;
  };
}

export const CHARACTERS: Record<CharacterId, CharacterProfile> = {
  VICTOR: {
    id: 'VICTOR',
    name: 'Victor',
    title: 'Tactical Assault Commander',
    role: 'Assault / SMG Specialist',
    lore: 'A battle-hardened veteran who survived hundreds of hot-drops. Specializes in rapid room clearing and recoil mitigation.',
    perkName: 'Submachine Mastery',
    perkDescription: 'Reduces horizontal recoil kick by 15% and speeds up SMG reload time.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    style: {
      camoColor: 0x4a5538, // Desert/Olive tactical
      vestColor: 0x222620, // Tactical black vest
      helmetColor: 0x3b4231, // Standard military helmet
      accentColor: 0xf59e0b, // Amber tactical straps
      skinTone: 0xc49a7a,
      hasCap: true,
    },
  },
  SARA: {
    id: 'SARA',
    name: 'Sara',
    title: 'Vehicle & Speed Specialist',
    role: 'Recon & High-Speed Pilot',
    lore: 'Combat engineer with elite mechanical intuition. Modifies vehicle suspensions and outruns shrinking blue zones with ease.',
    perkName: 'Apex Driver',
    perkDescription: 'Increases vehicle top speed by 10% and reduces vehicle damage taken by 20%.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    style: {
      camoColor: 0x1f2937, // Sleek stealth black
      vestColor: 0x111827, // Dark carbon armor
      helmetColor: 0x374151, // Flight pilot helmet
      accentColor: 0x06b6d4, // Cyan LED comms
      skinTone: 0xd8b4a0,
      hasHeadset: true,
    },
  },
  CARLO: {
    id: 'CARLO',
    name: 'Carlo',
    title: 'Urban Phantom Assassin',
    role: 'Infiltration & Stealth Ops',
    lore: 'Former elite mercenary famed for silent takedowns and rooftop vantage domination. Master of silenced weapons.',
    perkName: 'Ghost Step',
    perkDescription: 'Reduces sound radius of footsteps by 30% and shortens fall impact stun.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    style: {
      camoColor: 0x2d3139, // Urban charcoal
      vestColor: 0x181a1f, // Ballistic weave
      helmetColor: 0x23272e, // Spec ops visor
      accentColor: 0xef4444, // Crimson stealth visor light
      skinTone: 0xb58b68,
      hasCape: true,
    },
  },
  RILEY: {
    id: 'RILEY',
    name: 'Riley',
    title: 'High-Altitude Ghillie Sniper',
    role: 'Marksman & Recon Scout',
    lore: 'Patient marksman trained in dense forests. Can hold breath longer when sighting through high-magnification 8x scopes.',
    perkName: 'Eagle Eye',
    perkDescription: 'Zero scope sway for the first 3 seconds of aiming down sights with Sniper & DMR rifles.',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
    style: {
      camoColor: 0x364828, // Woodland ghillie green
      vestColor: 0x27341d, // Camo chest rig
      helmetColor: 0x425633, // Foliage covered helmet
      accentColor: 0x84cc16, // Leaf green
      skinTone: 0xc89e7e,
      hasGhillieLeaves: true,
    },
  },
  VANGUARD: {
    id: 'VANGUARD',
    name: 'Vanguard',
    title: 'Heavy Assault Juggernaut',
    role: 'Frontline Tank & Breach',
    lore: 'Towering soldier clad in reinforced titanium composites. Unyielding under heavy automatic suppression fire.',
    perkName: 'Titanium Shell',
    perkDescription: 'Starts matches with +25 extra level-3 body armor durability and 15% blast resistance.',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    style: {
      camoColor: 0x333b47, // Battleship steel
      vestColor: 0x1f242d, // Reinforced ballistic plate
      helmetColor: 0x475569, // Heavy blast visor
      accentColor: 0xeab308, // Hazard yellow stripes
      skinTone: 0xb88e6e,
      hasHeavyPlates: true,
    },
  },
};
