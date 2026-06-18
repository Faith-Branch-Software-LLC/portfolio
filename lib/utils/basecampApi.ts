const USER_AGENT = 'FaithBranch PM (neiswangersebastian@gmail.com)';

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'User-Agent': USER_AGENT,
    'Content-Type': 'application/json',
  };
}

export interface BasecampProject {
  id: number;
  name: string;
  description: string;
  status: string;
  dock: { name: string; id: number; title: string; app_url: string }[];
}

export interface BasecampTodolist {
  id: number;
  title: string;
  description: string;
  completed_ratio: string;
}

export interface BasecampTodo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  assignees: { name: string }[];
  due_on: string | null;
  created_at: string;
  updated_at: string;
}

export async function listProjects(token: string, accountId: string, apiBase = 'https://3.basecampapi.com'): Promise<BasecampProject[]> {
  const res = await fetch(`${apiBase}/${accountId}/projects.json`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(`Basecamp projects fetch failed: ${res.status}`);
  return res.json();
}

export async function listTodolists(
  token: string,
  accountId: string,
  projectId: string,
  apiBase = 'https://3.basecampapi.com',
): Promise<BasecampTodolist[]> {
  const project = await fetch(`${apiBase}/${accountId}/projects/${projectId}.json`, {
    headers: headers(token),
  }).then((r) => r.json());

  const todosetDock = project.dock?.find((d: { name: string }) => d.name === 'todoset');
  if (!todosetDock) return [];

  const todosetId = todosetDock.id;
  const todoset = await fetch(`${apiBase}/${accountId}/buckets/${projectId}/todosets/${todosetId}.json`, {
    headers: headers(token),
  }).then((r) => r.json());

  const res = await fetch(todoset.todolists_url, { headers: headers(token) });
  if (!res.ok) return [];
  return res.json();
}

export async function listTodos(
  token: string,
  accountId: string,
  projectId: string,
  todolistId: string,
  apiBase = 'https://3.basecampapi.com',
): Promise<BasecampTodo[]> {
  const all: BasecampTodo[] = [];
  let url: string | null =
    `${apiBase}/${accountId}/buckets/${projectId}/todolists/${todolistId}/todos.json`;

  while (url) {
    const fetchRes: Response = await fetch(url, { headers: headers(token) });
    if (!fetchRes.ok) break;
    const page: BasecampTodo[] = await fetchRes.json();
    all.push(...page);
    const link: string = fetchRes.headers.get('link') ?? '';
    const next: string | null = link.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
    url = next;
  }
  return all;
}

export async function createTodo(
  token: string,
  accountId: string,
  projectId: string,
  todolistId: string,
  title: string,
  description?: string,
  apiBase = 'https://3.basecampapi.com',
): Promise<BasecampTodo> {
  const res = await fetch(
    `${apiBase}/${accountId}/buckets/${projectId}/todolists/${todolistId}/todos.json`,
    {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ content: title, description: description ?? '' }),
    },
  );
  if (!res.ok) throw new Error(`Basecamp createTodo failed: ${res.status}`);
  return res.json();
}

export async function completeTodo(
  token: string,
  accountId: string,
  projectId: string,
  todoId: string,
  apiBase = 'https://3.basecampapi.com',
): Promise<void> {
  await fetch(`${apiBase}/${accountId}/buckets/${projectId}/todos/${todoId}/completion.json`, {
    method: 'POST',
    headers: headers(token),
  });
}

export async function uncompleteTodo(
  token: string,
  accountId: string,
  projectId: string,
  todoId: string,
  apiBase = 'https://3.basecampapi.com',
): Promise<void> {
  await fetch(`${apiBase}/${accountId}/buckets/${projectId}/todos/${todoId}/completion.json`, {
    method: 'DELETE',
    headers: headers(token),
  });
}

export async function deleteTodo(
  token: string,
  accountId: string,
  projectId: string,
  todoId: string,
  apiBase = 'https://3.basecampapi.com',
): Promise<void> {
  await fetch(`${apiBase}/${accountId}/buckets/${projectId}/todos/${todoId}.json`, {
    method: 'DELETE',
    headers: headers(token),
  });
}
