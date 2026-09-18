import type { GameActionType, GameView, Role } from "./game";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(error?.message) ? error.message.join(", ") : error?.message;
    throw new Error(message ?? "Không thể kết nối đến máy chủ.");
  }
  return response.json() as Promise<T>;
}

export const api = {
  createGame: (hostName: string) => request<{ gameId: string; hostPlayerId: string }>("/games", { method: "POST", body: JSON.stringify({ hostName }) }),
  joinGame: (gameId: string, name: string) => request<{ playerId: string }>(`/games/${gameId}/join`, { method: "POST", body: JSON.stringify({ name }) }),
  configureRoles: (gameId: string, playerId: string, roles: Role[]) => request<GameView>(`/games/${gameId}/configuration`, { method: "POST", body: JSON.stringify({ playerId, roles }) }),
  startGame: (gameId: string, playerId: string) => request<GameView>(`/games/${gameId}/start`, { method: "POST", body: JSON.stringify({ playerId }) }),
  viewGame: (gameId: string, playerId: string) => request<GameView>(`/games/${gameId}/view?playerId=${encodeURIComponent(playerId)}`),
  action: (gameId: string, playerId: string, action: { type: GameActionType; targetId?: string; targetIds?: string[]; use?: boolean }) => request<GameView>(`/games/${gameId}/actions`, { method: "POST", body: JSON.stringify({ playerId, ...action }) }),
};
