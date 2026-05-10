import { type CSSProperties } from 'react'

import { type useSettings } from '@/context/setting'

export function getStyle(
  settings: ReturnType<typeof useSettings>['settings'],
  id: string,
  isActive: boolean
): CSSProperties {
  const customColor = settings.buttonColors?.[id]
  const themeEnabled = settings.theme?.enabled

  let backgroundColor: string | undefined
  let color: string | undefined
  let buttonHover: string | undefined

  if (customColor) {
    backgroundColor = isActive ? '#000' : customColor
    color = '#fff'
    buttonHover = isActive ? '#000' : '#404040'
  } else if (themeEnabled) {
    backgroundColor = isActive ? settings.theme.buttonActive : settings.theme.buttonColor
    color = settings.theme.buttonText
    buttonHover = isActive ? settings.theme.buttonActive : settings.theme.buttonHoverColor
  } else if (isActive) {
    backgroundColor = '#000'
    color = '#fff'
    buttonHover = '#404040'
  } else {
    buttonHover = '#e0e0e0'
  }

  return {
    backgroundColor,
    color,
    '--button-hover': buttonHover,
  } as CSSProperties
}
