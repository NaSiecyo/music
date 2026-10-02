import { proxy } from 'valtio'

interface ContextMenu {
  target: HTMLElement | null
  cursorPosition: {
    x: number
    y: number
  } | null
  type: 'album' | 'track' | 'playlist' | 'artist' | null
  dataSourceID: string | number | null
  options: {
    useCursorPosition?: boolean
  } | null
}

const initContextMenu: ContextMenu = {
  target: null,
  cursorPosition: null,
  type: null,
  dataSourceID: null,
  options: null,
}

const contextMenus = proxy<ContextMenu>(initContextMenu)
export default contextMenus

// ============================================================
// 全局监听器
// ============================================================
let globalHandler: ((e: MouseEvent) => void) | null = null

const removeGlobalListener = () => {
  if (globalHandler) {
    document.removeEventListener('mousedown', globalHandler, true)
    globalHandler = null
  }
}

const addGlobalListener = () => {
  removeGlobalListener()

  globalHandler = (e: MouseEvent) => {
    const menuEl = document.querySelector(
      '[data-context-menu-root]:not([data-context-menu-measure])'
    ) as HTMLElement | null

    if (!menuEl) return
    if (menuEl.contains(e.target as Node)) return

    console.log('[menu] 点击外部，关闭菜单')
    closeContextMenu()
  }

  document.addEventListener('mousedown', globalHandler, true)
  console.log('[menu] 全局监听器已绑定')
}

// ============================================================
// 打开菜单
// ============================================================
export const openContextMenu = ({
  event,
  type,
  dataSourceID,
  options = null,
}: {
  event: React.MouseEvent<HTMLElement, MouseEvent>
  type: ContextMenu['type']
  dataSourceID: ContextMenu['dataSourceID']
  options?: ContextMenu['options']
}) => {
  if (event.target === contextMenus.target) {
    closeContextMenu()
    return
  }

  const target = event.target as HTMLElement
  contextMenus.target = target
  contextMenus.type = type
  contextMenus.dataSourceID = dataSourceID
  contextMenus.options = options
  contextMenus.cursorPosition = {
    x: event.clientX,
    y: event.clientY,
  }

  setTimeout(addGlobalListener, 0)
}

// ============================================================
// 关闭菜单 —— 关键修复：不用 lodash assign，逐个属性赋值
// ============================================================
export const closeContextMenu = () => {
  console.log('[menu] closeContextMenu 被调用')
  removeGlobalListener()

  contextMenus.target = null
  contextMenus.cursorPosition = null
  contextMenus.type = null
  contextMenus.dataSourceID = null
  contextMenus.options = null

  console.log('[menu] 状态已重置为:', {
    type: contextMenus.type,
    id: contextMenus.dataSourceID,
  })
}

// ============================================================
// 调试用
// ============================================================
if (typeof window !== 'undefined') {
  ;(window as any).closeContextMenu = closeContextMenu
  ;(window as any).openContextMenu = openContextMenu
  ;(window as any).contextMenus = contextMenus
}
