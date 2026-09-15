import React, { useState } from 'react';
import {
  X,
  Award,
  Zap,
  Shield,
  Target,
  Trophy,
  ShoppingBag,
  Check,
  Lock,
  ChevronRight,
  Flame,
  Sparkles,
} from 'lucide-react';
import {
  PlayerProgression,
  CosmeticItem,
  MatchObjective,
  FeatAchievement,
} from '../types/progression';
import {
  COSMETIC_CATALOG,
  AVAILABLE_BOOSTS,
  progressionManager,
} from '../systems/progressionSystem';

interface ProgressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProgression;
  objectives: MatchObjective[];
  feats: FeatAchievement[];
  onRefreshProfile: () => void;
}

export const ProgressionModal: React.FC<ProgressionModalProps> = ({
  isOpen,
  onClose,
  profile,
  objectives,
  feats,
  onRefreshProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'PASS' | 'ARMORY' | 'BOOSTS'>('PASS');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchaseCosmetic = (id: string) => {
    const success = progressionManager.purchaseCosmetic(id);
    if (success) {
      setPurchaseSuccess('Item purchased successfully!');
      setTimeout(() => setPurchaseSuccess(null), 2500);
      onRefreshProfile();
    }
  };

  const handleEquipCosmetic = (id: string) => {
    progressionManager.equipCosmetic(id);
    onRefreshProfile();
  };

  const handleBuyBoost = (boostId: string) => {
    const success = progressionManager.purchaseBoost(boostId);
    if (success) {
      setPurchaseSuccess('Boost purchased!');
      setTimeout(() => setPurchaseSuccess(null), 2000);
      onRefreshProfile();
    }
  };

  const handleActivateBoost = (boostId: string) => {
    const success = progressionManager.activateBoost(boostId);
    if (success) {
      onRefreshProfile();
    }
  };

  const filteredCosmetics = COSMETIC_CATALOG.filter((c) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'WEAPON') return c.category === 'WEAPON_SKIN';
    if (selectedCategory === 'OUTFIT') return c.category === 'OUTFIT';
    if (selectedCategory === 'PARACHUTE') return c.category === 'PARACHUTE';
    if (selectedCategory === 'TITLE') return c.category === 'TITLE';
    return true;
  });

  return (
    <div id="progression-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-['Rajdhani',sans-serif] select-none">
      <div className="relative w-[850px] max-w-full h-[620px] max-h-[92vh] bg-neutral-950 border border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wider uppercase font-['Chakra_Petch',sans-serif]">
                Battle Pass & Armory Progression
              </h2>
              <span className="text-xs text-neutral-400">Season 1: Erangel Combatant</span>
            </div>
          </div>

          {/* Currencies Badge */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1 rounded-lg border border-neutral-800 shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,1)]" />
              <span className="text-xs font-bold text-neutral-400">BP:</span>
              <span className="text-sm font-bold font-mono text-amber-400">{profile.bp}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1 rounded-lg border border-neutral-800 shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,1)]" />
              <span className="text-xs font-bold text-neutral-400">AG:</span>
              <span className="text-sm font-bold font-mono text-cyan-400">{profile.ag}</span>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-neutral-800 bg-neutral-900/40">
          <button
            onClick={() => setActiveTab('PASS')}
            className={`pb-2.5 px-3 text-sm font-bold tracking-wider uppercase transition border-b-2 flex items-center gap-2 ${
              activeTab === 'PASS'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Pass & Objectives</span>
          </button>
          <button
            onClick={() => setActiveTab('ARMORY')}
            className={`pb-2.5 px-3 text-sm font-bold tracking-wider uppercase transition border-b-2 flex items-center gap-2 ${
              activeTab === 'ARMORY'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cosmetics Armory</span>
          </button>
          <button
            onClick={() => setActiveTab('BOOSTS')}
            className={`pb-2.5 px-3 text-sm font-bold tracking-wider uppercase transition border-b-2 flex items-center gap-2 ${
              activeTab === 'BOOSTS'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Tactical Boosters</span>
          </button>

          {purchaseSuccess && (
            <div className="ml-auto text-xs font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded border border-emerald-500/40 animate-fade-in">
              {purchaseSuccess}
            </div>
          )}
        </div>

        {/* Tab 1: Pass & Objectives */}
        {activeTab === 'PASS' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {/* Player Level Card */}
            <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-amber-500 text-black font-extrabold flex flex-col items-center justify-center font-['Chakra_Petch',sans-serif] shadow-lg border-2 border-white">
                  <span className="text-[10px] uppercase tracking-wider font-bold">LVL</span>
                  <span className="text-2xl leading-none">{profile.level}</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white font-['Chakra_Petch',sans-serif]">
                      Player #1
                    </span>
                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-400/40 px-2 py-0.5 rounded font-bold uppercase">
                      {profile.rankTier} TIER
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400 mt-0.5">
                    Equipped Title: <span className="text-amber-300 font-semibold">{profile.equippedCosmetics.title}</span>
                  </span>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="flex-1 max-w-xs w-full flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-neutral-400 uppercase tracking-wider">Level Progress</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {profile.currentXp} / {profile.xpToNextLevel} XP
                  </span>
                </div>
                <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (profile.currentXp / profile.xpToNextLevel) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Daily Objectives Grid */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  <span>Daily Match Objectives</span>
                </h3>
                <span className="text-xs text-neutral-500">Resets daily</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {objectives.map((obj) => (
                  <div
                    key={obj.id}
                    className={`p-3.5 rounded-xl border flex flex-col gap-2 transition ${
                      obj.isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-neutral-900/60 border-neutral-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-neutral-200">{obj.title}</span>
                        <span className="text-xs text-neutral-400">{obj.description}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-400 font-mono">+{obj.rewardXp} XP</span>
                        {obj.isCompleted && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className={`h-full transition-all duration-200 ${
                            obj.isCompleted ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                          style={{ width: `${Math.min(100, (obj.current / obj.target) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {obj.current}/{obj.target}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feats & Achievements */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Combat Feats & Badges</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {feats.map((f) => (
                  <div
                    key={f.id}
                    className={`p-3 rounded-xl border flex items-center gap-3 ${
                      f.unlocked
                        ? 'bg-amber-500/10 border-amber-500/50 text-neutral-200'
                        : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-500 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        f.unlocked
                          ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                          : 'bg-neutral-800 text-neutral-600'
                      }`}
                    >
                      {f.unlocked ? <Trophy className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{f.name}</span>
                      <span className="text-[10px] text-neutral-400 leading-tight">{f.description}</span>
                      <span className="text-[10px] text-amber-400 font-mono mt-0.5">+{f.xpReward} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Armory & Cosmetics */}
        {activeTab === 'ARMORY' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2">
              {['ALL', 'WEAPON', 'OUTFIT', 'PARACHUTE', 'TITLE'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition uppercase tracking-wider border ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-black border-amber-400 shadow'
                      : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Item Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {filteredCosmetics.map((item) => {
                const isUnlocked = profile.unlockedCosmetics.includes(item.id);
                const isEquipped =
                  profile.equippedCosmetics.m416Skin === item.id ||
                  profile.equippedCosmetics.akmSkin === item.id ||
                  profile.equippedCosmetics.awmSkin === item.id ||
                  profile.equippedCosmetics.outfit === item.id ||
                  profile.equippedCosmetics.parachute === item.id ||
                  profile.equippedCosmetics.title === item.name;

                return (
                  <div
                    key={item.id}
                    className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-lg hover:border-neutral-700 transition"
                  >
                    <div className="flex flex-col gap-2">
                      {/* Color Preview & Rarity Banner */}
                      <div
                        className="w-full h-24 rounded-lg flex items-center justify-center relative overflow-hidden border border-white/10"
                        style={{
                          background: `linear-gradient(135deg, ${item.colorPreview}22 0%, ${item.colorPreview}55 100%)`,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-full border-2 border-white shadow-xl"
                          style={{ backgroundColor: item.colorPreview }}
                        />
                        <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white uppercase tracking-wider">
                          {item.rarity}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white font-['Chakra_Petch',sans-serif]">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-neutral-400 mt-0.5">{item.description}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {isEquipped ? (
                        <div className="w-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 py-1.5 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>EQUIPPED</span>
                        </div>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipCosmetic(item.id)}
                          className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                        >
                          <span>EQUIP</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePurchaseCosmetic(item.id)}
                          disabled={profile.bp < (item.costBp || 0)}
                          className={`w-full py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            profile.bp >= (item.costBp || 0)
                              ? 'bg-amber-500 hover:bg-amber-400 text-black'
                              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          <span>UNLOCK FOR {item.costBp} BP</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Tactical Gameplay Boosters */}
        {activeTab === 'BOOSTS' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Consumable Match Boosters</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Active boosters apply temporary combat enhancements during your next battle royale match.
              </p>
            </div>

            {/* Currently Active Boosts */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Currently Primed ({profile.activeBoosts.length})
              </span>
              {profile.activeBoosts.length === 0 ? (
                <div className="text-xs text-neutral-500 italic bg-neutral-900/40 p-3 rounded-lg border border-neutral-800">
                  No boosts currently active. Activate a booster below before dropping into the battlefield.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.activeBoosts.map((b) => (
                    <div
                      key={b.id}
                      className="bg-amber-500/15 border border-amber-400/60 p-3 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{b.name}</span>
                          <span className="text-[10px] text-amber-200/80">{b.description}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-400 font-mono bg-black/40 px-2 py-1 rounded">
                        {b.matchesRemaining} Match Left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Booster Cards Catalog */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {AVAILABLE_BOOSTS.map((boost) => {
                const ownedCount = profile.inventoryBoosts[boost.id] || 0;
                const isPrimed = profile.activeBoosts.some((b) => b.id === boost.id);

                return (
                  <div
                    key={boost.id}
                    className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 flex-shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white font-['Chakra_Petch',sans-serif]">
                          {boost.name}
                        </span>
                        <span className="text-xs text-neutral-400 mt-1">{boost.description}</span>
                        <span className="text-[11px] text-neutral-300 font-semibold mt-1">
                          In Armory Inventory: <span className="text-amber-400 font-mono">{ownedCount} cards</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-800/80">
                      <button
                        onClick={() => handleBuyBoost(boost.id)}
                        disabled={profile.bp < boost.costBp}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                          profile.bp >= boost.costBp
                            ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700'
                            : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                        }`}
                      >
                        Buy 1 Card ({boost.costBp} BP)
                      </button>

                      <button
                        onClick={() => handleActivateBoost(boost.id)}
                        disabled={ownedCount <= 0}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                          ownedCount > 0
                            ? 'bg-amber-500 hover:bg-amber-400 text-black shadow'
                            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        }`}
                      >
                        {isPrimed ? '+1 Match Stack' : 'Activate (1 Match)'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
