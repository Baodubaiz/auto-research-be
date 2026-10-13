import { MessageEvent } from '@nestjs/common';
import { ProcessStatus } from '../../enums/process-status.enum';

export const STREAMING_EVENT_TYPES = [
  'write_content',
  'chuyen_de_1',
  'chuyen_de_2',
  'chuyen_de_3',
  'writer',
  'gen_slides',
] as const;

export type StreamingEventType = (typeof STREAMING_EVENT_TYPES)[number];

export function isStreamingEventType(eventType: string): boolean {
  return STREAMING_EVENT_TYPES.includes(eventType as StreamingEventType);
}

export interface StreamEventData<T = unknown> {
  processStatus: ProcessStatus;
  statusName: string;
  hasFinished: boolean;
  eventType?: string;
  chunk?: T;
  data?: T;
  progress?: number;
  errorCode?: number;
  errorName?: string;
  errorMessage?: string;
  raw?: Record<string, unknown>;
}

export interface StreamMessageEvent<T = unknown> extends MessageEvent {
  type?: string;
  id?: string;
  retry?: number;
  data: StreamEventData<T>;
}
