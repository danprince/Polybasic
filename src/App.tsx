import "./App.css";
import { Fragment, FunctionComponent, VNode, h } from "preact";
import { useRef } from "preact/hooks";
import { StateMachine, useStateMachine } from "./useStateMachine";
import { Spinner } from "./Spinner";
import { Progress } from "./Progress";
import { LanguageSelector } from "./LanguageSelector";
import { useEventListener, useAnimateOnChange, classNames, delay, shuffle } from "./utils";
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
  | "pick-word"
  | "wait-for-answer"
  | "correct"
  | "incorrect"
  | "next-word"
  | "stats"

export type Event =
  | { type: "select-language", languageId: string }
  | { type: "load-words", sourceLanguageWords: string[], targetLanguageWords: string[] }
  | { type: "reset" }
  | { type: "submit-answer", wordIndex: number }
  | { type: "continue" }

export type Context = {
  sourceLanguageId: string,
  targetLanguageId: string,
  sourceLanguageWords: [],
  targetLanguageWords: [],

  currentWordLanguage: "source" | "target",
  currentWordIndex: number,
  optionWordIndexes: number[],
  answerWordIndex: number,

  wordsPerRound: number,
  streak: number,
  answers: Answer[],
}

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
    wordsPerRound: 20,
    streak: 0,
    answers: [],
  };
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
          state: "pick-word",
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

    "pick-word": ctx => {
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
    },

    "incorrect": async context => {
      await delay(1500);

      return {
        state: "next-word",
        context,
      };
    },

    "correct": async context => {
      await delay(1500);

      return {
        state: "next-word",
        context,
      };
    },

    "next-word"(ctx) {
      if (ctx.answers.length > 0 && ctx.answers.length % ctx.wordsPerRound === 0) {
        return {
          state: "stats",
          context: ctx,
        };
      } else {
        return {
          state: "pick-word",
          context: ctx,
        };
      }
    },

    "stats": {
      "continue"(ctx) {
        return {
          state: "pick-word",
          context: {
            ...ctx,
            answers: []
          },
        };
      }
    }
  }
};

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
        Polybasic
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
            class="header-flag"
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
            Learn 90% of a language with <br></br><a href="https://en.wikipedia.org/wiki/Basic_English" target="_blank">850 of the words</a>.
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

    case "load-words": {
      break;
    }

    case "error": {
      view = (
        <>
          <h1>Something Went Wrong</h1>
        </>
      );
      break;
    }

    case "stats": {
      view = (
        <Stats
          state={state}
          context={context}
          transition={transition}
        />
      );
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
        <>
          <Streak value={context.streak} />
          <Progress
            value={context.answers.length / context.wordsPerRound}
          />
          <GitHubLink />
        </>
      );
    }
  }

  return (
    <div class={`app ${context.streak > 1 ? "app-streak" : ""}`}>
      <header class="app-header">{header}</header>
      <div class="app-view">{view}</div>
      <footer class="app-footer">{footer}</footer>
    </div>
  );
};

let Streak: FunctionComponent<{ value: number }> = ({ value}) => {
  let hasStreak = value > 1;
  let animate = useAnimateOnChange(value) && hasStreak;

  let className = classNames(
    "streak",
    hasStreak ? "streak-active" : "streak-inactive",
    animate && "streak-pop"
  );

  return (
    <div class={className} title="Streak">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-flame" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M12 12c2 -2.96 0 -7 -1 -8c0 3.038 -1.762 4.383 -2.989 5.642c-1.226 1.26 -2.011 2.598 -2.011 4.358a6 6 0 1 0 12 0c0 -1.532 -.77 -2.94 -1.714 -4c-1.786 3 -3.077 3 -4.286 2z" />
      </svg>
      {value}
    </div>
  )
};

let GitHubLink: FunctionComponent = () => {
  return (
    <a class="github-link" href="https://github.com/danprince/polybasic" target="_blank" title="GitHub">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-brand-github" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
      </svg>
    </a>
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

let Stats: FunctionComponent<{
  state: State,
  context: Context,
  transition: (event: Event) => Promise<any>,
}> = ({
  state,
  context,
  transition,
}) => {
  let correctAnswers = context.answers.filter(answer => {
    return answer.actual === answer.expected;
  });

  let correctPercentage = correctAnswers.length / context.answers.length;

  return (
    <div class="stats">
      <h2 class="stats-title">{getStatsMessage(correctPercentage)}</h2>
      <p class="stats-description">You got <strong>{correctAnswers.length}</strong> answers correct!</p>
      <button class="stats-continue" onClick={() => transition({ type: "continue" })}>Continue</button>
    </div>
  );
};

function getStatsMessage(score: number) {
  if (score === 0) {
    return "Uh oh...";
  } else if (score < 0.5) {
    return "Not bad";
  } else if (score < 0.75) {
    return "Good job";
  } else {
    return "Amazing";
  }
}
