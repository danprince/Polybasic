import { h, render } from "./preact.js";
import { useEventListener } from "./utils.js";
import { useStateMachine } from "./use-state-machine.js";
import { Game } from "./game.js";
import languages from "./languages.js";

function getInitialContext() {
  return {
    sourceLanguageId: "en",
    targetLanguageId: "",
    sourceLanguageWords: [],
    targetLanguageWords: [],
  };
}

/**
 * @type {StateMachine<AppState, AppEvent, AppContext>}
 */
let appStateMachine = {
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

function App() {
  let [state, context, transition] = useStateMachine(appStateMachine);

  // If the user tries to navigate back without leaving the app, take
  // them back to the first menu.
  useEventListener(window, "popstate", () => {
    transition({ type: "reset" });
  }, [transition]);

  switch (state) {
    case "select-language": {
      return h(Screen, {},
        h("h1", { class: "title" }, "Polybasic"),

        h("div", { class: "tagline" },
          "Learn 90% of a language ",
          h("a", {
            href: "https://en.wikipedia.org/wiki/Basic_English",
            target: "_blank",
          }, "with 850 words.")
        ),

        h(LanguageSelector, {
          languages: languages.filter(language => {
            return language.id !== context.sourceLanguageId
          }),
          onSelect(languageId) {
            transition({ type: "select-language", languageId });
          }
        })
      );
    }

    case "loading": {
      return h(Screen, {},
        h(Spinner, null),
      );
    }

    case "error": {
      return h(Screen, {},
        h("h1", null, "Error")
      );
    }

    case "playing": {
      return h("div", { class: "screen game-screen" },
        h("header", { class: "header" },
          h("a", {
            href: "",
            class: "header-title",
            onClick(event) {
              event.preventDefault();
              transition({ type: "reset" });
            }
          }, "polybasic"),

          h("a", {
            href: "",
            onClick(event) {
              event.preventDefault();
              transition({ type: "reset" });
            }
          },
            h("img", {
              src: `flags/${context.targetLanguageId}.svg`,
              width: 24,
              height: 24,
            }),
          ),
        ),

        h("div", {
          class: "view"
        }, (
          h(Game, {
            sourceLanguageWords: context.sourceLanguageWords,
            targetLanguageWords: context.targetLanguageWords,
          })
        ))
      );
    }
  }
}

function Screen({
  children = null,
}) {
  return h("div", { class: "screen", children });
}

/**
 * @param {object} props
 * @param {(languageId: string) => any} props.onSelect
 * @param {typeof languages} props.languages
 */
function LanguageSelector({ onSelect, languages }) {
  return h("div", {
    class: "language-selector"
  }, languages.map(language => {
    return h("button", {
      class: "language-selector-item",
      onClick: () => onSelect(language.id),
    },
      h("img", {
        class: "language-selector-flag",
        width: 80,
        height: 80,
        src: `flags/${language.id}.svg`,
      }),
      h("div", {
        class: "language-selector-name",
      }, language.name)
    );
  }));
}

function Spinner() {
  return (
    h("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      class: "spinner",
      viewBox: "0 0 100 100",
    },
      h("circle", {
        cx: 50,
        cy: 50,
        r: 45,
      })
    )
  );
}

render(
  h(App, null),
  document.getElementById("root"),
);
