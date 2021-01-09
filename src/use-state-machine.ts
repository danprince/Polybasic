import { useEffect, useState } from "preact/hooks";

export interface StateMachine<
  State extends string,
  Event extends { type: string },
  Context = any
> {
  initial: State,
  context: Context,
  states: {
    [K in State]: (
      | PassiveStateHandler<State, Context>
      | ActiveStateHandler<State, Event, Context>
    )
  }
}

type PassiveStateHandler<State extends string, Context> =
  (context: Context) => (
    | { state: State, context: Context }
    | Promise<{ state: State, context: Context }>
  );

type ActiveStateHandler<
  State extends string,
  Event extends { type: string },
  Context = any,
> = {
  [T in Event["type"]]?: (
    context: Context,
    event: Event & { type: T },
  ) => (
    | { state: State, context: Context }
    | Promise<{ state: State, context: Context }>
  )
}

export function useStateMachine<
  State extends string,
  Event extends { type: string },
  Context
> (
  machine: StateMachine<State, Event, Context>
): [
  State,
  Context,
  (event: Event) => Promise<void>
] {
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

  async function transition(event: Event) {
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
