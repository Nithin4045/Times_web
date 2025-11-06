'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Modal, Button, Typography, Space, Divider } from 'antd';
import * as AntIcons from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;

/* ========================= Types ========================= */
type CSS = CSSProperties;

type RichSpan = {
  text: string;
  bold?: boolean;
  color?: string;
  style?: CSS;              // per-span style (e.g., { paddingLeft: 8 })
};
type RichValue = string | RichSpan[];

// A "line" can be just a RichValue, or an object with its own style
type RichLine = RichValue | { value: RichValue; style?: CSS };

type Config = {
  template?: 'MODAL' | 'CARD' | 'INLINE' | 'BANNER' | 'TOAST';

  // Plain fallbacks
  title?: RichValue;
  subtitle?: RichValue;
  body?: RichLine | RichLine[];
  bullets?: RichLine[];
  list?: RichLine[];
  tip?: { icon?: string; text?: RichLine };

  // Preferred rich API (all fields allow per-line style)
  rich?: {
    title?: RichLine;
    subtitle?: RichLine;
    body?: RichLine | RichLine[];
    bullets?: RichLine[];
    tip?: RichLine;
  };

  ctas?: Array<{
    id?: string;
    label: string;
    href?: string;
    variant?: 'primary' | 'default' | 'link' | 'dashed' | 'text';
    color?: string;       // bg/border color
    textColor?: string;   // text color
    onClose?: boolean;
    style?: CSS;
  }>;

  colors?: {
    card?: string;
    bg?: string;
    text?: string;
    accent?: string;
  };

  styles?: {
    width?: number;
    rounded?: number;
    padding?: number;
    border?: boolean;
    divider?: string;
    shadow?: 'none' | 'sm' | 'md' | 'lg';
    iconSize?: number;
  };

  // Optional header icon chip
  icon?: string;
  showIcon?: boolean;
};

/* ========================= Helpers ========================= */

function getIconByName(name?: string, style?: CSS) {
  if (!name) return null;
  const Cmp: any = (AntIcons as any)?.[name];
  return Cmp ? <Cmp style={style} /> : null; // safe: returns null if not found
}

function renderRich(value?: RichValue, extra?: CSS) {
  if (!value) return null;
  if (typeof value === 'string') return <span style={extra}>{value}</span>;
  return (
    <>
      {(value as RichSpan[]).map((s, i) => (
        <span
          key={i}
          style={{
            ...(s.color ? { color: s.color } : {}),
            ...(s.bold ? { fontWeight: 700 } : {}),
            ...(s.style ?? {}),
            ...(extra ?? {}),
          }}
        >
          {s.text}
        </span>
      ))}
    </>
  );
}

// Normalize any RichLine to a { value, style } pair
function toLine(v?: RichLine): { value?: RichValue; style?: CSS } {
  if (!v) return {};
  if (typeof v === 'string' || Array.isArray(v)) return { value: v, style: undefined };
  if (typeof (v as any).value !== 'undefined') return v as any;
  return { value: v as any, style: undefined };
}

function shadowStyle(kind?: 'none' | 'sm' | 'md' | 'lg'): CSS | undefined {
  switch (kind) {
    case 'sm': return { boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)' };
    case 'md': return { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' };
    case 'lg': return { boxShadow: '0 10px 24px rgba(0,0,0,0.16)' };
    default: return undefined;
  }
}

function btnStyle(bg?: string, text?: string, style?: CSS): CSS | undefined {
  if (!bg && !text && !style) return undefined;
  return {
    ...(bg ? { background: bg, borderColor: bg } : {}),
    ...(text ? { color: text } : {}),
    ...(style ?? {}),
  };
}

/* ====================== Body Renderer ====================== */

function MessageBody({ cfg }: { cfg: Config }) {
  const accent = cfg.colors?.accent ?? '#5c52f3';
  const textCol = cfg.colors?.text ?? '#1f2430';
  const iconSize = cfg.styles?.iconSize ?? 18;

  // Prefer rich.*; fall back to plain keys
  const titleLine = toLine(cfg.rich?.title ?? cfg.title);
  const subtitleLine = toLine(cfg.rich?.subtitle ?? cfg.subtitle);

  const bodyRaw = cfg.rich?.body ?? cfg.body;
  const bodyLines: Array<{ value?: RichValue; style?: CSS }> =
    Array.isArray(bodyRaw) ? (bodyRaw as RichLine[]).map(toLine) : [toLine(bodyRaw)];

  const bulletsRaw = cfg.rich?.bullets ?? cfg.bullets ?? cfg.list ?? [];
  const bullets = (bulletsRaw as RichLine[]).map(toLine);

  const tipLine = toLine(cfg.rich?.tip ?? cfg.tip?.text);
  const tipIconName = cfg.tip?.icon ?? 'BulbOutlined';

  const showHeaderIcon = !!cfg.icon && cfg.showIcon === true;

  return (
    <div style={{ color: textCol }}>
      <Space align="start" style={{ width: '100%' }}>
        {showHeaderIcon && (
          <span
            aria-hidden
            style={{
              display: 'inline-flex',
              width: 36, height: 36,
              alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              background: `${accent}1A`, color: accent,
              flex: '0 0 auto', pointerEvents: 'none', userSelect: 'none'
            }}
          >
            {getIconByName(cfg.icon, { fontSize: iconSize })}
          </span>
        )}

        <div style={{ flex: 1 }}>
          {/* Title */}
          {titleLine.value && (
            <Title level={3} style={{ margin: 0, ...(titleLine.style ?? {}) }}>
              {renderRich(titleLine.value)}
            </Title>
          )}

          {/* Subtitle */}
          {subtitleLine.value && (
            <Text style={subtitleLine.style}>
              <strong>{renderRich(subtitleLine.value)}</strong>
            </Text>
          )}

          {/* Body (1..N lines, each with its own style) */}
          {bodyLines.some(l => l.value) && <div style={{ height: 8 }} />}
          {bodyLines.map((ln, i) =>
            ln.value ? (
              <Paragraph key={i} style={{ margin: 0, whiteSpace: 'pre-line', ...(ln.style ?? {}) }}>
                {renderRich(ln.value)}
              </Paragraph>
            ) : null
          )}

          {/* Bullets with per-line style */}
          {bullets.length > 0 && (
            <ul style={{ margin: '12px 0 0 0', padding: 0, listStyle: 'none' }}>
              {bullets.map((ln, i) =>
                ln.value ? (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      margin: '8px 0',
                      ...(ln.style ?? {}),
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 6, height: 6, marginTop: 8,
                        borderRadius: '50%', background: accent, flex: '0 0 auto'
                      }}
                    />
                    <span>{renderRich(ln.value)}</span>
                  </li>
                ) : null
              )}
            </ul>
          )}

          {/* Tip row (rich + per-line style) */}
          {tipLine.value && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 12,
                ...(tipLine.style ?? {}),
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'inline-flex', width: 20, height: 20,
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, background: `${accent}1A`, color: accent,
                  flex: '0 0 auto', pointerEvents: 'none', userSelect: 'none'
                }}
              >
                {getIconByName(tipIconName, { fontSize: 14 })}
              </span>
              <Text>{renderRich(tipLine.value)}</Text>
            </div>
          )}
        </div>
      </Space>

      <Divider style={{ margin: '16px 0 0' }} />
    </div>
  );
}

/* =========================== Page ========================== */

export default function CustomPage() {
  const router = useRouter();
  const [cfg, setCfg] = useState<Config | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window === 'undefined') return;
        const sp = new URLSearchParams(window.location.search);
        const placement = (sp.get('placement') || '').trim();
        const role = (sp.get('role') || '').trim();
        const userId = (sp.get('userId') || '').trim();

        if (placement) {
          const qs = new URLSearchParams({ placement });
          if (role) qs.set('role', role);
          if (userId) qs.set('userId', userId);

          const res = await fetch(`/api/custom_page?${qs.toString()}`, { cache: 'no-store' });
          if (cancelled) return;
          if (res.ok) {
            const body = await res.json().catch(() => null);
            const item = body?.items?.[0];
            if (item && item.contentjson) {
              const parsed = typeof item.contentjson === 'string' ? JSON.parse(item.contentjson) : item.contentjson;
              setCfg(parsed);
              setOpen(parsed?.template === 'MODAL');
              return;
            }
          }
        }

        // Fallback to session storage if API didn't return a config
        const raw = sessionStorage.getItem('custom_page_cfg');
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Config;
            if (!cancelled) {
              setCfg(parsed);
              setOpen(parsed?.template === 'MODAL');
            }
          } catch {}
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCtaClick = async (cta: any) => {
    if (cta.onClose) {
      setLoading(true);
      try {
        // Get userId from URL params
        const sp = new URLSearchParams(window.location.search);
        const userId = sp.get('userId');
        
        if (userId && /^\d+$/.test(userId)) {
          // Update first_time_login to false
          await fetch('/api/utils/first_time_login', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: Number(userId) }),
          });
        }
      } catch (error) {
        console.error('Failed to update first_time_login:', error);
      } finally {
        setLoading(false);
        setOpen(false);
        router.back();
      }
    }
  };

  if (!cfg) return null;

  const width = cfg.styles?.width ?? 720;
  const radius = typeof cfg.styles?.rounded === 'number' ? cfg.styles.rounded : 12;
  const pad = cfg.styles?.padding ?? 24;
  const cardBg = cfg.colors?.card ?? '#fff';
  const divider = cfg.styles?.divider ?? 'rgba(0,0,0,0.08)';

  const CTAs = Array.isArray(cfg.ctas) && cfg.ctas.length > 0 && (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
      {cfg.ctas.map((c, i) => (
        <Button
          key={c.id ?? i}
          type={c.variant ?? 'default'}
          href={c.href}
          onClick={() => handleCtaClick(c)}
          loading={loading && c.onClose}
          disabled={loading}
          style={btnStyle(c.color, c.textColor, c.style)}
        >
          {c.label}
        </Button>
      ))}
    </div>
  );

  // MODAL template
  if (cfg.template === 'MODAL') {
    return (
      <Modal
        open={open}
        onCancel={() => {
          // Don't allow closing by clicking outside or pressing ESC for first-time login
          // Only allow closing via CTA buttons
        }}
        footer={null}
        maskClosable={false}
        closable={false}
        width={width}
        styles={{
          content: {
            borderRadius: radius,
            padding: pad,
            background: cardBg,
            ...(cfg.styles?.border ? { border: `1px solid ${divider}` } : {}),
            ...shadowStyle(cfg.styles?.shadow),
          },
        }}
        destroyOnHidden
      >
        <MessageBody cfg={cfg} />
        {CTAs}
      </Modal>
    );
  }

  // INLINE / CARD / BANNER fallback rendering
  return (
    <div
      style={{
        maxWidth: width,
        margin: '40px auto',
        padding: pad,
        borderRadius: radius,
        background: cardBg,
        ...(cfg.styles?.border ? { border: `1px solid ${divider}` } : {}),
        ...shadowStyle(cfg.styles?.shadow),
      }}
    >
      {/* Optional header icon chip */}
      {cfg.icon && cfg.showIcon === true && (
        <div style={{ marginBottom: 12 }}>
          <span
            aria-hidden
            style={{
              display: 'inline-flex',
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: `${cfg.colors?.accent ?? '#5c52f3'}1A`,
              color: cfg.colors?.accent ?? '#5c52f3',
            }}
          >
            {getIconByName(cfg.icon, { fontSize: cfg.styles?.iconSize ?? 18 })}
          </span>
        </div>
      )}

      <MessageBody cfg={cfg} />
      {CTAs}
    </div>
  );
}

