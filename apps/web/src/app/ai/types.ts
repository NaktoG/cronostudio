export type Profile = {
  key: string;
  version: number;
  name: string;
  description: string;
};

export type Channel = {
  id: string;
  name: string;
};

export type IdeaOption = {
  id: string;
  title: string;
};

export type ScriptOption = {
  id: string;
  title: string;
};

export type Run = {
  id: string;
  channel_id: string | null;
  profile_key: string;
  profile_version: number;
  status: string;
  input_json: unknown;
  output_json: unknown;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type PromptPayload = {
  system: string;
  user: string;
};

export type FormInputs = {
  topicSeed: string;
  channelStage: string;
  targetAudience: string;
  primaryGoal: string;
  resources: string;
  constraints: string;
  ideaId: string;
  scriptId: string;
  targetLengthSec: string;
  depthLevel: string;
  tone: string;
  scriptSummary: string;
  primaryEmotion: string;
  styleGuide: string;
};
