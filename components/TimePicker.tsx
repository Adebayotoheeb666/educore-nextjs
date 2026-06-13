"use client";
import { useState, useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function TimePicker({ value, onChange, id }: Props) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState("AM");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const m = (value || "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m) {
      setHour(Number(m[1]));
      setMinute(Number(m[2]));
      setAmpm(m[3].toUpperCase());
    }
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const apply = () => {
    const v = `${hour}:${pad(minute)} ${ampm}`;
    onChange(v);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }} ref={rootRef}>
      <div style={{ display: "flex", gap: 8 }}>
        <input id={id} className="filter-select" value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="btn-outline" onClick={() => setOpen((s) => !s)} aria-label="Open time picker">⏱</button>
      </div>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "white", border: "1px solid #e5e7eb", padding: 12, borderRadius: 8, boxShadow: "0 6px 18px rgba(15,23,42,0.08)", zIndex: 2000 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={hour} onChange={(e) => setHour(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
            <select value={minute} onChange={(e) => setMinute(Number(e.target.value))}>
              {Array.from({ length: 60 }, (_, i) => i).map((m) => <option key={m} value={m}>{pad(m)}</option>)}
            </select>
            <select value={ampm} onChange={(e) => setAmpm(e.target.value)}>
              <option>AM</option>
              <option>PM</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={apply}>Set</button>
          </div>
        </div>
      )}
    </div>
  );
}
