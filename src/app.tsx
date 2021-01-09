import { h } from "preact";
import { useEventListener } from "./utils";
import { StateMachine, useStateMachine } from "./use-state-machine";
import { Game } from "./game";
import languages from "./languages";

export type LanguageType = "source" | "target";

export type AppState =
  | "select-language"
  | "loading"
  | "playing"
  | "error";

export type AppEvent =
  | { type: "select-language", languageId: string }
  | { type: "loaded-words", sourceLanguageWords: string[], targetLanguageWords: string[] }
  | { type: "retry" }
  | { type: "reset" }

export interface AppContext {
  sourceLanguageId: string,
  targetLanguageId: string,
  sourceLanguageWords: string[],
  targetLanguageWords: string[],
}

function getInitialContext() {
  return {
    sourceLanguageId: "en",
    targetLanguageId: "",
    sourceLanguageWords: [],
    targetLanguageWords: [],
  };
}

let appStateMachine: StateMachine<AppState, AppEvent, AppContext> = {
  initial: "select-language",
  context: getInitialContext(),
  states: {
    "select-language": {
      "select-language"(context, event) {
        return {
          state: "loading",
          context: { ...context, targetLanguageId: event.languageId },
        };
      }
    },

    "loading": async context => {
      try {
        let [
          sourceLanguageWords,
          targetLanguageWords
        ] = await Promise.all([
          fetch(`words/${context.sourceLanguageId}.json`).then(res => res.json()),
          fetch(`words/${context.targetLanguageId}.json`).then(res => res.json()),
        ]);

        history.pushState("playing", "");

        return {
          state: "playing",
          context: {
            ...context,
            sourceLanguageWords,
            targetLanguageWords,
          },
        }
      } catch (err) {
        console.error(err);
        return {
          state: "error",
          context,
        };
      }
    },

    "error": {
      "retry"(context) {
        return {
          state: "select-language",
          context,
        };
      }
    },

    "playing": {
      "reset"(context) {
        return { state: "select-language", context };
      }
    },
  }
};

export function App() {
  let [state, context, transition] = useStateMachine(appStateMachine);

  // If the user tries to navigate back without leaving the app, take
  // them back to the first menu.
  useEventListener(window, "popstate", () => {
    transition({ type: "reset" });
  }, [transition]);

  switch (state) {
    case "select-language": {
      return (
        <Screen>
          <h1 class="title">Polybasic</h1>
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
        </Screen>
      );
    }

    case "loading": {
      return (
        <Screen>
          <Spinner />
        </Screen>
      );
    }

    case "error": {
      return (
        <Screen>
          <h1>Error</h1>
        </Screen>
      );
    }

    case "playing": {
      return (
        <Screen class="game-screen">
          <header class="header">
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
              <img
                width={24}
                height={24}
                src={`flags/${context.targetLanguageId}.svg`}
              />
            </a>
          </header>
          <div class="view">
            <Game
              sourceLanguageWords={context.sourceLanguageWords}
              targetLanguageWords={context.targetLanguageWords}
            />
          </div>
        </Screen>
      );
    }
  }
}

function Screen({
  children = null,
  class: className = "",
}) {
  return (
    <div class={`screen ${className}`}>
      {children}
    </div>
  );
}

function LanguageSelector({ onSelect, languages }) {
  return (
    <div class="language-selector">
      {languages.map(language => {
        return (
          <button
            class="language-selector-item"
            onClick={() => onSelect(language.id)}
          >
            <img
              class="language-selector-flag"
              width={80}
              height={80}
              src={`flags/${language.id}.svg`}
            />
          </button>
        );
      })}
    </div>
  );
}

function Spinner() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" class="spinner" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" />
    </svg>
  );
}
