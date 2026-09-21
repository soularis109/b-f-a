# Tasks

## 1. Схема даних

- [x] 1.1 Додати значення `paid` до `enum BillStatus` у `prisma/schema.prisma` і згенерувати нову Prisma-міграцію (`pnpm prisma:migrate:dev --name add_paid_bill_status`); перевірити командою `pnpm prisma:migrate:dev` (виконується без помилок, новий файл міграції з'являється в `prisma/migrations/`) та `pnpm prisma:generate` (перегенерований клієнт містить `'paid'` у типі `BillStatus`).

## 2. Сервісний шар: `BillsService.pay`

- [x] 2.1 Реалізувати `BillsService.pay(id: string): Promise<BillResponse>` (`src/bills/bills.service.ts`): `findUnique` за id → `NotFoundException`, якщо рахунку немає; `ConflictException`, якщо `status === 'paid'`; інакше `update` статусу на `paid` і повернення `BillResponse`. Додати юніт-тести в `src/bills/bills.service.spec.ts` для всіх трьох гілок (успішна оплата, 404 на неіснуючий id, 409 на вже оплачений рахунок, з перевіркою що `update` не викликається в error-гілках); перевірити командою `pnpm test src/bills/bills.service.spec.ts`.

## 3. Контролер: ендпоінт `POST /bills/:id/pay`

- [x] 3.1 Додати `@Post(':id/pay') @HttpCode(HttpStatus.OK) pay(@Param('id') id: string)` до `src/bills/bills.controller.ts`, що делегує в `BillsService.pay`. Додати юніт-тест у `src/bills/bills.controller.spec.ts`, що перевіряє делегування виклику та повернення результату сервісу; перевірити командою `pnpm test src/bills/bills.controller.spec.ts`.

## 4. E2E-покриття

- [x] 4.1 Додати до `test/bills.e2e-spec.ts` три сценарії: успішна оплата (`POST /bills/:id/pay` → `200`, `status: "paid"` у відповіді, персистентність підтверджена прямим читанням через Prisma), повторна оплата вже оплаченого рахунку (`409`), оплата неіснуючого id (`404`); перевірити командою `pnpm test:e2e`.

## 5. Фінальна верифікація

- [x] 5.1 Прогнати повний набір перевірок якості: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm test:e2e`.
