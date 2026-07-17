import type { Dispatch, SetStateAction } from "react";
import type { SaveSettingsInput } from "@shared/contracts";

export function SnapshotSettings({
  settingsDraft,
  setSettingsDraft
}: {
  settingsDraft: SaveSettingsInput;
  setSettingsDraft: Dispatch<SetStateAction<SaveSettingsInput>>;
}) {
  const updateSnapshotSetting = (key: keyof SaveSettingsInput["snapshots"], value: number) => {
    setSettingsDraft((current) => ({
      ...current,
      snapshots: { ...current.snapshots, [key]: value }
    }));
  };

  return (
    <div className="app-surface-subtle rounded-3xl p-4">
      <p className="text-sm font-medium app-text">版本快照</p>
      <p className="mt-1 text-sm app-text-soft">控制每个技能保留的普通版本数量，以及全部快照可使用的磁盘容量。</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium app-text" htmlFor="snapshot-retention-count">每个技能保留数量</label>
          <input
            className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-signal/45"
            id="snapshot-retention-count"
            max={100}
            min={5}
            onChange={(event) => updateSnapshotSetting("retentionCount", Number(event.target.value))}
            type="number"
            value={settingsDraft.snapshots.retentionCount}
          />
          <p className="mt-2 text-xs app-text-soft">范围 5–100；置顶版本不计入自动清理。</p>
        </div>
        <div>
          <label className="block text-sm font-medium app-text" htmlFor="snapshot-storage-limit">总容量上限（MB）</label>
          <input
            className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-signal/45"
            id="snapshot-storage-limit"
            max={10240}
            min={256}
            onChange={(event) => updateSnapshotSetting("storageLimitMb", Number(event.target.value))}
            type="number"
            value={settingsDraft.snapshots.storageLimitMb}
          />
          <p className="mt-2 text-xs app-text-soft">范围 256–10240 MB；优先清理最旧且未置顶的版本。</p>
        </div>
      </div>
    </div>
  );
}
