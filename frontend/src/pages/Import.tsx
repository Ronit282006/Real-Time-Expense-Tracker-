import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { uploadFileApi } from '../api/client';
import toast from 'react-hot-toast';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && ['.csv', '.xlsx', '.xls'].some(ext => f.name.toLowerCase().endsWith(ext))) {
      setFile(f);
      setDone(false);
    } else {
      toast.error('Please upload a CSV or Excel file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadFileApi(file);
      toast.success('File uploaded! Processing in background.');
      setDone(true);
      setFile(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 600, margin: '0 auto' }}>
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="p-5 md:p-8"
        style={{ background: '#fff', borderRadius: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Import Transactions</h1>
        <p style={{ fontSize: 14, color: '#9ca3af', margin: '0 0 24px' }}>Upload a CSV or Excel file to bulk import transactions</p>

        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed #d1d5db', borderRadius: 20, padding: 48,
            textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
            background: file ? '#f5f3ff' : '#fafafa',
            borderColor: file ? '#7c3aed' : '#d1d5db',
          }}
          onMouseEnter={e => { if (!file) e.currentTarget.style.borderColor = '#7c3aed'; }}
          onMouseLeave={e => { if (!file) e.currentTarget.style.borderColor = '#d1d5db'; }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setDone(false); } }}
          />
          {file ? (
            <div>
              <span style={{ fontSize: 40 }}>📄</span>
              <p style={{ fontSize: 16, fontWeight: 600, margin: '12px 0 4px', color: '#374151' }}>{file.name}</p>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px', color: '#374151' }}>Drop a file here, or click to browse</p>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Supports CSV, XLSX, XLS</p>
            </div>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleUpload}
          disabled={!file || uploading || done}
          style={{
            width: '100%', padding: '14px', marginTop: 20, borderRadius: 12, border: 'none',
            background: !file || done ? '#d1d5db' : uploading ? '#a78bfa' : '#7c3aed',
            color: '#fff', fontSize: 15, fontWeight: 600, cursor: !file || done ? 'not-allowed' : 'pointer',
          }}
        >
          {done ? 'Uploaded ✓' : uploading ? 'Uploading…' : 'Upload & Import'}
        </motion.button>

        {done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 20, padding: 16, borderRadius: 12,
              background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: 14, color: '#065f46',
            }}
          >
            Your file has been uploaded and is being processed in the background. A summary will be sent to your email.
          </motion.div>
        )}

        <div style={{ marginTop: 24, padding: 20, borderRadius: 16, background: '#fafafa' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>File Format Requirements</h3>
          <ul style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
            <li>First row must be headers</li>
            <li>Required columns: <strong>type</strong> (income/expense), <strong>amount</strong>, <strong>category</strong></li>
            <li>Optional columns: <strong>note</strong>, <strong>date</strong>, <strong>time</strong></li>
            <li>Maximum file size: 20 MB</li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}
