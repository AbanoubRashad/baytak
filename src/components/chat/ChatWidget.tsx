'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getChatMessages, sendChatMessage, startChat, updateChatContact, type ChatMessage } from '@/actions/chat';
import type { Consultant } from '@/components/layout/types';
import { Avatar } from '@/components/ui/Avatar';
import { FieldError } from '@/components/forms/FormBits';
import { btn, field } from '@/components/ui/styles';
import { onChatOpen, type ChatOpenDetail } from '@/lib/client/events';
import { createLocalStore } from '@/lib/client/local-store';
import { track } from '@/lib/client/track';
import { useAvailable } from '@/lib/client/use-available';
import { whatsappUrl } from '@/lib/whatsapp';
import { chatStartSchema, normalizeEgyptMobile } from '@/lib/validation';

interface Thread {
  leadId: string;
  token: string;
}
const threadStore = createLocalStore<Thread | null>('baytak:chat', null);
const POLL_MS = 5000;

interface LocalMessage extends ChatMessage {
  pending?: boolean;
  failed?: boolean;
}

/** Optimistic bubble shown while a message is being sent. */
function pendingMessage(body: string): LocalMessage {
  return { id: `local-${crypto.randomUUID()}`, sender: 'client', body, createdAt: new Date().toISOString(), pending: true };
}

export function ChatWidget({ consultant }: { consultant: Consultant }) {
  const t = useTranslations('chat');
  const tForms = useTranslations('forms');
  const locale = useLocale() as 'en' | 'ar';
  const online = useAvailable(consultant);
  const thread = threadStore.useValue();
  const id = useId();

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [context, setContext] = useState<ChatOpenDetail>({});
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string>();
  const [notice, setNotice] = useState<'notStored' | 'tooMany' | 'failed' | null>(null);
  const [sending, setSending] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLOListElement>(null);

  // Open from anywhere: cards, compound carousel, afford tool, header…
  useEffect(
    () =>
      onChatOpen((detail) => {
        setContext(detail);
        if (detail.message) setText(detail.message);
        setOpen(true);
      }),
    [],
  );

  // Focus management + Escape to close.
  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Poll for Romany's replies while the panel is open.
  const refresh = useCallback(async () => {
    if (!thread) return;
    const server = await getChatMessages(thread);
    if (server.length) setMessages((local) => [...server, ...local.filter((m) => m.pending || m.failed)]);
  }, [thread]);

  useEffect(() => {
    if (!open || !thread) return;
    let active = true;
    const tick = () => {
      if (active && document.visibilityState === 'visible') void refresh();
    };
    tick();
    const timer = window.setInterval(tick, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [open, thread, refresh]);

  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ block: 'end' });
  }, [messages, open]);

  const needsPhone = !thread && !online;

  async function send(body: string) {
    const message = body.trim();
    if (!message || sending) return;
    setNotice(null);

    if (!thread) {
      const normalized = phone ? normalizeEgyptMobile(phone) : '';
      const check = chatStartSchema.shape.phone.safeParse(phone);
      if ((needsPhone && !normalized) || !check.success) {
        setPhoneError('phoneInvalid');
        return;
      }
    }
    setPhoneError(undefined);
    setSending(true);
    const local = pendingMessage(message);
    setMessages((m) => [...m, local]);
    setText('');

    try {
      if (!thread) {
        const res = await startChat({
          name: name || undefined,
          phone: phone || undefined,
          message,
          unitId: context.unitId,
          compoundId: context.compoundId,
          source: context.source ?? 'chat',
          website: '',
          locale,
        });
        if (!res.ok) throw new Error(res.error);
        track('Chat started', { source: context.source ?? 'chat' });
        if (res.stored && res.leadId && res.token) threadStore.set({ leadId: res.leadId, token: res.token });
        else setNotice('notStored');
      } else {
        const res = await sendChatMessage({ ...thread, message });
        if (!res.ok) throw new Error(res.error);
        if (phone || name) void updateChatContact({ ...thread, name: name || undefined, phone: phone || undefined });
      }
      setMessages((m) => m.map((x) => (x.id === local.id ? { ...x, pending: false } : x)));
    } catch (err) {
      setNotice(err instanceof Error && err.message === 'rate' ? 'tooMany' : 'failed');
      setMessages((m) => m.map((x) => (x.id === local.id ? { ...x, pending: false, failed: true } : x)));
    } finally {
      setSending(false);
    }
  }

  function retry(m: LocalMessage) {
    setMessages((all) => all.filter((x) => x.id !== m.id));
    void send(m.body);
  }

  function newConversation() {
    threadStore.set(null);
    setMessages([]);
    setContext({});
    setNotice(null);
  }

  const quick = [t('quick1'), t('quick2'), t('quick3')];
  const hasSent = messages.some((m) => m.sender === 'client');

  return (
    <>
      {!open && (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-[92px] end-4 z-40 inline-flex items-center gap-3 rounded-full bg-primary p-1.5 text-on-primary shadow-float transition-transform hover:scale-[1.02] sm:end-6 lg:bottom-6 lg:pe-5"
          aria-haspopup="dialog"
        >
          <Avatar src={consultant.avatar} alt="" size={48} online={online} className="[&>span]:border-primary" />
          <span className="hidden font-display text-[17px] font-bold lg:inline">{t('open', { name: consultant.name })}</span>
          <span className="sr-only lg:hidden">{t('open', { name: consultant.name })}</span>
        </button>
      )}

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${id}-title`}
          className="fixed inset-0 z-50 flex flex-col bg-card sm:inset-auto sm:bottom-6 sm:end-6 sm:h-[min(640px,calc(100dvh-48px))] sm:w-[400px] sm:overflow-hidden sm:rounded-card sm:border sm:border-line sm:shadow-float"
        >
          <header className="flex items-center gap-3 border-b border-line bg-pale px-4 py-3">
            <Avatar src={consultant.avatar} alt="" size={44} online={online} />
            <div className="min-w-0 flex-1">
              <p id={`${id}-title`} className="font-semibold text-ink">
                {consultant.name}
              </p>
              <p className="truncate text-[13px] text-ink-2">{online ? t('online') : t('offline')}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
              className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-sky"
              aria-label={t('close')}
            >
              <X className="size-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <ol ref={logRef} aria-label={t('log', { name: consultant.name })} aria-live="polite" className="space-y-3">
              <li className="max-w-[85%] rounded-2xl rounded-ss-md bg-fill px-4 py-3 text-[15px] text-ink">
                {t('hello', { name: consultant.name })}
              </li>
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] ${
                    m.sender === 'client' ? 'ms-auto rounded-se-md bg-primary text-on-primary' : 'rounded-ss-md bg-fill text-ink'
                  } ${m.pending ? 'opacity-70' : ''}`}
                >
                  {m.sender === 'client' && <span className="sr-only">{t('you')}: </span>}
                  {m.body}
                  {m.failed && (
                    <button type="button" onClick={() => retry(m)} className="mt-1 block text-xs font-semibold underline">
                      {t('failed')}
                    </button>
                  )}
                </li>
              ))}
            </ol>

            {!hasSent && (
              <div className="mt-4">
                <p className="sr-only">{t('quickLabel')}</p>
                <ul className="flex flex-wrap gap-2">
                  {quick.map((q) => (
                    <li key={q}>
                      <button
                        type="button"
                        onClick={() => {
                          setText(q);
                          inputRef.current?.focus();
                        }}
                        className="min-h-11 rounded-full border border-sky-line bg-pale px-4 text-start text-sm font-medium text-primary-hover dark:text-primary"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {notice && (
              <p role="status" className="mt-4 rounded-xl bg-sand px-4 py-3 text-sm text-on-sand">
                {tForms(notice)}{' '}
                <a
                  href={whatsappUrl(consultant.whatsapp, messages.at(-1)?.body)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                  onClick={() => track('WhatsApp click', { from: 'chat-fallback' })}
                >
                  {t('openWhatsapp')}
                </a>
              </p>
            )}
          </div>

          <form
            className="border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(text);
            }}
          >
            {!thread && (
              <div className="mb-2 space-y-2">
                {needsPhone && <p className="text-[13px] text-ink-2">{t('awayNote')}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor={`${id}-name`} className="sr-only">
                      {t('nameLabel')}
                    </label>
                    <input
                      id={`${id}-name`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('nameLabel')}
                      autoComplete="name"
                      className={`${field} min-h-11 text-[15px]`}
                    />
                  </div>
                  <div>
                    <label htmlFor={`${id}-phone`} className="sr-only">
                      {needsPhone ? t('phoneLabel') : t('phoneOptional')}
                    </label>
                    <input
                      id={`${id}-phone`}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('phoneShort')}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      dir="ltr"
                      required={needsPhone}
                      aria-invalid={Boolean(phoneError)}
                      aria-describedby={phoneError ? `${id}-phone-err` : undefined}
                      className={`${field} min-h-11 text-[15px] rtl:text-end`}
                    />
                  </div>
                </div>
                <FieldError id={`${id}-phone-err`} code={phoneError} />
              </div>
            )}
            <div className="flex items-end gap-2">
              <label htmlFor={`${id}-msg`} className="sr-only">
                {t('placeholder')}
              </label>
              <textarea
                ref={inputRef}
                id={`${id}-msg`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send(text);
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder={t('placeholder')}
                className={`${field} min-h-12 resize-none py-3 text-[15px]`}
              />
              <button type="submit" disabled={sending || !text.trim()} className={`${btn.primary} size-12 shrink-0 px-0`} aria-label={t('send')}>
                <Send className="size-5 rtl:-scale-x-100" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[13px]">
              <a
                href={whatsappUrl(consultant.whatsapp, text || undefined)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary-hover dark:text-primary"
                onClick={() => track('WhatsApp click', { from: 'chat' })}
              >
                <MessageCircle aria-hidden className="size-4" />
                {t('orWhatsapp')}
              </a>
              {thread && (
                <button type="button" onClick={newConversation} className="inline-flex min-h-11 items-center text-ink-2 underline-offset-4 hover:underline">
                  {t('newChat')}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  );
}
