import { h } from "preact";
import { useEventListener, delay, shuffle } from "./utils";
import { StateMachine, useStateMachine } from "./use-state-machine";
import type { LanguageType } from "./app";

type GameState =
  | "new-word"
  | "waiting-for-answer"
  | "correct"
  | "incorrect"
  | "skipped"

type GameEvent =
  | { type: "show-word", index: number, language: LanguageType, options: number[] }
  | { type: "submit-answer", index: number }
  | { type: "skip-answer" }

type GameContext = {
  currentWordIndex: number,
  currentWordLanguage: LanguageType,
  optionWordIndexes: number[],
  answerWordIndex: number,
}

let gameStateMachine: StateMachine<GameState, GameEvent, GameContext> = {
  initial: "new-word",
  context: {
    currentWordIndex: -1,
    currentWordLanguage: "source",
    optionWordIndexes: [],
    answerWordIndex: -1,
  },
  states: {
    "new-word"(context) {
      let length = 850;
      let index = Math.floor(Math.random() * length);
      let options = [index];

      for (let i = 0; i < 2; i++) {
        options.push(Math.floor(Math.random() * length));
      }

      return {
        state: "waiting-for-answer",
        context: {
          ...context,
          currentWordIndex: index,
          currentWordLanguage: Math.random() > 0.5 ? "source" : "target",
          optionWordIndexes: shuffle(options),
        }
      };
    },

    "waiting-for-answer": {
      "submit-answer"(context, event) {
        let correct = event.index === context.currentWordIndex;

        return {
          state: correct ? "correct" : "incorrect",
          context: {
            ...context,
            answerWordIndex: event.index,
          },
        };
      },
      "skip-answer"(context) {
        return {
          state: "skipped",
          context,
        };
      },
    },

    "incorrect": async context => {
      await delay(1500);

      return {
        state: "new-word",
        context,
      };
    },

    "correct": async context => {
      await delay(1500);

      return {
        state: "new-word",
        context,
      };
    },

    "skipped": async context => {
      await delay(1500);

      return {
        state: "new-word",
        context,
      };
    },
  },
};

export function Game({
  sourceLanguageWords,
  targetLanguageWords,
}: {
  sourceLanguageWords: string[],
  targetLanguageWords: string[],
}) {
  let [state, context, transition] = useStateMachine(gameStateMachine);

  useEventListener(window, "keydown", event => {
    if (event.key >= "0" && event.key <= "9") {
      let buttons = document.querySelectorAll(".choice") as NodeListOf<HTMLButtonElement>;
      let index = parseInt(event.key) - 1;
      let button = buttons[index];

      if (button) {
        if (document.activeElement !== button) {
          button.focus();
        } else {
          let wordIndex = context.optionWordIndexes[index];
          transition({ type: "submit-answer", index: wordIndex });
        }
      }
    }
  }, []);

  return (
    <div class={`game ${state}`}>
      <h1 class="game-word">
        {context.currentWordLanguage === "source"
          ? sourceLanguageWords[context.currentWordIndex]
          : targetLanguageWords[context.currentWordIndex]}
      </h1>
      <div class="choices">
        {context.optionWordIndexes.map(wordIndex => {
          let isCorrect = wordIndex === context.currentWordIndex;
          let isAnswer = wordIndex === context.answerWordIndex;
          let className = state === "waiting-for-answer"
            ? `choice`
            : `choice ${isCorrect ? "choice-correct" : "choice-incorrect"} ${isAnswer ? "choice-answer" : ""}`

          return (
            <button
              disabled={state !== "waiting-for-answer"}
              class={className}
              onClick={() => {
                transition({ type: "submit-answer", index: wordIndex });
              }}
            >
              {context.currentWordLanguage === "target"
                ? sourceLanguageWords[wordIndex]
                : targetLanguageWords[wordIndex]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Progress({ value = 0 }) {
  return (
    h("div", { class: "progress" }, [
      h("div", { class: "progress-track" },
        h("div", {
          class: "progress-bar",
          style: { width: `${value * 100}%` },
        })
      )
    ])
  );
}

