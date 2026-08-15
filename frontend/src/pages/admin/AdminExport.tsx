import { useState } from 'react';
import { motion } from 'framer-motion';
import { adminExportApi } from '../../api/client';
import toast from 'react-hot-toast';

interface ExportCard {
  kind: 'users' | 'transactions';
  format: 'csv' | 'xlsx';
  label: string;
  description: string;
  icon: string;
}

const exports: ExportCard[] = [
  { kind: 'users', format: 'csv', label: 'Users CSV', description: 'All accounts with income, expense and transaction stats', icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4m4 4a4 4 0 01-4-4m4 4h3a3 3 0 013 3v1M7 20v-1a3 3 0 013-3h0' },
  { kind: 'users', format: 'xlsx', label: 'Users Excel', description: 'All accounts with stats in .xlsx format', icon: 'M8 17V7m8 10V7m-12 5h16M8 7h4m0 0h8M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z' },
  { kind: 'transactions', format: 'csv', label: 'Transactions CSV', description: 'Every transaction across all users', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { kind: 'transactions', format: 'xlsx', label: 'Transactions Excel', description: 'Every transaction across all users in .xlsx format', icon: 'M8 17V7m8 10V7m-12 5h16M8 7h4m0 0h8M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z' },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AdminExport() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (e: ExportCard) => {
    const key = `${e.kind}.${e.format}`;
    setDownloading(key);
    try {
      const r = await adminExportApi(e.kind, e.format);
      downloadBlob(r.data as Blob, `${e.kind}.${e.format}`);
      toast.success(`${e.label} downloaded`);
    } catch {
      toast.error(`Failed to export ${e.label}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>Download the full platform dataset. Exports contain all users and all transactions.</p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {exports.map(e => (
          <motion.div
            key={`${e.kind}.${e.format}`}
            whileHover={{ y: -4 }}
            style={{ flex: '1 1 260px', maxWidth: 360, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14, marginBottom: 16,
              background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={e.icon} />
              </svg>
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 600 }}>{e.label}</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>{e.description}</p>
            <button
              onClick={() => handleDownload(e)}
              disabled={downloading !== null}
              style={{
                width: '100%', padding: '11px', borderRadius: 12, border: 'none',
                background: downloading === `${e.kind}.${e.format}` ? '#a78bfa' : '#7c3aed',
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: downloading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {downloading === `${e.kind}.${e.format}` ? 'Downloading…' : `Download ${e.label}`}
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
