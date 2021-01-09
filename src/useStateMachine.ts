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

type Transition<State extends string, Context> = {
  state: State,
  context: Context,
}

type PassiveStateHandler<State extends string, Context> =
  (context: Context) => (
    | Transition<State, Context>
    | Promise<Transition<State, Context>>
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
    | Transition<State, Context>
    | Promise<Transition<State, Context>>
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
  (event: Event) => Promise<void>,
  Context,
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
      .then((transition: Transition<State, Context>) => {
        if (cancelled) return;
        update(transition);
      });

    return cancel;
  }, [state]);

  async function transition(event: Event) {
    let currentState = machine.states[state];

    if (!currentState.hasOwnProperty(event.type)) {
      return console.warn(`Cannot transition with a "${event.type}" event in the "${state}" state`);
    }

    let eventHandler = currentState[event.type];
    let transition = await eventHandler(context, event);
    update(transition);
  }

  return [state, transition, context];
}
