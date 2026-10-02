export enum TrackApiNames {
  FetchTracks = 'fetchTracks',
  FetchAudioSource = 'fetchAudioSource',
  FetchLyric = 'fetchLyric',
  Unblock = 'unblock',
}

// unblock music
export interface UnblockParam {
  track_id: number
}
export interface UnblockResponse {
  code: number
  url: string
}
// 获取歌曲详情
export interface FetchTracksParams {
  ids: number[]
}
export interface FetchTracksResponse {
  code: number
  songs?: Track[]
  privileges: {
    [key: string]: unknown
  }
}

// ============================================================
// 音质等级类型（与 settings.ts 里保持一致）
// ============================================================
export type AudioLevelType =
  | 'standard'
  | 'higher'
  | 'exhigh'
  | 'lossless'
  | 'hires'
  | 'jyeffect'
  | 'sky'
  | 'jymaster'

// 获取音源URL
export interface FetchAudioSourceParams {
  id: number
  /**
   * 音质等级：
   *  - standard: 128kbps
   *  - higher:   192kbps
   *  - exhigh:   320kbps（推荐，无需 VIP）
   *  - lossless: 无损 FLAC（需 VIP）
   *  - hires:    Hi-Res（需 VIP）
   *  - jyeffect: 高清环绕声（需 VIP）
   *  - sky:      沉浸环绕声（需 VIP）
   *  - jymaster: 超清母带（需 SVIP）
   */
  level?: AudioLevelType
  qqCookie?: string
  miguCookie?: string
  jooxCookie?: string
}
export interface FetchAudioSourceResponse {
  code: number
  data: {
    br: number
    canExtend: boolean
    code: number
    encodeType: 'mp3' | 'flac' | null
    expi: number
    fee: number
    flag: number
    freeTimeTrialPrivilege: {
      [key: string]: unknown
    }
    freeTrialPrivilege: {
      [key: string]: unknown
    }
    freeTrialInfo: null
    gain: number
    id: number
    level: AudioLevelType | 'null'
    md5: string | null
    payed: number
    size: number
    type: 'mp3' | 'flac' | null
    uf: null
    url: string | null
    urlSource: number
  }[]
}

// 获取歌词
export interface FetchLyricParams {
  id: number
}
export interface FetchLyricResponse {
  code: number
  sgc: boolean
  sfy: boolean
  qfy: boolean
  lyricUser?: {
    id: number
    status: number
    demand: number
    userid: number
    nickname: string
    uptime: number
  }
  transUser?: {
    id: number
    status: number
    demand: number
    userid: number
    nickname: string
    uptime: number
  }
  lrc: {
    version: number
    lyric: string
  }
  klyric?: {
    version: number
    lyric: string
  }
  tlyric?: {
    version: number
    lyric: string
  }
}

// 新版歌词 - 包含逐字歌词
export interface FetchLyricNewResponse {
  code: number
  sgc: boolean
  sfy: boolean
  qfy: boolean
  lrc?: {
    version: number
    lyric: string
  }
  tlyric?: {
    version: number
    lyric: string
  }
  klyric?: {
    version: number
    lyric: string
  }
  yrc?: {
    version: number
    lyric: string
  }
  ytlrc?: {
    version: number
    lyric: string
  }
  yromalrc?: {
    version: number
    lyric: string
  }
  romalrc?: {
    version: number
    lyric: string
  }
}

// 收藏歌曲
export interface LikeATrackParams {
  id: number
  like: boolean
}
export interface LikeATrackResponse {
  code: number
  playlistId: number
  songs: Track[]
}
