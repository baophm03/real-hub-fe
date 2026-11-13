"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Pencil, Plus, Power, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ability } from '@/config/casl/ability';
import { PageHeader } from '@/components/shared/page-header';
import { FormField } from '@/components/shared/form-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api/get-api-error-message';
import { useGetApiLocations } from '@/lib/api/endpoints/locations';
import type { Location } from '@/lib/api/types/locations';
import { useApiCommissionOptions } from '@/lib/api/endpoints/commission-meta';
import { usePortalPath } from '@/lib/hooks/use-portal';
import { useApiZones, usePatchApiZone, usePatchApiZoneStatus, usePostApiZone, type Zone, type ZoneInput } from '@/lib/api/endpoints/zones';

type ZoneDraft = ZoneInput;
const EMPTY_DRAFT: ZoneDraft = { name: '', code: '', type: '', provinceId: '', districtId: '', wardId: '', description: '' };
const NONE = '__NONE__';

export default function CommissionZonesPage() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const queryClient = useQueryClient();
  const canRead = ability.can('READ', 'COMMISSION');
  const hasManagePermission = ability.can('CREATE', 'COMMISSION');
  const hasApprovePermission = ability.can('APPROVE', 'COMMISSION');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [offset, setOffset] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [draft, setDraft] = useState<ZoneDraft>(EMPTY_DRAFT);
  const [statusTarget, setStatusTarget] = useState<Zone | null>(null);

  const {
    data: commissionOptionsEnvelope,
    isLoading: commissionOptionsLoading,
    isError: commissionOptionsError,
    error: commissionOptionsRequestError,
    refetch: refetchCommissionOptions,
  } = useApiCommissionOptions();
  const canReadAllZones = Boolean(commissionOptionsEnvelope?.data.capabilities.canReadAllPlans);
  const canManage = hasManagePermission && Boolean(commissionOptionsEnvelope?.data.capabilities.canManagePlans);
  const canApprove = hasApprovePermission && Boolean(commissionOptionsEnvelope?.data.capabilities.canApprovePlans);

  const {
    data: zonesEnvelope,
    isLoading,
    isError: zonesError,
    error: zonesRequestError,
    refetch: refetchZones,
  } = useApiZones({
    search: search.trim() || undefined,
    status: status === 'ALL' ? undefined : status,
    limit: 20,
    offset,
  }, canRead && canReadAllZones);
  const zones = zonesEnvelope?.data ?? [];
  const total = zonesEnvelope?.meta?.total ?? zones.length;
  const { data: provincesEnvelope } = useGetApiLocations({ type: 'PROVINCE', limit: 100 });
  const { data: districtsEnvelope } = useGetApiLocations(
    { type: 'DISTRICT', parentId: draft.provinceId || undefined, limit: 100 },
    { query: { enabled: Boolean(draft.provinceId) } },
  );
  const { data: wardsEnvelope } = useGetApiLocations(
    { type: 'WARD', parentId: draft.districtId || undefined, limit: 100 },
    { query: { enabled: Boolean(draft.districtId) } },
  );
  const provinces = (provincesEnvelope as unknown as { data?: Location[] })?.data ?? [];
  const districts = (districtsEnvelope as unknown as { data?: Location[] })?.data ?? [];
  const wards = (wardsEnvelope as unknown as { data?: Location[] })?.data ?? [];
  const provinceLabel = draft.provinceId
    ? provinces.find((location) => location.id === draft.provinceId)?.name ?? 'Đang tải tỉnh / thành phố…'
    : 'Không gắn tỉnh / thành';
  const districtLabel = draft.districtId
    ? districts.find((location) => location.id === draft.districtId)?.name ?? 'Đang tải quận / huyện…'
    : 'Không gắn quận / huyện';
  const wardLabel = draft.wardId
    ? wards.find((location) => location.id === draft.wardId)?.name ?? 'Đang tải phường / xã…'
    : 'Không gắn phường / xã';

  const { mutateAsync: createZone, isPending: isCreating } = usePostApiZone();
  const { mutateAsync: updateZone, isPending: isUpdating } = usePatchApiZone();
  const { mutateAsync: updateStatus, isPending: isChangingStatus } = usePatchApiZoneStatus();

  const invalidateZoneData = () => {
    void queryClient.invalidateQueries({ queryKey: ['/api/zones'] });
    void queryClient.invalidateQueries({ queryKey: ['/api/commission/options'] });
  };

  const openCreate = () => {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setDialogOpen(true);
  };

  const openEdit = (zone: Zone) => {
    setEditing(zone);
    setDraft({
      name: zone.name,
      code: zone.code,
      type: zone.type ?? '',
      provinceId: zone.provinceId ?? '',
      districtId: zone.districtId ?? '',
      wardId: zone.wardId ?? '',
      description: zone.description ?? '',
    });
    setDialogOpen(true);
  };

  const saveZone = async () => {
    const payload: ZoneInput = {
      name: draft.name.trim(),
      code: draft.code.trim().toUpperCase(),
      type: draft.type?.trim() || undefined,
      provinceId: draft.provinceId || null,
      districtId: draft.districtId || null,
      wardId: draft.wardId || null,
      description: draft.description?.trim() || undefined,
    };
    if (!payload.name || !payload.code) {
      toast.error('Vui lòng nhập tên và mã khu vực.');
      return;
    }
    try {
      if (editing) await updateZone({ id: editing.id, data: payload });
      else await createZone(payload);
      toast.success(editing ? 'Đã cập nhật khu vực' : 'Đã tạo khu vực');
      setDialogOpen(false);
      invalidateZoneData();
    } catch (error) {
      toast.error(getApiErrorMessage(error) ?? 'Không thể lưu khu vực.');
    }
  };

  const changeStatus = async () => {
    if (!statusTarget) return;
    const nextStatus = statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateStatus({ id: statusTarget.id, status: nextStatus });
      toast.success(nextStatus === 'ACTIVE' ? 'Đã kích hoạt khu vực' : 'Đã ngừng khu vực');
      setStatusTarget(null);
      invalidateZoneData();
    } catch (error) {
      toast.error(getApiErrorMessage(error) ?? 'Không thể cập nhật trạng thái khu vực.');
    }
  };

  const locationName = useMemo(() => {
    const byId = new Map([...provinces, ...districts, ...wards].map((location) => [location.id, location.name]));
    return (id: string | null | undefined) => id ? byId.get(id) ?? 'Địa điểm không còn trong danh sách' : null;
  }, [provinces, districts, wards]);

  if (!canRead) return <p className="rounded-lg border border-border bg-surface p-6 text-sm text-foreground-muted">Bạn cần quyền xem hoa hồng để truy cập danh mục khu vực.</p>;
  if (commissionOptionsLoading) return <div aria-busy="true" className="h-56 animate-pulse rounded-xl bg-surface-muted" />;
  if (commissionOptionsError) return (
    <div role="alert" className="rounded-xl border border-border bg-surface p-6">
      <h1 className="font-heading text-lg">Không tải được quyền và cấu hình hoa hồng</h1>
      <p className="mt-2 text-sm text-foreground-muted">{getApiErrorMessage(commissionOptionsRequestError) ?? 'Không thể tải dữ liệu từ máy chủ.'}</p>
      <Button className="mt-4" variant="secondary" onClick={() => void refetchCommissionOptions()}>Thử tải lại</Button>
    </div>
  );
  if (commissionOptionsEnvelope && !canReadAllZones) return <p className="rounded-lg border border-border bg-surface p-6 text-sm text-foreground-muted">Bạn cần quyền hoa hồng toàn tenant để xem và quản lý danh mục khu vực.</p>;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Cài đặt · Hoa hồng"
        title="Khu vực kinh doanh"
        description="Tạo khu vực thuộc tenant, gán cho bất động sản và dùng làm điều kiện chọn rule hoa hồng."
        actions={canManage ? <Button onClick={openCreate}><Plus size={16} />Tạo khu vực</Button> : undefined}
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-foreground-muted">
          <Button variant="secondary" size="sm" onClick={() => router.push(portalPath('/settings/commissions'))}>
            <ArrowLeft size={15} /> Chính sách hoa hồng
          </Button>
          <span>{total.toLocaleString('vi-VN')} khu vực</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <Input className="pl-9 sm:w-64" placeholder="Tìm tên hoặc mã khu vực" value={search} onChange={(event) => { setSearch(event.target.value); setOffset(0); }} />
          </div>
          <Select value={status} onValueChange={(value) => { setStatus((value as typeof status) ?? 'ALL'); setOffset(0); }}>
            <SelectTrigger className="sm:w-44"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" label="Tất cả trạng thái">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE" label="Đang hoạt động">Đang hoạt động</SelectItem>
              <SelectItem value="INACTIVE" label="Ngừng hoạt động">Ngừng hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? <div className="h-56 animate-pulse rounded-xl bg-surface-muted" /> : zonesError ? (
        <div role="alert" className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-heading text-lg">Không tải được danh mục khu vực</h2>
          <p className="mt-2 text-sm text-foreground-muted">{getApiErrorMessage(zonesRequestError) ?? 'Không thể tải dữ liệu từ máy chủ.'}</p>
          <Button className="mt-4" variant="secondary" onClick={() => void refetchZones()}>Thử tải lại</Button>
        </div>
      ) : zones.length ? (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b border-border bg-surface-muted/50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-foreground-muted md:grid">
            <span>Khu vực</span><span>Địa bàn</span><span>Đang sử dụng</span><span>Trạng thái / thao tác</span>
          </div>
          {zones.map((zone) => {
            const inUseCount = zone._count?.properties ?? 0;
            return (
              <div key={zone.id} className="grid gap-3 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary"><MapPin size={16} /></span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{zone.name}</span><span className="font-mono text-xs text-foreground-muted">{zone.code}</span></div>
                    {zone.type && <p className="mt-0.5 text-xs text-foreground-muted">{zone.type}</p>}
                    {zone.description && <p className="mt-1 line-clamp-2 text-xs text-foreground-muted">{zone.description}</p>}
                  </div>
                </div>
                <div className="text-sm text-foreground-muted">
                  {[zone.provinceId, zone.districtId, zone.wardId].map(locationName).filter(Boolean).join(' · ') || 'Chưa gắn địa bàn hành chính'}
                </div>
                <div className="text-sm text-foreground-muted">
                  <span>{inUseCount} bất động sản</span><span className="mx-2">·</span><span>{zone._count?.commissionRules ?? 0} rule</span>
                </div>
                <div className="flex items-center justify-between gap-2 md:justify-end">
                  <Badge variant={zone.status === 'ACTIVE' ? 'green' : 'default'}>{zone.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}</Badge>
                  {canManage && <Button variant="ghost" size="icon-sm" aria-label={`Sửa ${zone.name}`} onClick={() => openEdit(zone)}><Pencil size={15} /></Button>}
                  {canApprove && <Button variant="ghost" size="icon-sm" aria-label={zone.status === 'ACTIVE' ? `Ngừng ${zone.name}` : `Kích hoạt ${zone.name}`} onClick={() => setStatusTarget(zone)}><Power size={15} /></Button>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <MapPin className="mx-auto mb-3 text-foreground-muted" size={24} />
          <h2 className="font-heading text-lg">Chưa có khu vực</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-foreground-muted">Khu vực là điều kiện để rule hoa hồng áp dụng khác nhau theo địa bàn. Tạo zone, gán cho bất động sản, rồi chọn zone trong rule.</p>
          {canManage && <Button className="mt-4" onClick={openCreate}><Plus size={16} />Tạo khu vực đầu tiên</Button>}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))}>Trang trước</Button>
        <span className="px-2 text-xs tabular-nums text-foreground-muted">{total === 0 ? 0 : offset + 1}–{Math.min(offset + zones.length, total)} / {total}</span>
        <Button variant="secondary" disabled={offset + zones.length >= total} onClick={() => setOffset(offset + 20)}>Trang sau</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Cập nhật khu vực' : 'Tạo khu vực kinh doanh'}</DialogTitle>
            <DialogDescription>Mã khu vực duy nhất trong tenant. Khu vực được dùng để khớp rule hoa hồng với bất động sản.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Tên khu vực" required><Input maxLength={200} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Ví dụ: TP. Hồ Chí Minh – Khu Đông" /></FormField>
            <FormField label="Mã khu vực" required><Input maxLength={50} value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })} placeholder="HCM_EAST" /></FormField>
            <FormField label="Loại phân vùng"><Input maxLength={50} value={draft.type ?? ''} onChange={(event) => setDraft({ ...draft, type: event.target.value })} placeholder="Ví dụ: SALES_AREA" /></FormField>
            <FormField label="Tỉnh / thành phố">
              <Select value={draft.provinceId || NONE} onValueChange={(value) => setDraft({ ...draft, provinceId: value === NONE ? '' : String(value), districtId: '', wardId: '' })}>
                <SelectTrigger className="w-full"><SelectValue>{provinceLabel}</SelectValue></SelectTrigger><SelectContent>
                  <SelectItem value={NONE} label="Không gắn tỉnh / thành">Không gắn tỉnh / thành</SelectItem>
                  {provinces.map((location) => <SelectItem key={location.id} value={location.id} label={location.name}>{location.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Quận / huyện">
              <Select disabled={!draft.provinceId} value={draft.districtId || NONE} onValueChange={(value) => setDraft({ ...draft, districtId: value === NONE ? '' : String(value), wardId: '' })}>
                <SelectTrigger className="w-full"><SelectValue>{districtLabel}</SelectValue></SelectTrigger><SelectContent>
                  <SelectItem value={NONE} label="Không gắn quận / huyện">Không gắn quận / huyện</SelectItem>
                  {districts.map((location) => <SelectItem key={location.id} value={location.id} label={location.name}>{location.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Phường / xã">
              <Select disabled={!draft.districtId} value={draft.wardId || NONE} onValueChange={(value) => setDraft({ ...draft, wardId: value === NONE ? '' : String(value) })}>
                <SelectTrigger className="w-full"><SelectValue>{wardLabel}</SelectValue></SelectTrigger><SelectContent>
                  <SelectItem value={NONE} label="Không gắn phường / xã">Không gắn phường / xã</SelectItem>
                  {wards.map((location) => <SelectItem key={location.id} value={location.id} label={location.name}>{location.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <div className="sm:col-span-2"><FormField label="Mô tả"><Textarea maxLength={2000} rows={3} value={draft.description ?? ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Ghi chú về phạm vi khu vực" /></FormField></div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={saveZone} disabled={isCreating || isUpdating}>{isCreating || isUpdating ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo khu vực'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(statusTarget)} onOpenChange={(open) => { if (!open) setStatusTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{statusTarget?.status === 'ACTIVE' ? 'Ngừng hoạt động khu vực?' : 'Kích hoạt khu vực?'}</DialogTitle>
            <DialogDescription>
              {statusTarget?.status === 'ACTIVE'
                ? `Khu vực “${statusTarget?.name}” chỉ ngừng được khi không còn bất động sản, rule hoa hồng, chính sách phân bổ hoặc sales territory đang sử dụng.`
                : `Kích hoạt lại “${statusTarget?.name}” để có thể gán cho bất động sản và cấu hình rule.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setStatusTarget(null)}>Hủy</Button>
            <Button variant={statusTarget?.status === 'ACTIVE' ? 'destructive' : 'default'} onClick={changeStatus} disabled={isChangingStatus}>{isChangingStatus ? 'Đang cập nhật…' : 'Xác nhận'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
