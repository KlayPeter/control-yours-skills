import type { Dispatch, SetStateAction } from "react";
import type { SaveSettingsInput } from "@shared/contracts";

export function AISettings({
  settingsDraft,
  setSettingsDraft
}: {
  settingsDraft: SaveSettingsInput;
  setSettingsDraft: Dispatch<SetStateAction<SaveSettingsInput>>;
}) {
  return (
    <div className="app-surface-subtle rounded-3xl p-4">
      <p className="text-sm font-medium app-text">AI</p>
      <p className="mt-1 text-sm app-text-soft">
        配置用于远程仓库识别和总结的 AI 服务。
      </p>

      <div className="mt-4 grid gap-4">
        <label className="flex items-center gap-3 text-sm app-text">
          <input
            checked={settingsDraft.ai.enabled}
            className="h-4 w-4 rounded border-white/20 bg-black/30 focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none"
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
            className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-signal/45"
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
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div>
          <label className="block text-sm font-medium app-text" htmlFor="ai-base-url">
            接口地址
          </label>
          <input
            className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-signal/45"
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
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div>
          <label className="block text-sm font-medium app-text" htmlFor="ai-model">
            模型
          </label>
          <input
            className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-signal/45"
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
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div>
          <label className="block text-sm font-medium app-text" htmlFor="ai-api-key">
            API Key
          </label>
          <input
            className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-signal/45"
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
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
