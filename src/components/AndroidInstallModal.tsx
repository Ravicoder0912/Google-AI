import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Download,
  X,
  CheckCircle2,
  Share2,
  Sparkles,
  ExternalLink,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess?: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<"install" | "download" | "qr">("install");

  useEffect(() => {
    // Check if already running in standalone mode (installed as PWA)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
  }, []);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleTriggerPWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        if (onInstallSuccess) onInstallSuccess();
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div
      id="android-install-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  Install on Android Phone
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Run as a native fullscreen app with fast loading
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("install")}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "install"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Install on Android</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("qr")}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "qr"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan to Phone</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("download")}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "download"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download Source</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {activeTab === "install" && (
            <div className="space-y-4">
              {/* App Identity Banner */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80">
                <img
                  src="/icon.svg"
                  alt="App Icon"
                  className="w-12 h-12 rounded-xl shadow-xs shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-indigo-950">
                    The Tiebreaker
                  </h4>
                  <p className="text-xs text-indigo-700">
                    Official Progressive Web Application for Android
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-indigo-800">
                    <span className="flex items-center gap-0.5">
                      <Zap className="w-3 h-3 text-amber-500" /> Fast
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Offline Shell
                    </span>
                  </div>
                </div>
              </div>

              {/* 1-Click Install Button if supported */}
              {deferredPrompt ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleTriggerPWAInstall}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install "The Tiebreaker" to Android Home Screen</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-500">
                    Will add a native icon to your app drawer and home screen.
                  </p>
                </div>
              ) : isInstalled ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Already running as an installed Android app!</span>
                </div>
              ) : null}

              {/* 3 Step Android Chrome Guide */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  How to Install on Android in 3 Steps:
                </h4>
                <ol className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>
                      Open this URL in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your Android phone.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span>
                      Tap the <strong>three dots (⋮) menu</strong> in the top right corner of the browser.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span>
                      Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </span>
                  </li>
                </ol>
              </div>

              {/* Quick Copy Link */}
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 truncate select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  {copiedUrl ? "Copied!" : "Copy URL"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "qr" && (
            <div className="text-center space-y-4 py-2">
              <div className="inline-block p-4 bg-white rounded-2xl border-2 border-indigo-100 shadow-md">
                {/* Clean QR code rendered using SVG */}
                <div className="w-48 h-48 mx-auto flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      currentUrl
                    )}&color=1e1b4b&bgcolor=f8fafc`}
                    alt="Scan QR code with Android phone"
                    className="w-full h-full object-contain rounded-lg"
                    loading="lazy"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Scan with your Android Camera
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Open your phone's camera app, point it at this QR code, and tap the link to load and install the app.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedUrl ? "Link Copied to Clipboard!" : "Copy App Link to Share"}</span>
              </button>
            </div>
          )}

          {activeTab === "download" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Download Full Project Code</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You can export and download the complete React & TypeScript source code repository directly from Google AI Studio:
                </p>
                <ol className="space-y-1.5 text-xs text-slate-700 list-decimal list-inside pt-1">
                  <li>Click the <strong>Settings (⚙️)</strong> menu in the top right of Google AI Studio.</li>
                  <li>Select <strong>"Export to ZIP"</strong> or <strong>"Export to GitHub"</strong>.</li>
                  <li>Extract the files or build an Android APK using Capacitor / Bubblewrap / Cordova if you wish to publish to Google Play Store.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Turn into Native Google Play APK/AAB</span>
                </h5>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  Because this app has a standard <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[11px]">manifest.json</code> and Service Worker, you can easily wrap it using Google's official <strong>PWABuilder</strong> (pwabuilder.com) or <strong>Bubblewrap CLI</strong> to generate a signed Android APK in under 2 minutes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            Android & Mobile Optimized
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
