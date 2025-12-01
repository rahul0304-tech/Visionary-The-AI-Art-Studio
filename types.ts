export enum AgentType {
  DIRECTOR = 'DIRECTOR',
  ART_DEPT = 'ART_DEPT',
  MOTION_DEPT = 'MOTION_DEPT',
  USER = 'USER'
}

export enum AppState {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING', // Director working
  GENERATING_IMAGE = 'GENERATING_IMAGE', // Art Dept working
  GENERATING_VIDEO = 'GENERATING_VIDEO', // Motion Dept working
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  agent: AgentType;
  message: string;
  details?: string;
}

export interface DirectorPlan {
  visualPrompt: string;
  motionPrompt: string;
  reasoning: string;
}

export interface AppContextState {
  apiKeySelected: boolean;
}