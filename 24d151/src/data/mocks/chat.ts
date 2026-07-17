import { ChatMessage } from '../../types';
export const INITIAL_CHAT: ChatMessage[] = [
  { id: 'msg-1', sender: 'copilot', text: 'Hello! I am your Nexus transit copilot. What is your destination today?', timestamp: '08:00 AM', suggestions: ['Find fastest route to JFK Terminal 4', 'Are there active delays on Subway Line 4?'] }
];