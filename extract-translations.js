const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'workspace-app.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The block to extract starts with:
// type TranslationDictionary = Record<string, string>;
// and ends with:
// const translations: Record<Locale, TranslationDictionary> = { ... };

const lines = content.split('\n');

let startIndex = lines.findIndex(line => line.startsWith('type TranslationDictionary ='));
let endIndex = lines.findIndex(line => line.startsWith('const translations: Record<Locale, TranslationDictionary> ='));

// Find where the `const translations` block ends
let i = endIndex;
while(i < lines.length && !lines[i].startsWith('};')) {
    i++;
}
endIndex = i;

if (startIndex !== -1 && endIndex !== -1) {
    const extractedLines = lines.slice(startIndex, endIndex + 1);
    
    // Add import Locale
    const localeImport = `import type { Locale } from "@shared/contracts";\n\n`; // Adjust the import path if needed, we'll check it later
    
    let newContentFile = `export ` + extractedLines.join('\n');
    newContentFile = newContentFile.replace('type TranslationDictionary', 'type TranslationDictionary');
    newContentFile = newContentFile.replace('const zhCnTranslations', 'export const zhCnTranslations');
    newContentFile = newContentFile.replace('const enTranslations', 'export const enTranslations');
    newContentFile = newContentFile.replace('const translations', 'export const translations');
    
    // Write to src/locales/translations.ts
    const dir = path.join(__dirname, 'src', 'locales');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'translations.ts'), newContentFile);
    
    // Replace in workspace-app.tsx
    lines.splice(startIndex, endIndex - startIndex + 1, 'import { translations } from "@/locales/translations";', 'export type { TranslationDictionary } from "@/locales/translations";');
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log("Extraction successful.");
} else {
    console.log("Could not find start/end bounds.");
}
