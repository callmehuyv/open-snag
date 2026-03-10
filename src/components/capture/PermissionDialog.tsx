import { ShieldAlert, ExternalLink, RefreshCw } from 'lucide-react';
import * as api from '../../lib/tauri-api';

interface PermissionDialogProps {
  onGranted: () => void;
  onCancel: () => void;
}

export default function PermissionDialog({ onGranted, onCancel }: PermissionDialogProps) {
  const handleOpenSettings = async () => {
    await api.openScreenPermissionSettings();
  };

  const handleCheckAgain = async () => {
    const granted = await api.checkScreenPermission();
    if (granted) {
      onGranted();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 px-6 py-4 flex items-center gap-3 border-b border-amber-100">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <ShieldAlert size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">Screen Recording Permission Required</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">OpenSnag needs permission to capture your screen</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-[13px] text-gray-600 leading-relaxed">
            To take screenshots, macOS requires you to grant Screen Recording access. Please follow these steps:
          </p>
          <ol className="mt-3 space-y-2 text-[13px] text-gray-700">
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-[11px] font-bold">1</span>
              <span>Click <strong>"Open Settings"</strong> below</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-[11px] font-bold">2</span>
              <span>Find <strong>OpenSnag</strong> in the list and toggle it <strong>ON</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-[11px] font-bold">3</span>
              <span>Come back here and click <strong>"Check Again"</strong></span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-100">
          <button
            onClick={onCancel}
            className="text-[13px] text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckAgain}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw size={14} />
              Check Again
            </button>
            <button
              onClick={handleOpenSettings}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] text-white bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              <ExternalLink size={14} />
              Open Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
