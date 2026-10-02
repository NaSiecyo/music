import { SupportedLanguage } from '@/web/i18n/i18n'
import persistedUiStates from '@/web/states/persistedUiStates'
import settings, {
  AUDIO_LEVEL_LABELS,
  AUDIO_LEVELS_ORDERED,
  AudioLevel,
} from '@/web/states/settings'
import { useTranslation } from 'react-i18next'
import { useSnapshot } from 'valtio'
import { BlockTitle, OptionText, Select, Option, Switch } from './Controls'

function General() {
  return (
    <div>
      <Language />
      <AppleMusic />
      <NeteaseMusic />
      <Download />
      <CloseWindow />
    </div>
  )
}

function Language() {
  const { t } = useTranslation()
  const supportedLanguages: { name: string; value: SupportedLanguage }[] = [
    { name: 'English', value: 'en-US' },
    { name: '简体中文', value: 'zh-CN' },
  ]
  const { language } = useSnapshot(settings)
  const setLanguage = (language: SupportedLanguage) => {
    settings.language = language
  }

  return (
    <div className='mb-12'>
      <BlockTitle>{t`settings.title-language`}</BlockTitle>
      <Option>
        <OptionText>{t`settings.general-choose-language`}</OptionText>
        <Select options={supportedLanguages} value={language} onChange={setLanguage} />
      </Option>
    </div>
  )
}

function AppleMusic() {
  const { t } = useTranslation()

  const { playAnimatedArtworkFromApple, priorityDisplayOfAlbumArtistDescriptionFromAppleMusic } =
    useSnapshot(settings)

  return (
    <div className='mt-7 mb-12'>
      <BlockTitle>Apple Music</BlockTitle>
      <Option>
        <OptionText>{t`settings.play-animated-artwork-from-apple-music`}</OptionText>
        <Switch
          enabled={playAnimatedArtworkFromApple}
          onChange={v => (settings.playAnimatedArtworkFromApple = v)}
        />
      </Option>
      <Option>
        <OptionText>{t`settings.priority-display-description-from-apple-music`}</OptionText>
        <Switch
          enabled={priorityDisplayOfAlbumArtistDescriptionFromAppleMusic}
          onChange={v => (settings.priorityDisplayOfAlbumArtistDescriptionFromAppleMusic = v)}
        />
      </Option>
    </div>
  )
}

function NeteaseMusic() {
  const { t } = useTranslation()

  const { displayPlaylistsFromNeteaseMusic } = useSnapshot(settings)
  return (
    <div className='mt-7 mb-12'>
      <BlockTitle>{t`settings.title-netease-music`}</BlockTitle>
      <Option>
        <OptionText>{t`settings.display-playlists-from-netease-music`}</OptionText>
        <Switch
          enabled={displayPlaylistsFromNeteaseMusic}
          onChange={v => {
            settings.displayPlaylistsFromNeteaseMusic = v
            if (persistedUiStates.librarySelectedTab === 'playlists') {
              persistedUiStates.librarySelectedTab = 'albums'
            }
          }}
        />
      </Option>
    </div>
  )
}

// ============================================================
// 下载设置（新增下载音质选项）
// ============================================================
function Download() {
  const { t } = useTranslation()

  const { showDownloadActions, downloadAudioLevel } = useSnapshot(settings)

  // 构造下拉框选项：把音质等级数组转成 Select 组件需要的数据格式
  // { name: 显示名, value: 实际值 }
  const audioLevelOptions = AUDIO_LEVELS_ORDERED.map(level => ({
    name: AUDIO_LEVEL_LABELS[level],
    value: level,
  }))

  const setDownloadAudioLevel = (level: AudioLevel) => {
    settings.downloadAudioLevel = level
  }

  return (
    <div className='mt-7 mb-12'>
      <BlockTitle>{t`settings.title-download`}</BlockTitle>

      {/* 显示下载按钮的开关 */}
      <Option>
        <OptionText>{t`settings.show-download-actions`}</OptionText>
        <Switch
          enabled={showDownloadActions}
          onChange={v => (settings.showDownloadActions = v)}
        />
      </Option>

      {/* 下载音质选择 —— 只有开启下载功能时才显示 */}
      {showDownloadActions && (
        <Option>
          <div>
            <OptionText>下载音质</OptionText>
            <div className='text-xs opacity-60'>
              无损及以上需要黑胶 VIP 账号
            </div>
          </div>
          <Select
            options={audioLevelOptions}
            value={downloadAudioLevel}
            onChange={setDownloadAudioLevel}
          />
        </Option>
      )}
    </div>
  )
}

function CloseWindow() {
  const { t } = useTranslation()

  const { closeWindowInMinimize } = useSnapshot(settings)
  return (
    <div className='mt-7 mb-12'>
      <BlockTitle>{t`settings.minimize-window`}</BlockTitle>
      <Option>
        <OptionText>{t`settings.minimize-window-to-tray-when-close`}</OptionText>
        <Switch
          enabled={closeWindowInMinimize}
          onChange={v => (settings.closeWindowInMinimize = v)}
        />
      </Option>
    </div>
  )
}

export default General
