# AGENTS.md

Короткий гайд для будь-кого (людини чи агента), хто працює в цьому репозиторії.

## Стек і версії

- **Node** — версія закріплена в `.nvmrc`; завжди `nvm use` перед роботою (старіші патчі Node 22.x ламають `@nestjs/cli`)
- **pnpm** — пакетний менеджер
- **NestJS 12**, ESM (`"type": "module"`), платформа Express
- **TypeScript** у strict mode: `strict: true` + `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch` — не послаблювати без явної причини
- **ESLint** (flat config, `typescript-eslint` type-checked правила) + **Prettier**
- **Vitest** для unit- і e2e-тестів

## Команди для перевірки якості

Перед комітом/PR має проходити все:

```
pnpm typecheck      # tsc --noEmit
pnpm lint            # ESLint (lint:fix — з автофіксом)
pnpm format:check    # Prettier (format — із записом)
pnpm test            # unit-тести (Vitest)
pnpm test:e2e        # e2e-тести (Vitest)
pnpm test:cov        # покриття
```

## Coverage

Без жорсткого відсоткового gate. Правило: **покриття нового/зміненого коду не повинно бути нижче за те, що було до зміни; будь-яка нова логіка обов'язково супроводжується тестами**. `pnpm test:cov` — інструмент перевірки цього правила, а не число, яке треба перевищити.

## Конвенція комітів

- **Conventional Commits**: `type(scope?): опис`, типи — `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `ci`, `build`
- Зміни в межах однієї задачі розбиваються на **логічні групи окремими комітами** — код, тести, документація/конфіг не змішуються в одному коміті
- Конвенція наразі без автоматичного enforcement (немає commitlint/husky) — дотримання на рівні дисципліни
- **Агент ніколи не виконує `git commit` без прямої команди користувача** — навіть якщо план чи задача згадують коміт як наступний крок, це не команда «закомітити зараз»

## Інше важливе

- Проєкт — ESM: relative-імпорти в TS-файлах потребують `.js`-розширення (`./app.module.js`, не `./app.module`) через `moduleResolution: nodenext` — типова пастка
- Каркас зараз чистий, без бізнес-логіки; нові фічі додаються невеликими PR з тестами на нову логіку
