# 🗄️ Module: Database & Prisma ORM

## Mục đích
Quản lý tầng dữ liệu quan hệ (PostgreSQL) thông qua Prisma ORM, bao gồm định nghĩa schema, quan hệ thực thể, enum và các migration đồng bộ DB.

---

## Các thành phần chính

- `PrismaService` (`src/database/prisma.service.ts`):
  - Kế thừa `PrismaClient`, thực thi lifecycle hook `onModuleInit` (`$connect`) và `onModuleDestroy` (`$disconnect`)
- `PrismaModule` (`src/database/prisma.module.ts`):
  - Khai báo `@Global()`, cung cấp và export `PrismaService` cho toàn bộ ứng dụng
- `prisma/schema.prisma`:
  - Datasource: `postgresql` với biến môi trường `DATABASE_URL`
  - Các Enum chính:
    - `JobStatus`: `pending`, `processing`, `finished`, `error`, `suspended`
    - `ModuleType`: `document_setup`, `write_report`, `chatbot`, `enhancement`
    - `DocStatus`: `draft`, `processing`, `completed`
  - Các Models chính:
    - `User`: Quản lý tài khoản và phân quyền
    - `Document`: Dự án nghiên cứu của người dùng
    - `Proposal`, `Outline`, `Reference`, `DocumentKeyword`: Dữ liệu thiết lập tài liệu
    - `Report`, `Dataset`, `DatasetVariable`, `ProposedMethod`, `GeneratedSlide`: Dữ liệu viết báo cáo
    - `ChatSession`, `ChatMessage`: Phiên và tin nhắn chatbot
    - `EnhancementSession`, `EnhancementSuggestion`: Gợi ý chỉnh sửa văn phong
    - `Job`: Bảng theo dõi tiến trình tác vụ nền

---

## Luồng dữ liệu

```mermaid
flowchart TD
    Env[DATABASE_URL in .env] --> PrismaConfig[datasource db postgresql]
    Schema[prisma/schema.prisma] -->|prisma generate| Client[@prisma/client Node Modules]
    Client --> PrismaService[PrismaService in src/database/]
    PrismaService --> DomainServices[Domain Services: Auth, DocumentSetup, Jobs, ...]
    DomainServices --> Postgres[(PostgreSQL Container / VPS)]
```

---

## Dependencies

- **Phụ thuộc vào**:
  - `@prisma/client`, `prisma` CLI
  - PostgreSQL instance cấu hình qua biến `DATABASE_URL`
- **Được sử dụng bởi**:
  - Toàn bộ các domain service trong `src/modules/`

---

## Edge cases & Lưu ý

- Khi chỉnh sửa `prisma/schema.prisma`, bắt buộc chạy `npm run prisma:generate` để cập nhật client TypeScript types.
- Khi triển khai môi trường Docker dev, sử dụng lệnh `npm run docker:db-push` hoặc `npx prisma db push` để đồng bộ schema nhanh chóng mà không làm gián đoạn container.
- Không bao giờ hardcode credentials database trong file schema. Luôn đọc từ `env("DATABASE_URL")`.

---

## Cập nhật lần cuối
2026-10-19 — Khởi tạo tài liệu module theo chuẩn `rules/rule-docs.md`.
