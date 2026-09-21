import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWA';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7C5CFC]/15 hover:bg-[#7C5CFC]/25 text-[#7C5CFC] border border-[#7C5CFC]/30 text-xs font-semibold transition"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D2127] hover:bg-[#282D34] text-[#A8AFB8] hover:text-[#F5F7FA] border border-[#282D34] text-xs font-medium transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-xl bg-[#171A1F] border border-[#282D34] p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#F5F7FA]">Install on iPhone / iPad</h4>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-[#737B86] hover:text-[#F5F7FA]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#A8AFB8] leading-relaxed">
                1. Tap the <strong>Share</strong> button in the Safari bottom bar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-[#1D2127] hover:bg-[#282D34] text-xs font-medium text-[#F5F7FA] rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
