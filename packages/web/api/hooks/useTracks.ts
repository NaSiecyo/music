import { fetchAudioSource, fetchTracks } from '@/web/api/track'
import type {} from '@/web/api/track'
import reactQueryClient from '@/web/utils/reactQueryClient'
import { IpcChannels } from '@/shared/IpcChannels'
import {
  FetchAudioSourceParams,
  FetchTracksParams,
  FetchTracksResponse,
  TrackApiNames,
  UnblockParam,
  UnblockResponse,
} from '@/shared/api/Track'
import { CacheAPIs } from '@/shared/CacheAPIs'
import { useQuery } from '@tanstack/react-query'
import settings from '@/web/states/settings'

export async function fetchLongTracks(params: FetchTracksParams) {
  const len = Math.ceil(params.ids.length / 500)
  const promiseArr = []
  let offset = 0
  const totalIds = params.ids
  for (let i = 0; i < len; i++) {
    const req = new Promise<FetchTracksResponse>((resolve, reject) => {
      params.ids = totalIds.slice(offset, offset + 500)
      resolve(fetchTracks(params))
    })
    promiseArr.push(req)
    offset += 500
  }

  const results = await Promise.all(promiseArr)
  const mergedResponse: FetchTracksResponse = results.reduce(
    (acc, curr) => {
      acc.code = curr.code
      if (curr.songs) {
        if (!acc.songs) {
          acc.songs = []
        }
        acc.songs.push(...curr.songs)
      }
      if (curr.privileges) {
        Object.assign(acc.privileges, curr.privileges)
      }
      return acc
    },
    { code: 0, privileges: {} }
  )

  return mergedResponse
}

export default function useTracks(params: FetchTracksParams) {
  return useQuery({
    queryKey: [TrackApiNames.FetchTracks, params],
    queryFn: async () => {
      const cache = await window.ipcRenderer?.invoke(IpcChannels.GetApiCache, {
        api: CacheAPIs.Track,
        query: {
          ids: params.ids.join(','),
        },
      })
      if (cache) return cache
      return await fetchLongTracks(params)
    },
    enabled: params.ids.length !== 0,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })
}

export function fetchTracksWithReactQuery(params: FetchTracksParams) {
  return reactQueryClient.fetchQuery({
    queryKey: [TrackApiNames.FetchTracks, params],
    queryFn: async () => {
      const cache = await window.ipcRenderer?.invoke(IpcChannels.GetApiCache, {
        api: CacheAPIs.Track,
        query: {
          ids: params.ids.join(','),
        },
      })
      if (cache) return cache as FetchTracksResponse
      return fetchTracks(params)
    },
    retry: 4,
    retryDelay: (retryCount: number) => {
      return retryCount * 500
    },
    staleTime: 86400000,
  })
}

// ============================================================
// 获取音源URL（带自动音质注入）
// ============================================================
export function fetchAudioSourceWithReactQuery(params: FetchAudioSourceParams) {
  // 关键：如果调用方没有显式指定 level，就使用设置里的"播放音质"
  // 下载场景可以自己传 level: settings.downloadAudioLevel 来覆盖
  if (!params.level) {
    params.level = (settings.playAudioLevel as FetchAudioSourceParams['level']) || 'exhigh'
  }

  params.qqCookie = settings.qqCookie
  params.miguCookie = settings.miguCookie
  params.jooxCookie = settings.jooxCookie

  return reactQueryClient.fetchQuery({
    queryKey: [TrackApiNames.FetchAudioSource, params],
    queryFn: () => {
      return fetchAudioSource(params)
    },
    retry: 1,
    staleTime: 0,
  })
}
