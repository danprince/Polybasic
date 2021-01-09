import "./App.css";
import { Fragment, FunctionComponent, VNode, h } from "preact";
import { useRef } from "preact/hooks";
import { StateMachine, useStateMachine } from "./useStateMachine";
import { Spinner } from "./Spinner";
import { Progress } from "./Progress";
import { LanguageSelector } from "./LanguageSelector";
import { useEventListener, delay, shuffle } from "./utils";
import languages from "./languages";

interface Answer {
  language: "source" | "target",
  expected: number,
  actual: number,
  time: number,
}

export type State =
  | "select-language"
  | "load-words"
  | "error"
  | "get-next-word"
  | "wait-for-answer"
  | "correct"
  | "incorrect"
  | "skipped"
  | "stats"

export type Event =
  | { type: "select-language", languageId: string }
  | { type: "load-words", sourceLanguageWords: string[], targetLanguageWords: string[] }
  | { type: "reset" }
  | { type: "submit-answer", wordIndex: number }
  | { type: "skip-answer" }

export type Context = {
  sourceLanguageId: string,
  targetLanguageId: string,
  sourceLanguageWords: [],
  targetLanguageWords: [],

  currentWordLanguage: "source" | "target",
  currentWordIndex: number,
  optionWordIndexes: number[],
  answerWordIndex: number,

  streak: number,
  answers: Answer[],
}

let stateMachine: StateMachine<State, Event, Context> = {
  initial: "select-language",
  context: getInitialContext(),
  states: {
    "select-language": {
      "select-language"(ctx, event) {
        return {
          state: "load-words",
          context: {
            ...ctx,
            targetLanguageId: event.languageId,
          }
        };
      },
    },

    "load-words": async ctx => {
      try {
        let [
          sourceLanguageWords,
          targetLanguageWords
        ] = await Promise.all([
          fetch(`words/${ctx.sourceLanguageId}.json`).then(res => res.json()),
          fetch(`words/${ctx.targetLanguageId}.json`).then(res => res.json()),
        ]);

        return {
          state: "get-next-word",
          context: {
            ...ctx,
            sourceLanguageWords,
            targetLanguageWords,
          },
        }
      } catch (err) {
        console.error(err);
        return {
          state: "error",
          context: ctx,
        };
      }
    },

    "error": {
      "reset"(ctx) {
        return {
          state: "select-language",
          context: ctx,
        };
      }
    },

    "get-next-word": ctx => {
      let length = ctx.sourceLanguageWords.length;
      let index = Math.floor(Math.random() * length);
      let options = [index];

      for (let i = 0; i < 2; i++) {
        options.push(Math.floor(Math.random() * length));
      }

      return {
        state: "wait-for-answer",
        context: {
          ...ctx,
          currentWordIndex: index,
          currentWordLanguage: Math.random() > 0.5 ? "source" : "target",
          optionWordIndexes: shuffle(options),
        }
      };
    },

    "wait-for-answer": {
      "submit-answer"(ctx, event) {
        let correct = event.wordIndex === ctx.currentWordIndex;

        let answer: Answer = {
          language: ctx.currentWordLanguage,
          expected: ctx.currentWordIndex,
          actual: event.wordIndex,
          time: Date.now(),
        };

        return {
          state: correct ? "correct" : "incorrect",
          context: {
            ...ctx,
            streak: correct ? ctx.streak + 1 : 0,
            answerWordIndex: event.wordIndex,
            answers: [...ctx.answers, answer],
          },
        };
      },
      "skip-answer"(ctx) {
        return {
          state: "skipped",
          context: ctx,
          streak: 0,
        };
      }
    },

    "incorrect": async context => {
      await delay(1500);

      return {
        state: "get-next-word",
        context,
      };
    },

    "correct": async context => {
      await delay(1500);

      return {
        state: "get-next-word",
        context,
      };
    },

    "skipped": async context => {
      await delay(1500);

      return {
        state: "get-next-word",
        context,
      };
    },

    "stats": {

    }
  }
};

function getInitialContext(): Context {
  return {
    sourceLanguageId: "en",
    targetLanguageId: "",
    sourceLanguageWords: [],
    targetLanguageWords: [],
    currentWordLanguage: "source",
    currentWordIndex: 0,
    optionWordIndexes: [],
    answerWordIndex: 0,
    streak: 0,
    answers: [],
  };
}

export let App: FunctionComponent = () => {
  let [state, transition, context] = useStateMachine(stateMachine);

  let header = (
    <>
      <a
        href=""
        class="header-title"
        onClick={event => {
          event.preventDefault();
          transition({ type: "reset" });
        }}
      >
        polybasic
      </a>
      <a
        href=""
        onClick={event => {
          event.preventDefault();
          transition({ type: "reset" });
        }}
      >
        {context.targetLanguageId && (state === "load-words" ? (
          <Spinner width={24} height={24} />
        ) : (
          <img
            width={24}
            height={24}
            src={`flags/${context.targetLanguageId}.svg`}
          />
        ))}
      </a>
    </>
  );

  let footer: VNode;
  let view: VNode;

  switch (state) {
    case "select-language": {
      view = (
        <>
          <div class="tagline">
            Learn 90% of a language <a href="https://en.wikipedia.org/wiki/Basic_English" target="_blank">with 850 words.</a>
          </div>
          <LanguageSelector
            languages={languages.filter(language => {
              return language.id !== context.sourceLanguageId
            })}
            onSelect={languageId => {
              transition({ type: "select-language", languageId });
            }}
          />
        </>
      );
      break;
    }

    case "error": {
      view = (
        <>
          <h1>Something Went Wrong</h1>
        </>
      );
    }

    case "load-words": {
      break;
    }

    default: {
      view = (
        <Game
          state={state}
          context={context}
          transition={transition}
        />
      );

      footer = (
        <Progress value={context.answers.length / 20} />
      );
    }
  }

  return (
    <div class="app">
      <header class="app-header">{header}</header>
      <div class="app-view">{view}</div>
      <footer class="app-footer">{footer}</footer>
    </div>
  );
};

let Game: FunctionComponent<{
  state: State,
  context: Context,
  transition: (event: Event) => Promise<any>,
}> = ({
  state,
  context,
  transition,
}) => {
  let buttonsRef = useRef([]);

  useEventListener(window, "keydown", event => {
    if (event.key < "0" || event.key > "9") return;

    let index = parseInt(event.key) - 1;
    let button = buttonsRef.current[index];

    if (button) {
      if (document.activeElement !== button) {
        button.focus();
      } else {
        let wordIndex = context.optionWordIndexes[index];
        transition({ type: "submit-answer", wordIndex });
      }
    }
  }, []);

  return (
    <div class={`game ${state}`}>
      <h1 class="game-word">
        {context.currentWordLanguage === "source"
          ? context.sourceLanguageWords[context.currentWordIndex]
          : context.targetLanguageWords[context.currentWordIndex]}
      </h1>
      <div class="choices">
        {context.optionWordIndexes.map((wordIndex, index) => {
          let isCorrect = wordIndex === context.currentWordIndex;
          let isAnswer = wordIndex === context.answerWordIndex;
          let className = state === "wait-for-answer"
            ? `choice`
            : `choice ${isCorrect ? "choice-correct" : "choice-incorrect"} ${isAnswer ? "choice-answer" : ""}`

          return (
            <button
              ref={button => buttonsRef.current[index] = button}
              disabled={state !== "wait-for-answer"}
              class={className}
              onClick={() => {
                transition({ type: "submit-answer", wordIndex });
              }}
            >
              {context.currentWordLanguage === "target"
                ? context.sourceLanguageWords[wordIndex]
                : context.targetLanguageWords[wordIndex]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
