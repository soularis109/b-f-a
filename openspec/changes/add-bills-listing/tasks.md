# Tasks

## 1. Query DTO та response-типи

- [x] 1.1 Створити `src/bills/dto/get-bills-query.dto.ts` з `GetBillsQueryDto` (`page`, `limit` — `@IsOptional @Type(() => Number) @IsInt @Min(1)`, `limit` додатково `@Max(100)`, дефолти `page = 1`, `limit = 20` через ініціалізатори полів) і перевірити `pnpm typecheck`
- [x] 1.2 Додати типи `PaginatedBillsMeta { total, page, limit, totalPages }` і `PaginatedBillsResponse { data: BillResponse[]; meta: PaginatedBillsMeta }` у `src/bills/types/bill-response.type.ts` і перевірити `pnpm typecheck`

## 2. Рефакторинг мапінгу Bill → BillResponse

- [x] 2.1 Виділити приватний метод `BillsService.toBillResponse(bill): BillResponse` і переписати `create`/`pay` на його використання без зміни поведінки; перевірити `pnpm test src/bills/bills.service.spec.ts` (наявні тести лишаються зеленими без модифікацій)

## 3. Сервіс: `BillsService.findAll`

- [x] 3.1 Реалізувати `findAll(query: GetBillsQueryDto): Promise<PaginatedBillsResponse>` з `skip = (page - 1) * limit`, `this.prisma.$transaction([bill.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }), bill.count()])`, `totalPages = Math.ceil(total / limit)`
- [x] 3.2 Додати unit-тести в `src/bills/bills.service.spec.ts`: дефолтні `page`/`limit` (перевірка `skip: 0, take: 20`), нестандартна сторінка (перевірка обчислення `skip`/`take`), порожній результат (`data: []`, `meta.totalPages: 0`), непорожній результат (перевірка, що `amount` у відповіді — `number`, а не `Decimal`, і коректність `meta.total`/`meta.totalPages`), фіксований `orderBy: { createdAt: 'desc' }`; перевірити `pnpm test src/bills/bills.service.spec.ts`

## 4. Контролер: `GET /bills`

- [x] 4.1 Додати `@Get() findAll(@Query() query: GetBillsQueryDto): Promise<PaginatedBillsResponse>` у `src/bills/bills.controller.ts`
- [x] 4.2 Додати unit-тест делегування в `src/bills/bills.controller.spec.ts` (виклик `billsService.findAll` з тим самим query DTO, повернення його результату); перевірити `pnpm test src/bills/bills.controller.spec.ts`

## 5. E2E-покриття

- [x] 5.1 Додати `describe('GET /bills', ...)` у `test/bills.e2e-spec.ts`: порожній список (`200`, `data: []`, `meta` з нулями); дефолти й форма відповіді (кілька створених рахунків, перевірка `data.length`, форми `BillResponse`, `meta.page`/`meta.limit`); кілька сторінок (напр. 5 рахунків, `limit=2` → 3 сторінки, остання неповна, перевірка `meta.total`/`meta.totalPages`); сортування `createdAt DESC` (послідовно створені рахунки повертаються в порядку спадання)
- [x] 5.2 Додати негативні e2e-кейси в `test/bills.e2e-spec.ts`: невалідні `page`/`limit` (`0`, `-1`, `101`, нечислове, дробове — кожен окремим `it`) → `400`; сторонній query-параметр (`?foo=bar`) → `400` (наслідок `forbidNonWhitelisted`); перевірити `pnpm test:e2e`

## 6. Фінальна верифікація

- [x] 6.1 Прогнати повний набір перевірок: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm test:e2e`

## 7. OpenSpec-документація

- [x] 7.1 Переконатися, що `proposal.md`, `design.md` і `specs/bills/spec.md` цієї зміни відображають фінальну реалізацію (без розбіжностей після кодування) і пройти `openspec validate --change "add-bills-listing" --strict`