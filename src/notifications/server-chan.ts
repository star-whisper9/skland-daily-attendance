import { ofetch } from 'ofetch'
import { type NotificationService, NotificationServiceError } from './interface'

export interface ServerChanOptions {
  title?: string
}

export class ServerChanService implements NotificationService {
  #sendKey: string
  #title: string
  #messages: string[] = []
  constructor(sendKey: string, options?: ServerChanOptions) {
    if (!sendKey)
      throw new NotificationServiceError('未提供 server 酱 sendKey，请通过 https://sct.ftqq.com/ 获取')
    this.#sendKey = sendKey
    this.#title = options.title ?? '【森空岛每日签到】'
  }

  pushMessage(...messages: string[]) {
    this.#messages.push(...messages)
  }

  get formatMessage() {
    return this.#messages.join('\n\n')
  }

  async send() {
    const content = this.formatMessage
    const payload = {
      title: this.#title,
      desp: content,
    }
    const data = await ofetch<{ code: number }>(
      `https://sctapi.ftqq.com/${this.#sendKey}.send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      },
    )

    return data.code === 0
  }
}
