type LanguageType = "source" | "target";

declare type AppState =
  | "select-language"
  | "loading"
  | "playing"
  | "error";

declare type AppEvent =
  | { type: "select-language", languageId: string }
  | { type: "loaded-words", sourceLanguageWords: string[], targetLanguageWords: string[] }
  | { type: "retry" }
  | { type: "reset" }

declare interface AppContext {
  sourceLanguageId: string,
  targetLanguageId: string,
  sourceLanguageWords: string[],
  targetLanguageWords: string[],
}

declare type GameState =
  | "new-word"
  | "waiting-for-answer"
  | "correct"
  | "incorrect"
  | "skipped"

declare type GameEvent =
  | { type: "show-word", index: number, language: LanguageType, options: number[] }
  | { type: "submit-answer", index: number }
  | { type: "skip-answer" }

declare interface GameContext {
  currentWordIndex: number,
  currentWordLanguage: LanguageType,
  optionWordIndexes: number[],
  answerWordIndex: number,
}

declare interface StateMachine<
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
