import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import useLockMainScroll from '@/web/hooks/useLockMainScroll'
import useMeasure from 'react-use-measure'
import { ContextMenuItem, ContextMenuPosition } from './types'
import MenuPanel from './MenuPanel'
import { createPortal } from 'react-dom'

const BasicContextMenu = ({
  onClose,
  items,
  target,
  cursorPosition,
  options,
  classNames,
}: {
  onClose: (e?: MouseEvent) => void
  items: ContextMenuItem[]
  target: HTMLElement
  cursorPosition: { x: number; y: number }
  options?: {
    useCursorPosition?: boolean
    fixedPosition?: `${'top' | 'bottom'}-${'left' | 'right'}`
  } | null
  classNames?: string
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [measureRef, menuBounds] = useMeasure()
  const [position, setPosition] = useState<ContextMenuPosition | null>(null)

  useLockMainScroll(!!position)

  // 关键：用 useRef 缓存尺寸，避免 menuBounds 对象变化导致循环
  const sizeRef = useRef({ width: 0, height: 0 })
  if (menuBounds.width > 0 && menuBounds.height > 0) {
    sizeRef.current = { width: menuBounds.width, height: menuBounds.height }
  }

  // 只在尺寸真正变化时才重新计算位置
  const lastSizeRef = useRef({ width: -1, height: -1 })
  useLayoutEffect(() => {
    const { width, height } = sizeRef.current

    // 尺寸没变过 + 已经有 position → 不重复计算
    if (
      lastSizeRef.current.width === width &&
      lastSizeRef.current.height === height &&
      position
    ) {
      return
    }

    if (width === 0 || height === 0) return

    lastSizeRef.current = { width, height }

    if (options?.useCursorPosition) {
      const leftX = cursorPosition.x
      const rightX = cursorPosition.x - width
      const bottomY = cursorPosition.y
      const topY = cursorPosition.y - height
      setPosition({
        x: leftX + width < window.innerWidth ? leftX : rightX,
        y: bottomY + height < window.innerHeight ? bottomY : topY,
      })
    } else {
      const button = target.getBoundingClientRect()
      const leftX = button.x
      const rightX = button.x - width + button.width
      const bottomY = button.y + button.height + 8
      const topY = button.y - height - 8
      setPosition({
        x: leftX + width < window.innerWidth ? leftX : rightX,
        y: bottomY + height < window.innerHeight ? bottomY : topY,
      })
    }
  }, [menuBounds.width, menuBounds.height, target, cursorPosition, options?.useCursorPosition])

  useEffect(() => {
    if (!position) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose(e)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleScroll = () => onClose()

    document.addEventListener('mousedown', handleClickOutside, true)
    document.addEventListener('keydown', handleEsc, true)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
      document.removeEventListener('keydown', handleEsc, true)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [position, onClose])

  return createPortal(
    <>
      <MenuPanel
        position={{ x: 99999, y: 99999 }}
        items={items}
        ref={measureRef}
        onClose={() => {}}
        forMeasure={true}
        classNames={classNames}
      />
      {position && (
        <MenuPanel
          position={position}
          items={items}
          ref={menuRef}
          onClose={onClose}
          classNames={classNames}
        />
      )}
    </>,
    document.body
  )
}

export default BasicContextMenu
