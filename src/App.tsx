import React, { useState, useEffect } from 'react';
import { storageService } from './services/storage';
import {
  User,
  Department,
  ConsumptionRequest,
  AuditLogItem
} from './types';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { CreateRequestView } from './views/CreateRequestView';
import { ApprovalListView } from './views/ApprovalListView';
import { KitchenAdminView } from './views/KitchenAdminView';
import { RekapReportView } from './views/RekapReportView';
import { AuditLogsView } from './views/AuditLogsView';
import { WhatsAppHubView } from './views/WhatsAppHubView';
import { MasterDataView } from './views/MasterDataView';
import { RequestDetailModal } from './components/RequestDetailModal';
import { ApprovalActionModal } from './components/ApprovalActionModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { PrintSlipModal } from './components/PrintSlipModal';
import { LoginModal } from './components/LoginModal';

export const App: React.FC = () => {
  // Reactive state synced with storageService
  const [currentUser, setCurrentUser] = useState<User | null>(storageService.getCurrentUser());
  const [authLoading, setAuthLoading] = useState<boolean>(storageService.isAuthLoading());
  const [departments, setDepartments] = useState<Department[]>(storageService.getDepartments());
  const [users, setUsers] = useState<User[]>(storageService.getUsers());
  const [requests, setRequests] = useState<ConsumptionRequest[]>(storageService.getRequests());
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(storageService.getAuditLogs());

  // App UI state
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Modals state
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [approvalModalData, setApprovalModalData] = useState<{
    action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
    request: ConsumptionRequest;
  } | null>(null);
  const [whatsAppModalRequest, setWhatsAppModalRequest] = useState<ConsumptionRequest | null>(null);
  const [printModalData, setPrintModalData] = useState<{
    single?: ConsumptionRequest;
    list?: ConsumptionRequest[];
  } | null>(null);
  const [editingRequest, setEditingRequest] = useState<ConsumptionRequest | undefined>(undefined);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Subscribe to storageService updates
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setCurrentUser(storageService.getCurrentUser());
      setAuthLoading(storageService.isAuthLoading());
      setDepartments(storageService.getDepartments());
      setUsers(storageService.getUsers());
      setRequests(storageService.getRequests());
      setAuditLogs(storageService.getAuditLogs());
    });
    return () => unsubscribe();
  }, []);

  // Notifications for current user
  const userNotifications = currentUser ? storageService.getNotificationsForUser(currentUser.id) : [];

  // Handlers
  const handlePostLoginNavigate = (loggedInUser: User) => {
    if (loggedInUser.role === 'HOD' || loggedInUser.role === 'WAKASEK') {
      setActiveTab('approvals');
    } else if (loggedInUser.role === 'ADMIN_KONSUMSI') {
      setActiveTab('kitchen');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    storageService.logout();
    setActiveTab('dashboard');
    setSelectedRequestId(null);
  };

  const handleStartCreateRequest = () => {
    setEditingRequest(undefined);
    setActiveTab('create-request');
  };

  const handleStartEditRequest = (req: ConsumptionRequest) => {
    setEditingRequest(req);
    setSelectedRequestId(null);
    setActiveTab('create-request');
  };

  const handleCancelRequest = (requestId: string) => {
    storageService.cancelRequestByRequester(requestId).catch((e: Error) => alert(e.message));
    if (selectedRequestId === requestId) setSelectedRequestId(null);
  };

  const handleApprovalSubmit = async (notes: string) => {
    if (!approvalModalData) return;
    const { action, request } = approvalModalData;

    try {
      if (action === 'APPROVE') {
        await storageService.approveRequest(request.id, notes);
      } else if (action === 'REJECT') {
        await storageService.rejectRequest(request.id, notes);
      } else if (action === 'REQUEST_REVISION') {
        await storageService.requestRevision(request.id, notes);
      }
      setApprovalModalData(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleKitchenStatusUpdate = (
    requestId: string,
    status: 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED',
    notes?: string
  ) => {
    storageService.updateKitchenStatus(requestId, status, notes).catch((e: Error) => alert(e.message));
  };

  const currentSelectedRequest = selectedRequestId
    ? requests.find(r => r.id === selectedRequestId)
    : null;

  // Belum selesai memulihkan sesi login
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-sm text-slate-500 font-semibold">Memuat SIMKONSUMSI...</div>
      </div>
    );
  }

  // Wajib login sebelum bisa memakai aplikasi
  if (!currentUser) {
    return (
      <LoginModal
        users={storageService.getStaffDirectory()}
        currentUser={null}
        isMandatory
        onLoginSuccess={(loggedInUser) => {
          handlePostLoginNavigate(loggedInUser);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">

      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        notifications={userNotifications}
        onLogout={handleLogout}
        onMarkNotificationAsRead={(id) => storageService.markNotificationAsRead(id)}
        onMarkAllNotificationsRead={() => storageService.markAllNotificationsAsRead(currentUser.id)}
        onToggleSidebar={() => setSidebarMobileOpen(!sidebarMobileOpen)}
        onOpenRequestModal={(reqId) => setSelectedRequestId(reqId)}
        onOpenLoginModal={() => setShowLoginModal(true)}
      />

      {/* Main App Layout: Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'create-request') {
              setEditingRequest(undefined);
            }
            setActiveTab(tab);
          }}
          currentUser={currentUser}
          requests={requests}
          isOpenMobile={sidebarMobileOpen}
          onCloseMobile={() => setSidebarMobileOpen(false)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* 1. Dashboard View */}
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              departments={departments}
              users={users}
              requests={requests}
              onOpenCreate={handleStartCreateRequest}
              onOpenDetail={(id) => setSelectedRequestId(id)}
              onEditRequest={handleStartEditRequest}
              onCancelRequest={handleCancelRequest}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* 2. Create / Edit Request View */}
          {activeTab === 'create-request' && (
            <CreateRequestView
              currentUser={currentUser}
              departments={departments}
              users={users}
              editRequest={editingRequest}
              onSuccess={(newReq) => {
                setSelectedRequestId(newReq.id);
                setActiveTab('dashboard');
              }}
              onCancel={() => setActiveTab('dashboard')}
            />
          )}

          {/* 3. My Requests (Tab Shortcut) */}
          {activeTab === 'my-requests' && (
            <DashboardView
              currentUser={{ ...currentUser, role: 'REQUESTER' }} // force requester view mode
              departments={departments}
              users={users}
              requests={requests}
              onOpenCreate={handleStartCreateRequest}
              onOpenDetail={(id) => setSelectedRequestId(id)}
              onEditRequest={handleStartEditRequest}
              onCancelRequest={handleCancelRequest}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* 4. Approvals View (HOD & Wakasek) */}
          {activeTab === 'approvals' && (
            <ApprovalListView
              currentUser={currentUser}
              departments={departments}
              users={users}
              requests={requests}
              approvals={storageService.getApprovalsByRequestId('')}
              onOpenDetail={(id) => setSelectedRequestId(id)}
              onOpenApprovalModal={(req, action) => setApprovalModalData({ request: req, action })}
            />
          )}

          {/* 5. Kitchen Admin View */}
          {activeTab === 'kitchen' && (
            <KitchenAdminView
              currentUser={currentUser}
              departments={departments}
              users={users}
              requests={requests}
              onOpenDetail={(id) => setSelectedRequestId(id)}
              onUpdateStatus={handleKitchenStatusUpdate}
              onOpenPrintModal={(list) => setPrintModalData({ list })}
            />
          )}

          {/* 6. Rekap & Reports View */}
          {activeTab === 'rekap' && (
            <RekapReportView
              departments={departments}
              users={users}
              requests={requests}
              onOpenPrintModal={(list) => setPrintModalData({ list })}
              onOpenDetail={(id) => setSelectedRequestId(id)}
            />
          )}

          {/* 7. WhatsApp Hub Gateway View */}
          {activeTab === 'whatsapp-hub' && (
            <WhatsAppHubView
              requests={requests}
              users={users}
              departments={departments}
            />
          )}

          {/* 8. Audit Logs View */}
          {activeTab === 'audit-logs' && (
            <AuditLogsView
              logs={auditLogs}
              onOpenRequest={(id) => setSelectedRequestId(id)}
            />
          )}

          {/* 9. Master Data View (Superadmin) */}
          {activeTab === 'master-data' && (
            <MasterDataView
              departments={departments}
              users={users}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}

      {/* 1. Request Detail Modal with Vertical Timeline */}
      {currentSelectedRequest && (
        <RequestDetailModal
          request={currentSelectedRequest}
          currentUser={currentUser}
          users={users}
          departments={departments}
          approvals={storageService.getApprovalsByRequestId(currentSelectedRequest.id)}
          processings={storageService.getProcessingByRequestId(currentSelectedRequest.id)}
          onClose={() => setSelectedRequestId(null)}
          onOpenApprovalModal={(action) => {
            setApprovalModalData({ request: currentSelectedRequest, action });
          }}
          onUpdateKitchenStatus={(status, notes) => {
            handleKitchenStatusUpdate(currentSelectedRequest.id, status, notes);
          }}
          onOpenWhatsAppModal={() => {
            setWhatsAppModalRequest(currentSelectedRequest);
          }}
          onPrintSlip={() => {
            setPrintModalData({ single: currentSelectedRequest });
          }}
          onEditRequest={() => handleStartEditRequest(currentSelectedRequest)}
          onCancelRequest={() => handleCancelRequest(currentSelectedRequest.id)}
        />
      )}

      {/* 2. Approval Action Confirmation Dialog */}
      {approvalModalData && (
        <ApprovalActionModal
          action={approvalModalData.action}
          request={approvalModalData.request}
          currentUser={currentUser}
          onClose={() => setApprovalModalData(null)}
          onSubmit={handleApprovalSubmit}
        />
      )}

      {/* 3. WhatsApp Notification Preview Modal */}
      {whatsAppModalRequest && (
        <WhatsAppModal
          request={whatsAppModalRequest}
          requester={users.find(u => u.id === whatsAppModalRequest.requester_id) || currentUser}
          department={departments.find(d => d.id === whatsAppModalRequest.department_id) || departments[0]}
          approver={users.find(u => u.id === whatsAppModalRequest.target_approver_id)}
          onClose={() => setWhatsAppModalRequest(null)}
        />
      )}

      {/* 4. Print Slip & Kitchen Order Report Modal */}
      {printModalData && (
        <PrintSlipModal
          request={printModalData.single}
          requestsList={printModalData.list}
          users={users}
          departments={departments}
          onClose={() => setPrintModalData(null)}
        />
      )}

      {/* 5. Login / Ganti Akun dengan PIN Modal */}
      {showLoginModal && (
        <LoginModal
          users={storageService.getStaffDirectory()}
          currentUser={currentUser}
          onLoginSuccess={(loggedInUser) => {
            handlePostLoginNavigate(loggedInUser);
            setShowLoginModal(false);
          }}
          onClose={() => setShowLoginModal(false)}
        />
      )}

    </div>
  );
};

export default App;
