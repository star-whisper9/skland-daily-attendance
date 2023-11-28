import { ofetch } from 'ofetch'
import { BaseNotificationService, type NotificationService, NotificationServiceError } from './interface'

/**
 * 详见 https://bark.day.app/#/tutorial?id=%e8%af%b7%e6%b1%82%e5%8f%82%e6%95%b0
 */
export interface BarkOptions {
  title?: string
  level?: 'active' | 'timeSensitive' | 'passive'
  badge?: number
  autoCopy?: boolean
  copy?: string | ((messages: string) => string)
  sound?: string
  icon?: string
  group?: string
  // eslint-disable-next-line ts/ban-types
  isArchive?: '1'|(string & {})
  url?: string
}

const defaultOptions: BarkOptions = {
  title: '【森空岛每日签到】',
  group: 'Skland',
}

export class BarkService extends BaseNotificationService implements NotificationService {
  #url: string
  #options: BarkOptions
  #messages: string[] = []
  constructor(url: string, options?: BarkOptions) {
    super()
    if (!url)
      throw new NotificationServiceError('未提供 bark url，请查看 https://github.com/Finb/Bark 了解.')
    this.#url = url
    this.#options = Object.assign({}, defaultOptions, options)
  }

  addMessage(message: string) {
    super.addMessage(message)
    this.#messages.push(message)
  }

  get formatMessage() {
    return this.#messages.join('\n')
  }

  async send() {
    const content = this.formatMessage
    const payload: BarkOptions = Object.assign({
      body: content,
    }, this.#options)

    try {
      await ofetch(
        this.#url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        },
      )
      return true
    }
    catch (error) {
      return false
    }
  }
}
