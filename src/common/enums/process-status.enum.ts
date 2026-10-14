import { JobStatus } from '@prisma/client';

export enum ProcessStatus {
  PENDING = 1,
  PROCESSING = 2,
  FINISHED = 3,
  ERROR = 4,
  SUSPENDED = 5,
}

export const PROCESS_STATUS_NAMES: Record<ProcessStatus, string> = {
  [ProcessStatus.PENDING]: 'PENDING',
  [ProcessStatus.PROCESSING]: 'PROCESSING',
  [ProcessStatus.FINISHED]: 'FINISHED',
  [ProcessStatus.ERROR]: 'ERROR',
  [ProcessStatus.SUSPENDED]: 'SUSPENDED',
};

export function toJobStatus(status: ProcessStatus | number): JobStatus {
  switch (status) {
    case ProcessStatus.PENDING:
      return JobStatus.pending;
    case ProcessStatus.PROCESSING:
      return JobStatus.processing;
    case ProcessStatus.FINISHED:
      return JobStatus.finished;
    case ProcessStatus.ERROR:
      return JobStatus.error;
    case ProcessStatus.SUSPENDED:
      return JobStatus.suspended;
    default:
      return JobStatus.pending;
  }
}

export function toProcessStatus(jobStatus: JobStatus): ProcessStatus {
  switch (jobStatus) {
    case JobStatus.pending:
      return ProcessStatus.PENDING;
    case JobStatus.processing:
      return ProcessStatus.PROCESSING;
    case JobStatus.finished:
      return ProcessStatus.FINISHED;
    case JobStatus.error:
      return ProcessStatus.ERROR;
    case JobStatus.suspended:
      return ProcessStatus.SUSPENDED;
    default:
      return ProcessStatus.PENDING;
  }
}
