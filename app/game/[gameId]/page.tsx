"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { factionName, isNight, roleName, ROLES, type GameActionType, type GameView, type Player, type Role } from "@/lib/game";

type Session = { playerId: string; isHost: boolean };
const controlClass = "w-full rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm outline-none focus:border-[#eabf65]";

function readSession(gameId: string): Session | null {
  const raw = localStorage.getItem(`werewolf:${gameId}`);
  if (!raw) return null;
  try { return JSON.parse(raw) as Session; } catch { return null; }
}

function phaseTitle(phase: string) {
  if (phase === "LOBBY") return "Phòng đang chờ";
  if (phase === "FINISHED") return "Ván chơi đã kết thúc";
  if (phase === "NIGHT_CUPID") return "Đêm · Cupid đang ghép đôi";
  if (phase === "NIGHT_GUARD") return "Đêm · Bảo vệ đang hành động";
  if (phase === "NIGHT_WOLF") return "Đêm · Nhóm Sói đang chọn mục tiêu";
  if (phase === "NIGHT_SEER") return "Đêm · Tiên tri đang soi";
  if (phase === "NIGHT_WITCH_HEAL") return "Đêm · Phù thủy đang dùng bình cứu";
  if (phase === "NIGHT_WITCH_POISON") return "Đêm · Phù thủy đang dùng bình giết";
  if (phase === "NIGHT" || isNight(phase)) return "Đang trong đêm";
  if (phase === "DAY_NOMINATION") return "Ban ngày · Chọn người lên giàn";
  if (phase === "DAY_DEFENSE") return "Ban ngày · Thời gian biện hộ";
  return "Ban ngày · Quyết định treo cổ";
}

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [view, setView] = useState<GameView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [secondTargetId, setSecondTargetId] = useState("");
  const [configuredRoles, setConfiguredRoles] = useState<Role[] | null>(null);

  const refresh = useCallback(async (activeSession: Session) => {
    try { setView(await api.viewGame(gameId, activeSession.playerId)); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải ván chơi."); }
    finally { setLoading(false); }
  }, [gameId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSession(readSession(gameId));
      setSessionReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [gameId]);

  useEffect(() => {
    if (!session) return;
    const initialTimer = window.setTimeout(() => void refresh(session), 0);
    const timer = window.setInterval(() => void refresh(session), 3500);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [refresh, session]);

  const players = useMemo(() => view?.game.players ?? [], [view]);
  const alivePlayers = players.filter((player) => player.alive);
  const playerName = (id?: string) => players.find((player) => player.id === id)?.name ?? "—";

  async function submit(type: GameActionType, extra: { targetId?: string; targetIds?: string[]; use?: boolean } = {}) {
    if (!session) return;
    setActing(true); setError("");
    try {
      setView(await api.action(gameId, session.playerId, { type, ...extra }));
      setTargetId(""); setSecondTargetId("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể gửi lựa chọn."); }
    finally { setActing(false); }
  }

  async function start() {
    if (!session) return;
    setActing(true); setError("");
    try { setView(await api.startGame(gameId, session.playerId)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể bắt đầu ván."); }
    finally { setActing(false); }
  }

  async function saveRoleConfiguration(roles: Role[]) {
    if (!session) return;
    setActing(true); setError("");
    try {
      setView(await api.configureRoles(gameId, session.playerId, roles));
      setConfiguredRoles(roles);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể lưu cấu hình role."); }
    finally { setActing(false); }
  }

  if (!sessionReady) return <main className="grid min-h-screen place-items-center text-[#eabf65]">Đang xác thực người chơi…</main>;
  if (!session) return <main className="mx-auto grid min-h-screen max-w-xl place-items-center px-6 text-center"><div><h1 className="text-3xl font-bold">Không tìm thấy danh tính người chơi</h1><p className="mt-3 text-[#afc3b6]">Hãy vào phòng từ trang chủ trên chính trình duyệt này.</p><Link className="mt-6 inline-block rounded-xl bg-[#eabf65] px-5 py-3 font-bold text-[#14291f]" href="/">Về trang chủ</Link></div></main>;
  if (loading) return <main className="grid min-h-screen place-items-center text-[#eabf65]">Đang vào ngôi làng…</main>;
  if (!view) return <main className="grid min-h-screen place-items-center px-6 text-center text-red-100">{error || "Không tìm thấy ván chơi."}</main>;

  const { game, private: privateView } = view;
  const self = players.find((player) => player.id === privateView.playerId);
  const canAct = (self?.alive || session.isHost) && game.phase !== "FINISHED";
  const roleSlots = configuredRoles ?? privateView.configuredRoles ?? Array.from({ length: players.length }, () => "VILLAGER" as Role);
  const configurationSaved = privateView.configuredRoles?.length === players.length && privateView.configuredRoles.every((role, index) => role === roleSlots[index]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-7 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <Link href="/" className="text-sm font-bold tracking-[0.18em] text-[#eabf65]">LÀNG TRONG RỪNG</Link>
        <div className="text-right"><p className="text-sm text-[#afc3b6]">Mã phòng</p><code className="text-xs text-white/70">{gameId}</code></div>
      </header>
      <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_1.25fr_0.85fr]">
        <aside className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#eabf65]">Danh sách làng</p>
          <div className="mt-4 space-y-2">
            {players.map((player) => <PlayerRow key={player.id} player={player} isSelf={player.id === privateView.playerId} />)}
          </div>
        </aside>
        <section className="rounded-3xl border border-white/10 bg-[#17392a]/90 p-6 shadow-2xl sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#eabf65]">{game.phase === "LOBBY" ? "Trước ván" : `Đêm ${game.night}`}</p><h1 className="mt-2 text-3xl font-black">{phaseTitle(game.phase)}</h1></div><button onClick={() => void refresh(session)} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-[#c8d8cc] hover:bg-white/10">Làm mới</button></div>
          {game.phase === "LOBBY" && <LobbyConfiguration playerCount={players.length} roles={roleSlots} isHost={session.isHost} disabled={acting} saved={configurationSaved} onChange={setConfiguredRoles} onSave={() => saveRoleConfiguration(roleSlots)} onStart={start} />}
          {game.phase !== "LOBBY" && <><div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5"><p className="text-sm text-[#afc3b6]">Vai trò của bạn</p><p className="mt-1 text-2xl font-bold text-[#f5d68e]">{privateView.role ? roleName[privateView.role] : "Đang chờ phân role"}</p>{privateView.faction && <p className="mt-1 text-sm text-[#c8d8cc]">{factionName[privateView.faction] ?? privateView.faction}</p>}{!self?.alive && <p className="mt-4 text-sm text-red-200">Bạn đã bị loại và chỉ có thể theo dõi ván chơi.</p>}</div>
          {game.phase === "DAY_EXECUTION" && self?.id === game.day.scaffoldedId && <p className="mt-4 rounded-xl border border-[#eabf65]/25 bg-[#eabf65]/10 p-4 text-sm text-[#f7df9e]">Bạn đang trên giàn nên không tham gia biểu quyết treo cổ.</p>}
          {privateView.lover && <div className="mt-4 rounded-2xl border border-pink-200/20 bg-pink-950/20 p-4 text-sm"><p className="font-bold text-pink-200">Người yêu: {privateView.lover.name}</p><p className="mt-1 text-pink-100/80">{privateView.lover.role && roleName[privateView.lover.role]} · {privateView.lover.alive ? "Còn sống" : "Đã bị loại"}</p></div>}
          {privateView.notifications.length > 0 && <div className="mt-4 space-y-2">{privateView.notifications.map((notice, index) => <p key={`${notice}-${index}`} className="rounded-xl border border-[#eabf65]/25 bg-[#eabf65]/10 px-4 py-3 text-sm text-[#f7df9e]">{notice}</p>)}</div>}
          {canAct && privateView.actionPhase && <ActionPanel phase={privateView.actionPhase} role={privateView.role} players={alivePlayers} actorId={privateView.playerId} targetId={targetId} secondTargetId={secondTargetId} setTargetId={setTargetId} setSecondTargetId={setSecondTargetId} disabled={acting} isHost={session.isHost} guardLastTargetId={privateView.guardLastTargetId} potions={privateView.potions} wolfTarget={playerName(privateView.wolfBiteTarget)} wolfPack={privateView.wolfPack} wolfVotes={privateView.wolfVotes} nominationVoteTargetId={privateView.nominationVoteTargetId} executionVote={privateView.executionVote} scaffoldedName={playerName(game.day.scaffoldedId)} onSubmit={submit} />}{session.isHost && privateView.canAdvanceNight && <button disabled={acting} onClick={() => void submit("ADVANCE_NIGHT")} className="mt-5 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-[#c8d8cc] disabled:opacity-40">Tiếp tục lượt đêm không có người hành động</button>}</>}
          {game.phase === "FINISHED" && <><Winners factions={game.winners ?? []} winnerPlayerIds={game.winnerPlayerIds} players={game.finalRoles ?? []} /><FinalRoles roles={game.finalRoles ?? []} /></>}
        </section>
        <aside className="space-y-5"><div className="rounded-2xl border border-white/10 bg-black/15 p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#eabf65]">Nhật ký chung</p><div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">{[...game.publicEvents].reverse().map((event, index) => <p key={`${event}-${index}`} className="text-sm leading-6 text-[#c8d8cc]">{event}</p>)}</div></div>
          {privateView.seerHistory && <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#eabf65]">Sổ soi</p><div className="mt-3 space-y-2 text-sm">{privateView.seerHistory.length === 0 ? <p className="text-[#afc3b6]">Chưa có kết quả.</p> : privateView.seerHistory.map((item) => <p key={`${item.night}-${item.targetId}`}>Đêm {item.night}: <b>{playerName(item.targetId)}</b> · {item.result === "WOLF" ? "Sói" : "Không phải sói"}</p>)}</div></div>}
          {privateView.guardHistory && <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#eabf65]">Sổ bảo vệ</p><div className="mt-3 space-y-2 text-sm">{privateView.guardHistory.length === 0 ? <p className="text-[#afc3b6]">Chưa bảo vệ ai.</p> : privateView.guardHistory.map((item) => <p key={`${item.night}-${item.targetId}`}>Đêm {item.night}: <b>{playerName(item.targetId)}</b></p>)}</div></div>}
          {privateView.wolfPack && <div className="rounded-2xl border border-red-200/15 bg-red-950/15 p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-200">Nhóm sói</p><div className="mt-3 space-y-1 text-sm text-red-100">{privateView.wolfPack.map((wolf) => <p key={wolf.id}>{wolf.name}</p>)}</div></div>}</aside>
      </section>
      {error && <p className="fixed bottom-6 left-1/2 w-[min(90vw,38rem)] -translate-x-1/2 rounded-xl border border-red-300/30 bg-red-950 px-4 py-3 text-sm text-red-100 shadow-xl">{error}</p>}
    </main>
  );
}

function PlayerRow({ player, isSelf }: { player: Player; isSelf: boolean }) { return <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${isSelf ? "bg-[#eabf65]/15 text-[#f7df9e]" : "bg-white/5"}`}><span>{player.name}{isSelf && " (bạn)"}</span><span className={player.alive ? "text-emerald-300" : "text-red-300"}>{player.alive ? "Còn sống" : "Đã loại"}</span></div>; }

function LobbyConfiguration({ playerCount, roles, isHost, disabled, saved, onChange, onSave, onStart }: { playerCount: number; roles: Role[]; isHost: boolean; disabled: boolean; saved: boolean; onChange: (roles: Role[]) => void; onSave: () => void; onStart: () => void }) {
  const count = (role: Role) => roles.filter((item) => item === role).length;
  const changeCount = (role: Role, delta: number) => {
    if (delta > 0 && roles.length < playerCount) onChange([...roles, role]);
    else if (delta > 0 && role !== "VILLAGER" && count("VILLAGER") > 0) {
      const villageIndex = roles.lastIndexOf("VILLAGER");
      onChange(roles.map((item, index) => index === villageIndex ? role : item));
    }
    if (delta < 0 && count(role) > 0) onChange(roles.filter((item, index) => item !== role || index !== roles.lastIndexOf(role)));
  };
  if (!isHost) return <div className="mt-8 rounded-2xl border border-[#eabf65]/25 bg-[#eabf65]/10 p-5"><p className="font-semibold">{playerCount} người đã vào phòng</p><p className="mt-1 text-sm text-[#c8d8cc]">Chờ chủ phòng cấu hình các role của ván và bắt đầu.</p></div>;
  return <div className="mt-8 rounded-2xl border border-[#eabf65]/25 bg-[#eabf65]/10 p-5"><p className="font-semibold">{playerCount} người đã vào phòng</p><p className="mt-1 text-sm text-[#c8d8cc]">Chọn số lượng mỗi role trong ván. Tổng phải bằng số người chơi; server sẽ xáo ngẫu nhiên role trước khi chia.</p><p className="mt-4 text-sm font-semibold text-[#f7df9e]">Đã chọn: {roles.length}/{playerCount} role</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{ROLES.map((role) => <div key={role} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/15 px-3 py-2.5"><span className="text-sm">{roleName[role]}</span><div className="flex items-center gap-3"><button type="button" aria-label={`Giảm ${roleName[role]}`} disabled={disabled || count(role) === 0} onClick={() => changeCount(role, -1)} className="grid h-7 w-7 place-items-center rounded-md border border-white/20 disabled:opacity-40">−</button><span className="w-4 text-center font-bold">{count(role)}</span><button type="button" aria-label={`Tăng ${roleName[role]}`} disabled={disabled || (roles.length >= playerCount && (role === "VILLAGER" || count("VILLAGER") === 0))} onClick={() => changeCount(role, 1)} className="grid h-7 w-7 place-items-center rounded-md border border-[#eabf65]/60 text-[#f7df9e] disabled:opacity-40">+</button></div></div>)}</div><div className="mt-5 flex flex-wrap gap-3"><button disabled={disabled || roles.length !== playerCount} onClick={onSave} className="rounded-xl border border-[#eabf65]/70 px-5 py-3 font-bold text-[#f7df9e] disabled:cursor-not-allowed disabled:opacity-40">Lưu cấu hình</button><button disabled={disabled || !saved} onClick={onStart} className="rounded-xl bg-[#eabf65] px-5 py-3 font-bold text-[#14291f] disabled:cursor-not-allowed disabled:opacity-40">Bắt đầu ván</button></div>{!saved && <p className="mt-3 text-xs text-[#f7df9e]">Hãy lưu cấu hình role hiện tại trước khi bắt đầu.</p>}</div>;
}

function ActionPanel({ phase, role, players, actorId, targetId, secondTargetId, setTargetId, setSecondTargetId, disabled, isHost, guardLastTargetId, potions, wolfTarget, wolfPack, wolfVotes, nominationVoteTargetId, executionVote, scaffoldedName, onSubmit }: { phase: string; role?: string; players: Player[]; actorId: string; targetId: string; secondTargetId: string; setTargetId: (id: string) => void; setSecondTargetId: (id: string) => void; disabled: boolean; isHost: boolean; guardLastTargetId?: string; potions?: { heal: boolean; poison: boolean }; wolfTarget: string; wolfPack?: Array<{ id: string; name: string }>; wolfVotes?: Record<string, string>; nominationVoteTargetId?: string; executionVote?: boolean; scaffoldedName: string; onSubmit: (type: GameActionType, extra?: { targetId?: string; targetIds?: string[]; use?: boolean }) => Promise<void> }) {
  const selectable = players;
  const choose = (label: string, action: GameActionType, options: Player[] = selectable) => <div className="mt-6"><p className="font-bold">{label}</p><select className={`${controlClass} mt-3`} value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">Chọn người chơi</option>{options.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><button disabled={disabled || !targetId} onClick={() => void onSubmit(action, { targetId })} className="mt-3 rounded-xl bg-[#eabf65] px-4 py-2.5 text-sm font-bold text-[#14291f] disabled:opacity-40">Xác nhận</button></div>;
  if (phase === "NIGHT_CUPID" && role === "CUPID") return <div className="mt-6"><p className="font-bold">Ghép hai người thành tình nhân</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><select className={controlClass} value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">Người thứ nhất</option>{players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><select className={controlClass} value={secondTargetId} onChange={(event) => setSecondTargetId(event.target.value)}><option value="">Người thứ hai</option>{players.filter((player) => player.id !== targetId).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></div><button disabled={disabled || !targetId || !secondTargetId} onClick={() => void onSubmit("PAIR_LOVERS", { targetIds: [targetId, secondTargetId] })} className="mt-3 rounded-xl bg-[#eabf65] px-4 py-2.5 text-sm font-bold text-[#14291f] disabled:opacity-40">Ghép đôi</button></div>;
  if (phase === "NIGHT_GUARD" && role === "GUARD") return choose(`Bảo vệ một người${guardLastTargetId ? " (không được trùng đêm trước)" : ""}`, "PROTECT", players.filter((player) => player.id !== guardLastTargetId));
  if (phase === "NIGHT_WOLF" && role === "WOLF") { const hasVoted = Boolean(wolfVotes?.[actorId]); return <div className="mt-6"><p className="font-bold">Bỏ phiếu chọn mục tiêu cắn</p><p className="mt-1 text-sm text-[#afc3b6]">Khi mọi Sói còn sống đã chọn, người có nhiều phiếu nhất sẽ bị cắn. Nếu hòa, server chọn ngẫu nhiên một người trong nhóm hòa.</p><div className="mt-3 rounded-xl border border-red-200/15 bg-red-950/15 p-3 text-sm">{wolfPack?.map((wolf) => <p key={wolf.id}>{wolf.name}: <b>{wolfVotes?.[wolf.id] ? players.find((player) => player.id === wolfVotes[wolf.id])?.name ?? "Đã chọn" : "Đang chọn…"}</b></p>)}</div>{hasVoted ? <p className="mt-3 text-sm text-[#f7df9e]">Bạn đã gửi lựa chọn. Chờ các Sói còn lại.</p> : <><select className={`${controlClass} mt-3`} value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">Chọn mục tiêu</option>{players.filter((player) => !wolfPack?.some((wolf) => wolf.id === player.id)).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><button disabled={disabled || !targetId} onClick={() => void onSubmit("VOTE_WOLF_TARGET", { targetId })} className="mt-3 rounded-xl bg-[#eabf65] px-4 py-2.5 text-sm font-bold text-[#14291f] disabled:opacity-40">Gửi phiếu cắn</button></>}</div>; }
  if (phase === "NIGHT_SEER" && role === "SEER") return choose("Soi một người", "INSPECT");
  if (phase === "NIGHT_WITCH_HEAL" && role === "WITCH") { if (!potions?.heal) return <div className="mt-6"><p className="font-bold">Bạn đã hết bình cứu.</p><ActionButton disabled={disabled} label="Tiếp tục" muted onClick={() => onSubmit("USE_HEAL", { use: false })} /></div>; return <div className="mt-6"><p className="font-bold">Mục tiêu bị cắn: {wolfTarget}</p><p className="mt-1 text-sm text-[#afc3b6]">Bạn có muốn dùng bình cứu?</p><div className="mt-3 flex gap-2"><ActionButton disabled={disabled} label="Dùng bình cứu" onClick={() => onSubmit("USE_HEAL", { use: true })} /><ActionButton disabled={disabled} label="Không dùng" muted onClick={() => onSubmit("USE_HEAL", { use: false })} /></div></div>; }
  if (phase === "NIGHT_WITCH_POISON" && role === "WITCH") { if (!potions?.poison) return <div className="mt-6"><p className="font-bold">Bạn đã hết bình giết.</p><ActionButton disabled={disabled} label="Tiếp tục" muted onClick={() => onSubmit("USE_POISON", { use: false })} /></div>; return <div className="mt-6"><p className="font-bold">Bạn có muốn dùng bình giết?</p><select className={`${controlClass} mt-3`} value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">Chọn mục tiêu nếu sử dụng</option>{players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><div className="mt-3 flex gap-2"><ActionButton disabled={disabled || !targetId} label="Dùng bình giết" onClick={() => onSubmit("USE_POISON", { use: true, targetId })} /><ActionButton disabled={disabled} label="Không dùng" muted onClick={() => onSubmit("USE_POISON", { use: false })} /></div></div>; }
  if (phase === "DAY_NOMINATION" && nominationVoteTargetId) return <p className="mt-6 rounded-xl border border-[#eabf65]/25 bg-[#eabf65]/10 p-4 text-sm text-[#f7df9e]">Bạn đã bỏ phiếu đưa <b>{players.find((player) => player.id === nominationVoteTargetId)?.name ?? "người chơi"}</b> lên giàn.</p>;
  if (phase === "DAY_NOMINATION") return choose("Chọn người lên giàn", "NOMINATE", selectable.filter((player) => player.id !== actorId));
  if (phase === "DAY_DEFENSE" && isHost) return <div className="mt-6"><p className="font-bold">{scaffoldedName} đang biện hộ</p><ActionButton disabled={disabled} label="Kết thúc biện hộ" onClick={() => onSubmit("END_DEFENSE")} /></div>;
  if (phase === "DAY_EXECUTION" && executionVote !== undefined) return <p className="mt-6 rounded-xl border border-[#eabf65]/25 bg-[#eabf65]/10 p-4 text-sm text-[#f7df9e]">Bạn đã chọn <b>{executionVote ? "treo cổ" : "không treo"}</b> {scaffoldedName}.</p>;
  if (phase === "DAY_EXECUTION") return <div className="mt-6"><p className="font-bold">Có treo cổ {scaffoldedName} không?</p><div className="mt-3 flex gap-2"><ActionButton disabled={disabled} label="Treo cổ" onClick={() => onSubmit("VOTE_EXECUTION", { use: true })} /><ActionButton disabled={disabled} label="Không treo" muted onClick={() => onSubmit("VOTE_EXECUTION", { use: false })} /></div></div>;
  return <p className="mt-6 rounded-xl border border-white/10 bg-black/15 p-4 text-sm text-[#afc3b6]">Hãy chờ những người chơi liên quan hoàn thành lượt của họ.</p>;
}

function ActionButton({ label, onClick, disabled, muted = false }: { label: string; onClick: () => Promise<void>; disabled: boolean; muted?: boolean }) { return <button disabled={disabled} onClick={() => void onClick()} className={`rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-40 ${muted ? "border border-white/20 text-white" : "bg-[#eabf65] text-[#14291f]"}`}>{label}</button>; }

function Winners({ factions, winnerPlayerIds, players }: { factions: string[]; winnerPlayerIds?: string[]; players: Array<{ id: string; name: string; faction?: string }> }) { const winners = winnerPlayerIds ? players.filter((player) => winnerPlayerIds.includes(player.id)) : players.filter((player) => player.faction && factions.includes(player.faction)); return <div className="mt-6 rounded-2xl border border-[#eabf65]/50 bg-[#eabf65]/15 p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#eabf65]">Kết quả ván chơi</p><h2 className="mt-2 text-2xl font-black text-[#f7df9e]">{factions.map((faction) => factionName[faction] ?? faction).join(" · ")} chiến thắng</h2><p className="mt-3 text-sm text-[#c8d8cc]">Người chiến thắng: <b className="text-white">{winners.map((player) => player.name).join(", ") || "Chưa có dữ liệu"}</b></p></div>; }

function FinalRoles({ roles }: { roles: Array<{ id: string; name: string; role?: string; faction?: string }> }) { return <div className="mt-6 rounded-2xl border border-[#eabf65]/30 bg-[#eabf65]/10 p-5"><p className="font-bold text-[#f7df9e]">Vai trò cuối ván</p><div className="mt-3 grid gap-2 text-sm">{roles.map((player) => <p key={player.id}>{player.name} · {player.role && roleName[player.role as keyof typeof roleName]} · {player.faction && (factionName[player.faction] ?? player.faction)}</p>)}</div></div>; }
