import "./Progress.css";
import { FunctionComponent, h } from "preact";

export let Progress: FunctionComponent<{ value?: number }> = ({ value = 0 }) => {
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
