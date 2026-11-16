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
- [Portugal 🇵🇹](./samples/pt-pt/): Portuguese Personae (accounts and transaction's description are written in European Portuguese pt-PT)
- [Brazil 🇧🇷](./samples/pt-br/): Brazilian Personae (accounts and transaction's description are written in Brazilian Portuguese pt-BR)

## Bank statements 🧾

Every account of every Personae also comes as a **monthly PDF bank statement**, issued by a
fictitious Algoan bank. The statements are rebuilt from the samples on every run of the refresh
workflow and published as assets of the
[`statements-latest` release](https://github.com/algoan/fake-open-banking-data/releases/tag/statements-latest).
They are not committed to the repository.

Each file is named after the locale, the Personae, the account and the month it covers:

```
<locale>_<personae>_<account>_<YYYY-MM>.pdf
```

For example `fr_hermione_granger_compte-courant-01_2026-09.pdf`.

A statement carries the period it covers, the balance the account opened that period with, the
balance it closed on, every operation of the month split between debit and credit, and their totals.
Statements chain: the closing balance of a month is the opening balance of the next one.

- Only complete months get a statement: a month the account history does not cover from its first to
  its last day, such as the current one, is left out.
- Transactions dated after the balance the sample states are left out: that balance is the reference
  the statements are rebuilt from. This is why the card accounts of the samples, whose transactions
  all come after their balance date, get a statement with no operation.
- An account no complete month can be drawn from gets a single statement for the last complete
  month, carrying its balance and no operation, as long as that month holds no transaction.

Each statement is written in the language of its locale, and amounts and dates follow that
country's conventions. The wording lives in [`templates/locales.ts`](./templates/locales.ts).

To build them locally, in a `statements/` directory:

```
npm run statements
```
