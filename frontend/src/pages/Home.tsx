import { useEffect, useState } from "react";
import { Counter } from "../components/Counter";
import { api } from "../api/client";

type Todo = { id: number; title: string };

export function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Todo[]>("/todos").then((res) => {
      setTodos(res);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Counter />
      <hr />
      <section>
        <h2>Todos</h2>
        {loading ? <p aria-busy="true">Loading…</p> : (
          <ul aria-label="todo-list">
            {todos.map((t) => <li key={t.id}>{t.title}</li>)}
          </ul>
        )}
      </section>
    </>
  );
}
