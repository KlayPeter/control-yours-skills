"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, RefreshCcw, X, LoaderCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { UpdateInfo, ProgressInfo } from "@shared/contracts";

type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "downloaded" | "error";

export function AutoUpdaterDialog() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // We only show the dialog if it's not idle and not checking (checking can be silent or show a toast, but we'll show it in the dialog for manual checks)
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!window.appUpdater) return;

    const unsubAvailable = window.appUpdater.onUpdateAvailable((info) => {
      setUpdateInfo(info);
      setStatus("available");
      setIsOpen(true);
    });

    const unsubNotAvailable = window.appUpdater.onUpdateNotAvailable(() => {
      // If we were checking manually and the dialog was open, show "Up to date"
      if (status === "checking") {
        setStatus("idle");
        // We could show a toast here, but for now we'll just close it
        setIsOpen(false);
      }
    });

    const unsubProgress = window.appUpdater.onDownloadProgress((info) => {
      setProgressInfo(info);
      setStatus("downloading");
      setIsOpen(true);
    });

    const unsubDownloaded = window.appUpdater.onUpdateDownloaded(() => {
      setStatus("downloaded");
      setIsOpen(true);
    });

    const unsubError = window.appUpdater.onError((err) => {
      setErrorMsg(err);
      setStatus("error");
      setIsOpen(true);
    });

    return () => {
      unsubAvailable();
      unsubNotAvailable();
      unsubProgress();
      unsubDownloaded();
      unsubError();
    };
  }, [status]);

  const handleDownload = () => {
    if (window.appUpdater) {
      window.appUpdater.download();
      setStatus("downloading");
    }
  };

  const handleInstall = () => {
    if (window.appUpdater) {
      window.appUpdater.install();
    }
  };

  // Expose manual check to window so other components can trigger it
  useEffect(() => {
    // @ts-expect-error adding custom property to window
    window.__triggerUpdateCheck = () => {
      setStatus("checking");
      setIsOpen(true);
      window.appUpdater?.check();
    };
  }, []);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-[100] w-full max-w-md translate-x-[-50%] translate-y-[-50%] p-0 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-[20px]">
          <div className="overflow-hidden rounded-[20px] border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl supports-[backdrop-filter]:bg-black/30">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
            
            <div className="relative px-6 py-6">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                  <RefreshCcw className={cn("h-5 w-5 text-blue-400", status === "checking" && "animate-spin")} />
                  Software Update
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50">
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="mt-2 space-y-4">
                {status === "checking" && (
                  <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <LoaderCircle className="h-8 w-8 text-blue-400 animate-spin" />
                    <p className="text-[14px] text-white/70">Checking for updates...</p>
                  </div>
                )}

                {status === "available" && updateInfo && (
                  <div className="space-y-4">
                    <p className="text-[14px] leading-relaxed text-white/80">
                      A new version of Control Your Skills (<span className="text-blue-300 font-medium">{updateInfo.version}</span>) is available!
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                      <Dialog.Close asChild>
                        <button className="px-4 py-2 rounded-lg text-[13px] font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                          Later
                        </button>
                      </Dialog.Close>
                      <button 
                        onClick={handleDownload}
                        className="px-4 py-2 rounded-lg text-[13px] font-medium bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Update
                      </button>
                    </div>
                  </div>
                )}

                {status === "downloading" && progressInfo && (
                  <div className="space-y-3 py-2">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-white/70">Downloading update...</span>
                      <span className="text-blue-300 font-medium">{Math.round(progressInfo.percent)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progressInfo.percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-white/40">
                      <span>{(progressInfo.transferred / 1024 / 1024).toFixed(1)} MB / {(progressInfo.total / 1024 / 1024).toFixed(1)} MB</span>
                      <span>{(progressInfo.bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s</span>
                    </div>
                  </div>
                )}

                {status === "downloaded" && (
                  <div className="space-y-4">
                    <p className="text-[14px] leading-relaxed text-white/80">
                      The update has been downloaded and is ready to install. The application will restart.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                      <Dialog.Close asChild>
                        <button className="px-4 py-2 rounded-lg text-[13px] font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                          Not Now
                        </button>
                      </Dialog.Close>
                      <button 
                        onClick={handleInstall}
                        className="px-4 py-2 rounded-lg text-[13px] font-medium bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Restart & Install
                      </button>
                    </div>
                  </div>
                )}

                {status === "error" && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-red-300 mb-1">Update Failed</p>
                        <p className="text-[12px] text-red-200/70 break-words line-clamp-3" title={errorMsg || ""}>
                          {errorMsg || "An unknown error occurred while updating."}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Dialog.Close asChild>
                        <button className="px-4 py-2 rounded-lg text-[13px] font-medium bg-white/10 hover:bg-white/20 text-white transition-colors">
                          Close
                        </button>
                      </Dialog.Close>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
