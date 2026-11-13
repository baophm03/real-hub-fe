import { ChevronDown, CircleHelp } from "lucide-react";
import type { CommissionOption } from "@/lib/api/endpoints/commission-meta";

interface CommissionWorkflowGuideProps {
  statuses: CommissionOption[];
  actions: Record<string, CommissionOption[]>;
  isLoading: boolean;
  isError: boolean;
}

export function CommissionWorkflowGuide({
  statuses,
  actions,
  isLoading,
  isError,
}: CommissionWorkflowGuideProps) {
  const workflowRows = statuses.map((status) => ({
    status,
    actions: actions[status.value] ?? [],
  }));

  return (
    <section aria-label="Hướng dẫn quy trình hoa hồng">
      <details className="group/guide overflow-hidden rounded-lg border border-border bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 outline-none transition-colors hover:bg-surface-muted/40 focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden sm:px-5">
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-foreground-muted">
              <CircleHelp size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Hoa hồng được tính và xử lý thế nào?</span>
              <span className="mt-0.5 block text-xs leading-5 text-foreground-muted">
                Admin cài cách chia; Sales được gán vào giao dịch rồi xem phần của mình.
              </span>
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2 text-xs font-medium text-primary">
            <span>Xem quy trình</span>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className="transition-transform group-open/guide:rotate-180"
            />
          </span>
        </summary>

        <div className="border-t border-border px-4 py-4 sm:px-5 sm:py-5">
          <p className="mb-4 max-w-4xl text-sm leading-6 text-foreground-muted">
            <strong className="font-medium text-foreground">Nói ngắn gọn:</strong> Admin của doanh nghiệp cài cách chia trong chính sách một lần;
            mỗi giao dịch cần ghi đúng bất động sản và Sales phụ trách. Nếu quy tắc khớp, RealHub tính rồi lưu phần của từng người. Sales xem khoản của mình
            trong mục Hoa hồng nếu tài khoản được cấp quyền phù hợp.
          </p>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
            <div className="space-y-4">
              <section aria-labelledby="commission-guide-admin" className="rounded-lg border border-border bg-surface-muted/20 p-4">
                <h3 id="commission-guide-admin" className="text-sm font-semibold">1. Admin doanh nghiệp cài gì một lần?</h3>
                <p className="mt-1 text-sm leading-6 text-foreground-muted">
                  Vào <strong className="font-medium text-foreground">Chính sách hoa hồng → Tạo kế hoạch</strong>. Kế hoạch này chỉ áp dụng cho doanh nghiệp
                  đang đăng nhập; Admin cần có quyền quản lý hoa hồng.
                </p>
                <ol className="mt-3 space-y-2.5 text-sm leading-6">
                  <li><strong className="font-medium">Đặt tên và thời gian:</strong> nhập tên dễ nhận biết, ngày bắt đầu, ngày kết thúc nếu có; sau đó đưa kế hoạch sang trạng thái đang áp dụng theo quy trình và quyền hiện có.</li>
                  <li><strong className="font-medium">Tạo quy tắc:</strong> chọn điều kiện giao dịch, loại bất động sản, khu vực, dự án, nguồn khách hoặc hình thức khai thác mà chính sách này áp dụng.</li>
                  <li><strong className="font-medium">Điền cách tính:</strong> ví dụ 2% trên giá dự kiến hoặc giá giao dịch thực tế; đặt giới hạn tối thiểu/tối đa nếu doanh nghiệp cần.</li>
                  <li><strong className="font-medium">Chọn người nhận và tỷ lệ chia:</strong> ví dụ vai trò <em>Sales phụ trách</em> nhận 70%, vai trò <em>Doanh nghiệp</em> nhận 30%. Chọn vai trò Sales để dùng Sales được gán ở từng giao dịch, không phải nhập lại từng nhân viên vào chính sách.</li>
                </ol>
                <p className="mt-3 rounded-md border border-border bg-surface px-3 py-2.5 text-xs leading-5 text-foreground-muted">
                  <strong className="font-medium text-foreground">Lưu ý về khu vực:</strong> khu vực trong quy tắc dùng để chọn mức hoa hồng phù hợp với bất động sản.
                  Nó không tự chia tiền cho mọi Sales đang làm ở khu vực đó. Người nhận vai trò Sales được lấy từ Sales phụ trách trên giao dịch;
                  nếu giao dịch chưa ghi người này, hệ thống dùng Sales đang phụ trách lead. Nếu cả hai nơi đều chưa có Sales, hệ thống không tự chọn người nhận.
                </p>
                <p className="mt-2 rounded-md bg-surface px-3 py-2.5 text-xs leading-5 text-foreground-muted">
                  <strong className="font-medium text-foreground">Chọn đúng cách khai thác sản phẩm:</strong> chủ tự bán thường không có hoa hồng Sales;
                  sản phẩm giao Sales/đại lý khai thác thì dùng chính sách hoa hồng; nếu chủ và Sales cùng khai thác, quy tắc cần xét nguồn lead
                  (ví dụ khách đến từ link của chủ hay link của Sales).
                </p>
              </section>

              <section aria-labelledby="commission-guide-deal" className="rounded-lg border border-border bg-surface p-4">
                <h3 id="commission-guide-deal" className="text-sm font-semibold">2. Từ sản phẩm đến giao dịch được tính hoa hồng</h3>
                <ol className="mt-3 space-y-2 text-sm leading-6 text-foreground-muted">
                  <li><strong className="font-medium text-foreground">Sản phẩm được giao cho ai khai thác?</strong> Nếu giao Sales phụ trách, Sales nhận sản phẩm theo quy định của doanh nghiệp, chăm sóc khách và có thể chia sẻ link/QR riêng. Nếu sản phẩm tự bán hoặc kết hợp, khách hàng và nguồn lead có thể đi theo luồng khác.</li>
                  <li><strong className="font-medium text-foreground">Khách hàng trở thành lead rồi thành giao dịch:</strong> khi lead đủ điều kiện, Sales/Chủ/Đại lý tạo giao dịch cho đúng khách và bất động sản. Kiểm tra Sales phụ trách, nguồn khách, khu vực trên bất động sản và giá dự kiến trước khi lưu.</li>
                  <li><strong className="font-medium text-foreground">RealHub tính khoản dự kiến:</strong> hệ thống tìm chính sách đang áp dụng có điều kiện khớp, tính tổng hoa hồng rồi chia cho các người nhận đã cấu hình. Kết quả lưu lại quy tắc đã dùng để sau này kiểm tra được.</li>
                  <li><strong className="font-medium text-foreground">Giao dịch hoàn tất:</strong> theo luồng Phase 1, Admin doanh nghiệp hoặc nhân viên vận hành xác nhận giao dịch thành công. Sau đó người có quyền xử lý xác nhận/duyệt hoa hồng theo trạng thái đang hiện trên màn hình.</li>
                </ol>
                <p className="mt-3 text-xs leading-5 text-foreground-muted">
                  Nếu không có chính sách đang áp dụng, bất động sản không khớp điều kiện, hoặc không xác định được Sales nhận phần chia,
                  hệ thống không tự đoán một mức hoa hồng. Cần kiểm tra lại chính sách và thông tin giao dịch.
                </p>
              </section>

              <section aria-labelledby="commission-guide-sales" className="rounded-lg border border-border bg-surface p-4">
                <h3 id="commission-guide-sales" className="text-sm font-semibold">3. Sales xem mình được chia bao nhiêu ở đâu?</h3>
                <p className="mt-1 text-sm leading-6 text-foreground-muted">
                  Sales mở <strong className="font-medium text-foreground">Hoa hồng → Giao dịch</strong>, tìm giao dịch của mình rồi mở chi tiết để xem
                  phần được phân bổ và trạng thái. Tài khoản phải có quyền xem và phạm vi dữ liệu phù hợp; nếu không thấy khoản, quản trị viên cần kiểm tra
                  quyền xem, Sales được gán trên giao dịch/lead và quy tắc có khớp hay không.
                </p>
                <p className="mt-2 text-xs leading-5 text-foreground-muted">
                  Không nên hiểu là Sales chắc chắn nhận thông báo riêng ngay khi bán xong: thông báo phụ thuộc cấu hình thông báo của doanh nghiệp.
                  Trạng thái ước tính cũng chưa đồng nghĩa đã được duyệt hoặc đã thanh toán.
                </p>
              </section>
            </div>

            <aside aria-labelledby="commission-guide-example" className="rounded-lg border border-border bg-surface p-4">
              <h3 id="commission-guide-example" className="text-sm font-semibold">Ví dụ: Admin cài 70/30 thì Sales thấy gì?</h3>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                Giả sử Admin tạo quy tắc đang áp dụng: tính 2% trên giá trị 5 tỷ đồng, chia 70% cho Sales phụ trách và 30% cho doanh nghiệp.
                Giao dịch đã gán đúng Sales đó và khớp quy tắc:
              </p>
              <dl className="mt-4 divide-y divide-border rounded-md border border-border">
                <div className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm">
                  <dt className="text-foreground-muted">Tổng hoa hồng ước tính</dt>
                  <dd className="font-semibold tabular-nums">5 tỷ × 2% = 100 triệu ₫</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm">
                  <dt className="text-foreground-muted">Phần Sales được chia</dt>
                  <dd className="font-semibold tabular-nums">100 triệu × 70% = 70 triệu ₫</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm">
                  <dt className="text-foreground-muted">Phần doanh nghiệp</dt>
                  <dd className="font-medium tabular-nums">100 triệu × 30% = 30 triệu ₫</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-5 text-foreground-muted">
                Nếu chính sách dùng giá trị thực tế, trước khi chốt hệ thống có thể tạm dùng giá dự kiến; khi có giá chốt, người có quyền xác nhận
                để tính lại. Ví dụ giá chốt 4,8 tỷ thì tổng là 96 triệu ₫, phần Sales 70% là 67,2 triệu ₫.
              </p>
              <p className="mt-3 rounded-md bg-surface-muted/50 px-3 py-2.5 text-xs leading-5 text-foreground-muted">
                Đây là số minh họa để hiểu cách chia, không phải mức mặc định hay cam kết hoa hồng của RealHub. Tỷ lệ, điều kiện và người nhận thật
                luôn lấy từ chính sách đang áp dụng của doanh nghiệp.
              </p>
            </aside>
          </div>

          <p role="note" className="mt-4 rounded-md border border-border px-3 py-2.5 text-sm leading-6 text-foreground-muted">
            <strong className="font-medium text-foreground">Ba mốc cần phân biệt:</strong> ước tính là số tạm tính; xác nhận/duyệt là các bước nghiệp vụ
            do người có quyền thực hiện; đối soát là ghi nhận việc doanh nghiệp đã thanh toán bên ngoài RealHub. RealHub hiện lưu hồ sơ và mã tham chiếu,
            không tự chuyển tiền.
          </p>

          <details className="group/legal mt-4 rounded-lg border border-border bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium outline-none hover:bg-surface-muted/40 focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
              <span>Quy định pháp luật cần biết về hoa hồng môi giới</span>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="shrink-0 text-foreground-muted transition-transform group-open/legal:rotate-180"
              />
            </summary>
            <div className="border-t border-border px-4 py-3 text-sm leading-6 text-foreground-muted">
              <p>
                <strong className="font-medium text-foreground">Điều 63 quy định mức thù lao/hoa hồng do hai bên thỏa thuận.</strong>{" "}
                Cá nhân hành nghề môi giới nhận khoản này từ doanh nghiệp kinh doanh dịch vụ môi giới hoặc sàn giao dịch. Điều khoản này không ấn định
                một tỷ lệ phần trăm chung cho mọi giao dịch. Vì vậy, tỷ lệ 2% và cách chia 70/30 trong ví dụ chỉ để minh họa, không phải mức Nhà nước ấn định.
              </p>
              <p className="mt-2">
                Điều 46 khoản 4 yêu cầu hợp đồng kinh doanh dịch vụ bất động sản ghi rõ phí dịch vụ, thù lao/hoa hồng và phương thức, thời hạn thanh toán.
                Chính sách trên RealHub giúp doanh nghiệp tính và lưu kết quả; doanh nghiệp cần bảo đảm cấu hình phù hợp với thỏa thuận/hợp đồng thực tế.
                Một khoản đang ở trạng thái ước tính chưa tự chứng minh khoản đó đã đến hạn hoặc đã được thanh toán.
              </p>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <a
                  href="https://datafiles.chinhphu.vn/cpp/files/vbpq/2024/01/luat29.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  Luật 29/2023/QH15 · Điều 46, 63
                </a>
                <a
                  href="https://datafiles.chinhphu.vn/cpp/files/vbpq/2024/9/43-2024-qh15.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  Luật 43/2024/QH15 · hiệu lực từ 01/08/2024
                </a>
              </p>
            </div>
          </details>

          <details className="group/actions mt-4 rounded-lg border border-border bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium outline-none hover:bg-surface-muted/40 focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
              <span>Trạng thái và thao tác hiện có</span>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="shrink-0 text-foreground-muted transition-transform group-open/actions:rotate-180"
              />
            </summary>
            <div className="border-t border-border px-4 py-3">
              <p className="mb-3 text-xs leading-5 text-foreground-muted">
                Danh sách dưới đây phản ánh quy trình doanh nghiệp cài đặt và quyền của tài khoản. Một thao tác có thể cần lý do
                hoặc tệp đính kèm; chỉ dùng được khi trạng thái hiện tại cho phép.
              </p>
              {isLoading ? (
                <p role="status" className="rounded-md bg-surface-muted/40 px-3 py-2 text-sm text-foreground-muted">
                  Đang tải trạng thái và thao tác…
                </p>
              ) : isError ? (
                <p role="status" className="rounded-md border border-accent-red/40 bg-accent-red/20 px-3 py-2 text-sm text-accent-red-text">
                  Chưa tải được quy trình xử lý. Hãy dùng nút thử lại ở thông báo phía trên.
                </p>
              ) : workflowRows.length === 0 ? (
                <p role="status" className="rounded-md bg-surface-muted/40 px-3 py-2 text-sm text-foreground-muted">
                  Chưa có trạng thái xử lý được cấu hình cho doanh nghiệp này.
                </p>
              ) : (
                <ul aria-label="Trạng thái và thao tác hoa hồng" className="divide-y divide-border rounded-md border border-border">
                  {workflowRows.map(({ status, actions: statusActions }) => (
                    <li key={status.value} className="grid gap-2 px-3 py-3 sm:grid-cols-[minmax(9rem,0.7fr)_minmax(0,2fr)] sm:items-start">
                      <span className="text-sm font-medium">{status.label}</span>
                      {statusActions.length > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                          {statusActions.map((action) => (
                            <li key={action.value} className="rounded-md border border-border bg-surface-muted/30 px-2.5 py-1.5 text-xs">
                              <span>{action.label}</span>
                              {action.hint && <span className="ml-1 text-foreground-muted">· {action.hint}</span>}
                              {(action.requiresReason || action.requiresAttachment) && (
                                <span className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-foreground-muted">
                                  {action.requiresReason && <span className="rounded border border-border px-1.5 py-0.5">Cần lý do</span>}
                                  {action.requiresAttachment && <span className="rounded border border-border px-1.5 py-0.5">Cần tệp đính kèm</span>}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-foreground-muted">Không có thao tác khả dụng ở trạng thái này.</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        </div>
      </details>
    </section>
  );
}
