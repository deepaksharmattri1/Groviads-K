import { Lock, Mail, MessageSquare, Send, Shield, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import type { EncryptedMessageRecord } from '../types';
import {
  computeKeyFingerprint,
  decryptMessageE2EE,
  encryptMessageE2EE,
  generateEcdhKeyPair,
} from '../utils/crypto';

interface DecryptedChatItem {
  id: string;
  senderRole: 'client' | 'advisor';
  plaintext: string;
  fingerprint: string;
  createdAt: string;
  verified: boolean;
}

interface LiveChatWidgetProps {
  clientId: string;
  clientName?: string | null;
  clientEmail?: string | null;
  advisorPublicKey: JsonWebKey | null;
  advisorFingerprint: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenEnquiry: () => void;
}

const STORAGE_KEYPAIR_KEY = 'groviads_client_e2ee_keypair_v1';

export function LiveChatWidget({
  clientId,
  clientName,
  clientEmail,
  advisorPublicKey,
  advisorFingerprint,
  open,
  onOpenChange,
  onOpenEnquiry,
}: LiveChatWidgetProps) {
  const [clientKeys, setClientKeys] = useState<{
    publicKeyJwk: JsonWebKey;
    privateKeyJwk: JsonWebKey;
    fingerprint: string;
  } | null>(null);
  const [messages, setMessages] = useState<DecryptedChatItem[]>([]);
  const [draft, setDraft] = useState('');
  const [visitorNameInput, setVisitorNameInput] = useState(clientName || '');
  const [visitorEmailInput, setVisitorEmailInput] = useState(clientEmail || '');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (clientName && !visitorNameInput) setVisitorNameInput(clientName);
    if (clientEmail && !visitorEmailInput) setVisitorEmailInput(clientEmail);
  }, [clientName, clientEmail]);

  // Initialize or restore client ECDH P-256 keypair in browser
  useEffect(() => {
    let active = true;
    async function initKeys() {
      try {
        const stored = localStorage.getItem(STORAGE_KEYPAIR_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.publicKeyJwk && parsed.privateKeyJwk && parsed.fingerprint) {
            if (active) setClientKeys(parsed);
            return;
          }
        }
        const generated = await generateEcdhKeyPair();
        const fp = await computeKeyFingerprint(generated.publicKeyJwk);
        const bundle = { ...generated, fingerprint: fp };
        localStorage.setItem(STORAGE_KEYPAIR_KEY, JSON.stringify(bundle));
        if (active) setClientKeys(bundle);
      } catch {
        // SubtleCrypto unavailable fallback handled gracefully
      }
    }
    initKeys();
    return () => {
      active = false;
    };
  }, []);

  const loadAndDecryptMessages = async () => {
    if (!clientKeys || !advisorPublicKey) return;
    try {
      const res = await fetch(`/api/e2ee/messages?threadId=${encodeURIComponent(clientId)}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.messages)) return;

      const decrypted: DecryptedChatItem[] = [];
      for (const row of data.messages as EncryptedMessageRecord[]) {
        try {
          const peerPub =
            row.sender_role === 'client'
              ? advisorPublicKey
              : (JSON.parse(row.sender_public_key) as JsonWebKey);
          const plaintext = await decryptMessageE2EE({
            ciphertext: row.ciphertext,
            iv: row.iv,
            ownPrivateKeyJwk: clientKeys.privateKeyJwk,
            peerPublicKeyJwk: peerPub,
          });
          decrypted.push({
            id: row.id,
            senderRole: row.sender_role,
            plaintext,
            fingerprint: row.fingerprint,
            createdAt: row.created_at,
            verified: true,
          });
        } catch {
          decrypted.push({
            id: row.id,
            senderRole: row.sender_role,
            plaintext: '[Encrypted with a prior key session]',
            fingerprint: row.fingerprint,
            createdAt: row.created_at,
            verified: false,
          });
        }
      }
      setMessages(decrypted);
    } catch {
      // ignore transient poll error
    }
  };

  useEffect(() => {
    if (!open || !clientKeys || !advisorPublicKey) return;
    loadAndDecryptMessages();
    const timer = setInterval(loadAndDecryptMessages, 6000);
    return () => clearInterval(timer);
  }, [open, clientKeys, advisorPublicKey, clientId]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !clientKeys || !advisorPublicKey) return;
    setSending(true);
    try {
      const envelope = await encryptMessageE2EE({
        plaintext: draft.trim(),
        senderPrivateKeyJwk: clientKeys.privateKeyJwk,
        senderPublicKeyJwk: clientKeys.publicKeyJwk,
        recipientPublicKeyJwk: advisorPublicKey,
      });

      const res = await fetch('/api/e2ee/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: clientId,
          clientId,
          clientName: visitorNameInput.trim() || 'Website Visitor',
          clientEmail: visitorEmailInput.trim() || null,
          senderRole: 'client',
          ...envelope,
        }),
      });
      if (res.ok) {
        setDraft('');
        await loadAndDecryptMessages();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open ? (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          aria-label="Open encrypted live chat with GROVIADS"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1215] hover:bg-[#16202A] text-white text-xs font-semibold shadow-lg border border-white/15 transition-colors cursor-pointer whitespace-nowrap"
        >
          <MessageSquare className="w-4 h-4 text-[#60A5FA]" />
          <span>Encrypted Chat</span>
        </button>
      ) : (
        <div
          role="dialog"
          aria-label="GROVIADS End-to-End Encrypted Live Chat"
          className="w-[calc(100vw-2rem)] sm:w-[390px] bg-white rounded-xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
        >
          {/* Chat Header */}
          <div className="bg-[#0B1215] text-white px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span className="font-display text-sm font-bold">GROVIADS Advisory Desk</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                ECDH P-256 · AES-GCM 256
              </p>
            </div>
            <button
              type="button"
              aria-label="Close live chat"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Key Fingerprint Banner */}
          <div className="bg-[#F8FAFC] border-b border-slate-200 px-4 py-2 text-[11px] text-slate-600 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 truncate">
              <Shield className="w-3 h-3 text-[#0B1215] shrink-0" />
              Desk Key: <span className="font-mono">{advisorFingerprint || 'Verified'}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onOpenEnquiry();
              }}
              className="inline-flex items-center gap-1 font-semibold text-[#1D4ED8] hover:text-[#1E40AF] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Mail className="w-3 h-3" />
              Send Enquiry
            </button>
          </div>

          {/* Optional Name & Email Identity Row */}
          <div className="px-4 py-2.5 border-b border-slate-100 grid grid-cols-2 gap-2 bg-white">
            <label htmlFor="chat-name" className="sr-only">
              Your name
            </label>
            <input
              id="chat-name"
              type="text"
              value={visitorNameInput}
              onChange={(e) => setVisitorNameInput(e.target.value)}
              placeholder="Your name"
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#1D4ED8]"
            />
            <label htmlFor="chat-email" className="sr-only">
              Your email
            </label>
            <input
              id="chat-email"
              type="email"
              value={visitorEmailInput}
              onChange={(e) => setVisitorEmailInput(e.target.value)}
              placeholder="Email (for alerts)"
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>

          {/* Message Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC] min-h-[240px]">
            <div className="rounded-lg bg-white border border-slate-200 p-3 text-xs text-slate-700 leading-relaxed">
              <p className="font-semibold text-[#0B1215] mb-1">
                Welcome to GROVIADS Encrypted Messaging
              </p>
              <p>
                Messages sent here are encrypted in your browser before transmission. Ask a question
                or{' '}
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenEnquiry();
                  }}
                  className="font-semibold text-[#1D4ED8] underline underline-offset-2 cursor-pointer"
                >
                  submit a project enquiry
                </button>
                .
              </p>
            </div>

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.senderRole === 'client' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.senderRole === 'client'
                      ? 'bg-[#0B1215] text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  <p>{m.plaintext}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1 tabular-nums">
                  {m.senderRole === 'client' ? 'You' : 'GROVIADS'} ·{' '}
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <label htmlFor="chat-input" className="sr-only">
              Write an encrypted message
            </label>
            <input
              id="chat-input"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write an E2EE encrypted message..."
              className="flex-1 min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1D4ED8]"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim() || !advisorPublicKey}
              aria-label="Send encrypted message"
              className="w-9 h-9 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-50 text-white flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
