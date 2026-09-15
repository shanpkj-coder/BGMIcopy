import React, { useRef, useState, useEffect } from 'react';
import { Crosshair, RefreshCw, Car } from 'lucide-react';
import { Stance } from '../types/game';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onLook: (dx: number, dy: number) => void;
  onFireStart: () => void;
  onFireEnd: () => void;
  onAimToggle: () => void;
  isAiming: boolean;
  onJump: () => void;
  onStanceChange: (s: Stance) => void;
  currentStance: Stance;
  onReload: () => void;
  onInteract: () => void;
  nearVehicle: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onLook,
  onFireStart,
  onFireEnd,
  onAimToggle,
  isAiming,
  onJump,
  onStanceChange,
  currentStance,
  onReload,
  onInteract,
  nearVehicle,
}) => {
  // Joystick State
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  // Look touch tracking
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setJoystickActive(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!joystickActive) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setJoystickActive(false);
        setStickPos({ x: 0, y: 0 });
        onMove(0, 0);
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = rect.width / 2;

    const clampedDist = Math.min(distance, maxRadius);
    const angle = Math.atan2(dy, dx);

    const nx = (Math.cos(angle) * clampedDist) / maxRadius;
    const ny = (Math.sin(angle) * clampedDist) / maxRadius;

    setStickPos({
      x: Math.cos(angle) * clampedDist,
      y: Math.sin(angle) * clampedDist,
    });

    onMove(nx, ny);
  };

  // Right Screen Look Touch Zone
  const handleLookTouchStart = (e: React.TouchEvent) => {
    // Only capture if not on a button
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    lastLookPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookTouchMove = (e: React.TouchEvent) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const dx = touch.clientX - lastLookPos.current.x;
        const dy = touch.clientY - lastLookPos.current.y;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
        onLook(dx, dy);
        break;
      }
    }
  };

  const handleLookTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        break;
      }
    }
  };

  return (
    <div
      id="mobile-touch-layer"
      className="absolute inset-0 pointer-events-auto z-15 select-none touch-none"
      onTouchStart={handleLookTouchStart}
      onTouchMove={handleLookTouchMove}
      onTouchEnd={handleLookTouchEnd}
    >
      {/* 1. Left Virtual Joystick */}
      <div
        ref={joystickBaseRef}
        onTouchStart={handleJoystickTouchStart}
        onTouchMove={handleJoystickTouchMove}
        onTouchEnd={handleJoystickTouchEnd}
        className="absolute bottom-16 left-12 w-32 h-32 rounded-full border-2 border-white/20 bg-black/30 backdrop-blur-sm flex items-center justify-center pointer-events-auto touch-none shadow-2xl"
      >
        <div
          className="w-12 h-12 rounded-full bg-amber-400/80 border-2 border-white/60 shadow-lg pointer-events-none transition-transform duration-75"
          style={{
            transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
          }}
        />
        {/* Sprint Lock Ring Notch */}
        <div className="absolute -top-3 w-6 h-3 bg-amber-500/40 rounded-t-full flex items-center justify-center text-[8px] font-bold text-white">
          ▲
        </div>
      </div>

      {/* 2. Left Fire Button (Iconic PUBG/BGMI feature for two-thumb claw play) */}
      <button
        onTouchStart={(e) => {
          e.stopPropagation();
          onFireStart();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          onFireEnd();
        }}
        className="absolute bottom-52 left-10 w-16 h-16 rounded-full bg-red-600/70 active:bg-red-500 border-2 border-white/40 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
      >
        <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center text-white font-bold text-xs">
          FIRE
        </div>
      </button>

      {/* 3. Right Action Controls Grid (Fire, ADS, Jump, Crouch, Prone, Reload) */}
      <div className="absolute bottom-16 right-8 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Drive/Interact Button */}
        {nearVehicle && (
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onInteract();
            }}
            className="w-16 h-16 rounded-full bg-amber-500 text-black font-extrabold flex flex-col items-center justify-center shadow-2xl border-2 border-white active:scale-90 transition mb-2"
          >
            <Car className="w-6 h-6" />
            <span className="text-[9px] uppercase tracking-wider font-bold">DRIVE</span>
          </button>
        )}

        <div className="flex items-center gap-3">
          {/* Reload Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onReload();
            }}
            className="w-12 h-12 rounded-full bg-neutral-900/80 active:bg-neutral-800 text-white border border-neutral-600 flex items-center justify-center shadow-lg active:scale-95"
          >
            <RefreshCw className="w-5 h-5 text-amber-400" />
          </button>

          {/* ADS Scope Toggle Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onAimToggle();
            }}
            className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 shadow-2xl active:scale-95 transition-all ${
              isAiming
                ? 'bg-amber-500 border-white text-black'
                : 'bg-black/60 border-amber-400/80 text-amber-400'
            }`}
          >
            <Crosshair className="w-7 h-7" />
            <span className="text-[9px] font-extrabold tracking-wider">SCOPE</span>
          </button>

          {/* Main Right Fire Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onFireStart();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onFireEnd();
            }}
            className="w-20 h-20 rounded-full bg-red-600/80 active:bg-red-500 border-2 border-white flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-full border-2 border-white/80 flex items-center justify-center text-white font-extrabold text-sm">
              FIRE
            </div>
          </button>
        </div>

        {/* Stances: Jump, Crouch, Prone */}
        <div className="flex items-center gap-2 mt-1">
          {/* Prone */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onStanceChange(currentStance === 'PRONE' ? 'STAND' : 'PRONE');
            }}
            className={`w-11 h-11 rounded-full border text-[10px] font-bold shadow-md flex items-center justify-center ${
              currentStance === 'PRONE'
                ? 'bg-amber-400 text-black border-white'
                : 'bg-black/60 text-neutral-300 border-neutral-700'
            }`}
          >
            PRONE
          </button>

          {/* Crouch */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onStanceChange(currentStance === 'CROUCH' ? 'STAND' : 'CROUCH');
            }}
            className={`w-11 h-11 rounded-full border text-[10px] font-bold shadow-md flex items-center justify-center ${
              currentStance === 'CROUCH'
                ? 'bg-amber-400 text-black border-white'
                : 'bg-black/60 text-neutral-300 border-neutral-700'
            }`}
          >
            CROUCH
          </button>

          {/* Jump */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onJump();
            }}
            className="w-12 h-12 rounded-full bg-amber-500/90 active:bg-amber-400 text-black font-extrabold border-2 border-white shadow-xl flex items-center justify-center active:scale-90"
          >
            JUMP
          </button>
        </div>
      </div>
    </div>
  );
};
