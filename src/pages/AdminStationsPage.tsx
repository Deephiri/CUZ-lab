import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Printer,
  Download,
  Plus,
  RefreshCw,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { Station } from '../types.ts';
import { api } from '../services/api.ts';
import { CavendishLogo } from '../components/CavendishLogo.tsx';

export const AdminStationsPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [qrData, setQrData] = useState<{ url: string; dataUrl: string; svg: string } | null>(null);
  const [qrLoading, setQrLoading] = useState<boolean>(false);

  // Add station modal
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newLocation, setNewLocation] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const res = await api.getStations();
      setStations(res.stations);
      if (res.stations.length > 0 && !selectedStation) {
        loadStationQR(res.stations[0]);
      }
    } catch (err) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStationQR = async (st: Station) => {
    setSelectedStation(st);
    setQrLoading(true);
    try {
      const data = await api.getStationQR(st.station_code);
      setQrData(data);
    } catch (err: any) {
      alert(err.message || 'Failed to generate station QR');
    } finally {
      setQrLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyUrl = () => {
    if (qrData) {
      navigator.clipboard.writeText(qrData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createStation(newCode, newName, newLocation);
      setAddModalOpen(false);
      setNewCode('');
      setNewName('');
      setNewLocation('');
      await fetchStations();
      loadStationQR(res.station);
    } catch (err: any) {
      alert(err.message || 'Failed to create station');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-colors">
      {/* Screen view header (hidden during printing) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#00205B] dark:text-white tracking-tight flex items-center gap-2">
            <span>Station Counter QR Code Generator</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cavendish University Zambia • Generate, download, and print fixed counter QR codes
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#00205B] hover:bg-[#0B1B3D] text-white font-black text-xs inline-flex items-center gap-2 shadow-md shadow-blue-950/20 transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          Add New Station Counter
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Station List */}
        <div className="no-print bg-white dark:bg-[#0C182E] rounded-3xl p-4 sm:p-5 border border-blue-100 dark:border-blue-900/60 shadow-sm h-fit transition-colors">
          <div className="text-xs font-black text-[#00205B] dark:text-blue-300 uppercase tracking-wider mb-3 px-1">
            Registered Lab Counters ({stations.length})
          </div>

          <div className="space-y-2">
            {stations.map(st => (
              <button
                key={st.station_code}
                onClick={() => loadStationQR(st)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  selectedStation?.station_code === st.station_code
                    ? 'bg-[#00205B] text-white border-[#00205B] shadow-md font-bold'
                    : 'bg-slate-50 dark:bg-[#071329] border-slate-200 dark:border-blue-900/60 text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
                      selectedStation?.station_code === st.station_code
                        ? 'bg-amber-400 text-[#00205B]'
                        : 'bg-white dark:bg-[#0C182E] text-[#00205B] dark:text-amber-300 border border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    {st.station_code}
                  </span>
                  <QrCode
                    className={`w-4 h-4 ${
                      selectedStation?.station_code === st.station_code ? 'text-amber-300' : 'text-slate-400'
                    }`}
                  />
                </div>
                <div className="font-bold text-sm mt-2">{st.lab_name}</div>
                {st.location_description && (
                  <div
                    className={`text-xs mt-1 flex items-center gap-1 ${
                      selectedStation?.station_code === st.station_code ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{st.location_description}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Printable Sign Preview */}
        <div className="lg:col-span-2">
          {/* Action Bar (hidden in print) */}
          <div className="no-print bg-white dark:bg-[#0C182E] rounded-3xl p-4 border border-blue-100 dark:border-blue-900/60 shadow-xs mb-4 flex flex-wrap items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[#00205B] dark:text-blue-200">Encoded URL:</span>
              <span className="font-mono bg-blue-50 dark:bg-[#071329] px-2 py-1 rounded-lg text-slate-700 dark:text-blue-200 text-[11px] truncate max-w-xs sm:max-w-md border border-blue-100 dark:border-blue-900">
                {qrData?.url}
              </span>
              <button
                onClick={handleCopyUrl}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#071329] rounded-lg text-slate-500 hover:text-[#00205B] dark:hover:text-white"
                title="Copy URL"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {qrData && (
                <a
                  href={qrData.dataUrl}
                  download={`cuz_lab_qr_${selectedStation?.station_code}.png`}
                  className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-[#071329] text-[#00205B] dark:text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-500" />
                  Download PNG
                </a>
              )}
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-[#00205B] hover:bg-[#0B1B3D] text-white font-black text-xs inline-flex items-center gap-1.5 shadow-md shadow-blue-950/20 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                Print Lab Counter Sign
              </button>
            </div>
          </div>

          {/* OFFICIAL PRINTABLE COUNTER SIGN (Printed crisp white & navy) */}
          <div className="bg-white rounded-3xl border-2 border-[#00205B] shadow-xl p-8 sm:p-12 text-center max-w-xl mx-auto printable-sign text-slate-900">
            {/* University Crest Header */}
            <div className="border-b-4 border-[#00205B] pb-6 mb-6">
              <div className="flex justify-center mb-2">
                <CavendishLogo size="md" variant="crest" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[#00205B] uppercase">
                Cavendish University Zambia
              </h2>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-0.5">
                School of Science & Technology • ICT Laboratory Services
              </p>
              <div className="text-[11px] font-medium text-slate-600 italic mt-0.5">
                Success Begins at Cavendish
              </div>
            </div>

            {/* Station Title */}
            <div className="mb-6">
              <span className="inline-block px-3.5 py-1 rounded-full bg-blue-100 text-[#00205B] font-mono font-extrabold text-sm mb-2 border border-blue-300">
                STATION CODE: {selectedStation?.station_code}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {selectedStation?.lab_name}
              </h3>
              {selectedStation?.location_description && (
                <p className="text-xs text-slate-500 mt-1">
                  Location: {selectedStation.location_description}
                </p>
              )}
            </div>

            {/* High-Resolution QR Code */}
            <div className="my-6 inline-block p-4 bg-white rounded-3xl border-4 border-[#00205B] shadow-md">
              {qrLoading ? (
                <div className="w-64 h-64 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#00205B]" />
                </div>
              ) : qrData ? (
                <img
                  src={qrData.dataUrl}
                  alt={`QR Code for ${selectedStation?.station_code}`}
                  className="w-64 h-64 object-contain mx-auto"
                />
              ) : null}
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-left text-xs space-y-1.5 text-slate-700">
              <div className="font-extrabold text-[#00205B] text-center text-sm mb-2">
                How to Borrow Laboratory Equipment
              </div>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00205B] text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                Scan this QR code with your smartphone camera.
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00205B] text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                Log in with your 6-digit Student ID (e.g. 115-564).
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00205B] text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                Select items, pick a return date, and present your ID to the technician.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ADD STATION MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0C182E] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-blue-100 dark:border-blue-900/60 animate-in fade-in zoom-in-95">
            <h3 className="font-black text-lg text-[#00205B] dark:text-white mb-1">
              Add New Station Counter
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Registers a physical counter QR checkpoint for equipment checkouts
            </p>

            <form onSubmit={handleCreateStation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                  Station Code (Uppercase Unique Identifier)
                </label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LAB-MAIN-03"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                  Laboratory Counter Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Robotics & Automation Lab Counter"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                  Physical Location Description
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="e.g. Science Block, 2nd Floor, Room S204"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-blue-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#071329]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#00205B] hover:bg-[#0B1B3D] text-white text-xs font-black shadow-md shadow-blue-950/20 transition-all active:scale-95"
                >
                  {submitting ? 'Generating...' : 'Create & Generate QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
