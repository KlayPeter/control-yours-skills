import type { Dispatch, SetStateAction } from "react";
import type { SaveSettingsInput, SkillManagerSnapshot } from "@shared/contracts";
import { SectionCard } from "../ui/cards";

import { DirectorySettings } from "./settings/DirectorySettings";
import { CategorySettings } from "./settings/CategorySettings";
import { ThemeSettings } from "./settings/ThemeSettings";
import { GeneralSettings } from "./settings/GeneralSettings";
import { AISettings } from "./settings/AISettings";
import { SnapshotSettings } from "./settings/SnapshotSettings";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function SettingsSection({
  snapshot,
  t,
  settingsDraft,
  setSettingsDraft,
  onPickInstallDir,
  onValidateInstallDir,
  onPickTempDir,
  onValidateTempDir,
  onSaveSettings,
  onOpenPath,
  onCreateCategory,
  newCategoryName,
  onNewCategoryNameChange
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  settingsDraft: SaveSettingsInput;
  setSettingsDraft: Dispatch<SetStateAction<SaveSettingsInput>>;
  onPickInstallDir: () => AsyncActionResult;
  onValidateInstallDir: () => AsyncActionResult;
  onPickTempDir: () => AsyncActionResult;
  onValidateTempDir: () => AsyncActionResult;
  onSaveSettings: () => AsyncActionResult;
  onOpenPath: (path: string) => AsyncActionResult;
  onCreateCategory: () => AsyncActionResult;
  newCategoryName: string;
  onNewCategoryNameChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionCard title={t.settingsTitle} subtitle={t.settingsSubtitle}>
        <div className="app-surface space-y-4 rounded-3xl p-4">
          <DirectorySettings
            snapshot={snapshot}
            t={t}
            settingsDraft={settingsDraft}
            setSettingsDraft={setSettingsDraft}
            onPickInstallDir={onPickInstallDir}
            onValidateInstallDir={onValidateInstallDir}
            onPickTempDir={onPickTempDir}
            onValidateTempDir={onValidateTempDir}
          />
          
          <CategorySettings
            settingsDraft={settingsDraft}
            setSettingsDraft={setSettingsDraft}
            onCreateCategory={onCreateCategory}
            newCategoryName={newCategoryName}
            onNewCategoryNameChange={onNewCategoryNameChange}
          />
          
          <ThemeSettings
            settingsDraft={settingsDraft}
            setSettingsDraft={setSettingsDraft}
          />
          
          <GeneralSettings
            t={t}
            settingsDraft={settingsDraft}
            setSettingsDraft={setSettingsDraft}
          />
          
          <AISettings
            settingsDraft={settingsDraft}
            setSettingsDraft={setSettingsDraft}
          />

          <SnapshotSettings
            settingsDraft={settingsDraft}
            setSettingsDraft={setSettingsDraft}
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="app-button-primary px-5 focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none"
              onClick={() => void onSaveSettings()}
              type="button"
            >
              {t.saveSettings}
            </button>
            <button
              className="app-button px-5 focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none"
              onClick={() => void onOpenPath(settingsDraft.installDir)}
              type="button"
            >
              {t.openInstallFolder}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
