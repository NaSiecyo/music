private async _playAudioViaHowler(audio: string, id: number, autoplay: boolean = true) {
    // 只卸载我们自己的 _howler，而不是全局 Howler.unload()。
    // 全局 unload 会移除所有 <audio> 元素，导致 React portal 崩溃。
    try {
      if (_howler) {
        _howler.stop()
        _howler.unload()
      }
    } catch {
      /* ignore */
    }

    const url = audio.includes('?') ? `${audio}&dash-id=${id}` : `${audio}?dash-id=${id}`
    const howler = new Howl({
      src: [url],
      format: ['mp3', 'flac', 'webm'],
      html5: true,
      autoplay,
      volume: 1,
      onend: () => {
        this._howlerOnEndCallback()
      },
    })
    _howler = howler

    // 设置 crossOrigin 以支持 Web Audio API 分析（呼吸灯效果）
    try {
      const node = (howler as any)._sounds?.[0]?._node
      if (node && node instanceof HTMLMediaElement && node.crossOrigin !== 'anonymous') {
        node.crossOrigin = 'anonymous'
        try {
          node.load()
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }

    ;(window as any).howler = howler
    if (autoplay) {
      this.play()
      this.state = State.Playing
    }
    _howler.once('load', () => {
      this._cacheAudio((_howler as any)._src)
    })

    if (!this._progressInterval) {
      this._setupProgressInterval()
    }
}
