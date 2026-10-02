import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import useLockMainScroll from '@/web/hooks/useLockMainScroll'
import useMeasure from 'react-use-measure'
import { ContextMenuItem } from './types'
import MenuPanel from './MenuPanel'
import { createPortal } from 'react-dom'
import { ContextMenuPosition } from './types'

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
  const [measureRef, menu] = useMeasure()
  const [position, setPosition] = useState<ContextMenuPosition | null>(null)

  useLockMainScroll(!!position)

  useLayoutEffect(() => {
    if (options?.useCursorPosition) {
      const leftX = cursorPosition.x
      const rightX = cursorPosition.x - menu.width
      const bottomY = cursorPosition.y
      const topY = cursorPosition.y - menu.height
      setPosition({
        x: leftX + menu.width < window.innerWidth ? leftX : rightX,
        y: bottomY + menu.height < window.innerHeight ? bottomY : topY,
      })
    } else if (options?.fixedPosition) {
      const [vertical, horizontal] = options.fixedPosition.split('-') as [
        'top' | 'bottom',
        'left' | 'right'
      ]
      const button = target.getBoundingClientRect()
      const leftX = button.x
      const rightX = button.x - menu.width + button.width
      const bottomY = button.y + button.height + 8
      const topY = button.y - menu.height - 8
      setPosition({
        x: horizontal === 'left' ? leftX : rightX,
        y: vertical === 'bottom' ? bottomY : topY,
        transformOrigin: `origin-${options.fixedPosition}`,
      })
    } else {
      const button = target.getBoundingClientRect()
      const leftX = button.x
      const rightX = button.x - menu.width + button.width
      const bottomY = button.y + button.height + 8
      const topY = button.y - menu.height - 8
      setPosition({
        x: leftX + menu.width < window.innerWidth ? leftX : rightX,
        y: bottomY + menu.height < window.innerHeight ? bottomY : topY,
      })
    }
  }, [target, menu, options?.useCursorPosition, cursorPosition])

  // 关闭监听：全部使用捕获阶段，避免被其他组件的 stopPropagation 拦截
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

    // true = 捕获阶段
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
