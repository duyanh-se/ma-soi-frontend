"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

function saveSession(gameId: string, playerId: string, isHost: boolean) {
  localStorage.setItem(`werewolf:${gameId}`, JSON.stringify({ playerId, isHost }));
}

export default function Home() {
  const router = useRouter();
  const [hostName, setHostName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [gameId, setGameId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function createGame(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const room = await api.createGame(hostName);
      saveSession(room.gameId, room.hostPlayerId, true);
      router.push(`/game/${room.gameId}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tạo phòng."); }
    finally { setLoading(false); }
  }

  async function joinGame(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const player = await api.joinGame(gameId.trim(), joinName);
      saveSession(gameId.trim(), player.playerId, false);
      router.push(`/game/${gameId.trim()}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể vào phòng."); }
    finally { setLoading(false); }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-10 sm:px-8">
      <header className="mb-10 flex items-center justify-between">
        <div className="text-xs font-bold tracking-[0.28em] text-[#eabf65]">LÀNG TRONG RỪNG</div>
        <a className="text-sm text-[#afc3b6] hover:text-white" href="http://localhost:3000/docs" target="_blank" rel="noreferrer">API Docs</a>
      </header>
      <section className="mb-10 max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#eabf65]">Quản trò tự động</p>
        <h1 className="text-5xl font-black tracking-tight sm:text-7xl">Ma Sói</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-[#c8d8cc]">Web giữ bí mật vai trò, điều phối lượt đêm/ngày và xử lý luật chơi. Cả làng vẫn thảo luận với nhau ở nơi bạn chọn.</p>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
        <form onSubmit={createGame} className="rounded-3xl border border-white/10 bg-[#153326]/90 p-6 shadow-2xl sm:p-8">
          <h2 className="text-2xl font-bold">Tạo một ván mới</h2>
          <p className="mt-2 text-sm leading-6 text-[#afc3b6]">Mời mọi người vào phòng trước. Sau đó, chủ phòng chọn số lượng từng role cho cả ván; hệ thống sẽ xáo ngẫu nhiên khi chia.</p>
          <label className="mt-7 block text-sm font-semibold">Tên của bạn<input required value={hostName} onChange={(event) => setHostName(event.target.value)} maxLength={40} placeholder="Ví dụ: An" className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 outline-none placeholder:text-white/30 focus:border-[#eabf65]" /></label>
          <button disabled={loading} className="mt-7 w-full rounded-xl bg-[#eabf65] px-4 py-3 font-bold text-[#14291f] transition hover:bg-[#f5d68e] disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Đang tạo..." : "Tạo phòng"}</button>
        </form>
        <form onSubmit={joinGame} className="self-start rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Vào phòng</h2>
          <p className="mt-2 text-sm leading-6 text-[#afc3b6]">Nhập mã phòng do chủ phòng gửi cho bạn.</p>
          <label className="mt-7 block text-sm font-semibold">Mã phòng<input required value={gameId} onChange={(event) => setGameId(event.target.value)} placeholder="UUID của phòng" className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 outline-none placeholder:text-white/30 focus:border-[#eabf65]" /></label>
          <label className="mt-4 block text-sm font-semibold">Tên của bạn<input required value={joinName} onChange={(event) => setJoinName(event.target.value)} maxLength={40} placeholder="Ví dụ: Bình" className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 outline-none placeholder:text-white/30 focus:border-[#eabf65]" /></label>
          <button disabled={loading} className="mt-7 w-full rounded-xl border border-[#eabf65]/70 px-4 py-3 font-bold text-[#f4d990] transition hover:bg-[#eabf65]/10 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Đang vào..." : "Vào phòng"}</button>
        </form>
      </div>
      {error && <p className="mt-5 rounded-xl border border-red-300/30 bg-red-900/30 px-4 py-3 text-sm text-red-100">{error}</p>}
    </main>
  );
}
