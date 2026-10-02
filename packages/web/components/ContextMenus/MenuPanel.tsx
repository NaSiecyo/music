import { css, cx } from '@emotion/css'
import { ForwardedRef, forwardRef, useLayoutEffect, useRef, useState } from 'react'
import MenuItem from './MenuItem'
import { ContextMenuItem, ContextMenuPosition } from './types'

interface PanelProps {
  position: ContextMenuPosition
  items: ContextMenuItem[]
  onClose: (e: MouseEvent) => void
  forMeasure?: boolean
  classNames?: string
  isSubmenu?: boolean
}

interface SubmenuProps {
  itemRect: DOMRect
  index: number
}

const MenuPanel = forwardRef(
  (
    { position, items, onClose, forMeasure, classNames, isSubmenu }: PanelProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const [submenuProps, setSubmenuProps] = useState<SubmenuProps | null>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    return (
      <div
        ref={ref}
        data-context-menu-root={!forMeasure ? 'true' : undefined}
        data-context-menu-measure={forMeasure ? 'true' : undefined}
        className={cx(
          'app-region-no-drag fixed select-none',
          isSubmenu ? 'submenu z-30 px-1' : 'z-20'
        )}
        style={{ left: position.x, top: position.y }}
      >
        {/* 真实面板：纯 div，无动画 */}
        <div
          ref={panelRef}
          className={cx(
            'bg-white/90 dark:bg-black/90',
            'rounded-12 border border-black/[.06] p-px py-2.5 shadow-xl outline outline-1 outline-white backdrop-blur-3xl dark:border-white/[.06] dark:outline-black',
            css`
              min-width: 200px;
            `,
            classNames,
            position.transformOrigin || 'origin-top-left'
          )}
        >
          {items.map((item, index) => (
            <MenuItem
              key={index}
              index={index}
              item={item}
              onClose={onClose}
              onSubmenuOpen={(props: SubmenuProps) => setSubmenuProps(props)}
              onSubmenuClose={() => setSubmenuProps(null)}
              className={isSubmenu ? 'submenu' : ''}
            />
          ))}
        </div>

        <SubMenu
          items={submenuProps?.index ? items[submenuProps?.index]?.items : undefined}
          itemRect={submenuProps?.itemRect}
          onClose={onClose}
        />
      </div>
    )
  }
)
MenuPanel.displayName = 'Menu'

export default MenuPanel

const SubMenu = ({
  items,
  itemRect,
  onClose,
}: {
  items?: ContextMenuItem[]
  itemRect?: DOMRect
  onClose: (e: MouseEvent) => void
}) => {
  const submenuRef = useRef<HTMLDivElement>(null)

  const [position, setPosition] = useState<{
    x: number
    y: number
    transformOrigin: `origin-${'top' | 'bottom'}-${'left' | 'right'}`
  }>()
  useLayoutEffect(() => {
    if (!itemRect || !submenuRef.current) return
    const item = itemRect
    const submenu = submenuRef.current.getBoundingClientRect()

    const isRightSide = item.x + item.width + submenu.width <= window.innerWidth
    const x = isRightSide ? item.x + item.width : item.x - submenu.width

    const isTopSide = item.y - 10 + submenu.height <= window.innerHeight
    const y = isTopSide ? item.y - 10 : item.y + item.height + 10 - submenu.height

    const transformOriginTable = {
      top: { right: 'origin-top-left', left: 'origin-top-right' },
      bottom: { right: 'origin-bottom-left', left: 'origin-bottom-right' },
    } as const

    setPosition({
      x,
      y,
      transformOrigin:
        transformOriginTable[isTopSide ? 'top' : 'bottom'][isRightSide ? 'right' : 'left'],
    })
  }, [itemRect])

  if (!items || !itemRect) {
    return <></>
  }

  return (
    <>
      <MenuPanel
        position={{ x: 99999, y: 99999 }}
        items={items || []}
        ref={submenuRef}
        onClose={() => {}}
        forMeasure={true}
        isSubmenu={true}
      />
      <MenuPanel
        position={position || { x: 99999, y: 99999 }}
        items={items || []}
        onClose={onClose}
        isSubmenu={true}
      />
    </>
  )
}
