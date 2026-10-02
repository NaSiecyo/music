import { assign } from 'lodash-es'
import { proxy, ref } from 'valtio'

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
// 全局监听器（不依赖 React 组件生命周期）
// ============================================================
let globalHandler: ((e: MouseEvent) => void) | null = null

const removeGlobalListener = () => {
  if (globalHandler) {
    document.removeEventListener('mousedown', globalHandler, true)
    globalHandler = null
  }
}

const addGlobalListener = () => {
  // 避免重复绑定
  removeGlobalListener()

  globalHandler = (e: MouseEvent) => {
    // 找到真实菜单容器（measure 版本被标记为 data-context-menu-measure）
    const menuEl = document.querySelector(
      '[data-context-menu-root]:not([data-context-menu-measure])'
    ) as HTMLElement | null

    // 如果菜单还没渲染出来，不处理
    if (!menuEl) return

    // 点击在菜单内 → 不关闭（让菜单项的 onClick 处理）
    if (menuEl.contains(e.target as Node)) return

    // 其他情况 → 关闭菜单
    closeContextMenu()
  }

  // 捕获阶段绑定，不受任何组件 stopPropagation 影响
  document.addEventListener('mousedown', globalHandler, true)
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
  // 再次右键同一个元素 → toggle 关闭
  if (event.target === contextMenus.target) {
    closeContextMenu()
    return
  }

  const target = event.target as HTMLElement
  contextMenus.target = ref(target)
  contextMenus.type = type
  contextMenus.dataSourceID = dataSourceID
  contextMenus.options = options
  contextMenus.cursorPosition = {
    x: event.clientX,
    y: event.clientY,
  }

  // 关键：延迟一帧后绑定监听器
  // 原因是当前这次右键事件本身也会触发 mousedown，
  // 如果立即绑定，会被自己触发导致菜单刚开就关
  setTimeout(addGlobalListener, 0)
}

// ============================================================
// 关闭菜单
// ============================================================
export const closeContextMenu = () => {
  removeGlobalListener()
  assign(contextMenus, initContextMenu)
}
