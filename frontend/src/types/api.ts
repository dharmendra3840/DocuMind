export interface User {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Workspace {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export type DocumentStatus = "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
export type FileType = "pdf" | "docx" | "txt";

export interface Document {
  id: string;
  workspace_id: string;
  filename: string;
  file_type: FileType;
  file_size_bytes: number | null;
  page_count: number | null;
  chunk_count: number | null;
  status: DocumentStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentStatusResponse {
  status: DocumentStatus;
  progress_pct: number;
  error: string | null;
}

export interface Chunk {
  chunk_index: number;
  page_number: number;
  text: string;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  title: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export type MessageRole = "user" | "assistant";
export type MessageFeedback = "up" | "down";

export interface Source {
  filename: string;
  page: number;
  chunk_index: number;
  text: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  sources: Source[] | null;
  feedback: MessageFeedback | null;
  latency_ms: number | null;
  created_at: string;
}

export interface SSEToken {
  type: "token";
  content: string;
}
export interface SSESources {
  type: "sources";
  sources: Source[];
}
export interface SSEDone {
  type: "done";
  latency_ms: number;
  full_response: string;
}
export interface SSEError {
  type: "error";
  message: string;
}
export interface SSEMessageSaved {
  type: "message_saved";
  message_id: string;
}

export type SSEEvent = SSEToken | SSESources | SSEDone | SSEError | SSEMessageSaved;
