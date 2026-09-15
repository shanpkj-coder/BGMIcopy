export type RankTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'CROWN' | 'ACE' | 'CONQUEROR';

export interface PlayerProgression {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  rankTier: RankTier;
  rankScore: number;
  bp: number; // Battle Points
  ag: number; // Ace Gold
  unlockedCosmetics: string[]; // cosmetic IDs
  equippedCosmetics: {
    m416Skin: string;
    akmSkin: string;
    awmSkin: string;
    outfit: string;
    parachute: string;
    title: string;
  };
  activeBoosts: ActiveBoost[];
  inventoryBoosts: { [boostId: string]: number }; // boostId -> count
}

export interface ActiveBoost {
  id: string;
  type: 'DOUBLE_XP' | 'ADRENALINE' | 'TACTICAL_ARMOR' | 'RAPID_RELOAD';
  name: string;
  description: string;
  matchesRemaining: number;
}

export interface MatchObjective {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardXp: number;
  rewardBp: number;
  isCompleted: boolean;
}

export interface CosmeticItem {
  id: string;
  name: string;
  category: 'WEAPON_SKIN' | 'OUTFIT' | 'PARACHUTE' | 'TITLE';
  weaponTarget?: 'M416' | 'AKM' | 'AWM';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
  costBp?: number;
  costAg?: number;
  description: string;
  colorPreview: string;
}

export interface FeatAchievement {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  unlocked: boolean;
  iconName: string;
}
