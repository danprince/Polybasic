import { useEffect } from "preact/hooks";

export function useEventListener<
  Name extends keyof WindowEventMap
> (
  target: EventTarget,
  name: Name,
  callback: (event: WindowEventMap[Name]) => any,
  dependencies: any[]
) {
  useEffect(() => {
    target.addEventListener(name, callback);
    return () => target.removeEventListener(name, callback);
  }, [target, name, callback, ...dependencies]);
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function shuffle<T extends any[]>(array: T): T {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}
