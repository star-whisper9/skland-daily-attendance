export interface NotificationService {
  formatMessage?: string
  pushMessage: (message: string) => void
  send(): Promise<boolean>
}

export class NotificationServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(`[MessageService] error: ${message}`, options)
  }
}
