import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
  ShieldCheck,
  FileJson,
} from 'lucide-react';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    language,
    t,
    coaches,
    students,
    groups,
    sessions,
    attendance,
    payments,
    exportBackupData,
    restoreBackupData,
    resetAllData,
    refreshAllData,
  } = useApp();

  const isAr = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await exportBackupData();
      setSuccessMsg(isAr ? 'تم تحميل ملف النسخة الاحتياطية بنجاح' : 'Backup downloaded successfully');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const result = await restoreBackupData(json);
          if (result.success) {
            setSuccessMsg(isAr ? 'تمت استعادة البيانات بنجاح من النسخة الاحتياطية' : 'Database successfully restored from backup');
            setTimeout(() => setSuccessMsg(null), 4000);
          } else {
            setErrorMsg(result.error || 'Invalid backup structure');
          }
        } catch (err: any) {
          setErrorMsg(isAr ? 'الملف غير صالح أو تالف' : 'Invalid JSON backup file');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setErrorMsg(err.message || 'Restore failed');
      setLoading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await resetAllData();
      if (res.success) {
        setSuccessMsg(isAr ? 'تم مسح جميع البيانات والبدء بصفحة جديدة نظيفة' : 'All data wiped. Clean slate ready.');
        setConfirmReset(false);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res.error || 'Reset failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#050B1A] border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#BEF264]/20 text-[#BEF264] border border-[#BEF264]/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAr ? 'إدارة البيانات والنسخ الاحتياطي' : 'Database & Backup Manager'}
              </h3>
              <p className="text-xs text-white/50">
                {isAr ? 'حفظ دائم بدون أي أمثلة وهمية' : 'Permanent local & cloud persistence'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-2xl border border-white/10 text-center">
          <div className="p-2">
            <div className="text-lg font-bold text-[#BEF264]">{coaches.length}</div>
            <div className="text-[11px] text-white/50">{isAr ? 'المدربين' : 'Coaches'}</div>
          </div>
          <div className="p-2 border-x border-white/10">
            <div className="text-lg font-bold text-[#BEF264]">{groups.length}</div>
            <div className="text-[11px] text-white/50">{isAr ? 'المجموعات' : 'Groups'}</div>
          </div>
          <div className="p-2">
            <div className="text-lg font-bold text-[#BEF264]">{students.length}</div>
            <div className="text-[11px] text-white/50">{isAr ? 'الطلاب' : 'Students'}</div>
          </div>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Download Backup */}
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-left font-medium text-xs group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white">
                  {isAr ? 'تحميل نسخة احتياطية من كل بياناتك' : 'Export Full Backup (.JSON)'}
                </div>
                <div className="text-[11px] text-white/40">
                  {isAr ? 'حفظ ملف كامل على جهازك يشمل كل مدرب وجلسة وطالب' : 'Download all coaches, groups, sessions, and students'}
                </div>
              </div>
            </div>
            <FileJson className="w-4 h-4 text-white/40 group-hover:text-[#BEF264] transition-colors" />
          </button>

          {/* Upload Restore */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-left font-medium text-xs group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">
                    {isAr ? 'استيراد واستعادة نسخة احتياطية' : 'Restore from Backup (.JSON)'}
                  </div>
                  <div className="text-[11px] text-white/40">
                    {isAr ? 'رفع ملف نسخة سابقة تم حفظها' : 'Upload a previously exported JSON backup'}
                  </div>
                </div>
              </div>
              <RefreshCw className="w-4 h-4 text-white/40 group-hover:text-[#BEF264] transition-colors" />
            </button>
          </div>

          {/* Reset / Clean Slate */}
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isAr ? 'مسح كل البيانات والبدء من الصفر' : 'Reset / Wipe All Data'}</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 space-y-3">
              <div className="text-xs text-red-200 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  {isAr
                    ? 'هل أنت متأكد من رغبتك في مسح كل البيانات نهائياً؟'
                    : 'Are you sure you want to completely erase all data?'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="flex-1 py-2 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-colors"
                >
                  {isAr ? 'نعم، امسح كل البيانات' : 'Yes, Delete Everything'}
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/10">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            {isAr ? 'الحفظ التلقائي مفعّل فورياً' : 'Real-time auto-save active'}
          </span>
          <button
            onClick={() => refreshAllData()}
            className="text-[#BEF264] hover:underline font-bold flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{isAr ? 'تحديث البيانات' : 'Sync Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
