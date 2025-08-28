// Custom error classes for standardized error handling

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ArchiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArchiveError';
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class ExternalServiceError extends Error {
  constructor(message: string, public readonly service: string) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

export class WorkerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkerError';
  }
}