import { h } from "./preact.js";
import { useStateMachine } from "./use-state-machine.js";

/**
 * @type {StateMachine<GameState, GameEvent, GameContext>}
 */
let gameStateMachine = {
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

/**
 * @param {object} props
 * @param {string[]} props.sourceLanguageWords
 * @param {string[]} props.targetLanguageWords
 */
export function Game({
  sourceLanguageWords,
  targetLanguageWords,
}) {
  let [state, context, transition] = useStateMachine(gameStateMachine);

  let currentWord = context.currentWordLanguage === "source"
    ? sourceLanguageWords[context.currentWordIndex]
    : targetLanguageWords[context.currentWordIndex];

  return (
    h("div", { class: `game ${state}` },
      h("h1", { class: "game-word" }, currentWord),

      h("div", { class: "choices" },
        context.optionWordIndexes.map(index => {
          let isCorrect = index === context.currentWordIndex;
          let isAnswer = index === context.answerWordIndex;

          return h("button", {
            disabled: state !== "waiting-for-answer",

            class: state === "waiting-for-answer"
              ? `choice`
              : `choice ${isCorrect ? "choice-correct" : "choice-incorrect"} ${isAnswer ? "choice-answer" : ""}`,

            onClick() {
              transition({ type: "submit-answer", index });
            },

            children: context.currentWordLanguage === "target"
              ? sourceLanguageWords[index]
              : targetLanguageWords[index]
          });
        }),
      ),

      h("button", {
        class: "skip",
        onClick() {
          transition({ type: "skip-answer" });
        }
      }, "Skip"),
    )
  );
}

/**
 * @param {number} ms
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @template T
 * @param {T[]} array
 * @return {T[]}
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}
