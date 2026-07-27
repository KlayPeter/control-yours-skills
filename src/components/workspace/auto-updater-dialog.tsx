"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, CheckCircle2, Download, LoaderCircle, RefreshCcw, X } from "lucide-react";

import { cn } from "@/lib/cn";
import type { TranslationDictionary } from "@/locales/translations";
import type { AppUpdaterRuntimeInfo, ProgressInfo, UpdateInfo } from "@shared/contracts";

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "up-to-date"
  | "downloading"
  | "downloaded"
  | "error";

export function AutoUpdaterDialog({
  checkRequest,
  t
}: {
  checkRequest: number;
  t: TranslationDictionary;
}) {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [runtimeInfo, setRuntimeInfo] = useState<AppUpdaterRuntimeInfo | null>(null);
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const manualCheckRef = useRef(false);
  const showErrorsRef = useRef(false);
  const handledCheckRequestRef = useRef(0);

  const showError = useCallback((message: string) => {
    manualCheckRef.current = false;
    showErrorsRef.current = false;
    setErrorMessage(message);
    setStatus("error");
    setIsOpen(true);
  }, []);

  const startManualCheck = useCallback(async () => {
    setUpdateInfo(null);
    setProgressInfo(null);
    setErrorMessage(null);
    setStatus("checking");
    setIsOpen(true);
    manualCheckRef.current = true;
    showErrorsRef.current = true;

    if (!window.appUpdater) {
      showError(t.updateDesktopOnly);
      return;
    }

    try {
      const info = await window.appUpdater.getRuntimeInfo();
      setRuntimeInfo(info);

      if (!info.supported) {
        showError(t.updatePackagedOnly);
        return;
      }

      window.appUpdater.check();
    } catch (error) {
      showError(error instanceof Error ? error.message : t.updateUnknownError);
    }
  }, [showError, t.updateDesktopOnly, t.updatePackagedOnly, t.updateUnknownError]);

  useEffect(() => {
    const api = window.appUpdater;
    if (!api) {
      return;
    }

    let active = true;
    void api
      .getRuntimeInfo()
      .then((info) => {
        if (active) {
          setRuntimeInfo(info);
        }
      })
      .catch(() => {
        // A manual check will surface a user-facing error if runtime discovery fails.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const api = window.appUpdater;
    if (!api) {
      return;
    }

    const unsubscribeAvailable = api.onUpdateAvailable((info) => {
      manualCheckRef.current = false;
      showErrorsRef.current = false;
      setUpdateInfo(info);
      setStatus("available");
      setIsOpen(true);
    });

    const unsubscribeNotAvailable = api.onUpdateNotAvailable(() => {
      if (manualCheckRef.current) {
        setStatus("up-to-date");
        setIsOpen(true);
      } else {
        setStatus("idle");
      }
      manualCheckRef.current = false;
      showErrorsRef.current = false;
    });

    const unsubscribeProgress = api.onDownloadProgress((info) => {
      setProgressInfo(info);
      setStatus("downloading");
      setIsOpen(true);
    });

    const unsubscribeDownloaded = api.onUpdateDownloaded(() => {
      showErrorsRef.current = false;
      setStatus("downloaded");
      setIsOpen(true);
    });

    const unsubscribeError = api.onError((message) => {
      if (showErrorsRef.current) {
        showError(message);
      }
    });

    return () => {
      unsubscribeAvailable();
      unsubscribeNotAvailable();
      unsubscribeProgress();
      unsubscribeDownloaded();
      unsubscribeError();
    };
  }, [showError]);

  useEffect(() => {
    if (
      checkRequest <= 0 ||
      handledCheckRequestRef.current === checkRequest
    ) {
      return;
    }

    handledCheckRequestRef.current = checkRequest;
    void startManualCheck();
  }, [checkRequest, startManualCheck]);

  const handleDownload = () => {
    if (!window.appUpdater) {
      showError(t.updateDesktopOnly);
      return;
    }

    showErrorsRef.current = true;
    setProgressInfo(null);
    setStatus("downloading");
    window.appUpdater.download();
  };

  const handleInstall = () => {
    if (!window.appUpdater) {
      showError(t.updateDesktopOnly);
      return;
    }

    showErrorsRef.current = true;
    window.appUpdater.install();
  };

  const progressPercent = Math.round(progressInfo?.percent ?? 0);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-[100] w-full max-w-md translate-x-[-50%] translate-y-[-50%] p-0 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-[20px]">
          <div className="overflow-hidden rounded-[20px] border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl supports-[backdrop-filter]:bg-black/30">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent" />

            <div className="relative px-6 py-6">
              <div className="mb-4 flex items-center justify-between">
                <Dialog.Title className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
                  <RefreshCcw
                    className={cn(
                      "h-5 w-5 text-blue-400",
                      status === "checking" && "animate-spin"
                    )}
                  />
                  {t.updateDialogTitle}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    aria-label={t.updateClose}
                    className="rounded-full p-1.5 text-white/50 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500/50"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="mt-2 space-y-4">
                {status === "checking" ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-6">
                    <LoaderCircle className="h-8 w-8 animate-spin text-blue-400" />
                    <p className="text-[14px] text-white/70">{t.updateChecking}</p>
                  </div>
                ) : null}

                {status === "available" && updateInfo ? (
                  <div className="space-y-4">
                    <p className="text-[14px] leading-relaxed text-white/80">
                      {t.updateAvailable}{" "}
                      <span className="font-medium text-blue-300">{updateInfo.version}</span>
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                      <Dialog.Close asChild>
                        <button
                          className="rounded-lg px-4 py-2 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                          type="button"
                        >
                          {t.updateLater}
                        </button>
                      </Dialog.Close>
                      <button
                        className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-[13px] font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600"
                        onClick={handleDownload}
                        type="button"
                      >
                        <Download className="h-4 w-4" />
                        {t.updateDownload}
                      </button>
                    </div>
                  </div>
                ) : null}

                {status === "up-to-date" ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                      <div>
                        <p className="text-[13px] font-medium text-emerald-300">
                          {t.updateUpToDateTitle}
                        </p>
                        <p className="mt-1 text-[12px] text-emerald-100/70">
                          {t.updateUpToDateBody}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Dialog.Close asChild>
                        <button
                          className="rounded-lg bg-white/10 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/20"
                          type="button"
                        >
                          {t.updateClose}
                        </button>
                      </Dialog.Close>
                    </div>
                  </div>
                ) : null}

                {status === "downloading" ? (
                  <div className="space-y-3 py-2">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-white/70">
                        {progressInfo ? t.updateDownloading : t.updatePreparingDownload}
                      </span>
                      {progressInfo ? (
                        <span className="font-medium text-blue-300">{progressPercent}%</span>
                      ) : (
                        <LoaderCircle className="h-4 w-4 animate-spin text-blue-300" />
                      )}
                    </div>
                    <div
                      aria-label={t.updateDownloading}
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={progressPercent}
                      className="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-black/50"
                      role="progressbar"
                    >
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {progressInfo ? (
                      <div className="flex items-center justify-between text-[11px] text-white/40">
                        <span>
                          {(progressInfo.transferred / 1024 / 1024).toFixed(1)} MB /{" "}
                          {(progressInfo.total / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <span>
                          {(progressInfo.bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {status === "downloaded" ? (
                  <div className="space-y-4">
                    <p className="text-[14px] leading-relaxed text-white/80">
                      {t.updateDownloadedBody}
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                      <Dialog.Close asChild>
                        <button
                          className="rounded-lg px-4 py-2 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                          type="button"
                        >
                          {t.updateNotNow}
                        </button>
                      </Dialog.Close>
                      <button
                        className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-[13px] font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600"
                        onClick={handleInstall}
                        type="button"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        {t.updateRestartInstall}
                      </button>
                    </div>
                  </div>
                ) : null}

                {status === "error" ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                      <div className="min-w-0">
                        <p className="mb-1 text-[13px] font-medium text-red-300">
                          {t.updateFailedTitle}
                        </p>
                        <p
                          className="line-clamp-3 break-words text-[12px] text-red-200/70"
                          title={errorMessage || ""}
                        >
                          {errorMessage || t.updateUnknownError}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Dialog.Close asChild>
                        <button
                          className="rounded-lg px-4 py-2 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                          type="button"
                        >
                          {t.updateClose}
                        </button>
                      </Dialog.Close>
                      <button
                        className="rounded-lg bg-white/10 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/20"
                        onClick={() => void startManualCheck()}
                        type="button"
                      >
                        {t.updateRetry}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {runtimeInfo ? (
                <p className="mt-5 border-t border-white/10 pt-3 text-[11px] text-white/40">
                  {t.updateCurrentVersion} {runtimeInfo.currentVersion}
                </p>
              ) : null}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
