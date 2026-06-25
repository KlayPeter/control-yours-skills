const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'workspace-app.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const unusedVars = [
  'selectedSkillId', 'selectedStagedId', 'selectedLogId', 'loadSkillDetail', 'validateDirectory',
  'importLocalArchive', 'addRemoteSource', 'pickArchiveFile', 'createSkillCategory', 'setSettingsDraft',
  'locale', 'installedSkills', 'activeTheme', 'openStagedDetailModal', 'handleInstallWithProgress',
  'selectedStageIds', 'setSelectedStageIds', 'searchValue', 'setSearchValue', 'selectedCategoryFilter',
  'setSelectedCategoryFilter', 'newCategoryName', 'setNewCategoryName', 'remoteUrl', 'setRemoteUrl',
  'primarySectionCategory'
];

let newContent = content;

unusedVars.forEach(v => {
  const regex = new RegExp('\\b' + v + '\\b\\s*,?', 'g');
  newContent = newContent.replace(regex, '');
});

// Clean up any empty lines or trailing commas in the destructuring block
newContent = newContent.replace(/,\s*}/g, ' }');

fs.writeFileSync(filePath, newContent);
console.log('Cleaned up unused variables.');
