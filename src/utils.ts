import { useEffect, useRef, useState } from "preact/hooks";

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

export function useAnimateOnChange(value: any, duration = 500) {
  let [animating, setAnimating] = useState(false);
  let valueRef = useRef(value);

  useEffect(() => {
    if (value !== valueRef.current && value > 0) {
      setAnimating(true);
      let timeout = setTimeout(() => setAnimating(false), duration);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return animating;
}

export function classNames(...classNames: (string | boolean | undefined | null)[]) {
  return classNames.filter(name => name).join(" ");
}
