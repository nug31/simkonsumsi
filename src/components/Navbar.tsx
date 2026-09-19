import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  NotificationItem,
} from '../types';
import { storageService } from '../services/storage';
import {
  Bell,
  UtensilsCrossed,
  UserCheck,
  LogOut,
  Check,
  Building2,
  Clock,
  AlertCircle,
  Menu,
} from 'lucide-react';

interface Props {
  currentUser: User;
  notifications: NotificationItem[];
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onLogout: () => void;
  onToggleSidebar?: () => void;
  onOpenRequestModal?: (requestId: string) => void;
  onOpenLoginModal?: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsRead,
  onLogout,
  onToggleSidebar,
  onOpenRequestModal,
  onOpenLoginModal,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  const departments = storageService.getDepartments();
  const currentDept = departments.find(d => d.id === currentUser.department_id);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand & School Logo */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
                aria-label="Toggle Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 tracking-tight text-lg">SIMKONSUMSI</span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">Sistem Permintaan Konsumsi Guru Tamu & Industri</p>
              </div>
            </div>
          </div>

          {/* Right Actions: PIN Switch, Notifications, User Profile, Logout */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Switch Account (opens LoginModal, still requires PIN) */}
            {onOpenLoginModal && (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-600/20"
                title="Ganti Akun (butuh PIN)"
              >
                <UserCheck className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">Ganti Akun</span>
              </button>
            )}

            {/* Notifications Popover */}
            <div className="relative" ref={notifMenuRef}>
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors focus:outline-hidden"
                aria-label="Notifikasi"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifikasi Internal</h4>
                      {unreadCount > 0 && (
                        <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {unreadCount} Baru
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => onMarkAllNotificationsRead()}
                        className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        Tandai Semua Dibaca
                      </button>
                    )}
                  </div>

                  <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        Belum ada notifikasi
                      </div>
                    ) : (
                      notifications.slice(0, 10).map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            onMarkNotificationAsRead(notif.id);
                            if (onOpenRequestModal && notif.request_id) {
                              onOpenRequestModal(notif.request_id);
                              setShowNotifMenu(false);
                            }
                          }}
                          className={`p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                            !notif.is_read ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="mt-0.5">
                            {notif.type === 'SUCCESS' && <Check className="w-4 h-4 text-emerald-500" />}
                            {notif.type === 'INFO' && <Clock className="w-4 h-4 text-blue-500" />}
                            {notif.type === 'WARNING' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                            {notif.type === 'DANGER' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 leading-tight truncate">
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Info */}
            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-200">
              <img
                src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}`}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span className="truncate max-w-[120px]">{currentDept?.code || 'Sekolah'}</span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => {
                if (confirm('Keluar dari SIMKONSUMSI?')) onLogout();
              }}
              className="p-2 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Keluar"
              aria-label="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
