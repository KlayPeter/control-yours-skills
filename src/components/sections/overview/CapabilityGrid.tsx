import { HardDriveDownload, FolderOpen, Search, UploadCloud } from "lucide-react";
import type { SkillManagerSnapshot, WorkspaceSkillSource } from "@shared/contracts";
import { CapabilityCard } from "../../ui/cards";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function CapabilityGrid({
  snapshot,
  t,
  installPathConfigured,
  onChooseInstallDir,
  onOpenPath,
  onGoImport,
  onGoStaged,
  onOpenSystemSourceModal,
  onImportProject,
  systemSkillCount,
  detectedSystemSources,
  importedProjectCount,
  importedProjectSkillCount,
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  installPathConfigured: boolean;
  onChooseInstallDir: () => AsyncActionResult;
  onOpenPath: (path: string) => AsyncActionResult;
  onGoImport: () => AsyncActionResult;
  onGoStaged: () => AsyncActionResult;
  onOpenSystemSourceModal: (source: WorkspaceSkillSource) => void;
  onImportProject: () => AsyncActionResult;
  systemSkillCount: number;
  detectedSystemSources: number;
  importedProjectCount: number;
  importedProjectSkillCount: number;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <CapabilityCard
        body={
          installPathConfigured
            ? `${t.capabilityInstallBody} ${snapshot.settings.installDir}`
            : `${t.capabilityInstallBody} ${t.installPathRequiredBody}`
        }
        icon={HardDriveDownload}
        primaryAction={{
          label: t.quickStartChooseInstallDir,
          onClick: onChooseInstallDir
        }}
        secondaryAction={
          installPathConfigured
            ? {
                label: t.openInstallFolder,
                onClick: () => onOpenPath(snapshot.settings.installDir)
              }
            : undefined
        }
        status={installPathConfigured ? t.capabilityStatusConfigured : t.capabilityStatusNeedsSetup}
        title={t.capabilityInstallTitle}
      />
      <CapabilityCard
        body={t.capabilityImportBody}
        icon={UploadCloud}
        primaryAction={{
          label: t.quickStartGoImport,
          onClick: onGoImport
        }}
        secondaryAction={{
          label: t.quickStartGoStaged,
          onClick: onGoStaged,
          disabled: snapshot.stagedSources.length === 0
        }}
        status={`${snapshot.summary.readyCount} ${t.statusReady}`}
        title={t.capabilityImportTitle}
      />
      <CapabilityCard
        body={`${t.capabilitySystemBody} ${systemSkillCount} ${t.skillCount}`}
        icon={FolderOpen}
        primaryAction={
          snapshot.systemSkillSources[0]
            ? {
                label: t.view,
                onClick: () => onOpenSystemSourceModal(snapshot.systemSkillSources[0])
              }
            : undefined
        }
        status={`${detectedSystemSources}/${snapshot.systemSkillSources.length} ${t.providerFound}`}
        title={t.capabilitySystemTitle}
      />
      <CapabilityCard
        body={`${t.capabilityProjectBody} ${importedProjectSkillCount} ${t.skillCount}`}
        icon={Search}
        primaryAction={{
          label: t.importProject,
          onClick: onImportProject
        }}
        secondaryAction={
          importedProjectCount > 0
            ? {
                label: t.openFolder,
                onClick: () => onOpenPath(snapshot.importedProjects[0].path)
              }
            : undefined
        }
        status={`${importedProjectCount} ${t.projectDirectories}`}
        title={t.capabilityProjectTitle}
      />
    </div>
  );
}
