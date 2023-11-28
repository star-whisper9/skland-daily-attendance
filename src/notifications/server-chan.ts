import { ofetch } from 'ofetch'
import { BaseNotificationService, type NotificationService, NotificationServiceError } from './interface'

export interface ServerChanOptions {
  title?: string
}

interface ServerChanFormattedMessage {
  message: string
  as: `heading-${1 | 2 | 3}` | 'text' | 'quote'
}

const asMapping: Record<`heading-${1 | 2 | 3}` | 'text' | 'quote', string> = {
  'heading-1': '#',
  'heading-2': '##',
  'heading-3': '###',
  'text': '',
  'quote': '>',
}

export class ServerChanService extends BaseNotificationService implements NotificationService {
  #sendKey: string
  #title: string
  #messages: ServerChanFormattedMessage[] = []
  constructor(sendKey: string, options?: ServerChanOptions) {
    super()
    if (!sendKey)
      throw new NotificationServiceError('未提供 server 酱 sendKey，请通过 https://sct.ftqq.com/ 获取')
    this.#sendKey = sendKey
    this.#title = options?.title ?? '【森空岛每日签到】'
  }

  addMessage(message: string, as: `heading-${1 | 2 | 3}` | 'text' | 'quote') {
    super.addMessage(message)
    this.#messages.push({ message, as })
  }

  get formatMessage() {
    return this.#messages
      .map(i => `${asMapping[i.as]} ${i.message}`)
      .join('\n\n')
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
