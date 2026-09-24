# REALHUB BĐS
## Tài liệu Tổng quan & Luồng Dự án
Mô tả toàn bộ sản phẩm, vai trò, luồng nghiệp vụ, scope phase và cấu hình động

| Thông tin | Nội dung |
| :--- | :--- |
| **Phiên bản** | v1.0 |
| **Ngày lập** | 03/07/2026 |
| **Phạm vi** | Phase 1 MVP + định hướng Phase 2/3 |
| **Trạng thái** | Final draft for review and implementation planning |

---

### 1. Mục tiêu tài liệu
Tài liệu này giúp toàn bộ thành viên dự án hiểu RealHub là gì, phục vụ ai, luồng nghiệp vụ chạy như thế nào, Phase 1 bao gồm gì và những phần nào để Phase 2/3. Tài liệu dùng cho Product Owner, Business Analyst, UI/UX, Frontend, Backend, QA, DevOps và đội vận hành.

### 2. Định vị sản phẩm
RealHub là nền tảng hệ sinh thái bất động sản, cho phép khách hàng tự tìm và gửi nhu cầu, người đăng sản phẩm tự bán hoặc cho thuê, sales/agency khai thác sản phẩm, CTV giới thiệu lead, và đội vận hành quản lý xác minh, lead, deal, hoa hồng và báo cáo.
* Không chỉ là website đăng tin BĐS.
* Không chỉ là CRM nội bộ cho sales.
* Không chỉ là nơi agency quản lý sản phẩm.
* RealHub là nền tảng kết nối khách hàng, chủ BĐS, sales, CTV, agency và vận hành giao dịch BĐS.

### 3. Nguyên tắc scope quan trọng

| Quyết định | Nội dung chốt |
| :--- | :--- |
| **Phase 1 chưa có payment** | Không SePay, không cọc online, không subscription billing, không payout hoa hồng online. |
| **Người đăng tự bán được** | Owner/chủ đầu tư/agency có thể tự nhận lead và tự xử lý khách, không bắt buộc qua sales. |
| **Customer tự phục vụ** | Khách có thể tự đăng ký, tự tìm/lưu/so sánh, gửi nhu cầu, yêu cầu mua/thuê, đặt lịch, yêu cầu giữ chỗ. |
| **Hoa hồng động** | Có Commission Engine động: plan, rule, split, snapshot, ledger; Phase 1 chỉ tính dự kiến/xác nhận, chưa chi trả online. |
| **Cấu hình động** | Các policy quan trọng không hard-code: assignment, lead protection, visibility, form fields, SEO, notification, feature flag. |
| **Multi-tenant-ready** | Thiết kế sẵn cho nhiều agency/sàn, nhưng MVP có thể chạy một tenant trước. |

### 4. Sơ đồ luồng tổng thể
*(Sơ đồ tham chiếu từ tài liệu gốc)*
**Hình 1.** Luồng tổng thể dự án RealHub Phase 1 và định hướng Phase 2/3.

### 5. Vai trò nghiệp vụ

| Nhóm | Vai trò | Mô tả |
| :--- | :--- | :--- |
| Khách hàng | **Guest** | Khách vãng lai xem website, tìm sản phẩm, gửi form cơ bản. |
| Khách hàng | **Customer / Buyer / Renter / Investor** | Tự đăng ký, tạo nhu cầu mua/thuê/đầu tư, lưu/so sánh, đặt lịch và theo dõi giao dịch. |
| Nguồn BĐS | **Owner / Chủ BĐS** | Đăng sản phẩm, tự bán/tự cho thuê hoặc yêu cầu sales/agency hỗ trợ khai thác. |
| Nguồn BĐS | **Developer / Chủ đầu tư** | Tạo dự án/quỹ sản phẩm, tự phân phối hoặc mở cho agency/sales khai thác. |
| Kinh doanh | **Sales / Môi giới** | Nhận phụ trách sản phẩm, tạo link/QR, nhận lead, chăm sóc khách và tạo deal. |
| Kinh doanh | **CTV / Referral** | Giới thiệu lead qua link referral, không có quyền xem dữ liệu nhạy cảm hoặc xử lý giao dịch sâu. |
| Quản lý | **Team Leader** | Quản lý sales, duyệt giữ chỗ mềm, xử lý lead trong team. |
| Doanh nghiệp | **Agency Admin** | Quản lý tenant/sàn, agency, user, sản phẩm, lead, deal, chính sách hoa hồng. |
| Vận hành | **Operator / CSKH / Kiểm duyệt** | Xác minh chủ nguồn, sản phẩm, dữ liệu public, xử lý tranh chấp và audit. |
| Nền tảng | **Super Admin** | Quản trị toàn hệ thống, tenant, role, plan và cấu hình platform. |

### 6. Role hệ thống Phase 1

| Role | Mục đích |
| :--- | :--- |
| **GUEST** | Không đăng nhập, xem public website và gửi form cơ bản. |
| **CUSTOMER** | Khách mua/thuê/đầu tư tự phục vụ. |
| **OWNER** | Người đăng/chủ BĐS tự quản lý sản phẩm và lead của mình. |
| **SALES** | Sales/môi giới khai thác sản phẩm được phép. |
| **COLLABORATOR** | CTV/người giới thiệu lead. |
| **TEAM_LEADER** | Trưởng nhóm sales. |
| **AGENCY_ADMIN** | Admin sàn/agency. |
| **OPERATOR** | Kiểm duyệt/CSKH/vận hành. |
| **SUPER_ADMIN** | Quản trị platform. |

*Lưu ý:* Một user có thể có nhiều vai trò nghiệp vụ và nhiều tenant membership. Không thiết kế một tài khoản chỉ có đúng một vai trò cố định.

### 7. Khái niệm và thuật ngữ chuẩn

| Thuật ngữ | Ý nghĩa |
| :--- | :--- |
| **Nguồn BĐS** | Nguồn tạo sản phẩm: owner, chủ đầu tư, agency, import, hoặc đề xuất từ sales. |
| **Sản phẩm BĐS** | Một căn, nhà, đất, mặt bằng, văn phòng, kho xưởng hoặc sản phẩm cụ thể có thể bán/thuê. |
| **Chế độ khai thác** | Cách sản phẩm được bán/cho thuê: tự bán, giao sales, hybrid, internal, public marketplace. |
| **Nhận phụ trách sản phẩm** | Sales nhận quyền khai thác một sản phẩm trong thời hạn và điều kiện nhất định. |
| **Lead Pool** | Nơi chứa lead chưa gán sales/sản phẩm rõ ràng hoặc cần phân bổ. |
| **Bảo hộ lead** | Khoảng thời gian hệ thống bảo vệ quyền xử lý lead của owner/sales/CTV/agency. |
| **Commission Engine** | Bộ máy hoa hồng động theo rule/split/snapshot/ledger. |
| **Customer Portal** | Cổng khách hàng tự tìm, lưu, gửi nhu cầu, đặt lịch và theo dõi giao dịch. |
| **Owner Portal** | Cổng chủ BĐS/người đăng quản lý sản phẩm, lead và tự bán/tự cho thuê. |

### 8. Phase Plan

| Phase | Mục tiêu | Có trong phase | Chưa có / để sau |
| :--- | :--- | :--- | :--- |
| **Phase 1 - MVP Core** | Chạy được hệ sinh thái cốt lõi. | Customer self-service, Owner self-sell, Sales assignment, Lead CRM, Deal cơ bản, giữ chỗ mềm, Commission Engine dự kiến/xác nhận, SEO, MinIO, audit. | Không SePay, không payment online, không ngân hàng/pháp lý/nội thất, không payout hoa hồng. |
| **Phase 2 - Payment & Partner Finance** | Thêm thanh toán và vận hành giao dịch sâu. | SePay, payment order/webhook, đối soát, cọc online nếu cho phép, refund, subscription tenant, ngân hàng/tư vấn vay. | Chưa cần marketplace liên sàn/AI nâng cao. |
| **Phase 2/3 - Legal & Transaction Support** | Hỗ trợ pháp lý/công chứng. | Pháp lý, công chứng, thẩm định hồ sơ, hợp đồng, tiến độ pháp lý. | Tùy mức độ giao dịch thực tế. |
| **Phase 3 - Ecosystem Expansion** | Mở rộng hệ sinh thái. | Nội thất/xây dựng, quản lý tòa nhà, vận hành cho thuê, AI Sales Kit, marketplace liên sàn, đối tác marketing. | Không thuộc MVP. |

### 9. Luồng Customer tự phục vụ
1. Khách truy cập public website hoặc landing page.
2. Khách tìm kiếm sản phẩm theo khu vực, loại BĐS, giá, diện tích, dự án.
3. Khách tự đăng ký bằng email/số điện thoại và xác thực OTP nếu áp dụng.
4. Khách lưu, so sánh hoặc gửi yêu cầu tư vấn cho sản phẩm cụ thể.
5. Khách có thể tạo nhu cầu chung: mua, thuê, đầu tư với ngân sách/khu vực/loại BĐS.
6. Hệ thống tạo lead hoặc `customer_need` và đưa vào Lead CRM/Lead Pool.
7. Hệ thống kiểm tra trùng lead và áp dụng chính sách bảo hộ lead.
8. Lead được gán cho owner, sales, team hoặc agency tùy nguồn và policy.
9. Khách đặt lịch xem nhà/xem dự án hoặc yêu cầu giữ chỗ.
10. Khách theo dõi lịch hẹn, yêu cầu và trạng thái giao dịch trong Customer Portal.

### 10. Luồng Owner/người đăng tự bán
1. Owner tự đăng ký hoặc được mời vào tenant.
2. Owner xác thực số điện thoại/email và hoàn thiện hồ sơ chủ nguồn.
3. Owner gửi Sản phẩm BĐS hoặc BĐS ký gửi.
4. Operator/Agency Admin xác minh chủ nguồn và xác minh sản phẩm.
5. Owner chọn chế độ khai thác: `SELF_SELL`, `SALES_DISTRIBUTION` hoặc `HYBRID`.
6. Nếu `SELF_SELL`: lead từ sản phẩm gán trực tiếp về Owner Portal.
7. Nếu `SALES_DISTRIBUTION`: sales được nhận phụ trách theo assignment policy.
8. Nếu `HYBRID`: owner và sales cùng khai thác; lead thuộc nguồn nào thì gán nguồn đó.
9. Owner quản lý lead, lịch hẹn, deal cơ bản và trạng thái sản phẩm.
10. Owner có thể chuyển từ tự bán sang yêu cầu sales hỗ trợ nếu cần.

### 11. Chế độ khai thác sản phẩm

| selling_mode | Ý nghĩa | Lead gán cho ai | Hoa hồng |
| :--- | :--- | :--- | :--- |
| **SELF_SELL** | Người đăng tự bán/tự cho thuê. | Owner/chủ nguồn. | Thường không có hoa hồng sales; có thể có phí dịch vụ sau này. |
| **SALES_DISTRIBUTION** | Sales/agency khai thác sản phẩm. | Sales theo assignment hoặc team. | Áp dụng Commission Engine. |
| **HYBRID** | Owner và sales cùng khai thác. | Theo nguồn lead: owner link, sales link, CTV link, public. | Tính theo nguồn lead và rule phù hợp. |
| **INTERNAL_ONLY** | Chỉ nội bộ tenant thấy. | Theo người được phân quyền. | Theo chính sách nội bộ. |
| **MARKETPLACE_PUBLIC** | Public trên RealHub marketplace. | Theo lead source/policy. | Theo rule tenant/platform. |

### 12. Luồng Sales/CTV khai thác
1. Sales login vào Sales Portal.
2. Sales thấy sản phẩm đúng tenant, khu vực, dự án và visibility policy.
3. Sales bấm nhận phụ trách sản phẩm.
4. Hệ thống kiểm tra assignment policy: max sales, thời hạn, trạng thái sản phẩm, quyền khu vực.
5. Hệ thống tạo assignment, link/QR riêng và đưa sản phẩm vào “Sản phẩm tôi phụ trách”.
6. Sales share link/QR/caption/tài liệu public cho khách.
7. Lead từ link/QR được gán cho sales nếu chưa trùng hoặc chưa bị bảo hộ bởi nguồn khác.
8. CTV chỉ được tạo referral link/lead giới thiệu, không xử lý giao dịch sâu và không xem dữ liệu nhạy cảm.

### 13. Luồng Lead CRM và bảo hộ lead

**Bảng 13.1: Phân bổ theo nguồn Lead**
| Nguồn lead | Xử lý Phase 1 |
| :--- | :--- |
| **Link/QR sales** | Gán cho sales theo assignment nếu còn hiệu lực. |
| **Link owner/self-sell** | Gán cho owner/chủ nguồn. |
| **CTV referral** | Ghi nhận CTV là nguồn giới thiệu, phân sales/team xử lý. |
| **Public website** | Vào Lead Pool hoặc gán theo rule khu vực/sản phẩm/agency. |
| **Customer need chung** | Tạo `customer_need` + lead pool, gợi ý sản phẩm phù hợp. |
| **Sales nhập tay** | Check trùng theo số điện thoại và policy bảo hộ. |

**Bảng 13.2: Xử lý tình huống trùng Lead**
| Tình huống trùng lead | Hành vi hệ thống |
| :--- | :--- |
| **Chưa có lead** | Tạo lead mới. |
| **Cùng sales/owner** | Merge activity vào lead hiện tại. |
| **Khác sales cùng sản phẩm** | Tạo cảnh báo/tranh chấp lead. |
| **Khác nguồn nhưng hết bảo hộ** | Cho phép phân lại theo policy. |
| **Lead không chăm sóc X ngày** | Nhắc việc hoặc chuyển Lead Pool theo lead protection policy. |

### 14. Luồng Deal Phase 1 - không thanh toán
1. Lead đủ điều kiện được chuyển thành deal.
2. Sales/Owner/Agency cập nhật sản phẩm quan tâm, giá dự kiến, trạng thái tư vấn.
3. Khách có thể yêu cầu giữ chỗ.
4. Sales/Owner tạo yêu cầu giữ chỗ mềm.
5. Team Leader/Agency Admin/Operator duyệt giữ chỗ mềm tùy quyền.
6. Sản phẩm chuyển trạng thái “Đang giữ chỗ” nếu được duyệt.
7. Nếu khách hủy hoặc quá hạn, sản phẩm quay lại trạng thái phù hợp.
8. Nếu deal thành công, Agency Admin/Operator xác nhận giao dịch thủ công.
9. Hệ thống cập nhật trạng thái sản phẩm và tạo hoa hồng xác nhận nếu có.

*Lưu ý: Phase 1 không xử lý cọc online, payment webhook, hoàn tiền online hoặc đối soát SePay.*

### 15. Commission Engine động
Hoa hồng không được hard-code. RealHub sử dụng Commission Engine để cấu hình chính sách theo tenant, sản phẩm, dự án, khu vực, nguồn lead, chế độ khai thác, loại giao dịch và thời gian hiệu lực.

**Bảng 15.1: Các lớp trong Commission Engine**
| Lớp | Ý nghĩa |
| :--- | :--- |
| **Commission Plan** | Chính sách/gói hoa hồng có hiệu lực theo tenant/dự án/khu vực/thời gian. |
| **Commission Rule** | Điều kiện áp dụng và cách tính: %, fixed amount, 1 tháng thuê, 50% tháng thuê đầu. |
| **Commission Split** | Chia tổng hoa hồng cho sales, CTV, team leader, agency, owner hoặc bên liên quan. |
| **Commission Calculation** | Kết quả tính dự kiến/xác nhận cho từng deal. |
| **Commission Snapshot** | Lưu rule áp dụng tại thời điểm tạo deal để deal cũ không bị thay đổi khi rule mới active. |
| **Commission Ledger** | Lưu lịch sử tạo, điều chỉnh, xác nhận hoặc hủy hoa hồng. |

**Bảng 15.2: Các trạng thái Commission trong Phase 1**
| Trạng thái Phase 1 | Ý nghĩa |
| :--- | :--- |
| **DRAFT** | Nháp, chưa áp dụng. |
| **ESTIMATED** | Hoa hồng dự kiến khi tạo/cập nhật deal. |
| **PENDING_CONFIRMATION** | Chờ xác nhận khi deal gần hoàn tất. |
| **CONFIRMED** | Đã xác nhận số tiền hoa hồng, chưa chi trả online. |
| **ADJUSTED** | Có điều chỉnh. |
| **CANCELLED** | Deal hủy hoặc không đủ điều kiện hoa hồng. |

### 16. Configuration & Policy Engine

| Nhóm cấu hình động | Phase 1 | Mục đích |
| :--- | :--- | :--- |
| **Workflow states/transitions** | Basic | Không hard-code toàn bộ chuyển trạng thái lead/deal/product. |
| **Dynamic Property Form** | Có | Field khác nhau theo căn hộ, đất, thuê, văn phòng, kho xưởng. |
| **Visibility & Data Masking** | Có | Ẩn/hiện trường nhạy cảm theo role/quyền/phụ trách. |
| **Assignment Policy** | Có | Max sales, thời hạn phụ trách, gia hạn, expire behavior. |
| **Lead Protection Policy** | Có | Thời gian bảo hộ theo source/tenant/campaign/activity. |
| **Commission Engine** | Có | Hoa hồng động theo rule/split/snapshot/ledger. |
| **Notification Rules** | Basic | Cấu hình event nào gửi cho ai qua kênh nào. |
| **SEO Templates** | Có | Title/description/canonical/noindex động theo loại trang. |
| **Tenant Feature Flags** | Có | Bật/tắt customer portal, owner self-sell, CTV, marketplace... theo tenant. |
| **Tenant Limits** | Basic | Giới hạn user, sản phẩm, lead, storage, imports. |

### 17. Visibility & thông tin public/nội bộ

| Loại dữ liệu | Khách | Sales chưa phụ trách | Sales phụ trách | Owner | Agency/Admin/Operator |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Giá hiển thị, diện tích, mô tả public** | Xem | Xem | Xem | Xem | Xem/Sửa |
| **Địa chỉ chính xác** | Ẩn/rút gọn | Ẩn | Theo quyền | Xem sản phẩm của mình | Xem |
| **SĐT chủ BĐS** | Ẩn | Ẩn | Theo quyền/log | Xem | Xem/log |
| **Giá net/biên thương lượng** | Ẩn | Ẩn | Theo quyền | Theo cấu hình | Xem |
| **File pháp lý/hợp đồng** | Ẩn | Ẩn | Theo quyền/log | Theo cấu hình | Xem/log |
| **Lead/khách hàng** | Chỉ của mình | Không | Lead của mình | Lead sản phẩm của mình | Theo tenant/quyền |

### 18. Revalidation sản phẩm
1. Sản phẩm đến kỳ kiểm tra lại theo revalidation policy.
2. Hệ thống nhắc owner, sales phụ trách hoặc operator.
3. Người phụ trách xác nhận còn hiệu lực, cập nhật giá/trạng thái hoặc tạm ngưng.
4. Nếu quá hạn không phản hồi, sản phẩm chuyển “Hết hiệu lực” hoặc ẩn public.
5. Lịch sử giá và trạng thái được ghi nhận để audit/report.

### 19. Partner services để Phase 2/3

| Nhóm đối tác | Phase | Ghi chú |
| :--- | :--- | :--- |
| **Ngân hàng / tư vấn vay** | Phase 2 | Liên quan khách mua cần vay và tư vấn tài chính. |
| **Pháp lý / công chứng** | Phase 2/3 | Hỗ trợ deal, hợp đồng, công chứng, thẩm định hồ sơ. |
| **Nội thất / xây dựng** | Phase 3 | Dịch vụ sau mua, tăng hệ sinh thái sau giao dịch. |
| **Quản lý tòa nhà / vận hành cho thuê** | Phase 3 | Nếu RealHub mở rộng rental management. |

### 20. Checklist P0 trước khi chia task

| Hạng mục | Trạng thái mong muốn |
| :--- | :--- |
| **Scope Phase 1** | Chốt không payment, có owner self-sell, customer self-service, commission động. |
| **Role/Permission** | Role MVP + multi-profile/multi-tenant membership. |
| **Product Visibility** | Có `visibility_scope` và `publication_status` riêng. |
| **Selling Mode** | Có `SELF_SELL`, `SALES_DISTRIBUTION`, `HYBRID`, `INTERNAL_ONLY`, `MARKETPLACE_PUBLIC`. |
| **Lead Policy** | Có duplicate/protection/lead pool. |
| **Commission Engine** | Có plan/rule/split/snapshot/ledger. |
| **Dynamic Config** | Có assignment, visibility, lead protection, SEO, feature flags. |
| **QA Acceptance** | Có test cho customer, owner, sales, CTV, lead, deal, commission. |