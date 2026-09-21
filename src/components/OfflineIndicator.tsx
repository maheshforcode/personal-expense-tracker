import React from 'react';
import { useOnlineStatus } from '../hooks/usePWA';
import { Wifi, WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        isOnline
          ? 'bg-[#171A1F] border-[#282D34] text-[#A8AFB8]'
          : 'bg-[#FEC84B]/10 border-[#FEC84B]/40 text-[#FEC84B]'
      }`}
      title={isOnline ? 'Online - All local operations active' : 'Offline - Changes saved locally to IndexedDB'}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isOnline ? 'bg-[#32D583]' : 'bg-[#FEC84B] animate-pulse'
        }`}
      />
      <span>{isOnline ? 'Online' : 'Offline · Changes saved locally'}</span>
    </div>
  );
};
