import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Wrench,
  Check,
} from 'lucide-react';
import { Equipment } from '../types.ts';
import { api } from '../services/api.ts';

export const StaffInventoryPage: React.FC = () => {
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formTotal, setFormTotal] = useState(1);
  const [formAvail, setFormAvail] = useState(1);
  const [formStatus, setFormStatus] = useState<'active' | 'maintenance' | 'retired'>('active');
  const [formSpecs, setFormSpecs] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.getCatalog(true); // all = true
      setItems(res.items);
    } catch (err: any) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(items.map(i => i.category))).filter(Boolean);

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.object_name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      (item.model_or_specs && item.model_or_specs.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('General Electronics');
    setFormTotal(5);
    setFormAvail(5);
    setFormStatus('active');
    setFormSpecs('');
    setModalOpen(true);
  };

  const openEditModal = (item: Equipment) => {
    setEditingItem(item);
    setFormName(item.object_name);
    setFormCategory(item.category);
    setFormTotal(item.total_quantity);
    setFormAvail(item.available_quantity);
    setFormStatus(item.status);
    setFormSpecs(item.model_or_specs || '');
    setModalOpen(true);
  };

  const handleStockDelta = async (item: Equipment, delta: number) => {
    try {
      await api.adjustStock(item.equipment_id, delta);
      fetchInventory();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.updateEquipment(editingItem.equipment_id, {
          object_name: formName,
          category: formCategory,
          total_quantity: Number(formTotal),
          available_quantity: Number(formAvail),
          status: formStatus,
          model_or_specs: formSpecs,
        });
        setNotice(`Equipment "${formName}" updated successfully`);
      } else {
        await api.createEquipment({
          object_name: formName,
          category: formCategory,
          total_quantity: Number(formTotal),
          available_quantity: Number(formAvail),
          status: formStatus,
          model_or_specs: formSpecs,
        });
        setNotice(`Equipment "${formName}" added to inventory`);
      }
      setModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#00205B] dark:text-white tracking-tight flex items-center gap-2">
            <span>Laboratory Inventory Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cavendish University Zambia • Add new items, manage physical stock, and set equipment operational status
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#00205B] hover:bg-[#0B1B3D] text-white font-black text-xs inline-flex items-center gap-2 shadow-md shadow-blue-950/20 transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          Add Equipment Item
        </button>
      </div>

      {notice && (
        <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0C182E] rounded-3xl p-4 border border-blue-100 dark:border-blue-900/60 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3 transition-colors">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 dark:text-blue-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items, categories, or technical specs..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00205B] outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 dark:text-blue-400" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden w-full md:w-auto"
          >
            <option value="all">All Categories ({items.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-[#0C182E] rounded-3xl border border-blue-100 dark:border-blue-900/60 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="py-16 text-center text-slate-400 dark:text-blue-300">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00205B] dark:text-amber-400" />
            <p className="text-xs font-bold">Loading lab inventory catalog...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <Boxes className="w-12 h-12 mx-auto mb-2 text-blue-200 dark:text-blue-900" />
            <p className="font-black text-sm text-[#00205B] dark:text-white">No equipment items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-blue-50/50 dark:bg-[#071329] text-[#00205B] dark:text-blue-200 font-black border-b border-blue-100 dark:border-blue-900/60 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Item Name & Specs</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Available / Total</th>
                  <th className="py-3 px-4 text-center">Quick Stock Adjust</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 dark:divide-blue-900/40">
                {filteredItems.map(item => (
                  <tr key={item.equipment_id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#00205B] dark:text-white text-sm">{item.object_name}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">{item.model_or_specs || 'Standard Lab Equipment'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-blue-200 font-medium">
                      {item.category}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.status === 'active' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Active
                        </span>
                      ) : item.status === 'maintenance' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Maintenance
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Retired
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-emerald-700 dark:text-emerald-400 text-sm font-mono">{item.available_quantity}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-[#00205B] dark:text-white font-mono">{item.total_quantity}</span>
                        <span className="text-[10px] text-slate-400 font-normal">units</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-[#071329] p-1 rounded-xl border border-slate-200 dark:border-blue-900">
                        <button
                          onClick={() => handleStockDelta(item, -1)}
                          disabled={item.available_quantity <= 0}
                          className="p-1 rounded-lg hover:bg-white dark:hover:bg-[#0C182E] text-slate-700 dark:text-slate-200 disabled:opacity-30 transition-colors"
                          title="Decrease available stock (-1)"
                        >
                          <MinusCircle className="w-4 h-4 text-rose-600" />
                        </button>
                        <span className="text-xs font-mono font-bold px-2 text-[#00205B] dark:text-white">{item.available_quantity}</span>
                        <button
                          onClick={() => handleStockDelta(item, 1)}
                          className="p-1 rounded-lg hover:bg-white dark:hover:bg-[#0C182E] text-slate-700 dark:text-slate-200 transition-colors"
                          title="Increase stock (+1)"
                        >
                          <PlusCircle className="w-4 h-4 text-emerald-600" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(item)}
                        className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-[#071329] text-[#00205B] dark:text-blue-200 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT EQUIPMENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0C182E] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-blue-100 dark:border-blue-900/60 animate-in fade-in zoom-in-95">
            <h3 className="font-black text-lg text-[#00205B] dark:text-white mb-1">
              {editingItem ? 'Edit Equipment Item' : 'Add New Equipment to Catalog'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Specify inventory count and borrowing availability status for Cavendish Labs
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">Equipment Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Raspberry Pi 4 Model B (8GB)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    placeholder="e.g. Microcontrollers"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                  >
                    <option value="active">Active (Available)</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">Total Quantity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formTotal}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setFormTotal(val);
                      if (formAvail > val) setFormAvail(val);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">Available Quantity</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={formTotal}
                    value={formAvail}
                    onChange={e => setFormAvail(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">Model / Technical Specs</label>
                <textarea
                  rows={2}
                  value={formSpecs}
                  onChange={e => setFormSpecs(e.target.value)}
                  placeholder="e.g. Model UT61E, 50MHz 4-channel, includes banana probes & USB cable"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-blue-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#071329]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#00205B] hover:bg-[#0B1B3D] text-white text-xs font-black shadow-md shadow-blue-950/20 transition-all active:scale-95"
                >
                  {submitting ? 'Saving...' : editingItem ? 'Update Equipment' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
