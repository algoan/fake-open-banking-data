<p align="center">
  <a href="http://algoan.com/" target="blank"><img src="https://media.licdn.com/dms/image/C4E0BAQH-hIlc5g9g7w/company-logo_200_200/0?e=2159024400&v=beta&t=j5y9KO1P22GsMx3vBNawrpvyvjD2iyBWGeVPUsRkn5s" width="320" alt="Algoan Logo" /></a>
</p>

# Fake Open Banking data samples

This repository shares different open banking data samples in order to test easily [Algoan Scoring APIs](https://docs.algoan.com). Balance and transaction dates are automatically refreshed by a daily cron job.

> 💡 The story, all names, characters, credits portrayed in this fake data are fictitious. No identification with actual persons (living or deceased), credits, debts, and life style is intended or should be inferred.

## Personae

A JSON file represents what we call a "Personae": a profile with relevant credit risk indicators.
### [Harry Cover](https://raw.githubusercontent.com/algoan/fake-open-banking-data/main/samples/fr/harry_cover.json)

**Language**: French 🇫🇷

**Description**:

Risky profile (Credit Score ~150-200/1000)

- Earns 2500€/month
- Pays a rent of 900€/month
- Has 6 consumer credits with three different lenders (3 with lender "A", 2 with lender "B" and 1 with lender "C")
- Has done 3 split payments.
- Has overdraft fees
- Has 1 payment rejection on a credit and on a subscription
- Falling cash flows

### [Lara Crochet](https://raw.githubusercontent.com/algoan/fake-open-banking-data/main/samples/fr/lara_crochet.json)

**Language**: French 🇫🇷

**Description**:

Good profile (Credit Score ~900/1000)

- Earns 2500€/month
- Pays a mortgage of 500€/month
- Has 4 consumer credits with two different lenders (2 with lender "A" and 2 with lender "B")
- Has done 2 split payments.
- Has no incident or fees
- Stable cash flows

### [Hassan Cehef](https://raw.githubusercontent.com/algoan/fake-open-banking-data/main/samples/fr/hassan_cehef.json)

**Language**: French 🇫🇷

**Description**:

Risky profile (Credit Score <100/1000)

- Has an account seizure
- Presents a high gambling over incomes ratio, frequent gambling
- Their treasury is globally decreasing
- Presents frequent overdraft and significant amount of overdraft fees
- Presence of payment incidents with significant amount
- Has 2 consumer loans

### [Otto Graf](https://raw.githubusercontent.com/algoan/fake-open-banking-data/main/samples/fr/otto_graf.json)

**Language**: French 🇫🇷

**Description**:

Good profile (Credit Score ~900/1000)

- Secondary account synchronized

### [Paul Hemique](https://raw.githubusercontent.com/algoan/fake-open-banking-data/main/samples/fr/paul_hemique.json)

**Language**: French 🇫🇷

**Description**:

Good profile (Credit Score ~900/1000)

- Couple with similar wages in the same company
- Has a mortgage and a consumer loan
- Insurances, telecom and power are debited on the account

### [Habib Oche](https://raw.githubusercontent.com/algoan/fake-open-banking-data/main/samples/fr/habib_oche.json)

**Language**: French 🇫🇷

**Description**:

Good profile (Credit Score ~900/1000)

- Earns ~2000€/month
- Pays a rent of ~600€/month
- Has a consumer loan and a split payment
- Has neither payment incidents nor fees
- Has light overdraft end of month
- Has a stable treasury
- Has standard expenses: power, telecom, transport, multimedia, gym
- Has some savings
- Has a deferred debit card

### [Emilie Corne](https://raw.githubusercontent.com/algoan/fake-open-banking-data/main/samples/fr/emilie_corne.json)

**Language**: French 🇫🇷

**Description**:

Good profile (Credit Score ~900/1000)

- Their earnings come from self-employment
- Has a rent
- Has direct debits such as power, telecom, insurance

### [Renee Sense](https://raw.githubusercontent.com/algoan/fake-open-banking-data/main/samples/fr/renee_sense.json)

**Language**: French 🇫🇷

**Description**:

Good profile (Credit Score ~900/1000)

- Is retired
- Has a reversionary pension
- Has a mortgage
- Has rental income
- Has insurances, power and telecom transactions

### [Maude Erateur](https://raw.githubusercontent.com/algoan/fake-open-banking-data/main/samples/fr/maude_erateur.json)

**Language**: French 🇫🇷

**Description**:

Fair profile (Credit Score ~500/1000)

- Student
- Receives regular transfers
- Receives allowances
- Has a rent
- Has a state subsidy
- Has a student loan
- Has overdraft periods

### [Carla Paroledor](https://raw.githubusercontent.com/algoan/fake-open-banking-data/main/samples/fr/carla_paroledor.json)

**Language**: French 🇫🇷

**Description**:

Good profile (Credit Score ~900/1000)

- Earns ~1300€/month
- Has a rent of ~400€/month
- Repays a consumer loan
- Has allowances
- Has neither incidents nor fees
- Has light overdraft at end of month
- Has standard expenses: power, telecom, transport, multimedia, gym
- Has savings
