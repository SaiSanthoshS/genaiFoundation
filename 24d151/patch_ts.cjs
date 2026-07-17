const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// 1. App.tsx fixes
const appTsxPath = path.join(srcDir, 'App.tsx');
let appContent = fs.readFileSync(appTsxPath, 'utf8');

// Ensure useNotifications is imported
if (!appContent.includes("import { useNotifications }")) {
  appContent = appContent.replace("import { reminderService } from './services/reminderService';", "import { reminderService } from './services/reminderService';\nimport { useNotifications } from './hooks/useNotifications';");
}

// Fix 'fired' to 'triggered'
appContent = appContent.replace(/fired/g, 'triggered');
fs.writeFileSync(appTsxPath, appContent, 'utf8');


// 2. ReminderCard.tsx fixes
const reminderCardPath = path.join(srcDir, 'components', 'profile', 'ReminderCard.tsx');
let reminderCardContent = fs.readFileSync(reminderCardPath, 'utf8');

// Fix 'fired' to 'triggered'
reminderCardContent = reminderCardContent.replace(/fired/g, 'triggered');
reminderCardContent = reminderCardContent.replace(/isFired/g, 'isTriggered');
fs.writeFileSync(reminderCardPath, reminderCardContent, 'utf8');


// 3. Profile.tsx fixes
const profilePath = path.join(srcDir, 'pages', 'Profile.tsx');
let profileContent = fs.readFileSync(profilePath, 'utf8');

// Fix duplicate imports
profileContent = profileContent.replace("import { Reminder } from '../types';\nimport { Reminder } from '../types';", "import { Reminder } from '../types';");
profileContent = profileContent.replace("import { Reminder } from '../types';\nimport ProfileCard from", "import ProfileCard from");

// Fix props mismatch (onUpdatePreferences vs onSavePreferences)
profileContent = profileContent.replace("onUpdatePreferences={onUpdatePreferences}", "onSavePreferences={onUpdatePreferences}");

// Fix ReminderCardProps mismatch in Profile.tsx
// Profile.tsx calls:
// <ReminderCard key={rem.id} reminder={rem} onToggle={() => onToggleReminder(rem.id)} onDelete={() => onDeleteReminder(rem.id)} />
// But ReminderCard expects onToggleStatus, not onToggle.
profileContent = profileContent.replace("onToggle={() => onToggleReminder(rem.id)}", "onToggleStatus={() => onToggleReminder(rem.id)}");

fs.writeFileSync(profilePath, profileContent, 'utf8');

// 4. apiClient.ts fixes
const apiClientPath = path.join(srcDir, 'services', 'apiClient.ts');
let apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
apiClientContent = apiClientContent.replace('import.meta.env.VITE_API_BASE_URL', '(import.meta as any).env.VITE_API_BASE_URL');
fs.writeFileSync(apiClientPath, apiClientContent, 'utf8');

// 5. logger.ts fixes
const loggerPath = path.join(srcDir, 'utils', 'logger.ts');
let loggerContent = fs.readFileSync(loggerPath, 'utf8');
loggerContent = loggerContent.replace("import.meta.env.MODE", "(import.meta as any).env.MODE");
fs.writeFileSync(loggerPath, loggerContent, 'utf8');

console.log('TypeScript errors patched.');
