import { useEffect, useState } from "./preact.js";

/**
 * @template {string} State
 * @template {{ type: string }} Event
 * @template Context
 * @param {StateMachine<State, Event, Context>} machine
 * @return {[State, Context, (event: Event) => Promise<void>]}
 *
 * TODO: Return same transition function reference for each call
 */
export function useStateMachine(machine) {
  const [{ state, context }, update] = useState({
    state: machine.initial,
    context: machine.context,
  });

  useEffect(() => {
    let cancelled = false;
    let cancel = () => cancelled = true;
    let currentState = machine.states[state];

    if (typeof currentState !== "function") {
      return cancel;
    }

    Promise
      // @ts-ignore : doesn't think currentState is callable
      .resolve(currentState(context))
      .then(updates => {
        if (cancelled) return;
        update(updates);
      });

    return cancel;
  }, [state]);

  /**
   * @param {Event} event
   */
  async function transition(event) {
    let currentState = machine.states[state];

    if (!currentState.hasOwnProperty(event.type)) {
      return console.warn(`Cannot transition with a "${event.type}" event in the "${state}" state`);
    }

    let eventHandler = currentState[event.type];
    let updates = await eventHandler(context, event);
    update(updates);
  }

  return [state, context, transition];
}
