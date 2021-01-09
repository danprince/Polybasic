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

interface Timestamps {
  [key: string]: [number, number]
}

export class Sounds<T extends Timestamps> {
  private audio: HTMLAudioElement;
  private timestamps: T;

  constructor(src: string, timestamps: T) {
    this.audio = new Audio(src);
    this.timestamps = timestamps;
  }

  play(name: keyof T) {
    let [start, end] = this.timestamps[name];
    this.audio.currentTime = start;
    this.audio.play();
    setTimeout(() => this.audio.pause(), (end - start) * 1000);
  }
}
