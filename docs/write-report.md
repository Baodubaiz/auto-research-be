# ✍️ Module: Write Report & Data Analysis

## Mục đích
Quản lý quá trình sinh báo cáo/luận văn nghiên cứu khoa học: soạn thảo nội dung báo cáo dạng Markdown, phân tích tập dữ liệu (dataset), biến nghiên cứu (dataset variables), phương pháp đề xuất (proposed method), và sinh slide thuyết trình (generated slides).

---

## Các thành phần chính

- `ReportController` & `ReportService` (`src/modules/write-report/report/`):
  - CRUD báo cáo nghiên cứu và các section nội dung
  - Hỗ trợ endpoint gắn tài liệu (`document-report.controller.ts`)
- `DatasetController` & `DatasetService` (`src/modules/write-report/dataset/`):
  - Quản lý metadata và file dữ liệu thực nghiệm (CSV, Excel) phục vụ phân tích định lượng
- `DatasetVariableController` & `DatasetVariableService` (`src/modules/write-report/dataset-variable/`):
  - Quản lý các biến nghiên cứu độc lập, phụ thuộc, trung gian và thang đo
- `ProposedMethodController` & `ProposedMethodService` (`src/modules/write-report/proposed-method/`):
  - Quản lý mô tả phương pháp nghiên cứu, thuật toán, khung lý thuyết phân tích
- `GeneratedSlideController` & `GeneratedSlideService` (`src/modules/write-report/generated-slide/`):
  - Quản lý kết quả slide trình chiếu (PPTX/HTML) sinh tự động từ nội dung báo cáo

---

## Luồng dữ liệu

```mermaid
sequenceDiagram
    participant FE as Frontend Client
    participant WR as WriteReport Module
    participant DB as Prisma (PostgreSQL)
    participant KF as Kafka (write_section_request)
    participant AI as AI Write Worker
    
    FE->>WR: Yêu cầu sinh nội dung mục báo cáo / phân tích dữ liệu
    WR->>DB: Tạo bản ghi Report/Job (Status: PENDING)
    WR->>KF: Gửi event write_section_request
    AI-->>KF: Streaming chunks hoặc hoàn tất trả về write_section_response
    WR->>DB: Cập nhật nội dung Markdown và hoàn tất Job
    FE->>WR: GET /api/v1/reports/:id (Lấy kết quả)
```

---

## Dependencies

- **Phụ thuộc vào**:
  - `PrismaService`: Quản lý lưu trữ bảng `Report`, `Dataset`, `DatasetVariable`, `ProposedMethod`, `GeneratedSlide`
  - `DocumentSetupModule`: Đọc ngữ cảnh Outline và Reference
  - `MessagingModule`: Điều phối event Kafka sang AI Write Section Worker
  - `JobsModule`: Theo dõi tiến trình tạo báo cáo và slide
- **Được sử dụng bởi**:
  - `EnhancementModule`: Cung cấp nội dung văn bản để AI trau chuốt và viết lại

---

## Edge cases & Lưu ý

- Nội dung bài viết dài cần chia nhỏ theo từng section/tiểu mục để tránh payload vượt ngưỡng Kafka và timeout HTTP.
- Kết quả slide (.pptx) lưu trữ tại MinIO/S3, trong DB chỉ lưu URL tải và metadata.
- Tập dữ liệu lớn (dataset) cần kiểm tra kích thước và định dạng cột trước khi kích hoạt worker phân tích.

---

## Cập nhật lần cuối
2026-10-19 — Khởi tạo tài liệu module theo chuẩn `rules/rule-docs.md`.

---

## Cập nhật 2026-10-23 — API `translate_report`

`POST /documents/:documentId/translate-report` (JWT)

| Field | Kiểu | Ghi chú |
|---|---|---|
| `targetLanguage` | string (bắt buộc) | Chuỗi tự do ("English", "Tiếng Việt") — AI nhúng vào prompt |
| `isOutline` | boolean (mặc định `false`) | `true` ⇒ dịch đề cương, `false` ⇒ dịch toàn văn |

- AI **không** trả nội dung bản dịch qua Kafka; AI ghi vào Mongo `admin.document_configurations`:
  `translatedContent` (toàn văn) hoặc `translatedOutline` (đề cương) — AI ghi **trước** khi gửi message.
- BE đọc lại Mongo (read primary + retry ngắn) và trả `content` cho FE. Không đọc được ⇒ `content: null`,
  job vẫn `finished` (AI đã dịch xong) — FE hiển thị cảnh báo.
- Mã lỗi: publish Kafka `610`; nghiệp vụ `641` (translate). Cross-user ⇒ **404**.
