import React from 'react';
import { Award, Zap } from 'lucide-react';

export interface XpNotification {
  id: string;
  text: string;
  isFeat?: boolean;
}

interface XpPopupBannerProps {
  notifications: XpNotification[];
}

export const XpPopupBanner: React.FC<XpPopupBannerProps> = ({ notifications }) => {
  if (notifications.length === 0) return null;

  return (
    <div id="xp-notifications-container" className="fixed top-24 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none font-['Rajdhani',sans-serif] select-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md animate-bounce border transition-all ${
            notif.isFeat
              ? 'bg-amber-500/25 border-amber-400 text-amber-200'
              : 'bg-neutral-950/90 border-amber-500/50 text-white'
          }`}
        >
          {notif.isFeat ? (
            <Award className="w-5 h-5 text-amber-400 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-sm font-bold tracking-wider uppercase font-['Chakra_Petch',sans-serif]">
            {notif.text}
          </span>
        </div>
      ))}
    </div>
  );
};
