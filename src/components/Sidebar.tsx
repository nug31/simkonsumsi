import React from 'react';
import { User, ConsumptionRequest } from '../types';
import {
  LayoutDashboard,
  PlusCircle,
  FileSpreadsheet,
  CheckSquare,
  ChefHat,
  BarChart3,
  History,
  Database,
  MessageSquare,
  Sparkles,
  Info,
  X
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'create-request'
  | 'my-requests'
  | 'approvals'
  | 'kitchen'
  | 'rekap'
  | 'audit-logs'
  | 'master-data'
  | 'whatsapp-hub';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User;
  requests: ConsumptionRequest[];
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  currentUser,
  requests,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  // Compute pending approvals for this approver
  const pendingApprovalsCount = requests.filter(r => {
    if (currentUser.role === 'SUPERADMIN') {
      return r.status === 'WAITING_HOD' || r.status === 'WAITING_WAKASEK';
    }
    if (currentUser.role === 'HOD') {
      return r.status === 'WAITING_HOD' && (r.target_approver_id === currentUser.id || r.department_id === currentUser.department_id);
    }
    if (currentUser.role === 'WAKASEK') {
      return r.status === 'WAITING_WAKASEK';
    }
    return false;
  }).length;

  // Compute kitchen queue count for Admin Konsumsi
  const kitchenQueueCount = requests.filter(r => 
    r.status === 'APPROVED_HOD' || r.status === 'APPROVED_WAKASEK' || r.status === 'PROCESSING'
  ).length;

  const canCreate = ['REQUESTER', 'HOD', 'WAKASEK', 'SUPERADMIN'].includes(currentUser.role);
  const canApprove = ['HOD', 'WAKASEK', 'SUPERADMIN'].includes(currentUser.role);
  const canViewKitchen = ['ADMIN_KONSUMSI', 'SUPERADMIN'].includes(currentUser.role);
  const canViewRekap = ['ADMIN_KONSUMSI', 'WAKASEK', 'SUPERADMIN'].includes(currentUser.role);
  const isSuperadmin = currentUser.role === 'SUPERADMIN';

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      id: 'create-request' as NavTab,
      label: 'Pengajuan Baru',
      icon: PlusCircle,
      visible: canCreate,
      highlight: true,
    },
    {
      id: 'my-requests' as NavTab,
      label: 'Pengajuan Saya',
      icon: FileSpreadsheet,
      visible: true,
    },
    {
      id: 'approvals' as NavTab,
      label: 'Persetujuan (Approval)',
      icon: CheckSquare,
      visible: canApprove,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'kitchen' as NavTab,
      label: 'Dapur Konsumsi',
      icon: ChefHat,
      visible: canViewKitchen,
      badge: kitchenQueueCount > 0 ? kitchenQueueCount : undefined,
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      id: 'rekap' as NavTab,
      label: 'Rekap & Cetak Laporan',
      icon: BarChart3,
      visible: canViewRekap,
    },
    {
      id: 'whatsapp-hub' as NavTab,
      label: 'WhatsApp Gateway',
      icon: MessageSquare,
      visible: true,
    },
    {
      id: 'audit-logs' as NavTab,
      label: 'Audit Trail & Log',
      icon: History,
      visible: true,
    },
    {
      id: 'master-data' as NavTab,
      label: 'Master Data & Settings',
      icon: Database,
      visible: isSuperadmin,
    },
  ];

  const handleItemClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } no-print`}
      >
        {/* Mobile Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 md:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm tracking-wide">Navigasi Menu</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Nav Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Menu Utama
            </p>
          </div>

          {navItems
            .filter(item => item.visible)
            .map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : item.highlight
                      ? 'bg-slate-800 text-emerald-300 hover:bg-slate-700 hover:text-emerald-200 border border-emerald-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-white'
                          : item.highlight
                          ? 'text-emerald-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold shadow-xs ${
                        item.badgeColor || 'bg-blue-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Bottom Context Card: Role Info & Routing Principle */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center gap-2 mb-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <p className="text-[11px] font-semibold text-slate-200">Logika Approval Otomatis</p>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              <strong className="text-blue-300">Jurusan</strong> → HOD Jurusan → Admin Konsumsi<br />
              <strong className="text-purple-300">Non-Jurusan</strong> → Wakasek → Admin Konsumsi
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
