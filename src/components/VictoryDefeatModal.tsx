import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Skull, Clock, Target, ArrowRight, Award } from 'lucide-react';
import { PlayerStats } from '../types/game';

interface VictoryDefeatModalProps {
  type: 'VICTORY' | 'DEFEAT';
  stats: PlayerStats;
  rank: number;
  onPlayAgain: () => void;
  onOpenArmory?: () => void;
  earnedXp?: number;
  earnedBp?: number;
}

export const VictoryDefeatModal: React.FC<VictoryDefeatModalProps> = ({
  type,
  stats,
  rank,
  onPlayAgain,
  onOpenArmory,
  earnedXp = 450,
  earnedBp = 250,
}) => {
  useEffect(() => {
    if (type === 'VICTORY') {
      // Golden celebratory confetti burst
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#eab308', '#f59e0b', '#fbbf24', '#ffffff'],
        });
      } catch (e) {}
    }
  }, [type]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div id="endgame-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-4 font-['Rajdhani',sans-serif] select-none">
      <div className="relative w-[540px] max-w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Top Glow Accent */}
        <div
          className={`absolute -top-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-40 ${
            type === 'VICTORY' ? 'bg-amber-500' : 'bg-red-600'
          }`}
        />

        {/* Title Icon */}
        <div className="mb-3 relative">
          {type === 'VICTORY' ? (
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-bounce">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <Skull className="w-10 h-10 text-red-500" />
            </div>
          )}
        </div>

        {/* Header Banner */}
        {type === 'VICTORY' ? (
          <>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 font-['Chakra_Petch',sans-serif] tracking-wider uppercase drop-shadow-md">
              Winner Winner Chicken Dinner!
            </h1>
            <div className="text-amber-400 font-bold text-lg mt-1 tracking-widest uppercase">
              #1 / 100 • CONQUEROR VICTORY
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold text-neutral-100 font-['Chakra_Petch',sans-serif] tracking-wider uppercase">
              Better Luck Next Time!
            </h1>
            <div className="text-red-400 font-bold text-lg mt-1 tracking-widest uppercase">
              Rank #{rank} / 100
            </div>
          </>
        )}

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col items-center">
            <Target className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-xs text-neutral-400 uppercase tracking-wider">Kills</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5">{stats.kills}</span>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col items-center">
            <Award className="w-5 h-5 text-red-400 mb-1" />
            <span className="text-xs text-neutral-400 uppercase tracking-wider">Damage</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5">{stats.damageDealt}</span>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col items-center">
            <Clock className="w-5 h-5 text-blue-400 mb-1" />
            <span className="text-xs text-neutral-400 uppercase tracking-wider">Survived</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5">{formatTime(stats.survivalTime)}</span>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col items-center">
            <Award className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-xs text-neutral-400 uppercase tracking-wider">Tier Rating</span>
            <span className="text-xl font-bold font-mono text-amber-400 mt-0.5">
              {type === 'VICTORY' ? 'SSS+' : stats.kills > 3 ? 'SS' : 'A'}
            </span>
          </div>
        </div>

        {/* Match Rewards Banner */}
        <div className="w-full bg-neutral-900/60 border border-amber-500/30 rounded-xl p-3 mb-5 flex items-center justify-around text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 uppercase font-semibold">Match XP:</span>
            <span className="text-amber-400 font-bold font-mono text-sm">+{earnedXp} XP</span>
          </div>
          <div className="w-[1px] h-4 bg-neutral-800" />
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 uppercase font-semibold">Battle Points:</span>
            <span className="text-amber-400 font-bold font-mono text-sm">+{earnedBp} BP</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center justify-center gap-3">
          {onOpenArmory && (
            <button
              onClick={onOpenArmory}
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold py-3 rounded-xl tracking-wider uppercase text-xs shadow-lg transition"
            >
              Pass & Armory
            </button>
          )}
          <button
            onClick={onPlayAgain}
            className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold py-3 rounded-xl tracking-wider uppercase text-xs shadow-xl flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <span>Play Next Match</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
