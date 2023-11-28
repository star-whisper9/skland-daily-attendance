import { getPrivacyName } from './utils'
import { SKLAND_BOARD_IDS, SKLAND_BOARD_NAME_MAPPING } from './constant'
import { attendance, auth, checkIn, getBinding, signIn } from './api'
import { BaseNotificationService, type NotificationService } from './notifications/interface'
import { BarkService, ServerChanService } from './notifications'

interface Options {
  /** server 酱推送功能的启用，false 或者 server 酱的token */
  withServerChan?: false | string
  /** bark 推送功能的启用，false 或者 bark 的 URL */
  withBark?: false | string
}

export class AttendanceService<N extends NotificationService> {
  #token: string
  #grantCode: string = ''
  #notification: N | undefined
  #hasError = false
  constructor(token: string, notification?: N) {
    this.#token = token
    this.#notification = notification ?? new BaseNotificationService() as NotificationService as N
  }

  async authorize() {
    const { code } = await auth(this.#token)
    this.#grantCode = code
  }

  private async signIn() {
    if (this.#grantCode === '')
      throw new Error('grant_code 为空, 请先使用 `this.authorize()` 验证.')
    const { cred, token } = await signIn(this.#grantCode)
    return { cred, token }
  }

  private async getBinding(cred: string, token: string) {
    const { list } = await getBinding(cred, token)
    return list
  }

  public async attendance() {
    const { cred, token } = await this.signIn()
    const list = await this.getBinding(cred, token)
    this.#notification?.addMessage('森空岛每日签到', 'heading-1')
    this.#notification?.addMessage(new Intl.DateTimeFormat('zh-CN', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Shanghai' }).format(new Date()), 'quote')
    this.#notification?.addMessage('森空岛各版面每日检票', 'heading-2')

    await Promise.all(SKLAND_BOARD_IDS.map(async (id) => {
      const data = await checkIn(cred, token, id)
      const name = SKLAND_BOARD_NAME_MAPPING[id]
      if (data.message === 'OK' && data.code === 0)
        this.#notification?.addMessage(`版面【${name}】登岛检票成功`)
      else
        this.#notification?.addMessage(`版面【${name}】登岛检票失败, 错误信息: ${data.message}`)
    }))

    this.#notification?.addMessage('明日方舟签到', 'heading-2')

    let successAttendance = 0
    const characterList = list.map(i => i.bindingList).flat()
    await Promise.all(characterList.map(async (character) => {
      console.log(`将签到第${successAttendance + 1}个角色`)
      const data = await attendance(cred, token, {
        uid: character.uid,
        gameId: character.channelMasterId,
      })
      if (data.code === 0 && data.message === 'OK') {
        const msg = `${(Number(character.channelMasterId) - 1) ? 'B 服' : '官服'}角色 ${getPrivacyName(character.nickName)} 签到成功${`, 获得了${data.data.awards.map(a => `「${a.resource.name}」${a.count}个`).join(',')}`}`
        this.#notification?.addMessage(msg)
        successAttendance++
      }
      else {
        const msg = `${(Number(character.channelMasterId) - 1) ? 'B 服' : '官服'}角色 ${getPrivacyName(character.nickName)} 签到失败${`, 错误消息: ${data.message}`}`
        this.#notification?.addMessage(msg)
        this.#hasError = true
      }
    }))
    this.#notification?.addMessage(`成功签到${successAttendance}个角色`)

    await this.#notification?.send(this.#hasError)
  }
}

export async function doAttendanceForAccount(token: string, options: Options) {
  let notification: NotificationService | undefined
  if (options.withBark)
    notification = new BarkService(options.withBark)
  else if (options.withServerChan)
    notification = new ServerChanService(options.withServerChan)

  const attendanceService = new AttendanceService(token, notification)
  await attendanceService.authorize()
  await attendanceService.attendance()
}
