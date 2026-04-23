import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Link2, ArrowLeft, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import type { MinutesDocument } from '../../types';
import { supabase } from '../../lib/supabase';
import { synthesiseMinutes } from '../../lib/ai';

export function Minutes() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<MinutesDocument | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    (async () => {
      // Try session cache first
      const cached = sessionStorage.getItem(`choir:${code}:minutes`);
      const durStr = sessionStorage.getItem(`choir:${code}:duration`);
      const cachedParticipants = sessionStorage.getItem(`choir:${code}:participants`);
      if (cached && durStr) {
        if (cancelled) return;
        setDoc(JSON.parse(cached));
        setDuration(Number(durStr));
        setParticipantCount(cachedParticipants ? JSON.parse(cachedParticipants).length : 0);
        setLoading(false);
        return;
      }

      // Else fetch from supabase and synthesise
      if (!supabase) {
        setLoading(false);
        return;
      }
      const [{ data: room }, { data: ps }, { data: ms }] = await Promise.all([
        supabase.from('rooms').select('*').eq('id', code).maybeSingle(),
        supabase.from('participants').select('*').eq('room_id', code).order('joined_at', { ascending: true }),
        supabase.from('messages').select('*').eq('room_id', code).order('created_at', { ascending: true }),
      ]);
      if (cancelled || !room) { setLoading(false); return; }
      const durationMs = room.ended_at
        ? new Date(room.ended_at).getTime() - new Date(room.created_at).getTime()
        : Date.now() - new Date(room.created_at).getTime();
      setDuration(durationMs);
      setParticipantCount(ps?.length ?? 0);
      const minutes = await synthesiseMinutes((ms ?? []) as never, (ps ?? []) as never, code, durationMs);
      if (!cancelled) setDoc(minutes);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [code]);

  async function exportPdf() {
    if (!doc || !code) return;
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 64;
    let y = margin;
    const width = pdf.internal.pageSize.getWidth() - margin * 2;
    const lineHeight = (size: number) => size * 1.35;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(22);
    pdf.setTextColor(26, 28, 36);
    pdf.text('choir.', margin, y); y += 28;
    pdf.setFontSize(12);
    pdf.text('session minutes', margin, y); y += 16;
    pdf.setFontSize(10);
    pdf.text(`room ${code}  ·  ${Math.round(duration / 60000)} minutes  ·  ${participantCount} participants`, margin, y); y += 28;

    function heading(t: string) {
      if (y > 760) { pdf.addPage(); y = margin; }
      pdf.setFontSize(9);
      pdf.setTextColor(122, 141, 163);
      pdf.text(t.toUpperCase(), margin, y); y += 14;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, margin + width, y); y += 12;
      pdf.setTextColor(26, 28, 36);
    }

    function body(text: string, size = 11) {
      pdf.setFontSize(size);
      const lines = pdf.splitTextToSize(text, width);
      for (const l of lines) {
        if (y > 780) { pdf.addPage(); y = margin; }
        pdf.text(l, margin, y); y += lineHeight(size);
      }
      y += 4;
    }

    heading('session summary');
    body(doc.session_summary);

    heading('participants');
    for (const p of doc.participants) {
      body(`${p.name} — ${p.airtime_percent}% airtime, ${p.new_ideas_contributed} new ideas, silent ${p.silent_minutes} min`);
    }

    heading('decisions recorded');
    for (const d of doc.decisions_recorded) {
      body(`• ${d.decision}  (${d.support})${d.reservations ? `  — caveat: ${d.reservations}` : ''}`);
    }

    heading('unresolved threads');
    for (const u of doc.unresolved_threads) {
      body(`• "${u.thread}" — raised by ${u.raised_by} at ${u.at_timestamp}`);
    }

    heading('patterns worth noting');
    for (const p of doc.patterns_worth_noting) {
      body(`• ${p}`);
    }

    y += 10;
    pdf.setFontSize(12);
    pdf.setTextColor(80, 80, 100);
    const verdict = pdf.splitTextToSize(doc.one_sentence_verdict, width);
    for (const l of verdict) {
      if (y > 780) { pdf.addPage(); y = margin; }
      pdf.text(l, margin, y); y += 18;
    }

    pdf.save(`choir-${code}-minutes.pdf`);
  }

  if (!code) return null;

  return (
    <div
      style={{
        background: 'var(--color-paper)',
        color: 'var(--color-paper-ink)',
        minHeight: '100vh',
        padding: '60px 24px 80px',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 720 }}>
        <button
          onClick={() => navigate('/')}
          className="font-mono flex items-center gap-1.5 mb-10"
          style={{
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#5A5E6A',
            background: 'none',
            border: 0,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={12} /> back to choir
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="font-serif" style={{ fontSize: 56, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.02em' }}>
            choir.
          </h1>
          <p className="font-serif mt-2" style={{ fontSize: 22, color: '#45495A' }}>
            session minutes
          </p>
          <p className="font-mono mt-3" style={{ fontSize: 12, color: '#7A7E8E', letterSpacing: '0.04em' }}>
            room {code} · {Math.round(duration / 60000)} minutes · {participantCount} participants
          </p>
          <hr style={{ border: 0, borderTop: '1px solid #D8D3C5', margin: '28px 0' }} />
        </motion.div>

        {loading && <p className="font-mono" style={{ color: '#7A7E8E' }}>writing the minutes…</p>}

        {!loading && !doc && (
          <p className="font-mono" style={{ color: '#7A7E8E' }}>
            could not produce the minutes document (check that GROQ_API_KEY is configured on your deployment).
          </p>
        )}

        {doc && (
          <>
            <Section title="session summary">
              <p style={{ fontSize: 17, lineHeight: 1.7 }}>{doc.session_summary}</p>
            </Section>

            <Section title="participants">
              <div>
                {doc.participants.map((p, i) => (
                  <div key={i} className="font-mono" style={{ fontSize: 14, color: '#3B3F4D', padding: '6px 0', borderBottom: i < doc.participants.length - 1 ? '1px dashed #D8D3C5' : undefined }}>
                    <span style={{ display: 'inline-block', width: 140 }}>{p.name}</span>
                    <span style={{ display: 'inline-block', width: 110 }}>{p.airtime_percent}% airtime</span>
                    <span style={{ display: 'inline-block', width: 120 }}>{p.new_ideas_contributed} new idea{p.new_ideas_contributed === 1 ? '' : 's'}</span>
                    {p.silent_minutes > 0 && (
                      <span style={{ color: '#7A7E8E' }}>· silent {p.silent_minutes} min</span>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            <Section title="decisions recorded">
              {doc.decisions_recorded.length === 0 && (
                <p className="font-serif italic" style={{ fontSize: 16, color: '#7A7E8E' }}>no decisions were recorded.</p>
              )}
              {doc.decisions_recorded.map((d, i) => (
                <div key={i} style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 17, lineHeight: 1.6 }}>
                    <span className="font-mono" style={{ fontSize: 11, color: '#7A7E8E', letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 8 }}>decision:</span>
                    {d.decision}
                  </p>
                  <p className="font-mono" style={{ fontSize: 13, color: '#5A5E6A', marginTop: 4 }}>
                    {d.support}
                  </p>
                  {d.reservations && (
                    <p className="font-serif italic" style={{ fontSize: 15, color: '#7A5A2E', marginTop: 6 }}>
                      caveat: {d.reservations}
                    </p>
                  )}
                </div>
              ))}
            </Section>

            <Section title="unresolved threads">
              {doc.unresolved_threads.length === 0 && (
                <p className="font-serif italic" style={{ fontSize: 16, color: '#7A7E8E' }}>everything raised was addressed.</p>
              )}
              {doc.unresolved_threads.map((u, i) => (
                <p key={i} style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 10 }}>
                  <span style={{ color: '#8A6D1E' }}>·</span>{' '}
                  &ldquo;{u.thread}&rdquo; raised by <em>{u.raised_by}</em> at{' '}
                  <span className="font-mono" style={{ fontSize: 13, color: '#5A5E6A' }}>{u.at_timestamp}</span>.
                  <span style={{ color: '#7A7E8E' }}> never answered.</span>
                </p>
              ))}
            </Section>

            <Section title="patterns worth noting">
              {doc.patterns_worth_noting.map((p, i) => (
                <p key={i} style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 10 }}>
                  <span style={{ color: '#8A6D1E' }}>·</span> {p}
                </p>
              ))}
            </Section>

            <div style={{ margin: '44px 0 20px', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', width: 40, height: 1, background: '#C5BFB0' }} />
            </div>

            <p className="font-mono" style={{ fontSize: 11, color: '#7A7E8E', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              the quiet version
            </p>
            <p className="font-serif italic" style={{ fontSize: 20, lineHeight: 1.55, color: '#45495A' }}>
              {doc.one_sentence_verdict}
            </p>

            <hr style={{ border: 0, borderTop: '1px solid #D8D3C5', margin: '40px 0 28px' }} />

            <div className="flex gap-5 items-center flex-wrap">
              <button
                onClick={exportPdf}
                className="font-mono flex items-center gap-2"
                style={{
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#1A1C24',
                  border: '1px solid #1A1C24',
                  borderRadius: 3,
                  padding: '10px 16px',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Download size={13} /> download as pdf
              </button>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="font-mono flex items-center gap-2"
                style={{
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#45495A',
                  border: '1px solid #C5BFB0',
                  borderRadius: 3,
                  padding: '10px 16px',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {copied ? <Check size={13} /> : <Link2 size={13} />}
                {copied ? 'link copied' : 'share link'}
              </button>
            </div>

            <p className="font-mono mt-8" style={{ fontSize: 11, color: '#7A7E8E', lineHeight: 1.7 }}>
              this document will be available at this url for 14 days.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ margin: '36px 0' }}>
      <p className="font-mono" style={{ fontSize: 11, color: '#7A7E8E', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
        {title}
      </p>
      <hr style={{ border: 0, borderTop: '1px solid #D8D3C5', margin: '0 0 18px' }} />
      {children}
    </section>
  );
}
