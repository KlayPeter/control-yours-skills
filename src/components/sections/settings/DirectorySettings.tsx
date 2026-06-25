import type { Dispatch, SetStateAction } from "react";
import type { SaveSettingsInput, SkillManagerSnapshot } from "@shared/contracts";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function DirectorySettings({
  snapshot,
  t,
  settingsDraft,
  setSettingsDraft,
  onPickInstallDir,
  onValidateInstallDir,
  onPickTempDir,
  onValidateTempDir,
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  settingsDraft: SaveSettingsInput;
  setSettingsDraft: Dispatch<SetStateAction<SaveSettingsInput>>;
  onPickInstallDir: () => AsyncActionResult;
  onValidateInstallDir: () => AsyncActionResult;
  onPickTempDir: () => AsyncActionResult;
  onValidateTempDir: () => AsyncActionResult;
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium app-text" htmlFor="install-dir">
          {t.defaultInstallDirectory}
        </label>
        <div className="mt-2 flex flex-col gap-2 xl:flex-row">
          <input
            className="app-input h-10 flex-1 rounded-2xl px-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-signal/45"
            id="install-dir"
            onChange={(event) =>
              setSettingsDraft((current) => ({
                ...current,
                installDir: event.target.value
              }))
            }
            placeholder={t.installDirPlaceholder}
            value={settingsDraft.installDir}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className="app-button rounded-2xl px-4 py-2 focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none"
            onClick={() => void onPickInstallDir()}
            type="button"
          >
            {t.choose}
          </button>
          <button
            className="app-button rounded-2xl px-4 py-2 focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none"
            onClick={() => void onValidateInstallDir()}
            type="button"
          >
            {t.validate}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium app-text" htmlFor="temp-dir">
          {t.tempDirectory}
        </label>
        <div className="mt-2 flex flex-col gap-2 xl:flex-row">
          <input
            className="app-input h-10 flex-1 rounded-2xl px-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-signal/45"
            id="temp-dir"
            onChange={(event) =>
              setSettingsDraft((current) => ({
                ...current,
                tempDir: event.target.value
              }))
            }
            placeholder={`${t.tempDirPlaceholderPrefix} (${snapshot.runtime.dataRoot || "data"})`}
            value={settingsDraft.tempDir}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className="app-button rounded-2xl px-4 py-2 focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none"
            onClick={() => void onPickTempDir()}
            type="button"
          >
            {t.choose}
          </button>
          <button
            className="app-button rounded-2xl px-4 py-2 focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none"
            onClick={() => void onValidateTempDir()}
            type="button"
          >
            {t.validate}
          </button>
        </div>
      </div>
    </>
  );
}
