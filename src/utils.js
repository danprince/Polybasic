import {  useEffect } from "./preact.js";

/**
 * @template {keyof WindowEventMap} Name
 * @param {EventTarget} target
 * @param {Name} name
 * @param {(event: WindowEventMap[Name]) => any} callback
 * @param {any[]} dependencies
 */
export function useEventListener(target, name, callback, dependencies) {
  useEffect(() => {
    target.addEventListener(name, callback);
    return () => target.removeEventListener(name, callback);
  }, [target, name, callback, ...dependencies]);
}
