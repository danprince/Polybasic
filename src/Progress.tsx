import "./Progress.css";
import { FunctionComponent, h } from "preact";

export let Progress: FunctionComponent<{
  value: number
}> = ({
  value,
}) => {
  return (
    <div class="progress">
      <div class="progress-track">
        <div class="progress-bar" style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}
