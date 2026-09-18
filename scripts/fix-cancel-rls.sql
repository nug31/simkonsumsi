-- Fix: requester tidak bisa membatalkan pengajuan sendiri karena WITH CHECK
-- policy cr_update salah menolak transisi status ke CANCELLED. Jalankan ini
-- sekali di SQL Editor untuk memperbaiki database yang sudah ada.
DROP POLICY IF EXISTS "cr_update" ON consumption_requests;
CREATE POLICY "cr_update"
ON consumption_requests FOR UPDATE
TO authenticated
USING (
    (requester_id = auth.uid() AND status NOT IN ('COMPLETED', 'CANCELLED'))
    OR (target_approver_id = auth.uid() AND status IN ('WAITING_HOD', 'WAITING_WAKASEK'))
    OR (public.current_role() IN ('ADMIN_KONSUMSI', 'SUPERADMIN'))
)
WITH CHECK (
    (requester_id = auth.uid())
    OR (target_approver_id = auth.uid())
    OR (public.current_role() IN ('ADMIN_KONSUMSI', 'SUPERADMIN'))
);
