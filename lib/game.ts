export const ROLES = ["WOLF", "VILLAGER", "SEER", "GUARD", "FOOL", "CURSED", "WITCH", "CUPID"] as const;
export type Role = (typeof ROLES)[number];

export type GameActionType = "PAIR_LOVERS" | "PROTECT" | "VOTE_WOLF_TARGET" | "INSPECT" | "USE_HEAL" | "USE_POISON" | "NOMINATE" | "END_DEFENSE" | "VOTE_EXECUTION" | "ADVANCE_NIGHT";
export type Player = { id: string; name: string; alive: boolean };

export type GameView = {
  game: { id: string; phase: string; night: number; players: Player[]; publicEvents: string[]; winners?: string[]; winnerPlayerIds?: string[]; finalRoles?: Array<{ id: string; name: string; role?: Role; faction?: string }>; day: { nominationRound: number; scaffoldedId?: string; nominationVoteCount: number; executionVoteCount: number } };
  private: { playerId: string; configuredRoles?: Role[]; canAdvanceNight?: boolean; actionPhase?: string; role?: Role; faction?: string; notifications: string[]; lover?: { id: string; name: string; alive: boolean; role?: Role; faction?: string }; seerHistory?: Array<{ night: number; targetId: string; result: "WOLF" | "NOT_WOLF" }>; guardLastTargetId?: string; guardHistory?: Array<{ night: number; targetId: string }>; potions?: { heal: boolean; poison: boolean }; wolfPack?: Array<{ id: string; name: string }>; wolfVotes?: Record<string, string>; wolfBiteTarget?: string; nominationVoteTargetId?: string; executionVote?: boolean };
};

export const roleName: Record<Role, string> = { WOLF: "Ma sói", VILLAGER: "Dân làng", SEER: "Tiên tri", GUARD: "Bảo vệ", FOOL: "Kẻ ngốc", CURSED: "Kẻ bị nguyền", WITCH: "Phù thủy", CUPID: "Cupid" };
export const factionName: Record<string, string> = { VILLAGE: "Phe dân", WOLF: "Phe sói", LOVERS: "Tình nhân độc lập", FOOL: "Phe kẻ ngốc" };
export function isNight(phase: string) { return phase.startsWith("NIGHT_"); }
