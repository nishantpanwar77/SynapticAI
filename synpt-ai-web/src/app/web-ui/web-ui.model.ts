export interface ResponseSection {
  type: 'thinking' | 'code' | 'heading' | 'text' | 'steps' | 'approach';
  content: string;
  language?: string;
  level?: number;
  items?: string[];
}

export interface ParsedSection {
  type: string;
  content: string;
  metadata?: {
    language?: string;
    level?: number;
    items?: string[];
    tags?: string[];
    title?: string;
    timestamp?: string;
    // Add more metadata fields as needed
  };
}
