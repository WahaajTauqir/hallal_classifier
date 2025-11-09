
export enum ECodeStatus {
  Halal = 'Halal',
  Haram = 'Haram',
  Mushbooh = 'Mushbooh',
}

export interface IngredientResult {
  name: string;
  status: ECodeStatus;
  reason: string;
}

export interface AnalysisResponse {
    overallStatus: string;
    ingredients: IngredientResult[];
    halalLogoDetected: boolean;
}

export interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
}

export type IdentifierMode = 'upload' | 'capture' | 'barcode';