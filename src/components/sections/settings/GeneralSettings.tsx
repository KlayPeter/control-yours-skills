import type { Dispatch, SetStateAction } from "react";
import type { SaveSettingsInput } from "@shared/contracts";

type TranslationDictionary = Record<string, string>;

export function GeneralSettings({
  t,
  settingsDraft,
  setSettingsDraft
}: {
  t: TranslationDictionary;
  settingsDraft: SaveSettingsInput;
  setSettingsDraft: Dispatch<SetStateAction<SaveSettingsInput>>;
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium app-text" htmlFor="conflict-policy">
          {t.conflictPolicy}
        </label>
        <select
          className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-signal/45"
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
          className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-signal/45"
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
    </>
  );
}
