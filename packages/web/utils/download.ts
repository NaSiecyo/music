import player from '@/web/states/player'
import settings from '@/web/states/settings'
import toast from 'react-hot-toast'
import i18n from '@/web/i18n/i18n'
import { fetchTracksWithReactQuery } from '@/web/api/hooks/useTracks'

/**
 * 音频流代理地址（Cloudflare Worker）。
 * 网易云 CDN 是 http://，直接请求会被浏览器的 Mixed Content 拦截，
 * 且 CDN 有防盗链。走 Worker 中转可以一次解决两个问题，
 * 同时下载流量不占用我们自己的服务器带宽。
 */
const AUDIO_PROXY_BASE = 'https://ncmproxy.furryopen.com'

/**
 * 下载歌曲音频文件。
 * UI 层由 settings.showDownloadActions 控制是否显示菜单项，
 * 这里只负责执行下载本身。
 *
 * @param trackID 歌曲 ID
 */
export async function downloadTrack(trackID: number) {
  try {
    // 关键：显式使用「下载音质」设置，而不是「播放音质」
    const downloadLevel = settings.downloadAudioLevel || 'lossless'

    const [source, tracks] = await Promise.all([
      // 把下载音质传给 player.getAudioSource
      player.getAudioSource(trackID, downloadLevel),
      fetchTracksWithReactQuery({ ids: [trackID] }),
    ])

    const url = source.audio
    if (!url) {
      toast.error(i18n.t('toasts.download-failed') || '下载失败：无法获取音频链接')
      return
    }

    const track = tracks?.songs?.[0]
    const artists = track?.ar?.map(a => a.name).join(', ')
    const filename = `${artists ? `${artists} - ` : ''}${track?.name ?? String(trackID)}.mp3`

    // 走 Worker 代理，绕过防盗链 + 解决 Mixed Content
    const proxyUrl = `${AUDIO_PROXY_BASE}/?url=${encodeURIComponent(url)}`

    toast.success(i18n.t('toasts.download-started') || '开始下载')

    try {
      // 优先用 fetch + blob：能保留自定义文件名，且受浏览器统一管理
      const resp = await fetch(proxyUrl)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const blob = await resp.blob()
      const blobUrl = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch {
      // fetch 失败时降级为普通链接（浏览器可能用自己的文件名）
      const a = document.createElement('a')
      a.href = proxyUrl
      a.download = filename
      a.target = '_blank'
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
  } catch {
    toast.error(i18n.t('toasts.download-failed') || '下载失败')
  }
}
