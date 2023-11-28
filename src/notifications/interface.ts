export interface NotificationService {
  formatMessage?: string
  /**
   * 添加信息
   * @param as 有格式的推送服务用
   */
  addMessage(
    message: string,
    as?: `heading-${1 | 2 | 3}` | 'text' | 'quote'
  ): void
  send(hasError?: boolean): Promise<boolean>
}

export class NotificationServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(`[MessageService] error: ${message}`, options)
  }
}

export class BaseNotificationService {
  constructor() { }
  addMessage(message: string, _as?: any) {
    console.log(message)
  }

  send() { }
}
