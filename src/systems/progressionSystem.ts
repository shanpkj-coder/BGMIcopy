import { CosmeticItem, FeatAchievement, MatchObjective, PlayerProgression, RankTier } from '../types/progression';

export const COSMETIC_CATALOG: CosmeticItem[] = [
  // Weapons
  {
    id: 'skin_m416_glacier',
    name: 'M416 Glacier',
    category: 'WEAPON_SKIN',
    weaponTarget: 'M416',
    rarity: 'MYTHIC',
    costBp: 1500,
    description: 'Iconic crystal blue frost finish with sub-zero particle aura.',
    colorPreview: '#38bdf8',
  },
  {
    id: 'skin_m416_camo',
    name: 'M416 Desert Camo',
    category: 'WEAPON_SKIN',
    weaponTarget: 'M416',
    rarity: 'RARE',
    costBp: 600,
    description: 'Matte arid desert camouflage pattern.',
    colorPreview: '#d97706',
  },
  {
    id: 'skin_akm_dragon',
    name: 'AKM Golden Dragon',
    category: 'WEAPON_SKIN',
    weaponTarget: 'AKM',
    rarity: 'LEGENDARY',
    costBp: 1800,
    description: 'Gilded dragon engraving with hand-rubbed walnut wood stock.',
    colorPreview: '#eab308',
  },
  {
    id: 'skin_awm_cyber',
    name: 'AWM Cyberpulse',
    category: 'WEAPON_SKIN',
    weaponTarget: 'AWM',
    rarity: 'LEGENDARY',
    costBp: 2000,
    description: 'Futuristic carbon weave chassis with neon cyan scope.',
    colorPreview: '#06b6d4',
  },
  // Outfits
  {
    id: 'outfit_black_ops',
    name: 'Black Ops Infiltrator',
    category: 'OUTFIT',
    rarity: 'EPIC',
    costBp: 1200,
    description: 'Special forces night raid tactical gear with tinted ballistic goggles.',
    colorPreview: '#1e293b',
  },
  {
    id: 'outfit_desert_commando',
    name: 'Desert Commando',
    category: 'OUTFIT',
    rarity: 'RARE',
    costBp: 800,
    description: 'Standard issue arid battle dress uniform with tactical webbing.',
    colorPreview: '#a16207',
  },
  {
    id: 'outfit_neon_specter',
    name: 'Neon Specter Suit',
    category: 'OUTFIT',
    rarity: 'MYTHIC',
    costBp: 2500,
    description: 'Cybernetic reinforced exoskeleton with reactive luminescence.',
    colorPreview: '#8b5cf6',
  },
  // Parachutes
  {
    id: 'chute_golden_eagle',
    name: 'Golden Eagle Canopy',
    category: 'PARACHUTE',
    rarity: 'EPIC',
    costBp: 900,
    description: 'Emblazoned gold raptor insignia gliding canopy.',
    colorPreview: '#f59e0b',
  },
  {
    id: 'chute_crimson_drop',
    name: 'Crimson Drop Flare',
    category: 'PARACHUTE',
    rarity: 'RARE',
    costBp: 500,
    description: 'High visibility battle drop parachute in crimson.',
    colorPreview: '#ef4444',
  },
  // Titles
  {
    id: 'title_conqueror',
    name: 'Ace Conqueror',
    category: 'TITLE',
    rarity: 'LEGENDARY',
    costBp: 2200,
    description: 'Highest echelon battle royale combatant mark.',
    colorPreview: '#facc15',
  },
  {
    id: 'title_sharpshooter',
    name: 'Sharpshooter Elite',
    category: 'TITLE',
    rarity: 'EPIC',
    costBp: 1000,
    description: 'Master marksman with deadly long-range ballistics.',
    colorPreview: '#38bdf8',
  },
];

export const AVAILABLE_BOOSTS = [
  {
    id: 'boost_double_xp',
    type: 'DOUBLE_XP' as const,
    name: '2x XP Battle Pass Booster',
    description: 'Doubles all XP gained from kills, survival, and objectives in your next match.',
    costBp: 350,
  },
  {
    id: 'boost_adrenaline',
    type: 'ADRENALINE' as const,
    name: 'Adrenaline Infusion',
    description: 'Begin match with a fully primed 100% Boost Bar for enhanced sprint speed and regeneration.',
    costBp: 250,
  },
  {
    id: 'boost_armor',
    type: 'TACTICAL_ARMOR' as const,
    name: 'Reinforced Ceramic Vest',
    description: 'Grants +35 bonus starting armor integrity for increased ballistic protection.',
    costBp: 300,
  },
  {
    id: 'boost_reload',
    type: 'RAPID_RELOAD' as const,
    name: 'Tactical Quick-Draw Gloves',
    description: 'Reduces weapon magazine reload cycle time by 25% for 1 match.',
    costBp: 280,
  },
];

const INITIAL_OBJECTIVES: MatchObjective[] = [
  {
    id: 'obj_kills',
    title: 'Combat Supremacy',
    description: 'Eliminate 3 hostile combatants',
    target: 3,
    current: 0,
    rewardXp: 300,
    rewardBp: 150,
    isCompleted: false,
  },
  {
    id: 'obj_headshot',
    title: 'Precision Strike',
    description: 'Eliminate an opponent with a Headshot',
    target: 1,
    current: 0,
    rewardXp: 250,
    rewardBp: 120,
    isCompleted: false,
  },
  {
    id: 'obj_drive',
    title: 'Road Warrior',
    description: 'Travel 250 meters in the Buggy vehicle',
    target: 250,
    current: 0,
    rewardXp: 200,
    rewardBp: 100,
    isCompleted: false,
  },
  {
    id: 'obj_airdrop',
    title: 'Supply Intercept',
    description: 'Open and loot a red Airdrop supply crate',
    target: 1,
    current: 0,
    rewardXp: 400,
    rewardBp: 200,
    isCompleted: false,
  },
  {
    id: 'obj_survive_zone',
    title: 'Circle Tactician',
    description: 'Survive past Play Zone Phase 2',
    target: 2,
    current: 0,
    rewardXp: 250,
    rewardBp: 100,
    isCompleted: false,
  },
];

const INITIAL_FEATS: FeatAchievement[] = [
  {
    id: 'feat_first_blood',
    name: 'First Blood',
    description: 'Score the first elimination of the match',
    xpReward: 150,
    unlocked: false,
    iconName: 'Droplet',
  },
  {
    id: 'feat_sharpshooter',
    name: 'Long-Range Predator',
    description: 'Eliminate a target using the AWM Sniper rifle',
    xpReward: 300,
    unlocked: false,
    iconName: 'Target',
  },
  {
    id: 'feat_roadkill',
    name: 'Vehicular Carnage',
    description: 'Run down a hostile soldier with the Buggy',
    xpReward: 350,
    unlocked: false,
    iconName: 'Car',
  },
  {
    id: 'feat_air_raider',
    name: 'Airdrop Pioneer',
    description: 'Secure military supplies from an Airdrop',
    xpReward: 250,
    unlocked: false,
    iconName: 'Package',
  },
  {
    id: 'feat_chicken_dinner',
    name: 'Chicken Dinner Legend',
    description: 'Secure #1 Victory out of 100 survivors',
    xpReward: 600,
    unlocked: false,
    iconName: 'Trophy',
  },
];

const STORAGE_KEY = 'bgmi_player_progression_v1';

export class ProgressionManager {
  public profile: PlayerProgression;
  public objectives: MatchObjective[];
  public feats: FeatAchievement[];

  constructor() {
    this.profile = this.loadProfile();
    this.objectives = JSON.parse(JSON.stringify(INITIAL_OBJECTIVES));
    this.feats = this.loadFeats();
  }

  private loadProfile(): PlayerProgression {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}

    // Default starter profile
    return {
      level: 4,
      currentXp: 280,
      xpToNextLevel: 650,
      rankTier: 'GOLD',
      rankScore: 1850,
      bp: 1200,
      ag: 140,
      unlockedCosmetics: ['skin_m416_camo', 'outfit_desert_commando', 'chute_crimson_drop'],
      equippedCosmetics: {
        m416Skin: 'skin_m416_camo',
        akmSkin: 'default',
        awmSkin: 'default',
        outfit: 'outfit_desert_commando',
        parachute: 'chute_crimson_drop',
        title: 'Sharpshooter Elite',
      },
      activeBoosts: [
        {
          id: 'boost_double_xp',
          type: 'DOUBLE_XP',
          name: '2x XP Battle Pass Booster',
          description: 'Doubles all match XP gained.',
          matchesRemaining: 2,
        },
      ],
      inventoryBoosts: {
        boost_double_xp: 2,
        boost_adrenaline: 1,
        boost_armor: 1,
      },
    };
  }

  private loadFeats(): FeatAchievement[] {
    try {
      const saved = localStorage.getItem('bgmi_feats_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(INITIAL_FEATS));
  }

  public saveProfile() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      localStorage.setItem('bgmi_feats_v1', JSON.stringify(this.feats));
    } catch (e) {}
  }

  public addXp(amount: number): { leveledUp: boolean; newLevel: number; newXp: number } {
    let finalAmount = amount;
    // Check if double XP boost is active
    if (this.isBoostActive('DOUBLE_XP')) {
      finalAmount *= 2;
    }

    this.profile.currentXp += finalAmount;
    let leveledUp = false;

    while (this.profile.currentXp >= this.profile.xpToNextLevel) {
      this.profile.currentXp -= this.profile.xpToNextLevel;
      this.profile.level += 1;
      this.profile.xpToNextLevel = Math.round(500 + this.profile.level * 180);
      this.profile.bp += 250; // Level up bonus currency
      leveledUp = true;
      this.updateRankTier();
    }

    this.saveProfile();
    return { leveledUp, newLevel: this.profile.level, newXp: this.profile.currentXp };
  }

  private updateRankTier() {
    if (this.profile.level >= 25) this.profile.rankTier = 'CONQUEROR';
    else if (this.profile.level >= 20) this.profile.rankTier = 'ACE';
    else if (this.profile.level >= 15) this.profile.rankTier = 'CROWN';
    else if (this.profile.level >= 10) this.profile.rankTier = 'DIAMOND';
    else if (this.profile.level >= 7) this.profile.rankTier = 'PLATINUM';
    else if (this.profile.level >= 4) this.profile.rankTier = 'GOLD';
    else if (this.profile.level >= 2) this.profile.rankTier = 'SILVER';
    else this.profile.rankTier = 'BRONZE';
  }

  public isBoostActive(type: string): boolean {
    return this.profile.activeBoosts.some((b) => b.type === type && b.matchesRemaining > 0);
  }

  public activateBoost(boostId: string): boolean {
    const boostDef = AVAILABLE_BOOSTS.find((b) => b.id === boostId);
    if (!boostDef) return false;

    const count = this.profile.inventoryBoosts[boostId] || 0;
    if (count <= 0) return false;

    this.profile.inventoryBoosts[boostId] -= 1;

    // Check if already active, extend
    const existing = this.profile.activeBoosts.find((b) => b.id === boostId);
    if (existing) {
      existing.matchesRemaining += 1;
    } else {
      this.profile.activeBoosts.push({
        id: boostDef.id,
        type: boostDef.type,
        name: boostDef.name,
        description: boostDef.description,
        matchesRemaining: 1,
      });
    }

    this.saveProfile();
    return true;
  }

  public purchaseBoost(boostId: string): boolean {
    const boostDef = AVAILABLE_BOOSTS.find((b) => b.id === boostId);
    if (!boostDef) return false;
    if (this.profile.bp < boostDef.costBp) return false;

    this.profile.bp -= boostDef.costBp;
    this.profile.inventoryBoosts[boostId] = (this.profile.inventoryBoosts[boostId] || 0) + 1;
    this.saveProfile();
    return true;
  }

  public purchaseCosmetic(cosmeticId: string): boolean {
    const item = COSMETIC_CATALOG.find((c) => c.id === cosmeticId);
    if (!item) return false;
    if (this.profile.unlockedCosmetics.includes(cosmeticId)) return false;

    if (item.costBp && this.profile.bp >= item.costBp) {
      this.profile.bp -= item.costBp;
      this.profile.unlockedCosmetics.push(cosmeticId);
      this.saveProfile();
      return true;
    }
    return false;
  }

  public equipCosmetic(cosmeticId: string) {
    const item = COSMETIC_CATALOG.find((c) => c.id === cosmeticId);
    if (!item || !this.profile.unlockedCosmetics.includes(cosmeticId)) return;

    if (item.category === 'WEAPON_SKIN') {
      if (item.weaponTarget === 'M416') this.profile.equippedCosmetics.m416Skin = cosmeticId;
      else if (item.weaponTarget === 'AKM') this.profile.equippedCosmetics.akmSkin = cosmeticId;
      else if (item.weaponTarget === 'AWM') this.profile.equippedCosmetics.awmSkin = cosmeticId;
    } else if (item.category === 'OUTFIT') {
      this.profile.equippedCosmetics.outfit = cosmeticId;
    } else if (item.category === 'PARACHUTE') {
      this.profile.equippedCosmetics.parachute = cosmeticId;
    } else if (item.category === 'TITLE') {
      this.profile.equippedCosmetics.title = item.name;
    }

    this.saveProfile();
  }

  /**
   * Event triggers during match
   */
  public recordKill(weapon: string, isHeadshot: boolean): { xpGained: number; popups: string[] } {
    let xp = 100;
    const popups: string[] = ['+100 XP Enemy Eliminated'];

    if (isHeadshot) {
      xp += 50;
      popups.push('+50 XP Headshot Bonus');
    }

    // Update kill objective
    const killObj = this.objectives.find((o) => o.id === 'obj_kills');
    if (killObj && !killObj.isCompleted) {
      killObj.current += 1;
      if (killObj.current >= killObj.target) {
        killObj.isCompleted = true;
        xp += killObj.rewardXp;
        this.profile.bp += killObj.rewardBp;
        popups.push(`+${killObj.rewardXp} XP Objective: ${killObj.title}!`);
      }
    }

    // Update headshot objective
    if (isHeadshot) {
      const hsObj = this.objectives.find((o) => o.id === 'obj_headshot');
      if (hsObj && !hsObj.isCompleted) {
        hsObj.current += 1;
        hsObj.isCompleted = true;
        xp += hsObj.rewardXp;
        this.profile.bp += hsObj.rewardBp;
        popups.push(`+${hsObj.rewardXp} XP Objective: ${hsObj.title}!`);
      }
    }

    // Feat: First Blood
    const fb = this.feats.find((f) => f.id === 'feat_first_blood');
    if (fb && !fb.unlocked) {
      fb.unlocked = true;
      xp += fb.xpReward;
      popups.push(`Feat Unlocked: ${fb.name}! (+${fb.xpReward} XP)`);
    }

    // Feat: Sharpshooter
    if (weapon.includes('AWM') || weapon.includes('Sniper')) {
      const ss = this.feats.find((f) => f.id === 'feat_sharpshooter');
      if (ss && !ss.unlocked) {
        ss.unlocked = true;
        xp += ss.xpReward;
        popups.push(`Feat Unlocked: ${ss.name}! (+${ss.xpReward} XP)`);
      }
    }

    // Feat: Roadkill
    if (weapon.includes('Buggy') || weapon.includes('Vehicle')) {
      const rk = this.feats.find((f) => f.id === 'feat_roadkill');
      if (rk && !rk.unlocked) {
        rk.unlocked = true;
        xp += rk.xpReward;
        popups.push(`Feat Unlocked: ${rk.name}! (+${rk.xpReward} XP)`);
      }
    }

    this.addXp(xp);
    return { xpGained: xp, popups };
  }

  public recordDistanceDriven(meters: number): string | null {
    const driveObj = this.objectives.find((o) => o.id === 'obj_drive');
    if (driveObj && !driveObj.isCompleted) {
      driveObj.current += meters;
      if (driveObj.current >= driveObj.target) {
        driveObj.isCompleted = true;
        this.addXp(driveObj.rewardXp);
        this.profile.bp += driveObj.rewardBp;
        this.saveProfile();
        return `+${driveObj.rewardXp} XP Objective: ${driveObj.title}!`;
      }
    }
    return null;
  }

  public recordAirdropLooted(): string[] {
    const popups: string[] = ['+150 XP Airdrop Secured'];
    let xp = 150;

    const airdropObj = this.objectives.find((o) => o.id === 'obj_airdrop');
    if (airdropObj && !airdropObj.isCompleted) {
      airdropObj.isCompleted = true;
      airdropObj.current = 1;
      xp += airdropObj.rewardXp;
      this.profile.bp += airdropObj.rewardBp;
      popups.push(`+${airdropObj.rewardXp} XP Objective: ${airdropObj.title}!`);
    }

    const feat = this.feats.find((f) => f.id === 'feat_air_raider');
    if (feat && !feat.unlocked) {
      feat.unlocked = true;
      xp += feat.xpReward;
      popups.push(`Feat Unlocked: ${feat.name}! (+${feat.xpReward} XP)`);
    }

    this.addXp(xp);
    return popups;
  }

  public recordZonePhase(phase: number): string | null {
    const obj = this.objectives.find((o) => o.id === 'obj_survive_zone');
    if (obj && !obj.isCompleted && phase >= obj.target) {
      obj.isCompleted = true;
      obj.current = phase;
      this.addXp(obj.rewardXp);
      this.profile.bp += obj.rewardBp;
      this.saveProfile();
      return `+${obj.rewardXp} XP Objective: ${obj.title}!`;
    }
    return null;
  }

  public recordMatchEnd(won: boolean, rank: number, survivalSecs: number): { xpEarned: number; bpEarned: number } {
    let xp = Math.round(survivalSecs * 0.5); // Survival XP
    let bp = 100;

    if (won) {
      xp += 500;
      bp += 300;
      const feat = this.feats.find((f) => f.id === 'feat_chicken_dinner');
      if (feat && !feat.unlocked) {
        feat.unlocked = true;
        xp += feat.xpReward;
      }
    } else if (rank <= 10) {
      xp += 200;
      bp += 150;
    }

    this.addXp(xp);
    this.profile.bp += bp;

    // Consume 1 match from active boosts
    this.profile.activeBoosts.forEach((b) => {
      b.matchesRemaining = Math.max(0, b.matchesRemaining - 1);
    });
    this.profile.activeBoosts = this.profile.activeBoosts.filter((b) => b.matchesRemaining > 0);

    this.saveProfile();
    return { xpEarned: xp, bpEarned: bp };
  }
}

export const progressionManager = new ProgressionManager();
