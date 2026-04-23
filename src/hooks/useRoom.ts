import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import type { Classification, Message, Participant, Room, UnresolvedThread } from '../types';
import { classifyMessage, computeUnresolved } from '../lib/ai';
import { classifyDefault } from '../lib/utils';

interface UseRoomResult {
  room: Room | null;
  participants: Participant[];
  messages: Message[];
  unresolved: UnresolvedThread[];
  selfId: string | null;
  loading: boolean;
  sendMessage: (body: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  endSession: () => Promise<void>;
}

export function useRoom(roomCode: string | undefined): UseRoomResult {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unresolved, setUnresolved] = useState<UnresolvedThread[]>([]);
  const [loading, setLoading] = useState(true);

  const selfId = useMemo(() => {
    if (!roomCode) return null;
    return sessionStorage.getItem(`choir:${roomCode}:participant`);
  }, [roomCode]);

  const latestParticipantsRef = useRef<Participant[]>([]);
  const latestMessagesRef = useRef<Message[]>([]);
  useEffect(() => { latestParticipantsRef.current = participants; }, [participants]);
  useEffect(() => { latestMessagesRef.current = messages; }, [messages]);

  // Initial load
  useEffect(() => {
    if (!roomCode || !supabase) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: r }, { data: ps }, { data: ms }] = await Promise.all([
        supabase.from('rooms').select('*').eq('id', roomCode).maybeSingle(),
        supabase.from('participants').select('*').eq('room_id', roomCode).order('joined_at', { ascending: true }),
        supabase.from('messages').select('*').eq('room_id', roomCode).order('created_at', { ascending: true }),
      ]);
      if (cancelled) return;
      setRoom(r as Room | null);
      setParticipants((ps ?? []) as Participant[]);
      setMessages((ms ?? []) as Message[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  // Realtime subscriptions
  useEffect(() => {
    if (!roomCode || !supabase) return;
    const sb = supabase;

    const channel = sb
      .channel(`room:${roomCode}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'participants', filter: `room_id=eq.${roomCode}` }, (payload) => {
        setParticipants((prev) => {
          const p = payload.new as Participant;
          if (prev.some((x) => x.id === p.id)) return prev;
          return [...prev, p];
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'participants', filter: `room_id=eq.${roomCode}` }, (payload) => {
        const oldRow = payload.old as { id: string };
        setParticipants((prev) => prev.filter((p) => p.id !== oldRow.id));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomCode}` }, (payload) => {
        setMessages((prev) => {
          const m = payload.new as Message;
          if (prev.some((x) => x.id === m.id)) return prev;
          return [...prev, m];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomCode}` }, (payload) => {
        const m = payload.new as Message;
        setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomCode}` }, (payload) => {
        setRoom(payload.new as Room);
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [roomCode]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!roomCode || !selfId) return;
      const trimmed = body.trim();
      if (trimmed.length === 0) return;

      // Split long messages every 600 chars for conversational pacing
      const chunks: string[] = [];
      for (let i = 0; i < trimmed.length; i += 600) chunks.push(trimmed.slice(i, i + 600));

      for (const chunk of chunks) {
        if (!supabase) {
          // offline stub — local state only
          const local: Message = {
            id: 'local-' + Math.random().toString(36).slice(2),
            room_id: roomCode,
            participant_id: selfId,
            body: chunk,
            created_at: new Date().toISOString(),
            classification: classifyDefault(chunk),
          };
          setMessages((prev) => [...prev, local]);
          continue;
        }
        const { data, error } = await supabase
          .from('messages')
          .insert({ room_id: roomCode, participant_id: selfId, body: chunk })
          .select()
          .single();
        if (error || !data) continue;

        // Leader (oldest participant) runs classification
        const me = latestParticipantsRef.current.find((p) => p.id === selfId);
        const leader = latestParticipantsRef.current[0];
        if (me && leader && me.id === leader.id) {
          void (async () => {
            const cls: Classification = await classifyMessage(data as Message, latestMessagesRef.current, latestParticipantsRef.current);
            await supabase.from('messages').update({ classification: cls }).eq('id', (data as Message).id);
          })();
        }
      }
    },
    [roomCode, selfId]
  );

  const leaveRoom = useCallback(async () => {
    if (!roomCode || !selfId || !supabase) return;
    await supabase.from('participants').delete().eq('id', selfId);
  }, [roomCode, selfId]);

  const endSession = useCallback(async () => {
    if (!roomCode || !supabase) return;
    await supabase.from('rooms').update({ ended_at: new Date().toISOString(), ended_by: selfId }).eq('id', roomCode);
  }, [roomCode, selfId]);

  // Leader fires unresolved check every 30s
  useEffect(() => {
    if (!roomCode || participants.length === 0 || !selfId) return;
    const leader = participants[0];
    if (leader.id !== selfId) return;

    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      if (latestMessagesRef.current.length < 4) return;
      const u = await computeUnresolved(latestMessagesRef.current, latestParticipantsRef.current);
      if (!cancelled) setUnresolved(u);
    };
    const handle = setInterval(tick, 30000);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [roomCode, participants, selfId]);

  // Leave on unmount / unload
  useEffect(() => {
    if (!supabaseConfigured || !selfId) return;
    const handler = () => {
      // best-effort; fire & forget
      try {
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/participants?id=eq.${selfId}`,
          new Blob([], { type: 'application/json' })
        );
      } catch {
        /* noop */
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [selfId]);

  return { room, participants, messages, unresolved, selfId, loading, sendMessage, leaveRoom, endSession };
}
