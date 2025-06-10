'use client'

import React, { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

let toastCount = 0

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_VALUE
  return toastCount.toString()
}

const toastStore: ToastState = {
  toasts: [],
}

const listeners: Array<(state: ToastState) => void> = []

function dispatch(action: {
  type: 'ADD_TOAST' | 'DISMISS_TOAST' | 'REMOVE_TOAST'
  toast?: Toast
  toastId?: string
}) {
  switch (action.type) {
    case 'ADD_TOAST':
      if (action.toast) {
        toastStore.toasts = [...toastStore.toasts, action.toast]
      }
      break
    case 'DISMISS_TOAST':
      if (action.toastId) {
        toastStore.toasts = toastStore.toasts.map((t) =>
          t.id === action.toastId ? { ...t, open: false } : t
        )
      } else {
        toastStore.toasts = toastStore.toasts.map((t) => ({ ...t, open: false }))
      }
      break
    case 'REMOVE_TOAST':
      toastStore.toasts = toastStore.toasts.filter(
        (t) => t.id !== action.toastId
      )
      break
  }

  listeners.forEach((listener) => {
    listener(toastStore)
  })
}

function toast({
  title,
  description,
  variant = 'default',
  duration = 5000,
  ...props
}: Omit<Toast, 'id'>) {
  const id = genId()

  const update = (props: Partial<Toast>) =>
    dispatch({
      type: 'ADD_TOAST',
      toast: { ...props, id },
    })

  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      title,
      description,
      variant,
      duration,
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = useState<ToastState>(toastStore)

  const subscribe = useCallback((listener: (state: ToastState) => void) => {
    listeners.push(listener)
    return () => {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  React.useEffect(() => {
    return subscribe(setState)
  }, [subscribe])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}

export { useToast, toast } 