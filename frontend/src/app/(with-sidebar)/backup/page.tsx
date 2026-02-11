'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

type Recurrence = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'

type BackupConfig = {
  id: number
  enabled: boolean
  type: Recurrence
  hour: number | null
  minute: number | null
  dayOfWeek: number | null
  dayOfMonth: number | null
  month: number | null
  maxFiles: number
  updatedAt: string
}

type BackupRow = {
  name: string
  size: number
  modified: string
}

type BackupListResp = {
  page: number
  perPage: number
  total: number
  items: BackupRow[]
}

const daysOfWeek = [
  { id: 0, label: 'Sunday' },
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
]

const months = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  label: new Date(2000, i, 1).toLocaleString(undefined, { month: 'long' }),
}))

function classNames(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(' ')
}

function formatMB(bytes: number) {
  const mb = bytes / (1024 * 1024)
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`
  return `${mb.toFixed(2)} MB`
}

function IconDownload() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v10m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 17v3h16v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function IconTrash() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M6 7h12m-10 0 1 14h8l1-14M9 7V4h6v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function IconRestore() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M3 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function BackupPage() {
  // config
  const [cfg, setCfg] = useState<BackupConfig | null>(null)
  const [saving, setSaving] = useState(false)

  // list
  const [daysFilter, setDaysFilter] = useState<number>(7)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [list, setList] = useState<BackupListResp | null>(null)
  const [loadingList, setLoadingList] = useState(false)

  // actions
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // upload restore
  const uploadRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  const totalPages = useMemo(() => {
    if (!list) return 1
    return Math.max(1, Math.ceil(list.total / list.perPage))
  }, [list])

  async function loadConfig() {
    setError(null)
    const res = await fetch(`${API}/backup/config`, { cache: 'no-store' })
    const data = await res.json()
    setCfg(data)
  }

  async function loadList(p = page, pp = perPage, d = daysFilter) {
    setError(null)
    setLoadingList(true)
    try {
      const res = await fetch(`${API}/backup/list?page=${p}&perPage=${pp}&days=${d}`, { cache: 'no-store' })
      const data = await res.json()
      setList(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load backups')
      setList(null)
    } finally {
      setLoadingList(false)
    }
  }

  async function saveConfig() {
    if (!cfg) return
    setError(null)

    // strict UI validation per type (so user cannot save broken)
    const t = cfg.type
    if (t === 'HOUR' && (cfg.minute === null || cfg.minute === undefined)) {
      setError('Minute is required for Hour schedule')
      return
    }
    if (t !== 'HOUR' && (cfg.hour === null || cfg.minute === null)) {
      setError('Hour and Minute are required')
      return
    }
    if (t === 'WEEK' && cfg.dayOfWeek === null) {
      setError('Day of Week is required')
      return
    }
    if ((t === 'MONTH' || t === 'YEAR') && cfg.dayOfMonth === null) {
      setError('Day of Month is required')
      return
    }
    if (t === 'YEAR' && cfg.month === null) {
      setError('Month is required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`${API}/backup/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: cfg.enabled,
          type: cfg.type,
          hour: cfg.hour,
          minute: cfg.minute,
          dayOfWeek: cfg.dayOfWeek,
          dayOfMonth: cfg.dayOfMonth,
          month: cfg.month,
          maxFiles: cfg.maxFiles,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Save failed')
      setCfg(data)
      alert('Saved')
    } catch (e: any) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function createBackupNow() {
    if (!cfg) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch(`${API}/backup/create`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Create backup failed')
      await loadList(1, perPage, daysFilter)
      setPage(1)
    } catch (e: any) {
      setError(e?.message || 'Create backup failed')
    } finally {
      setCreating(false)
    }
  }

  async function restoreFromFile(filename: string) {
    if (!confirm(`Restore database from "${filename}"?\nThis will overwrite current database objects.`)) return
    setError(null)
    try {
      const res = await fetch(`${API}/backup/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Restore failed')
      alert('Restore completed')
    } catch (e: any) {
      setError(e?.message || 'Restore failed')
    }
  }

  async function deleteFile(filename: string) {
    if (!confirm(`Delete backup "${filename}"?`)) return
    setError(null)
    try {
      const res = await fetch(`${API}/backup/file/${encodeURIComponent(filename)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Delete failed')
      await loadList(page, perPage, daysFilter)
    } catch (e: any) {
      setError(e?.message || 'Delete failed')
    }
  }

  async function uploadAndRestore(file: File) {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch(`${API}/backup/restore-upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Upload restore failed')
      alert('Restore completed')
    } catch (e: any) {
      setError(e?.message || 'Upload restore failed')
    } finally {
      setUploading(false)
      if (uploadRef.current) uploadRef.current.value = ''
    }
  }

  useEffect(() => {
    loadConfig()
    loadList(1, perPage, daysFilter)
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // reload list when filter changes
  useEffect(() => {
    loadList(1, perPage, daysFilter)
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysFilter, perPage])

  if (!cfg) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-slate-200 p-8">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-200 p-8">
      <h1 className="text-3xl font-semibold mb-8">Auto Backup</h1>

      {/* ===== AUTO BACKUP ===== */}
      <div className="mb-10">
        <div className="uppercase text-sm tracking-widest text-slate-400 mb-3">Auto Backup</div>
        <div className="h-px bg-slate-700/70 mb-6" />

        <div className="grid grid-cols-12 gap-6 items-center">
          {/* Enable */}
          <div className="col-span-12 flex items-center gap-6">
            <div className="w-56 text-slate-300">Enable Auto Backup</div>

            <button
              onClick={() => setCfg({ ...cfg, enabled: !cfg.enabled })}
              className={classNames(
                'relative w-16 h-8 rounded-md border transition',
                cfg.enabled ? 'bg-emerald-500/80 border-emerald-300/40' : 'bg-slate-700 border-slate-600'
              )}
            >
              <span
                className={classNames(
                  'absolute top-1 left-1 w-6 h-6 rounded bg-white/90 transition',
                  cfg.enabled ? 'translate-x-8' : 'translate-x-0'
                )}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                {cfg.enabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* Occurrence row */}
          <div className="col-span-12 flex items-center gap-6">
            <div className="w-56 text-slate-300">Occurrence</div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400">Every</span>

              <select
                value={cfg.type}
                onChange={(e) => setCfg({ ...cfg, type: e.target.value as Recurrence })}
                className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
              >
                <option value="HOUR">Hour</option>
                <option value="DAY">Day</option>
                <option value="WEEK">Week</option>
                <option value="MONTH">Month</option>
                <option value="YEAR">Year</option>
              </select>

              {/* Dynamic fields like screenshot */}
              {cfg.type === 'HOUR' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">at</span>
                  <select
                    value={cfg.minute ?? 0}
                    onChange={(e) => setCfg({ ...cfg, minute: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
                  >
                    {Array.from({ length: 60 }).map((_, m) => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span className="text-slate-400">past the hour</span>
                </div>
              )}

              {cfg.type === 'DAY' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">at</span>
                  <select
                    value={cfg.hour ?? 0}
                    onChange={(e) => setCfg({ ...cfg, hour: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
                  >
                    {Array.from({ length: 24 }).map((_, h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-slate-400">:</span>
                  <select
                    value={cfg.minute ?? 0}
                    onChange={(e) => setCfg({ ...cfg, minute: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
                  >
                    {Array.from({ length: 60 }).map((_, m) => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              )}

              {cfg.type === 'WEEK' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">on</span>
                  <select
                    value={cfg.dayOfWeek ?? 0}
                    onChange={(e) => setCfg({ ...cfg, dayOfWeek: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
                  >
                    {daysOfWeek.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                  <span className="text-slate-400">at</span>
                  <select
                    value={cfg.hour ?? 0}
                    onChange={(e) => setCfg({ ...cfg, hour: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
                  >
                    {Array.from({ length: 24 }).map((_, h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-slate-400">:</span>
                  <select
                    value={cfg.minute ?? 0}
                    onChange={(e) => setCfg({ ...cfg, minute: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
                  >
                    {Array.from({ length: 60 }).map((_, m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                  </select>
                </div>
              )}

              {cfg.type === 'MONTH' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">on the</span>
                  <select
                    value={cfg.dayOfMonth ?? 1}
                    onChange={(e) => setCfg({ ...cfg, dayOfMonth: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
                  >
                    {Array.from({ length: 31 }).map((_, d) => <option key={d + 1} value={d + 1}>{d + 1}</option>)}
                  </select>
                  <span className="text-slate-400">at</span>
                  <select
                    value={cfg.hour ?? 0}
                    onChange={(e) => setCfg({ ...cfg, hour: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
                  >
                    {Array.from({ length: 24 }).map((_, h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-slate-400">:</span>
                  <select
                    value={cfg.minute ?? 0}
                    onChange={(e) => setCfg({ ...cfg, minute: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
                  >
                    {Array.from({ length: 60 }).map((_, m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                  </select>
                </div>
              )}

              {cfg.type === 'YEAR' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">on the</span>
                  <select
                    value={cfg.dayOfMonth ?? 1}
                    onChange={(e) => setCfg({ ...cfg, dayOfMonth: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
                  >
                    {Array.from({ length: 31 }).map((_, d) => <option key={d + 1} value={d + 1}>{d + 1}</option>)}
                  </select>
                  <span className="text-slate-400">of</span>
                  <select
                    value={cfg.month ?? 1}
                    onChange={(e) => setCfg({ ...cfg, month: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
                  >
                    {months.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                  <span className="text-slate-400">at</span>
                  <select
                    value={cfg.hour ?? 0}
                    onChange={(e) => setCfg({ ...cfg, hour: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
                  >
                    {Array.from({ length: 24 }).map((_, h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-slate-400">:</span>
                  <select
                    value={cfg.minute ?? 0}
                    onChange={(e) => setCfg({ ...cfg, minute: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
                  >
                    {Array.from({ length: 60 }).map((_, m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 flex items-center gap-6">
            <div className="w-56 text-slate-300">Maximum Number of Files</div>
            <input
              type="number"
              min={1}
              max={200}
              value={cfg.maxFiles}
              onChange={(e) => setCfg({ ...cfg, maxFiles: Number(e.target.value) })}
              className="w-24 bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
            />
          </div>

          <div className="col-span-12">
            <button
              onClick={saveConfig}
              disabled={saving}
              className={classNames(
                'px-6 py-2 rounded bg-sky-600 hover:bg-sky-500 transition font-semibold',
                saving && 'opacity-60 cursor-not-allowed'
              )}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          {error && (
            <div className="col-span-12 text-red-300 bg-red-500/10 border border-red-500/30 rounded p-3">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* ===== BACKUP / RESTORE ===== */}
      <div className="mb-10">
        <div className="uppercase text-sm tracking-widest text-slate-400 mb-3">Backup / Restore</div>
        <div className="h-px bg-slate-700/70 mb-6" />

        <div className="flex items-center gap-6 mb-4">
          <div className="w-56 text-slate-300">Download Backup</div>

          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(Number(e.target.value))}
            className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
          >
            <option value={7}>Last 7 days</option>
            <option value={15}>Last 15 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <button
            onClick={() => loadList(1, perPage, daysFilter)}
            className="px-6 py-2 rounded bg-sky-600 hover:bg-sky-500 transition font-semibold"
          >
            Download File
          </button>
          <span className="text-slate-500 text-sm">(Use table Download buttons)</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-56 text-slate-300">Restore Backup</div>

          <input
            ref={uploadRef}
            type="file"
            accept=".backup"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadAndRestore(f)
            }}
          />

          <button
            disabled={uploading}
            onClick={() => uploadRef.current?.click()}
            className={classNames(
              'px-6 py-2 rounded bg-sky-600 hover:bg-sky-500 transition font-semibold',
              uploading && 'opacity-60 cursor-not-allowed'
            )}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>

          <span className="text-slate-500 text-sm">(.backup)</span>
        </div>
      </div>

      {/* ===== AVAILABLE BACKUPS ===== */}
      <div>
        <div className="uppercase text-sm tracking-widest text-slate-400 mb-3">Available Backups</div>
        <div className="h-px bg-slate-700/70 mb-6" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-slate-300">Rows per page:</div>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-400"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <button
            onClick={createBackupNow}
            disabled={creating}
            className={classNames(
              'px-6 py-2 rounded bg-emerald-600 hover:bg-emerald-500 transition font-semibold',
              creating && 'opacity-60 cursor-not-allowed'
            )}
          >
            {creating ? 'Creating...' : 'Create Backup'}
          </button>
        </div>

        <div className="overflow-x-auto rounded border border-slate-700">
          <table className="w-full text-left">
            <thead className="bg-slate-900/30">
              <tr className="text-slate-400">
                <th className="px-4 py-3 font-semibold">File</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Size</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingList && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={4}>Loading...</td>
                </tr>
              )}

              {!loadingList && list?.items?.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={4}>No backups found</td>
                </tr>
              )}

              {!loadingList && list?.items?.map((b) => (
                <tr key={b.name} className="border-t border-slate-700 hover:bg-slate-800/40">
                  <td className="px-4 py-3">{b.name}</td>
                  <td className="px-4 py-3">{new Date(b.modified).toLocaleString()}</td>
                  <td className="px-4 py-3">{formatMB(b.size)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-5">
                      <button
                        onClick={() => restoreFromFile(b.name)}
                        className="inline-flex items-center gap-2 text-sky-300 hover:text-sky-200"
                        title="Restore"
                      >
                        <IconRestore /> <span className="text-sm font-semibold">RESTORE</span>
                      </button>

                      <a
                        href={`${API}/backup/download/${encodeURIComponent(b.name)}`}
                        className="inline-flex items-center gap-2 text-sky-300 hover:text-sky-200"
                        title="Download"
                      >
                        <IconDownload /> <span className="text-sm font-semibold">DOWNLOAD</span>
                      </a>

                      <button
                        onClick={() => deleteFile(b.name)}
                        className="inline-flex items-center gap-2 text-sky-300 hover:text-sky-200"
                        title="Delete"
                      >
                        <IconTrash /> <span className="text-sm font-semibold">DELETE</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer like screenshot */}
        {list && (
          <div className="flex items-center justify-between mt-4 text-slate-400">
            <div>
              {(list.total === 0) ? '0 records' : `${(list.page - 1) * list.perPage + 1}-${Math.min(list.page * list.perPage, list.total)} of ${list.total} records`}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={async () => { const p = Math.max(1, page - 1); setPage(p); await loadList(p, perPage, daysFilter) }}
                className={classNames(
                  'px-3 py-2 rounded border border-slate-700',
                  page <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-800'
                )}
              >
                ◀
              </button>

              <div className="px-3 py-2 rounded border border-slate-700">
                Page {page} / {totalPages}
              </div>

              <button
                disabled={page >= totalPages}
                onClick={async () => { const p = Math.min(totalPages, page + 1); setPage(p); await loadList(p, perPage, daysFilter) }}
                className={classNames(
                  'px-3 py-2 rounded border border-slate-700',
                  page >= totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-800'
                )}
              >
                ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
