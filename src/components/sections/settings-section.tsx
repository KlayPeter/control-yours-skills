import type { Dispatch, SetStateAction } from "react";
import { SunMoon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SaveSettingsInput, SkillManagerSnapshot } from "@shared/contracts";
import { SectionCard } from "../ui/cards";

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
          <div>
            <label className="block text-sm font-medium app-text" htmlFor="install-dir">
              {t.defaultInstallDirectory}
            </label>
            <div className="mt-2 flex flex-col gap-2 xl:flex-row">
              <input
                className="app-input h-10 flex-1 rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                id="install-dir"
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    installDir: event.target.value
                  }))
                }
                placeholder={t.installDirPlaceholder}
                value={settingsDraft.installDir}
              />
              <button
                className="app-button rounded-2xl px-4 py-2"
                onClick={() => void onPickInstallDir()}
                type="button"
              >
                {t.choose}
              </button>
              <button
                className="app-button rounded-2xl px-4 py-2"
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
                className="app-input h-10 flex-1 rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                id="temp-dir"
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    tempDir: event.target.value
                  }))
                }
                placeholder={`${t.tempDirPlaceholderPrefix} (${snapshot.runtime.dataRoot || "data"})`}
                value={settingsDraft.tempDir}
              />
              <button
                className="app-button rounded-2xl px-4 py-2"
                onClick={() => void onPickTempDir()}
                type="button"
              >
                {t.choose}
              </button>
              <button
                className="app-button rounded-2xl px-4 py-2"
                onClick={() => void onValidateTempDir()}
                type="button"
              >
                {t.validate}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium app-text">技能分类</label>
            <div className="mt-2 flex flex-col gap-2 xl:flex-row">
              <input
                className="app-input h-10 flex-1 rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                onChange={(event) => onNewCategoryNameChange(event.target.value)}
                placeholder="例如 video"
                value={newCategoryName}
              />
              <button
                className="app-button rounded-2xl px-4 py-2"
                onClick={() => void onCreateCategory()}
                type="button"
              >
                创建分类
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {settingsDraft.skillCategories.length ? (
                settingsDraft.skillCategories.map((category) => (
                  <button
                    key={category}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition",
                      settingsDraft.defaultSkillCategory === category
                        ? "border-signal/40 bg-signal/15 text-signal"
                        : "app-surface-subtle app-text-soft"
                    )}
                    onClick={() =>
                      setSettingsDraft((current) => ({
                        ...current,
                        defaultSkillCategory: category
                      }))
                    }
                    type="button"
                  >
                    {category}
                  </button>
                ))
              ) : (
                <p className="text-sm app-text-soft">还没有分类，创建后就可以把 skill 放到对应目录。</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium app-text">主题</label>
            <div className="mt-2 flex items-center gap-2">
              <button
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-2xl border px-4 text-sm transition",
                  settingsDraft.theme === "light"
                    ? "border-transparent shadow-md"
                    : "app-surface-subtle app-text-soft hover:bg-black/5"
                )}
                style={
                  settingsDraft.theme === "light"
                    ? { background: "var(--app-text)", color: "var(--app-bg-start)" }
                    : undefined
                }
                onClick={() => setSettingsDraft((current) => ({ ...current, theme: "light" }))}
                type="button"
              >
                <SunMoon className="h-4 w-4" />
                浅色
              </button>
              <button
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-2xl border px-4 text-sm transition",
                  settingsDraft.theme === "dark"
                    ? "border-transparent shadow-md"
                    : "app-surface-subtle app-text-soft hover:bg-black/5"
                )}
                style={
                  settingsDraft.theme === "dark"
                    ? { background: "var(--app-text)", color: "var(--app-bg-start)" }
                    : undefined
                }
                onClick={() => setSettingsDraft((current) => ({ ...current, theme: "dark" }))}
                type="button"
              >
                <SunMoon className="h-4 w-4" />
                深色
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium app-text" htmlFor="conflict-policy">
              {t.conflictPolicy}
            </label>
            <select
              className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none focus:border-signal/45"
              id="conflict-policy"
              onChange={(event) =>
                setSettingsDraft((current) => ({
                  ...current,
                  conflictPolicy: event.target.value as SaveSettingsInput["conflictPolicy"]
                }))
              }
              value={settingsDraft.conflictPolicy}
            >
              <option value="rename">{t.conflictRename}</option>
              <option value="skip">{t.conflictSkip}</option>
              <option value="overwrite">{t.conflictOverwrite}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium app-text" htmlFor="locale">
              {t.interfaceLanguage}
            </label>
            <select
              className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none focus:border-signal/45"
              id="locale"
              onChange={(event) =>
                setSettingsDraft((current) => ({
                  ...current,
                  locale: event.target.value as SaveSettingsInput["locale"]
                }))
              }
              value={settingsDraft.locale}
            >
              <option value="zh-CN">{t.languageChinese}</option>
              <option value="en">{t.languageEnglish}</option>
            </select>
          </div>

          <div className="app-surface-subtle rounded-3xl p-4">
            <p className="text-sm font-medium app-text">AI</p>
            <p className="mt-1 text-sm app-text-soft">
              配置用于远程仓库识别和总结的 AI 服务。
            </p>

            <div className="mt-4 grid gap-4">
              <label className="flex items-center gap-3 text-sm app-text">
                <input
                  checked={settingsDraft.ai.enabled}
                  className="h-4 w-4 rounded border-white/20 bg-black/30"
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      ai: {
                        ...current.ai,
                        enabled: event.target.checked
                      }
                    }))
                  }
                  type="checkbox"
                />
                启用 AI 识别
              </label>

              <div>
                <label className="block text-sm font-medium app-text" htmlFor="ai-provider">
                  提供方
                </label>
                <input
                  className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                  id="ai-provider"
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      ai: {
                        ...current.ai,
                        provider: event.target.value as SaveSettingsInput["ai"]["provider"]
                      }
                    }))
                  }
                  value={settingsDraft.ai.provider}
                />
              </div>

              <div>
                <label className="block text-sm font-medium app-text" htmlFor="ai-base-url">
                  接口地址
                </label>
                <input
                  className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                  id="ai-base-url"
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      ai: {
                        ...current.ai,
                        baseUrl: event.target.value
                      }
                    }))
                  }
                  value={settingsDraft.ai.baseUrl}
                />
              </div>

              <div>
                <label className="block text-sm font-medium app-text" htmlFor="ai-model">
                  模型
                </label>
                <input
                  className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                  id="ai-model"
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      ai: {
                        ...current.ai,
                        model: event.target.value
                      }
                    }))
                  }
                  value={settingsDraft.ai.model}
                />
              </div>

              <div>
                <label className="block text-sm font-medium app-text" htmlFor="ai-api-key">
                  API Key
                </label>
                <input
                  className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                  id="ai-api-key"
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      ai: {
                        ...current.ai,
                        apiKey: event.target.value
                      }
                    }))
                  }
                  type="password"
                  value={settingsDraft.ai.apiKey}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
              <button
                className="app-button-primary px-5"
                onClick={() => void onSaveSettings()}
                type="button"
              >
                {t.saveSettings}
              </button>
              <button
                className="app-button px-5"
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
