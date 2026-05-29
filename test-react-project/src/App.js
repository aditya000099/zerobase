import { useState, useEffect, useRef } from "react";
import {
  ZeroBaseClient,
  AuthClient,
  DatabaseClient,
  StorageClient,
  RealtimeClient,
} from "./zerobaseSDK";
// import {
//   ZeroBaseClient,
//   AuthClient,
//   DatabaseClient,
//   StorageClient,
// } from "zerobase";

// ── Server health hook ─────────────────────────────────────────────────────
function useServerHealth(baseUrl) {
  const [health, setHealth] = useState({ status: "checking" });
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/health`, {
          signal: AbortSignal.timeout(4000),
        });
        const data = await res.json();
        if (!cancelled) setHealth(data);
      } catch {
        if (!cancelled) setHealth({ status: "down" });
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [baseUrl]);
  return health;
}

// ── SDK setup ─────────────────────────────────────────────────────────────────
const PROJECT_ID = "project_1773320343030";
const BASE_URL = "http://localhost:3000";
const API_KEY = "76d1bcbf-6394-4e52-bd09-fab8340a28d6";
// const API_KEY = "api-key-removed";

const zbClient = new ZeroBaseClient(PROJECT_ID, BASE_URL, API_KEY);
const auth = new AuthClient(zbClient);
const db = new DatabaseClient(zbClient);
const storage = new StorageClient(zbClient);
const rt = new RealtimeClient(zbClient);

// ── helpers ───────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function formatMb(mb) {
  if (!mb && mb !== 0) return "—";
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb} MB`;
}
function Badge({ children, color = "zinc" }) {
  const cls = {
    zinc: "bg-zinc-800 text-zinc-300 ring-zinc-700",
    green: "bg-green-900/40 text-green-400 ring-green-800/60",
    blue: "bg-blue-900/40 text-blue-400 ring-blue-800/60",
    red: "bg-red-900/40 text-red-400 ring-red-800/60",
    amber: "bg-amber-900/40 text-amber-400 ring-amber-800/60",
  }[color];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${cls}`}
    >
      {children}
    </span>
  );
}
function Section({ title, subtitle, badge, children }) {
  return (
    <section className="rounded-2xl bg-zinc-900/60 ring-1 ring-zinc-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
          {subtitle && (
            <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {badge}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
function Btn({
  onClick,
  children,
  variant = "primary",
  size = "md",
  disabled,
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-xl font-medium transition-all disabled:opacity-50";
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const v = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow",
    ghost: "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 ring-1 ring-zinc-700",
    danger: "bg-red-600/80 text-white hover:bg-red-500",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sz} ${v}`}
    >
      {children}
    </button>
  );
}
function Input({ label, ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      )}
      <input
        {...props}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/50"
      />
    </div>
  );
}
function Toast({ msg, onDone }) {
  useEffect(() => {
    if (msg) {
      const t = setTimeout(onDone, 3500);
      return () => clearTimeout(t);
    }
  }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-zinc-800 px-4 py-3 text-sm text-zinc-100 ring-1 ring-zinc-700 shadow-xl animate-fade-in">
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const health = useServerHealth(BASE_URL);
  const statusDot =
    {
      ok: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]",
      degraded: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]",
      down: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]",
      checking: "bg-white/30 animate-pulse",
    }[health.status] ?? "bg-white/30";
  const statusLabel =
    {
      ok: "API Online",
      degraded: "API Degraded",
      down: "API Offline",
      checking: "Checking…",
    }[health.status] ?? "Unknown";

  const [toast, setToast] = useState(null);
  const notify = (msg) => setToast(msg);

  // ── Auth ──
  const [users, setUsers] = useState([]);
  const [signup, setSignup] = useState({ name: "", email: "", password: "" });
  const [authLoading, setAuthLoading] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await auth.getUsers();
      setUsers(Array.isArray(res) ? res : []);
    } catch {
      setUsers([]);
    }
  };
  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await auth.createUser(signup);
      notify(`✅ User "${signup.name}" created`);
      setSignup({ name: "", email: "", password: "" });
      loadUsers();
    } catch (err) {
      notify(`❌ ${err.message || "Signup failed"}`);
    } finally {
      setAuthLoading(false);
    }
  };
  const handleDeleteUser = async (id, email) => {
    if (!window.confirm(`Delete ${email}?`)) return;
    try {
      await auth.deleteUser(id);
      notify("🗑 User deleted");
      loadUsers();
    } catch (err) {
      notify(`❌ ${err.message}`);
    }
  };

  // ── Database ──
  const [tables, setTables] = useState([]);
  const [activeTable, setActiveTable] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newTable, setNewTable] = useState("");
  const [dbLoading, setDbLoading] = useState(false);
  const [newDoc, setNewDoc] = useState("");

  const loadTables = async () => {
    try {
      const res = await db.getTables();
      const filtered = (res.tables || []).filter(
        (t) => !["auth_users", "logs"].includes(t.table_name),
      );
      setTables(filtered);
      if (filtered.length && !activeTable)
        setActiveTable(filtered[0].table_name);
    } catch {
      setTables([]);
    }
  };
  const loadDocuments = async (tableName) => {
    try {
      const res = await db.getDocuments(tableName);
      setDocuments(res.documents || []);
    } catch {
      setDocuments([]);
    }
  };
  useEffect(() => {
    if (activeTable) loadDocuments(activeTable);
  }, [activeTable]);

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTable.trim()) return;
    setDbLoading(true);
    try {
      await db.createTable(newTable.trim());
      notify(`✅ Table "${newTable}" created`);
      setNewTable("");
      loadTables();
    } catch (err) {
      notify(`❌ ${err.message}`);
    } finally {
      setDbLoading(false);
    }
  };
  const handleInsertDoc = async (e) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(newDoc);
      await db.createDocument(activeTable, parsed);
      notify("✅ Record inserted");
      setNewDoc("");
      loadDocuments(activeTable);
    } catch (err) {
      notify(`❌ ${err.message || "Invalid JSON"}`);
    }
  };

  // ── Storage ──
  const [storageInfo, setStorageInfo] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const ACCEPTED = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
  ];

  const loadStorage = async () => {
    try {
      const [info, list] = await Promise.all([
        storage.getInfo(),
        storage.listFiles(),
      ]);
      setStorageInfo(info);
      setFiles(list.files || []);
    } catch {}
  };
  const handleUpload = async (fileList) => {
    const valid = Array.from(fileList).filter((f) => ACCEPTED.includes(f.type));
    if (!valid.length) {
      notify("❌ Only PDF, PNG, JPG, GIF, WebP allowed");
      return;
    }
    setUploading(true);
    let ok = 0;
    for (const file of valid) {
      const res = await storage.uploadFile(file);
      if (res.success) ok++;
    }
    notify(`✅ ${ok}/${valid.length} file(s) uploaded`);
    setUploading(false);
    loadStorage();
  };
  const handleDeleteFile = async (name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await storage.deleteFile(name);
    notify("🗑 File deleted");
    loadStorage();
  };
  const storagePct = storageInfo
    ? Math.min((storageInfo.usedMb / (storageInfo.quotaMb || 1)) * 100, 100)
    : 0;

  // ── Realtime ──
  const [rtConnected, setRtConnected] = useState(false);
  const [rtEvents, setRtEvents] = useState([]);

  const toggleRealtime = async () => {
    if (rtConnected) {
      rt.disconnect();
      setRtConnected(false);
      notify("⚡ Realtime disconnected");
      return;
    }
    try {
      await rt.connect();
      setRtConnected(true);
      notify("⚡ Realtime connected!");
      // subscribe to loaded tables + schema changes
      tables.forEach((t) =>
        rt.subscribe(t.table_name, (event, data) =>
          setRtEvents((prev) =>
            [
              {
                event,
                table: t.table_name,
                data,
                _ts: new Date().toLocaleTimeString(),
              },
              ...prev,
            ].slice(0, 30),
          ),
        ),
      );
      rt.subscribe("__schema__", (event, data) =>
        setRtEvents((prev) =>
          [
            {
              event,
              table: "__schema__",
              data,
              _ts: new Date().toLocaleTimeString(),
            },
            ...prev,
          ].slice(0, 30),
        ),
      );
    } catch {
      notify("❌ Realtime connection failed");
    }
  };

  // ── Init ──
  useEffect(() => {
    loadUsers();
    loadTables();
    loadStorage();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <Toast msg={toast} onDone={() => setToast(null)} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              Z
            </div>
            <span className="font-semibold text-zinc-100">ZeroBase</span>
            <Badge color="blue">Demo</Badge>
          </div>
          {/* Server health pill */}
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot}`} />
            <span className="text-xs text-zinc-400">{statusLabel}</span>
            {health.uptime !== undefined && (
              <span className="text-xs text-zinc-600">
                · {Math.floor(health.uptime / 60)}m up
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 font-mono">{PROJECT_ID}</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {/* ── USERS ────────────────────────────────────────────────── */}
        <Section
          title="👤 Authentication"
          subtitle="Create & manage project users via auth.createUser() / auth.getUsers()"
          badge={<Badge color="green">{users.length} users</Badge>}
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create user form */}
            <div>
              <p className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">
                Create User
              </p>
              <form onSubmit={handleSignup} className="space-y-3">
                <Input
                  label="Name"
                  placeholder="Alice"
                  value={signup.name}
                  onChange={(e) =>
                    setSignup({ ...signup, name: e.target.value })
                  }
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="alice@example.com"
                  value={signup.email}
                  onChange={(e) =>
                    setSignup({ ...signup, email: e.target.value })
                  }
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={signup.password}
                  onChange={(e) =>
                    setSignup({ ...signup, password: e.target.value })
                  }
                  required
                />
                <Btn variant="primary" disabled={authLoading}>
                  {authLoading ? "Creating…" : "Create User"}
                </Btn>
              </form>
            </div>

            {/* User list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Users
                </p>
                <Btn variant="ghost" size="sm" onClick={loadUsers}>
                  Refresh
                </Btn>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {users.length === 0 && (
                  <p className="text-sm text-zinc-600">No users yet.</p>
                )}
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        {u.name || "—"}
                      </p>
                      <p className="text-xs text-zinc-500">{u.email}</p>
                    </div>
                    <Btn
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteUser(u.id, u.email)}
                    >
                      Delete
                    </Btn>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── DATABASE ─────────────────────────────────────────────── */}
        <Section
          title="🗄️ Database"
          subtitle="Create tables and insert records via db.createTable() / db.createDocument()"
          badge={<Badge color="blue">{tables.length} tables</Badge>}
        >
          <div className="space-y-5">
            {/* Create table */}
            <form onSubmit={handleCreateTable} className="flex gap-2">
              <input
                value={newTable}
                onChange={(e) => setNewTable(e.target.value)}
                placeholder="New table name…"
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/50"
              />
              <Btn variant="primary" disabled={dbLoading}>
                Create Table
              </Btn>
            </form>

            {tables.length > 0 && (
              <div className="grid md:grid-cols-3 gap-4">
                {/* Table list */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                    Tables
                  </p>
                  {tables.map((t) => (
                    <button
                      key={t.table_name}
                      onClick={() => setActiveTable(t.table_name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all
                        ${
                          activeTable === t.table_name
                            ? "bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-600/40"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        }`}
                    >
                      {t.table_name}
                      <span className="ml-2 text-xs text-zinc-600">
                        ({t.columns?.length || 0} cols)
                      </span>
                    </button>
                  ))}
                </div>

                {/* Documents */}
                <div className="md:col-span-2 space-y-3">
                  {activeTable && (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          {activeTable} — {documents.length} records
                        </p>
                      </div>

                      {/* Insert form */}
                      <form onSubmit={handleInsertDoc} className="space-y-2">
                        <textarea
                          value={newDoc}
                          onChange={(e) => setNewDoc(e.target.value)}
                          rows={3}
                          placeholder={'{"name": "example", "value": "hello"}'}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 resize-none"
                        />
                        <Btn variant="ghost" size="sm">
                          Insert Record
                        </Btn>
                      </form>

                      {/* Rows */}
                      <div className="overflow-x-auto rounded-xl border border-zinc-800">
                        {documents.length === 0 ? (
                          <p className="text-xs text-zinc-600 p-4">
                            No records yet.
                          </p>
                        ) : (
                          <table className="w-full text-xs text-left">
                            <thead className="bg-zinc-900 text-zinc-400">
                              <tr>
                                {Object.keys(documents[0]).map((k) => (
                                  <th
                                    key={k}
                                    className="px-3 py-2 font-medium border-b border-zinc-800"
                                  >
                                    {k}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {documents.map((doc, i) => (
                                <tr
                                  key={i}
                                  className="border-t border-zinc-800/60 hover:bg-zinc-900/40"
                                >
                                  {Object.values(doc).map((v, j) => (
                                    <td
                                      key={j}
                                      className="px-3 py-2 text-zinc-300 font-mono truncate max-w-xs"
                                    >
                                      {v === null ? (
                                        <span className="text-zinc-600">
                                          null
                                        </span>
                                      ) : (
                                        String(v)
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            {tables.length === 0 && (
              <p className="text-sm text-zinc-600">
                No tables yet. Create one above.
              </p>
            )}
          </div>
        </Section>

        {/* ── STORAGE ──────────────────────────────────────────────── */}
        <Section
          title="📦 Storage"
          subtitle="Upload files via storage.uploadFile(file). Supports PDF, PNG, JPG, GIF, WebP."
          badge={
            storageInfo ? (
              <Badge color="amber">
                {formatMb(storageInfo.usedMb)} / {formatMb(storageInfo.quotaMb)}
              </Badge>
            ) : null
          }
        >
          <div className="space-y-5">
            {/* Quota bar */}
            {storageInfo && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Used: {formatMb(storageInfo.usedMb)}</span>
                  <span>
                    Quota: {formatMb(storageInfo.quotaMb)} · Server free:{" "}
                    {formatMb(storageInfo.availableDiskMb)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500
                    ${storagePct >= 90 ? "bg-red-500" : storagePct >= 70 ? "bg-amber-500" : "bg-indigo-500"}`}
                    style={{ width: `${storagePct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleUpload(e.dataTransfer.files);
              }}
              onClick={() => !uploading && fileInput.current.click()}
              className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all
                ${dragging ? "border-indigo-500/60 bg-indigo-600/5" : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40"}`}
            >
              <input
                ref={fileInput}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
              {uploading ? (
                <>
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                  <p className="text-sm text-zinc-400">Uploading…</p>
                </>
              ) : (
                <>
                  <div className="text-3xl">⬆️</div>
                  <p className="text-sm text-zinc-400">
                    Drop files or{" "}
                    <span className="text-indigo-400">browse</span>
                  </p>
                  <p className="text-xs text-zinc-600">
                    PDF · PNG · JPG · GIF · WebP · max 50 MB
                  </p>
                </>
              )}
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Files ({files.length})
                </p>
                <div className="space-y-2">
                  {files.map((f) => {
                    const url = storage.getFileUrl(f.name);
                    const isImage = [
                      ".png",
                      ".jpg",
                      ".jpeg",
                      ".gif",
                      ".webp",
                    ].includes(f.ext);
                    return (
                      <div
                        key={f.name}
                        className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 group"
                      >
                        {isImage ? (
                          <img
                            src={url}
                            alt={f.name}
                            className="w-10 h-10 rounded-lg object-cover border border-zinc-800 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center text-lg shrink-0">
                            📄
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-200 truncate">
                            {f.name}
                          </p>
                          <p className="text-xs text-zinc-600 font-mono">
                            {formatBytes(f.sizeBytes)} ·{" "}
                            {new Date(f.modifiedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={url}
                            download={f.name}
                            className="text-xs text-zinc-400 hover:text-indigo-400 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
                          >
                            ⬇ Download
                          </a>
                          <Btn
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteFile(f.name)}
                          >
                            Delete
                          </Btn>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {files.length === 0 && !uploading && (
              <p className="text-sm text-zinc-600">No files uploaded yet.</p>
            )}
          </div>
        </Section>

        {/* ── Realtime ─────────────────────────────────────────────── */}
        <Section
          title="⚡ Realtime"
          subtitle="WebSocket live connection"
          badge={
            <Badge color={rtConnected ? "green" : "zinc"}>
              {rtConnected ? "Connected" : "Off"}
            </Badge>
          }
        >
          <div className="space-y-4">
            {/* Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleRealtime}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  rtConnected ? "bg-emerald-600" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    rtConnected ? "translate-x-6" : ""
                  }`}
                />
              </button>
              <span className="text-sm text-zinc-300">
                {rtConnected ? "Listening for changes…" : "Click to connect"}
              </span>
            </div>

            {/* Event log */}
            {rtEvents.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-medium">
                    Live Events
                  </span>
                  <button
                    onClick={() => setRtEvents([])}
                    className="text-xs text-zinc-600 hover:text-zinc-400"
                  >
                    Clear
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-zinc-900">
                  {rtEvents.map((ev, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 flex items-start gap-2 text-xs"
                    >
                      <span className="text-zinc-600 shrink-0">{ev._ts}</span>
                      <Badge
                        color={
                          ev.event === "INSERT"
                            ? "green"
                            : ev.event === "UPDATE"
                              ? "blue"
                              : "amber"
                        }
                      >
                        {ev.event}
                      </Badge>
                      <span className="text-zinc-400 font-mono">
                        {ev.table}
                      </span>
                      <span className="text-zinc-600 truncate">
                        {JSON.stringify(ev.data).slice(0, 80)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ── SDK Snippet ───────────────────────────────────────────── */}
        <Section
          title="📋 SDK Usage"
          subtitle="Copy-paste snippets for your own project"
        >
          <div className="space-y-3 text-xs font-mono text-zinc-400 bg-zinc-950 rounded-xl p-4 border border-zinc-800 overflow-x-auto whitespace-pre">{`import { ZeroBaseClient, AuthClient, DatabaseClient, StorageClient } from 'zerobase';

const client  = new ZeroBaseClient('YOUR_PROJECT_ID', 'https://your-api.com', 'YOUR_API_KEY');
const auth    = new AuthClient(client);
const db      = new DatabaseClient(client);
const storage = new StorageClient(client);

// Auth
await auth.createUser({ name, email, password });
const users = await auth.getUsers();

// Database
await db.createTable('products');
await db.createDocument('products', { name: 'Widget', price: 9.99 });
const { documents } = await db.getDocuments('products');

// Storage
const input = document.querySelector('input[type=file]');
await storage.uploadFile(input.files[0]);
const { files } = await storage.listFiles();
const url = storage.getFileUrl(files[0].name);   // direct download / preview`}</div>
        </Section>
      </main>
    </div>
  );
}
