# 📊 ĐẶC TẢ TÍNH NĂNG: `comment_data` & `check_logic_data` (SERVICE 2)

> Trạng thái: **BE đã triển khai** (nhánh `feat/phase4-wave1-kafka-config-secrets`) · Cập nhật: 2026-10-23
> Nguồn hợp đồng: `KAFKA_FULL_SCHEMA_AND_WORKFLOW.md` mục 7.7, 7.8 + Phụ lục C (hiệu chỉnh theo xác nhận AI Engine).
> Không phụ thuộc bất kỳ bug AI nào đang chờ fix (khác `analyzer`/`chuyen_de_3`/`delete_report`).

## 1. Mục đích

| Event | Vai trò trong luồng nghiên cứu | Mã lỗi |
|---|---|:--:|
| `check_logic_data` | Kiểm tra **logic biến & thang đo** trước khi phân tích — đây là event **duy nhất** phát hiện trùng `variable_code` | `642` |
| `comment_data` | AI **nhận xét tính hợp lệ** của dữ liệu khảo sát theo từng biến | `636` |

**Thứ tự nghiệp vụ bắt buộc**: `check_logic_data` → `analyzer` → `comment_data` (BE chạy `check_logic_data` trước để chặn dữ liệu xấu; `analyzer` không kiểm trùng `code`).

## 2. API

| Method | Route | Guard | Ghi chú |
|---|---|---|:--:|
| `POST` | `/datasets/:datasetId/check-logic` | JWT | `datasetId` phải là UUID, thuộc user hiện tại |
| `POST` | `/datasets/:datasetId/comment` | JWT | Dataset thuộc user khác ⇒ **404** (không lộ tài nguyên) |

`document_id` **không** lấy từ body — BE suy ra từ `Dataset.documentId` (một nguồn sự thật).

## 3. Request gửi AI (Kafka `write_section_request`)

Luôn gửi kèm bộ định danh để AI echo lại và BE correlate:

```json
{
  "event_type": "comment_data",
  "model_id": "gemini-3.5-flash-lite",
  "user_id": "<uuid>",
  "document_id": "<uuid>",
  "session_id": "sess-comment_data-<uuid>",
  "language": "Vietnamese",
  "thread_id": "<uuid>",
  "final_proposal": { "title": "..." },
  "data": { "age": [22, 35] },
  "variables": [
    { "name": "Tuổi", "code": "age", "variable_type": "observed", "role": "independent", "scale": "ratio" }
  ]
}
```

`check_logic_data` chỉ gửi `variables` (+ identifier), **không** gửi `thread_id`/`data`/`final_proposal`.

### 3.1. Ràng buộc enum (bắt buộc — gửi nhãn tiếng Việt sẽ bị `631`/`schema_validation_error`)

| Field | Giá trị hợp lệ | Map từ BE |
|---|---|---|
| `scale` (**bắt buộc**) | `nominal`, `ordinal`, `interval`, `ratio`, `guttman`, `semantic_differential`, `hybrid`, `performance_level` | Likert 5/7 mức ⇒ `interval` |
| `role` | `dependent`, `independent`, `intermediate`, `moderator`, `control`, `endogenous`, `null` | `VariableRole.Mediator` ⇒ `intermediate` |
| `variable_type` | `observed`, `latent`, `time_index`, `entity_index`, `component` | `VariableType` của BE là **kiểu dữ liệu**, không map 1-1 — mặc định `observed` cho cột dữ liệu |

## 4. Response & lưu trữ

| Event | Field AI trả | BE lưu ở đâu |
|---|---|---|
| `check_logic_data` | `errors_logic: string[]`, `warnings_logic: string[]` (token = 0) | Toàn bộ response trong `Job.result` (Json) — **không cần migration** |
| `comment_data` | `comments: list[dict]` + token | Toàn bộ response trong `Job.result` |

- Job: `module = write_report`, `action = comment_data | check_logic_data`, `documentId`, `sessionId` (UUID phiên BE sinh).
- Job ban đầu `pending` → publish thành công → `processing` → nhận response → `finished` (result = response).
- Publish Kafka lỗi ⇒ `clearPending` + job `error` với mã **610**.

## 5. Timeout

`comment_data` và `check_logic_data` = **300s** (`EVENT_TIMEOUT_CONFIG`), khớp `TIME_OUT_DICT` mặc định 300s của AI; heartbeat `ttl/2` = 300s cho 2 event này.

## 6. Module & file

```
src/modules/write-report/data-analysis/
├── dto/data-analysis.dto.ts          # AnalyzeVariableDto + CommentDataDto + CheckLogicDataDto + enum AI
├── data-analysis-ai.service.ts       # dispatch (publish + correlate + job lifecycle)
├── data-analysis-ai.service.spec.ts  # 4 case
├── data-analysis.controller.ts       # 2 route JWT
└── data-analysis.module.ts           # đăng ký trong write-report.module.ts
```

## 7. Kiểm thử

```bash
docker exec auto-research-be-local npm test -- --testPathPatterns=data-analysis
```
Phủ: payload đúng `event_type` + đủ 3 identifier; `check_logic_data` không gửi `thread_id`; dataset chéo user ⇒ 404; publish lỗi ⇒ job `error/610`.
