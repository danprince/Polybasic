import "./Spinner.css";
import { FunctionComponent, h } from "preact";

export let Spinner: FunctionComponent<{
  width?: number,
  height?: number,
}> = ({ width = 32, height = 32 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="spinner"
      viewBox="0 0 100 100"
      width={width}
      height={height}
    >
      <circle cx="50" cy="50" r="45" />
    </svg>
  );
}
