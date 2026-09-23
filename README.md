<p align="center">
  <a href="http://algoan.com/" target="blank"><img src="https://media.licdn.com/dms/image/C4E0BAQH-hIlc5g9g7w/company-logo_200_200/0?e=2159024400&v=beta&t=j5y9KO1P22GsMx3vBNawrpvyvjD2iyBWGeVPUsRkn5s" width="320" alt="Algoan Logo" /></a>
</p>

# Fake Open Banking data samples

This repository shares different open banking data samples in order to test easily [Algoan Scoring APIs](https://docs.algoan.com). Balance and transaction dates are automatically refreshed by a daily cron job.

> 💡 The story, all names, characters, credits portrayed in this fake data are fictitious. No identification with actual persons (living or deceased), credits, debts, and life style is intended or should be inferred.

## Personae

A JSON file represents what we call a "Personae": a profile with relevant credit risk indicators:

- [France 🇫🇷](./samples/fr): French Personae (accounts and transaction's description are written in French).
- [UK 🇬🇧](./samples/en/): United Kingdom Personae (accounts and transaction's description are written in English en-GB)
- [Spain 🇪🇸](./samples/es/): Spanish Personae (accounts and transaction's description are written in Spanish)
- [Netherlands 🇳🇱](./samples/nl/): Dutch Personae (accounts and transaction's description are written in Dutch nl-NL)
- [Belgium 🇧🇪 (FR)](./samples/be-fr/): Belgian Personae (accounts and transaction's description are written in French be-fr)
- [Belgium 🇧🇪 (NL)](./samples/be-nl/): Belgian Personae (accounts and transaction's description are written in Dutch be-nl)

## Bank statements 🧾

Every account of every Personae also comes as a **monthly PDF bank statement**, issued by a
fictitious "Banque Algoan", under [`statements/`](./statements):

```
statements/<locale>/<personae>/<account>_<YYYY-MM>.pdf
```

A statement carries the period it covers, the balance the account opened that period with, the
balance it closed on, every operation of the month split between debit and credit, and their totals.
Statements chain: the closing balance of a month is the opening balance of the next one, and the
last statement of an account closes on the balance held in the JSON sample.

| Command                         | What it does                                         |
| ------------------------------- | ---------------------------------------------------- |
| `npm run statements`            | Build the statements that are missing or out of date |
| `npm run statements -- --force` | Rebuild every statement, whatever the manifest says  |

### Design

The whole look of a statement lives in a single file, [`templates/statement.ts`](./templates/statement.ts):
page setup, header, balance boxes, transaction table, footer and the colour palette they all derive
from. Nothing else in the codebase draws anything, so restyling the statements means editing that
file only. The Algoan logo it inlines sits next to it, in [`templates/assets/`](./templates/assets).

### Freshness

The daily job rebuilds a statement only when its PDF is **missing**, or when it was produced during
an **earlier month** — so every statement refreshes on the first day of a month, and the other days
leave them untouched. [`statements/manifest.json`](./statements/manifest.json) records, for each
statement, the month it was produced in and the period it covers.

> ⚠️ Between two first-of-the-month runs the JSON samples keep moving forward one day at a time,
> while the PDF statements stay as they were. Expect them to drift apart within a month; they line
> up again on the 1st. Run `npm run statements -- --force` to realign them on demand.
