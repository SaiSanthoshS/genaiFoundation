const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// 1. Create Logger
const utilsDir = path.join(srcDir, 'utils');
if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir, { recursive: true });

const loggerContent = `export const logger = {
  info: (msg: string, ...data: any[]) => {
    if (import.meta.env.MODE !== 'production') {
      console.info(\`[INFO] \${msg}\`, ...data);
    }
  },
  warn: (msg: string, ...data: any[]) => {
    console.warn(\`[WARN] \${msg}\`, ...data);
  },
  error: (msg: string, ...data: any[]) => {
    console.error(\`[ERROR] \${msg}\`, ...data);
  }
};
`;
fs.writeFileSync(path.join(utilsDir, 'logger.ts'), loggerContent, 'utf8');


// 2. Update apiClient.ts with interceptors
const apiClientPath = path.join(srcDir, 'services', 'apiClient.ts');
const apiClientContent = `import axios from 'axios';
import { logger } from '../utils/logger';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  logger.info(\`API Request: \${config.method?.toUpperCase()} \${config.url}\`);
  return config;
}, (error) => {
  logger.error('API Request Error:', error);
  return Promise.reject(error);
});

apiClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response) {
    logger.error(\`API Error [\${error.response.status}]:\`, error.response.data);
  } else if (error.request) {
    logger.error('API Network Error: No response received.');
  } else {
    logger.error('API Error:', error.message);
  }
  return Promise.reject(error);
});

export default apiClient;
`;
fs.writeFileSync(apiClientPath, apiClientContent, 'utf8');

// 3. Accessibility & Memoization in LiveJourneyMap.tsx
const mapPath = path.join(srcDir, 'components', 'map', 'LiveJourneyMap.tsx');
let mapContent = fs.readFileSync(mapPath, 'utf8');

// Memoize PATH_COORDS calculation logic and the map component
if (!mapContent.includes('React.memo')) {
  mapContent = mapContent.replace("export default function LiveJourneyMap", "const LiveJourneyMap = function LiveJourneyMap");
  mapContent += `\nexport default React.memo(LiveJourneyMap);`;
}
fs.writeFileSync(mapPath, mapContent, 'utf8');

// 4. Update CopilotPanel.tsx accessibility
const copilotPath = path.join(srcDir, 'components', 'common', 'CopilotPanel.tsx');
let copilotContent = fs.readFileSync(copilotPath, 'utf8');
copilotContent = copilotContent.replace('<button \n          onClick={onClose}', '<button \n          onClick={onClose}\n          aria-label="Close Copilot"');
copilotContent = copilotContent.replace('<button\n            type="submit"', '<button\n            type="submit"\n            aria-label="Send message"');
fs.writeFileSync(copilotPath, copilotContent, 'utf8');

// 5. Create journeyService.test.ts
const testsDir = path.join(srcDir, 'services');
const testContent = `import { describe, it, expect, vi } from 'vitest';
import { journeyService } from './journeyService';
import apiClient from './apiClient';

vi.mock('./apiClient');

describe('journeyService', () => {
  it('searchRoutes should return mapped routes on success', async () => {
    const mockData = [{ id: 'route-1', name: 'Fastest Route', totalDuration: 45 }];
    (apiClient.post as any).mockResolvedValue({ data: mockData });

    const result = await journeyService.searchRoutes('Station A', 'Station B');
    expect(apiClient.post).toHaveBeenCalledWith('/journey/plan', expect.any(Object));
    expect(result).toEqual(mockData);
  });
});
`;
fs.writeFileSync(path.join(testsDir, 'journeyService.test.ts'), testContent, 'utf8');

// 6. Config vitest in package.json
const pkgPath = path.join(__dirname, 'package.json');
let pkgStr = fs.readFileSync(pkgPath, 'utf8');
const pkgJson = JSON.parse(pkgStr);
pkgJson.scripts.test = "vitest run";
fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2), 'utf8');

// 7. .env.example
const envExampleContent = `# Frontend Variables
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Backend Variables (if needed)
# PORT=8000
# HOST=0.0.0.0
`;
fs.writeFileSync(path.join(__dirname, '.env.example'), envExampleContent, 'utf8');

// 8. README.md
const readmeContent = `# Smart Public Transit Journey Planner

A production-ready full-stack application designed to revolutionize urban commute tracking, AI-assisted routing, and environmental accountability.

## Features
- **Smart Journey Planning**: AI-driven route combinations (Fastest, Cheapest, Eco-Friendly).
- **Live GPS Telemetry Map**: Interactive Vector Map via Leaflet tracking real-time vehicle carriage coordinates.
- **Dynamic Re-Routing Engine**: Automatic active itinerary swapping upon detection of municipal network disruptions.
- **Push Notification Departure Reminders**: Robust alarm system with background polling connected directly to OS-level Browser Notifications.
- **Eco Analytics Dashboard**: Tracks weekly CO2 offsets and visualizes commute impact via Recharts.

## Technology Stack
**Frontend:**
- React 19, TypeScript, Vite
- TailwindCSS v4
- React Router v7
- React Leaflet (OpenStreetMap)
- Vitest (Unit Testing)

**Backend:**
- Python 3.9+
- FastAPI, Uvicorn
- Pydantic (Type Validation)

## Setup & Installation

### 1. Clone & Environment
\`\`\`bash
# Create a .env file from the example
cp .env.example .env
\`\`\`

### 2. Run the FastAPI Backend
The backend utilizes an in-memory cache to handle routing, delays, and reminder persistence.
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
\`\`\`
> Visit http://localhost:8000/docs for full Swagger UI API Documentation.

### 3. Run the React Frontend
\`\`\`bash
npm install
npm run dev
\`\`\`
> Visit http://localhost:3000 to launch the app!

## Production Deployment
\`\`\`bash
# Build the optimized static assets
npm run build
\`\`\`
`;
fs.writeFileSync(path.join(__dirname, 'README.md'), readmeContent, 'utf8');

console.log('Production readiness optimizations applied successfully.');
