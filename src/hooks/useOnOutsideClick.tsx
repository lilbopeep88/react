import React, {useEffect, useCallback} from 'react'

export type TouchOrMouseEvent = MouseEvent | TouchEvent

export type UseOnOutsideClickSettings = {
  containerRef: React.RefObject<HTMLDivElement>
  ignoreClickRefs?: React.RefObject<HTMLElement>[]
  onClickOutside: (e: TouchOrMouseEvent) => void
}

type ShouldCallClickHandlerSettings = {
  ignoreClickRefs?: React.RefObject<HTMLElement>[]
  containerRef: React.RefObject<HTMLDivElement>
  e: TouchOrMouseEvent
}

const handlers: ((e: MouseEvent) => void)[] = []

/**
 * Calls all handlers in reverse order
 * @param event The MouseEvent generated by the click event.
 */
function handleClick(event: MouseEvent) {
  if (!event.defaultPrevented) {
    for (let i = handlers.length - 1; i >= 0; --i) {
      handlers[i](event)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (event.defaultPrevented) {
        break
      }
    }
  }
}

const shouldCallClickHandler = ({ignoreClickRefs, containerRef, e}: ShouldCallClickHandlerSettings): boolean => {
  let shouldCallHandler = true

  // don't call click handler if the mouse event was triggered by an auxiliary button (right click/wheel button/etc)
  if (e instanceof MouseEvent && e.button > 0) {
    shouldCallHandler = false
  }

  // don't call handler if the click happened inside of the container
  if (containerRef.current?.contains(e.target as Node)) {
    shouldCallHandler = false
    // don't call handler if click happened on an ignored ref
  } else if (ignoreClickRefs) {
    for (const ignoreRef of ignoreClickRefs) {
      if (ignoreRef.current?.contains(e.target as Node)) {
        shouldCallHandler = false
        // if we encounter one, break early, we don't need to go through the rest
        break
      }
    }
  }
  return shouldCallHandler
}

export const useOnOutsideClick = ({containerRef, ignoreClickRefs, onClickOutside}: UseOnOutsideClickSettings): void => {
  const onOutsideClickInternal = useCallback(
    (e: TouchOrMouseEvent) => {
      if (shouldCallClickHandler({ignoreClickRefs, containerRef, e})) {
        onClickOutside(e)
      }
    },
    [onClickOutside, containerRef, ignoreClickRefs]
  )
  useEffect(() => {
    if (handlers.length === 0) {
      document.addEventListener('click', handleClick)
    }
    setTimeout(() => handlers.push(onOutsideClickInternal))
    return () => {
      handlers.splice(
        handlers.findIndex(h => h === onOutsideClickInternal),
        1
      )
      if (handlers.length === 0) {
        document.removeEventListener('click', handleClick)
      }
    }
  }, [onOutsideClickInternal])
}
