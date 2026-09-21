export const ROLES = ["WOLF", "VILLAGER", "SEER", "GUARD", "FOOL", "CURSED", "WITCH", "CUPID"] as const;
export type Role = (typeof ROLES)[number];

export const roleDescription: Record<Role, string> = {
  WOLF: "Ban đêm, cùng bầy Sói chọn một người chơi để cắn. Hãy phối hợp kín đáo với các Sói còn sống.",
  VILLAGER: "Bạn không có hành động ban đêm. Ban ngày, quan sát, thảo luận và bỏ phiếu để tìm ra Ma sói.",
  SEER: "Mỗi đêm, bạn có thể soi một người chơi còn sống để biết họ có phải Sói hay không.",
  GUARD: "Mỗi đêm, bạn bảo vệ một người khỏi vết cắn của Sói; không được bảo vệ cùng một người ở hai đêm liên tiếp.",
  FOOL: "Bạn thắng ngay nếu bị cả làng treo cổ hợp lệ. Hãy thuyết phục mọi người nghi ngờ bạn.",
  CURSED: "Nếu bị Sói cắn mà không được cứu hoặc bảo vệ, bạn không chết mà trở thành Ma sói.",
  WITCH: "Bạn có một bình cứu và một bình độc cho cả ván; mỗi đêm có thể chọn dùng hoặc không dùng từng bình.",
  CUPID: "Trong đêm đầu tiên, chọn hai người trở thành tình nhân. Họ biết nhau và có thể thay đổi phe theo cặp đôi.",
};

export type GameActionType = "PAIR_LOVERS" | "PROTECT" | "VOTE_WOLF_TARGET" | "INSPECT" | "USE_HEAL" | "USE_POISON" | "NOMINATE" | "CAST_BLANK_NOMINATION" | "END_DEFENSE" | "VOTE_EXECUTION" | "CAST_BLANK_EXECUTION";
export type Player = { id: string; name: string; alive: boolean };

export type GameView = {
  game: { id: string; phase: string; phaseDeadlineAt?: string; night: number; players: Player[]; publicEvents: string[]; winners?: string[]; winnerPlayerIds?: string[]; finalRoles?: Array<{ id: string; name: string; role?: Role; faction?: string }>; day: { nominationRound: number; scaffoldedId?: string; nominationVoteCount: number; executionVoteCount: number; nominationVotes: Array<{ voterId: string; targetId: string | null }>; executionVotes: Array<{ voterId: string; vote: boolean | null }> } };
  private: { playerId: string; isHost: boolean; configuredRoles?: Role[]; actionPhase?: string; role?: Role; faction?: string; notifications: string[]; lover?: { id: string; name: string; alive: boolean; role?: Role; faction?: string }; seerHistory?: Array<{ night: number; targetId: string; result: "WOLF" | "NOT_WOLF" }>; guardLastTargetId?: string; guardHistory?: Array<{ night: number; targetId: string }>; potions?: { heal: boolean; poison: boolean }; wolfPack?: Array<{ id: string; name: string }>; wolfVotes?: Record<string, string>; wolfBiteTarget?: string; nominationVoteTargetId?: string | null; nominationVoteSubmitted?: boolean; executionVote?: boolean | null };
};

export const roleName: Record<Role, string> = { WOLF: "Ma sói", VILLAGER: "Dân làng", SEER: "Tiên tri", GUARD: "Bảo vệ", FOOL: "Kẻ ngốc", CURSED: "Kẻ bị nguyền", WITCH: "Phù thủy", CUPID: "Cupid" };
export const factionName: Record<string, string> = { VILLAGE: "Phe dân", WOLF: "Phe sói", LOVERS: "Tình nhân độc lập", FOOL: "Phe kẻ ngốc" };
export function isNight(phase: string) { return phase.startsWith("NIGHT_"); }
