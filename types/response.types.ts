export interface GeminiResponse {
    candidates: Candidate[];
    usageMetadata: UsageMetadata;
    modelVersion: string;
    responseId: string;
}

export interface Candidate {
    content: Content;
    finishReason: string;
    index: number;
}

export interface Content {
    parts: Part[];
    role: string;
}

export interface Part {
    text: string;
}

export interface UsageMetadata {
    promptTokensCount: number;
    candidateTokensCount: number;
    totalTokensCount: number;
    promptTokensDetails: PromptTokenDetail[];
    throughsTokenCount: number;
}

export interface PromptTokenDetail {
    modality: string;
    tokenCount: number;
}