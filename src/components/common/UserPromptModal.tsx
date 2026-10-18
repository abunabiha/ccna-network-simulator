import React, { useState, useEffect } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { Network, UserCheck, ArrowRight, X, Shield, Award } from 'lucide-react';

export const UserPromptModal: React.FC = () => {
  const userName = useNetworkStore((state) => state.userName);
  const isUserModalOpen = useNetworkStore((state) => state.isUserModalOpen);
  const setUserName = useNetworkStore((state) => state.setUserName);
  const closeUserModal = useNetworkStore((state) => state.closeUserModal);

  const [inputName, setInputName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Synchronize state when modal opens
  useEffect(() => {
    if (isUserModalOpen) {
      setInputName(userName || '');
      setError(null);
    }
  }, [isUserModalOpen, userName]);

  if (!isUserModalOpen) return null;

  const isEditing = Boolean(userName && userName.trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputName.trim();
    if (trimmed.length < 2) {
      setError('Mohon masukkan nama pengguna minimal 2 karakter.');
      return;
    }
    setUserName(trimmed);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in select-none">
      <div 
        className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between relative z-10 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/60 shrink-0">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">CCNA NetSim Pro</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 uppercase">
                  v1.1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Perbarui Profil Pengguna' : 'Inisialisasi Pengguna Baru'}
              </p>
            </div>
          </div>

          {/* Close button only available if user already has a name registered */}
          {isEditing && (
            <button
              onClick={closeUserModal}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Informative Explanation */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>Identitas Peserta Praktikum</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Nama Anda akan dicantumkan secara otomatis pada lembar penilaian laboratorium (<strong>Scorecard</strong>), sesi simulasi ujian <strong>Pearson VUE CCNA 200-301</strong>, dan berkas penyimpanan topologi.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nama Lengkap Pengguna / Mahasiswa:
            </label>
            <input
              type="text"
              autoFocus
              value={inputName}
              onChange={(e) => {
                setInputName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Contoh: Imam Asrowardi atau Budi Pratama"
              spellCheck={false}
              autoComplete="name"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 font-medium focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all select-text cursor-text"
            />
            {error && (
              <p className="text-[11px] text-rose-400 font-medium mt-1.5 flex items-center gap-1">
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            {isEditing && (
              <button
                type="button"
                onClick={closeUserModal}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950/60 transition-all active:scale-95 cursor-pointer"
            >
              <span>{isEditing ? 'Simpan Nama' : 'Mulai Simulasi Jaringan'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
