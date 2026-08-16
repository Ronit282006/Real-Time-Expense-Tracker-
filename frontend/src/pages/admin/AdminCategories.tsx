import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  adminCategoriesApi, adminCreateCategoryApi, adminUpdateCategoryApi, adminDeleteCategoryApi,
} from '../../api/client';
import type { Category } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';
import { FullPageLoader } from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 10,
  fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box',
};

const btn = (color: string): React.CSSProperties => ({
  padding: '7px 14px', borderRadius: 10, border: '1px solid #e5e7eb',
  background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  color, transition: 'all 0.2s',
});

export default function AdminCategories() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCats = useCallback(() => {
    setLoading(true);
    adminCategoriesApi()
      .then(r => setCats(r.data))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCats(); }, [fetchCats]);

  const addCategory = async () => {
    if (!newName.trim()) { toast.error('Category name is required'); return; }
    setAdding(true);
    try {
      await adminCreateCategoryApi(newName.trim());
      toast.success('Category added');
      setNewName('');
      fetchCats();
    } catch { toast.error('Add failed'); }
    finally { setAdding(false); }
  };

  const toggleActive = async (c: Category) => {
    try {
      await adminUpdateCategoryApi(c.id, { is_active: !c.is_active });
      toast.success(c.is_active ? 'Category disabled' : 'Category enabled');
      fetchCats();
    } catch { toast.error('Action failed'); }
  };

  const saveRename = async (c: Category) => {
    if (!renameValue.trim()) { toast.error('Name cannot be empty'); return; }
    try {
      await adminUpdateCategoryApi(c.id, { name: renameValue.trim() });
      toast.success('Category renamed');
      setRenameId(null);
      fetchCats();
    } catch { toast.error('Rename failed'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteCategoryApi(deleteTarget.id);
      toast.success('Category deleted');
      setDeleteTarget(null);
      fetchCats();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>Add Category</h3>
        <div className="flex flex-col sm:flex-row" style={{ gap: 12 }}>
          <input placeholder="Category name" value={newName} onChange={e => setNewName(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0, maxWidth: 400 }} />
          <button onClick={addCategory} disabled={adding} style={btn('#7c3aed')}>{adding ? 'Adding…' : 'Add Category'}</button>
        </div>
      </div>

      {loading ? <FullPageLoader /> : cats.length === 0 ? (
        <EmptyState title="No categories" description="Add your first category above." />
      ) : (
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                {['ID', 'Name', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#9ca3af', fontWeight: 500, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '12px', color: '#9ca3af' }}>{c.id}</td>
                  <td style={{ padding: '12px' }}>
                    {renameId === c.id ? (
                      <div className="flex flex-col sm:flex-row" style={{ gap: 8 }}>
                        <input value={renameValue} onChange={e => setRenameValue(e.target.value)} autoFocus style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => saveRename(c)} style={btn('#7c3aed')}>Save</button>
                          <button onClick={() => setRenameId(null)} style={btn('#6b7280')}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 600, color: '#374151' }}>{c.name}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: c.is_active ? '#ecfdf5' : '#fef2f2',
                      color: c.is_active ? '#059669' : '#dc2626',
                    }}>{c.is_active ? 'Active' : 'Disabled'}</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button style={btn('#7c3aed')} onClick={() => { setRenameId(c.id); setRenameValue(c.name); }}>Rename</button>
                      <button style={btn(c.is_active ? '#ef4444' : '#059669')} onClick={() => toggleActive(c)}>
                        {c.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button style={btn('#ef4444')} onClick={() => setDeleteTarget(c)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={`Delete the category "${deleteTarget?.name}"? Existing transactions keep their category text.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </motion.div>
  );
}
