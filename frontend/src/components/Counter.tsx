import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div aria-label="counter">
      <button onClick={() => setCount((c) => c - 1)} aria-label="decrement">–</button>
      <span data-testid="count" style={{ padding: "0 .75rem" }}>{count}</span>
      <button onClick={() => setCount((c) => c + 1)} aria-label="increment">+</button>
    </div>
  );
}
