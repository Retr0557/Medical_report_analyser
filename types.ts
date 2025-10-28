
export interface HealthParameter {
  parameter: string;
  value: string | number | null;
  unit: string | null;
  referenceRange: string | null;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AnalysisPayload {
  parameters: HealthParameter[];
  summary: string;
}
