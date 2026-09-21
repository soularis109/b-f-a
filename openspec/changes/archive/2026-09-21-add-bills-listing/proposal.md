# Proposal

## Why

Зараз клієнт може створити рахунок (`POST /bills`) і оплатити конкретний рахунок за відомим `id` (`POST /bills/:id/pay`), але немає способу отримати перелік наявних рахунків. UI, якому потрібно швидко показати список рахунків, не може завантажувати всю таблицю одразу — потрібен список-ендпоінт зі сторінковою пагінацією.

## What Changes

- Новий ендпоінт `GET /bills`, що повертає сторінкований список рахунків.
- Пагінація — offset-based через query-параметри `page` (дефолт `1`) і `limit` (дефолт `20`, максимум `100`).
- Сортування за замовчуванням — за `createdAt` у спадному порядку (новіші спочатку), без параметра сортування.
- Відповідь у форматі `{ data: Bill[], meta: { total, page, limit, totalPages } }`.
- Невалідні значення `page`/`limit` (поза межами, нечислові, дробові) відхиляються з `400 Bad Request`.
- Фільтрація та пошук навмисно поза скоупом — окрема майбутня фіча.

## Capabilities

### New Capabilities

_(немає — використовується наявна капабіліті `bills`)_

### Modified Capabilities

- `bills`: додається вимога щодо перегляду списку рахунків зі сторінковою пагінацією та валідації параметрів пагінації. Наявні вимоги про оплату (`POST /bills/:id/pay`) не змінюються.

## Impact

- `src/bills/bills.controller.ts` — новий метод `GET /bills`.
- `src/bills/bills.service.ts` — новий метод `findAll` (Prisma `findMany`/`count`).
- `src/bills/dto/get-bills-query.dto.ts` — новий DTO для query-параметрів пагінації.
- `src/bills/types/bill-response.type.ts` — нові типи `PaginatedBillsMeta`/`PaginatedBillsResponse`.
- Тести: `src/bills/bills.service.spec.ts`, `src/bills/bills.controller.spec.ts`, `test/bills.e2e-spec.ts`.
- Без змін схеми Prisma та без міграцій. Без змін в auth (авторизації в проєкті немає — список глобальний).