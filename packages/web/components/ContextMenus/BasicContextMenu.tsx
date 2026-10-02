// ============================================================
// BasicContextMenu.tsx
// 通用的右键菜单/上下文菜单容器组件
//
// 作用：
//   1. 接收父组件传入的菜单项数组（items）
//   2. 根据触发位置（鼠标坐标或某个按钮）计算菜单应该出现在屏幕的哪个位置
//   3. 通过 Portal 把菜单渲染到 document.body 上（避免被父容器 overflow 裁剪）
//   4. 监听外部点击、Esc 键、页面滚动，自动关闭菜单
// ============================================================

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
// useEffect:     在渲染后执行副作用（绑定事件监听）
// useLayoutEffect: 在 DOM 更新后、浏览器绘制前同步执行（用于计算菜单位置，避免闪烁）
// useRef:        保存 DOM 引用，跨渲染保持同一个对象
// useState:      保存菜单最终位置

import useLockMainScroll from '@/web/hooks/useLockMainScroll'
// 自定义 Hook：菜单打开时锁定主内容区滚动，防止背景跟着一起滚

import useMeasure from 'react-use-measure'
// 第三方 Hook：测量 DOM 元素的宽高
// 因为菜单内容长度不确定，必须先渲染出来量一下才能算位置

import { ContextMenuItem } from './types'
// 菜单项的 TypeScript 类型定义

import MenuPanel from './MenuPanel'
// 实际的菜单面板渲染组件

import { createPortal } from 'react-dom'
// React 提供的 API：把子节点渲染到指定的 DOM 节点（这里是 document.body）

import { ContextMenuPosition } from './types'
// 菜单位置的类型定义，包含 x / y / transformOrigin

// ============================================================
// 组件 Props 类型定义
// ============================================================
const BasicContextMenu = ({
  onClose,        // 关闭菜单的回调（父组件传进来的）
  items,          // 菜单项数组
  target,         // 触发菜单的 DOM 元素（用于计算相对位置）
  cursorPosition, // 鼠标点击时的坐标（{x, y}）
  options,        // 可选配置：使用鼠标坐标 或 固定位置
  classNames,     // 额外的 className
}: {
  // 注意：onClose 参数改成可选，因为 Esc/滚动等场景不需要传事件对象
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
  // ============================================================
  // 1. Ref 与 State 定义
  // ============================================================

  // menuRef：真实菜单容器的 DOM 引用
  // 用途：判断点击是否发生在菜单内部（内部不关闭，外部才关闭）
  const menuRef = useRef<HTMLDivElement>(null)

  // measureRef / menu：测量用
  // 先渲染一个"隐藏的测量版本"拿到菜单尺寸（width / height），
  // 再用尺寸计算最终位置，最后渲染"真正的菜单"
  const [measureRef, menu] = useMeasure()

  // position：菜单最终显示的位置
  // null 表示还没算好（此时不渲染真实菜单，只渲染测量版本）
  const [position, setPosition] = useState<ContextMenuPosition | null>(null)

  // ============================================================
  // 2. 菜单打开时锁定主内容滚动
  // ============================================================
  // 当 position 有值（菜单真正显示）时，锁定背景滚动
  // 避免用户滚动页面导致菜单位置与目标元素错位
  useLockMainScroll(!!position)

  // ============================================================
  // 3. 计算菜单位置
  // ============================================================
  // 使用 useLayoutEffect 而不是 useEffect：
  //   因为位置计算必须在浏览器绘制前完成，否则会出现"菜单位置闪烁"（先出现在左上角再跳到正确位置）
  useLayoutEffect(() => {
    // ---------- 模式 A：跟随鼠标位置 ----------
    // 适用于：右键点击出现的菜单
    if (options?.useCursorPosition) {
      // 备选的左右坐标：优先向右展开，空间不足则向左展开
      const leftX = cursorPosition.x
      const rightX = cursorPosition.x - menu.width

      // 备选的上下坐标：优先向下展开，空间不足则向上展开
      const bottomY = cursorPosition.y
      const topY = cursorPosition.y - menu.height

      const position = {
        // 如果向右展开后还在窗口内，就用向右；否则向左
        x: leftX + menu.width < window.innerWidth ? leftX : rightX,
        // 如果向下展开后还在窗口内，就用向下；否则向上
        y: bottomY + menu.height < window.innerHeight ? bottomY : topY,
      }
      setPosition(position)
    }
    // ---------- 模式 B：固定方向相对于 target 元素 ----------
    // 适用于："更多"按钮点击后弹出的菜单，明确指定弹出方向
    else if (options?.fixedPosition) {
      // 把 "top-left" / "bottom-right" 这种字符串拆成两个方向
      const [vertical, horizontal] = options.fixedPosition.split('-') as [
        'top' | 'bottom',
        'left' | 'right'
      ]

      // 获取目标元素的屏幕位置和尺寸
      const button = target.getBoundingClientRect()

      // 备选坐标
      const leftX = button.x
      const rightX = button.x - menu.width + button.width
      const bottomY = button.y + button.height + 8  // +8 是留一点间距
      const topY = button.y - menu.height - 8

      const position: ContextMenuPosition = {
        x: horizontal === 'left' ? leftX : rightX,
        y: vertical === 'bottom' ? bottomY : topY,
        // transformOrigin 用于 CSS 动画时以正确的角为原点缩放
        transformOrigin: `origin-${options.fixedPosition}`,
      }
      setPosition(position)
    }
    // ---------- 模式 C：默认，自动判断相对 target 的位置 ----------
    // 适用于：没有特殊配置的菜单
    else {
      const button = target.getBoundingClientRect()
      const leftX = button.x
      const rightX = button.x - menu.width + button.width
      const bottomY = button.y + button.height + 8
      const topY = button.y - menu.height - 8

      const position = {
        x: leftX + menu.width < window.innerWidth ? leftX : rightX,
        y: bottomY + menu.height < window.innerHeight ? bottomY : topY,
      }
      setPosition(position)
    }
    // 依赖项：target 变化、菜单尺寸变化、模式变化、鼠标坐标变化时，重新计算
  }, [target, menu, options?.useCursorPosition, cursorPosition])

  // ============================================================
  // 4. 关闭菜单的事件监听（核心修复部分）
  // ============================================================
  // 原代码用的是 useClickAway(menuRef, onClose)，但存在时序问题：
  //   首次渲染时 menuRef.current 还是 null，
  //   而真实菜单只有在 position 有值后才渲染，
  //   导致 useClickAway 未能正确绑定。
  //
  // 所以这里改成手动绑定 useEffect，并等待 position 有值再绑定。
  useEffect(() => {
    // position 还没算好，说明菜单还没渲染出来，不能绑定
    if (!position) return

    // ---------- 监听 1：点击菜单外部关闭 ----------
    // 使用 mousedown 而不是 click：
    //   mousedown 比 click 更早触发，体验更灵敏
    //   而且能防止"点外部 → 触发 click → 打开新菜单"的竞态问题
    const handleClickOutside = (e: MouseEvent) => {
      // 如果点击的目标不在菜单内部，就关闭
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose(e)
      }
    }

    // ---------- 监听 2：按 Esc 键关闭 ----------
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // ---------- 监听 3：页面滚动时关闭 ----------
    // 因为菜单是绝对定位的，页面一滚动位置就错位了
    // 所以干脆直接关闭
    const handleScroll = () => {
      onClose()
    }

    // 绑定监听器
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    // 第三个参数 true 表示在捕获阶段监听：
    //   这样能捕获到任意子元素的滚动事件，而不只是 window 自身
    window.addEventListener('scroll', handleScroll, true)

    // 清理函数：组件卸载或依赖变化时，移除所有监听器
    // 避免内存泄漏和重复绑定
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [position, onClose]) // 依赖：position 变化时重新绑定

  // ============================================================
  // 5. 渲染
  // ============================================================
  // 使用 createPortal 把菜单渲染到 document.body：
  //   1. 不受父组件 CSS（如 overflow: hidden / transform）的影响
  //   2. z-index 层级更可控
  return createPortal(
    <>
      {/* ---------- 测量用的隐藏菜单 ---------- */}
      {/* 位置设在屏幕外（99999），用户看不到，只用于测量宽高 */}
      <MenuPanel
        position={{ x: 99999, y: 99999 }}
        items={items}
        ref={measureRef}
        onClose={() => {
          // 测量版本不需要关闭逻辑，传空函数即可
        }}
        forMeasure={true}
        classNames={classNames}
      />

      {/* ---------- 真实的可见菜单 ---------- */}
      {/* 只有当 position 计算完成后才渲染 */}
      {position && (
        <MenuPanel
          position={position}
          items={items}
          ref={menuRef}       // 绑定 ref，用于判断点击是否在内部
          onClose={onClose}   // 把关闭回调传给菜单面板（点击菜单项时会调用）
          classNames={classNames}
        />
      )}
    </>,
    document.body
  )
}

export default BasicContextMenu
