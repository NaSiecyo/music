import { IpcChannels } from '@/shared/IpcChannels'
import { merge } from 'lodash-es'
import { proxy, subscribe } from 'valtio'
import i18n, { getInitLanguage, SupportedLanguage, supportedLanguages } from '../i18n/i18n'
import { getKeyboardShortcutDefaultSettings } from '@/shared/defaultSettings'

// ============================================================
// 音质等级相关类型定义
// ============================================================

/**
 * 所有支持的音质等级（来自网易云 API 的 level 参数）
 * - standard: 标准 128kbps
 * - higher:   较高 192kbps
 * - exhigh:   极高 320kbps（推荐，无需 VIP）
 * - lossless: 无损 FLAC（需 VIP）
 * - hires:    Hi-Res 音质（需 VIP）
 * - jymaster: 超清母带（需 SVIP）
 */
export type AudioLevel =
  | 'standard'
  | 'higher'
  | 'exhigh'
  | 'lossless'
  | 'hires'
  | 'jymaster'

/**
 * 音质等级的显示名称，用于下拉框选项
 */
export const AUDIO_LEVEL_LABELS: Record<AudioLevel, string> = {
  standard: '标准音质 (128kbps)',
  higher: '较高音质 (192kbps)',
  exhigh: '极高音质 (320kbps)',
  lossless: '无损音质 (FLAC)',
  hires: 'Hi-Res 音质',
  jymaster: '超清母带',
}

/**
 * 按顺序排列的音质等级，用于下拉框渲染
 */
export const AUDIO_LEVELS_ORDERED: AudioLevel[] = [
  'standard',
  'higher',
  'exhigh',
  'lossless',
  'hires',
  'jymaster',
]

// ============================================================
// 设置项类型
// ============================================================

interface Settings {
  accentColor: string
  language: SupportedLanguage
  qqCookie: string
  miguCookie: string
  jooxCookie: string
  enableFindTrackOnYouTube: boolean
  httpProxyForYouTube?: {
    proxy: string
    host: string
    port: number
    protocol: 'http' | 'https'
    auth?: {
      username: string
      password: string
    }
  }
  playAnimatedArtworkFromApple: boolean
  priorityDisplayOfAlbumArtistDescriptionFromAppleMusic: boolean
  displayPlaylistsFromNeteaseMusic: boolean
  closeWindowInMinimize: boolean
  showBackgroundImage: boolean
  unlock: boolean
  theme: string
  showDesktopLyrics: boolean
  keyboardShortcuts: KeyboardShortcutSettings
  showTrackListName: boolean
  showDownloadActions: boolean
  enableBreathingEffect: boolean
  autoLowPowerMode: boolean

  // ============================================================
  // 新增：音质设置
  // ============================================================
  /** 播放时使用的音质等级 */
  playAudioLevel: AudioLevel
  /** 下载时使用的音质等级（默认无损，需 VIP） */
  downloadAudioLevel: AudioLevel
}

/**
 * Device capability check, computed once per session (hardware doesn't
 * change while the app runs). When true AND `autoLowPowerMode` is
 * enabled, visually-identical-but-cheaper rendering paths are used
 * (slower breathing tick + no second background image layer) instead of
 * disabling the effects.
 */
export const isLowPowerDevice = () => {
  if (typeof navigator === 'undefined') return false
  const cores = navigator.hardwareConcurrency ?? Number.MAX_SAFE_INTEGER
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  return cores <= 4 || (typeof memory === 'number' && memory <= 4)
}

// ============================================================
// 默认设置
// ============================================================

const initSettings: Settings = {
  accentColor: 'yellow',
  language: getInitLanguage(),
  qqCookie: '',
  miguCookie: '',
  jooxCookie: '',
  enableFindTrackOnYouTube: false,
  playAnimatedArtworkFromApple: true,
  priorityDisplayOfAlbumArtistDescriptionFromAppleMusic: true,
  displayPlaylistsFromNeteaseMusic: true,
  closeWindowInMinimize: false,
  showBackgroundImage: false,
  httpProxyForYouTube: {
    proxy: '',
    host: '',
    port: 0,
    protocol: 'http',
  },
  unlock: true,
  theme: 'dark',
  showDesktopLyrics: false,
  keyboardShortcuts: getKeyboardShortcutDefaultSettings(),
  showTrackListName: false,
  showDownloadActions: false,
  enableBreathingEffect: true,
  autoLowPowerMode: true,

  // 新增默认值：播放用 320kbps（免费且音质好），下载用无损（需 VIP）
  playAudioLevel: 'exhigh',
  downloadAudioLevel: 'lossless',
}

// ============================================================
// 从 localStorage 恢复 + 合并
// ============================================================

const STORAGE_KEY = 'settings'

let statesInStorage = {}
try {
  statesInStorage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
} catch {
  // ignore
}

const settings = proxy<Settings>(merge(initSettings, statesInStorage))

subscribe(settings, () => {
  if (settings.language !== i18n.language && supportedLanguages.includes(settings.language)) {
    i18n.changeLanguage(settings.language)
  }
  // 同步electron set settings
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  window.ipcRenderer?.send(IpcChannels.SyncSettings, JSON.parse(JSON.stringify(settings)))
})

export default settings
