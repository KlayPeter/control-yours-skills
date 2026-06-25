const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/workspace-app.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace both WorkspacePrimarySection blocks
const startTag = '<WorkspacePrimarySection';
const endTag = '/>';

let startIdx = content.indexOf(startTag);
while(startIdx !== -1) {
    let endIdx = content.indexOf(endTag, startIdx);
    if (endIdx === -1) break;
    
    // We rebuild the props cleanly without duplicates
    const cleanProps = `<WorkspacePrimarySection
                  dropzone={dropzone}
                  installPathConfigured={installPathConfigured}
                  installedSkills={installedSkills}
                  onClearStaged={clearStagedSources}
                  onChooseInstallDir={handleQuickChooseInstallDir}
                  onGoImport={() => router.push("/local-install" as any)}
                  onGoStaged={() => router.push("/staged" as any)}
                  onGoAiWorkspace={() => router.push("/ai-workspace" as any)}
                  onGoLocalInstall={() => router.push("/local-install" as any)}
                  onGoProjects={() => router.push("/projects" as any)}
                  onImportProject={handleImportProject}
                  onImportZip={importZipWithPicker}
                  onLoadStagedDetail={loadStagedDetail}
                  onOpenLogsFromOverview={(logId) => {
                    setSelectedLogId(logId);
                    router.push("/logs");
                  }}
                  onOpenPath={openPath}
                  onOpenSystemSourceModal={openSystemSourceModal}
                  onInstallStaged={installStagedSources}
                  onParseStaged={parseStagedSources}
                  onPickInstallDir={handlePickInstallDir}
                  onPickTempDir={handlePickTempDir}
                  onRemoteAction={handleRemoteAction}
                  onRemoteUrlChange={setRemoteUrl}
                  remoteUrl={remoteUrl}
                  onInstallWorkspaceSkill={handleInstallWorkspaceSkill}
                  onRemoveProject={handleRemoveProject}
                  onRemoveStaged={removeStagedSources}
                  onCreateCategory={handleCreateCategory}
                  onSaveSettings={() => saveSettings(settingsDraft)}
                  onSearchValueChange={setSearchValue}
                  searchValue={searchValue}
                  onSelectLog={setSelectedLogId}
                  onToggleStageSelection={toggleStageSelection}
                  onValidateInstallDir={handleValidateInstallDir}
                  onValidateTempDir={handleValidateTempDir}
                  section={section}
                  selectedCategory={primarySectionCategory}
                  selectedLogId={selectedLogId}
                  selectedSkillId={selectedSkillId}
                  selectedStageIds={selectedStageIds}
                  selectedStagedId={selectedStagedId}
                  onNewCategoryNameChange={setNewCategoryName}
                  newCategoryName={newCategoryName}
                  setSettingsDraft={setSettingsDraft}
                  settingsDraft={settingsDraft}
                  snapshot={snapshot}
                  t={t}
                />`;
                
    content = content.substring(0, startIdx) + cleanProps + content.substring(endIdx + endTag.length);
    startIdx = content.indexOf(startTag, startIdx + cleanProps.length);
}

fs.writeFileSync(file, content);
