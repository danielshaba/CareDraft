'use client'

import React from 'react'
import { useDefaultContextActions } from './useDefaultContextActions'

export const ContextMenuActionsRegistrar: React.FC = () => {
  // Register the default context menu actions
  useDefaultContextActions()

  // This component doesn't render anything, it just registers actions
  return null
}

export default ContextMenuActionsRegistrar 