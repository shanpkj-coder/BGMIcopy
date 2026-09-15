import React, { useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Radio, Users, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { VoiceChannel, SquadmateVoice } from '../systems/voiceChat';

interface VoiceChatHUDProps {
  channel: VoiceChannel;
  onChangeChannel: (ch: VoiceChannel) => void;
  isSelfMuted: boolean;
  onToggleSelfMute: () => void;
  isDeafened: boolean;
  onToggleDeafen: () => void;
  isPttActive: boolean;
  micLevel: number;
  squadmates: SquadmateVoice[];
  onToggleSquadmateMute: (id: string) => void;
  onSquadmateVolumeChange: (id: string, vol: number) => void;
  proximityAlert: { message: string; distance: number; bearing: number } | null;
  onRequestMicAccess: () => void;
  hasMicPermission: boolean;
}

export const VoiceChatHUD: React.FC<VoiceChatHUDProps> = ({
  channel,
  onChangeChannel,
  isSelfMuted,
  onToggleSelfMute,
  isDeafened,
  onToggleDeafen,
  isPttActive,
  micLevel,
  squadmates,
  onToggleSquadmateMute,
  onSquadmateVolumeChange,
  proximityAlert,
  onRequestMicAccess,
  hasMicPermission,
}) => {
  const [isSquadPanelOpen, setIsSquadPanelOpen] = useState(false);

  return (
    <div id="voice-chat-hud" className="absolute top-16 left-4 z-25 font-['Rajdhani',sans-serif] pointer-events-auto select-none flex flex-col gap-2">
      {/* 1. Tactical Comms Quick Bar */}
      <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800 rounded-lg px-3 py-1.5 flex items-center gap-2.5 shadow-xl text-xs">
        {/* Channel Switcher */}
        <div className="flex items-center gap-1 bg-neutral-900/90 p-0.5 rounded border border-neutral-700/60">
          {(['TEAM', 'ALL', 'MUTE'] as VoiceChannel[]).map((ch) => (
            <button
              key={ch}
              onClick={() => onChangeChannel(ch)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider transition ${
                channel === ch
                  ? ch === 'TEAM'
                    ? 'bg-emerald-500 text-black font-extrabold shadow'
                    : ch === 'ALL'
                    ? 'bg-amber-500 text-black font-extrabold shadow'
                    : 'bg-red-600 text-white font-extrabold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {ch === 'ALL' ? 'PROXIMITY' : ch}
            </button>
          ))}
        </div>

        <div className="w-[1px] h-4 bg-neutral-800" />

        {/* Mic Toggle / Push-To-Talk Indicator */}
        <button
          onClick={onToggleSelfMute}
          className={`p-1.5 rounded transition flex items-center gap-1.5 ${
            isSelfMuted || channel === 'MUTE'
              ? 'bg-red-600/20 text-red-400 border border-red-500/50'
              : isPttActive || micLevel > 0.1
              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400 animate-pulse'
              : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-700'
          }`}
          title={isSelfMuted ? 'Mic Muted (Click to Unmute)' : 'Mic Active (Hold T to Speak)'}
        >
          {isSelfMuted || channel === 'MUTE' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          <span className="text-[10px] font-bold hidden sm:inline">
            {isSelfMuted ? 'MUTED' : isPttActive ? 'TRANSMITTING [T]' : 'PTT (T)'}
          </span>
          {/* Animated Audio Meter Bar */}
          {!isSelfMuted && channel !== 'MUTE' && (
            <div className="w-8 h-2 bg-neutral-800 rounded overflow-hidden p-0.5 hidden sm:flex items-center">
              <div
                className="h-full bg-emerald-400 rounded transition-all duration-75"
                style={{ width: `${Math.min(100, Math.max(15, micLevel * 100))}%` }}
              />
            </div>
          )}
        </button>

        {/* Deafen (Incoming Audio) Toggle */}
        <button
          onClick={onToggleDeafen}
          className={`p-1.5 rounded transition ${
            isDeafened
              ? 'bg-red-600/20 text-red-400 border border-red-500/50'
              : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-700'
          }`}
          title={isDeafened ? 'Audio Deafened (Click to Unmute Squad)' : 'Incoming Voice Active'}
        >
          {isDeafened ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Squad Comms Expand Toggle */}
        <button
          onClick={() => setIsSquadPanelOpen(!isSquadPanelOpen)}
          className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white bg-neutral-900 px-2 py-1 rounded border border-neutral-700"
        >
          <Users className="w-3 h-3 text-amber-400" />
          <span className="font-semibold">Squad ({squadmates.length + 1})</span>
          {isSquadPanelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {!hasMicPermission && (
          <button
            onClick={onRequestMicAccess}
            className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-1 rounded border border-amber-500/50 font-bold flex items-center gap-1"
            title="Enable physical microphone"
          >
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Enable Mic</span>
          </button>
        )}
      </div>

      {/* 2. Proximity Voice Chatter Alert */}
      {proximityAlert && (
        <div className="bg-amber-500/20 border border-amber-400/80 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-amber-300 shadow-xl animate-pulse">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              {proximityAlert.message}
            </span>
            <span className="text-[10px] text-amber-200/90 font-mono">
              Distance: {proximityAlert.distance}m • Bearing: {proximityAlert.bearing}°
            </span>
          </div>
        </div>
      )}

      {/* 3. Squad Comms Dropdown Panel */}
      {isSquadPanelOpen && (
        <div className="bg-neutral-950/95 border border-neutral-800 rounded-xl p-3 shadow-2xl flex flex-col gap-2 w-72 backdrop-blur-lg">
          <div className="flex justify-between items-center pb-1.5 border-b border-neutral-800 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            <span>Tactical Squad Channel</span>
            <span className="text-emerald-400 font-mono">FREQ 142.85 MHz</span>
          </div>

          {/* You */}
          <div className="flex items-center justify-between bg-neutral-900/60 p-2 rounded-lg border border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-neutral-100">#1 You (Lead)</span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {isSelfMuted ? 'Muted' : isPttActive ? 'Speaking...' : 'Ready (PTT)'}
                </span>
              </div>
            </div>
            <button
              onClick={onToggleSelfMute}
              className={`p-1 rounded ${isSelfMuted ? 'text-red-400' : 'text-emerald-400'}`}
            >
              {isSelfMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Squadmates */}
          {squadmates.map((m, idx) => (
            <div
              key={m.id}
              className={`flex flex-col gap-1 p-2 rounded-lg border transition ${
                m.isTalking
                  ? 'bg-emerald-950/30 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-neutral-900/40 border-neutral-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      m.isTalking ? 'bg-emerald-400 animate-ping' : 'bg-neutral-600'
                    }`}
                  />
                  <span className="text-xs font-bold text-neutral-200">
                    #{idx + 2} {m.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleSquadmateMute(m.id)}
                    className={`p-1 rounded hover:bg-neutral-800 transition ${
                      m.isMuted ? 'text-red-400' : 'text-neutral-400 hover:text-white'
                    }`}
                    title={m.isMuted ? 'Unmute squadmate' : 'Mute squadmate'}
                  >
                    {m.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-[9px] text-neutral-500">Vol</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={m.isMuted ? 0 : m.volume}
                  disabled={m.isMuted}
                  onChange={(e) => onSquadmateVolumeChange(m.id, parseFloat(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded accent-emerald-400 cursor-pointer"
                />
                <span className="text-[9px] text-neutral-400 font-mono w-6 text-right">
                  {Math.round(m.volume * 100)}%
                </span>
              </div>

              {/* Last voice callout */}
              {m.lastCallout && (
                <div className="text-[10px] text-emerald-300/80 italic pl-3 border-l border-emerald-500/40 mt-0.5">
                  "{m.lastCallout}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
