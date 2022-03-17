<p align="center">
  <a href="http://algoan.com/" target="blank"><img src="https://media.licdn.com/dms/image/C4E0BAQH-hIlc5g9g7w/company-logo_200_200/0?e=2159024400&v=beta&t=j5y9KO1P22GsMx3vBNawrpvyvjD2iyBWGeVPUsRkn5s" width="320" alt="Algoan Logo" /></a>
</p>

# Fake Open Banking data samples

This repository shares different open banking data samples in order to test easily [Algoan Scoring APIs](https://docs.algoan.com). Balance and transaction dates are automatically refreshed by a daily cron job.

> 💡 The story, all names, characters, credits portrayed in this fake data are fictitious. No identification with actual persons (living or deceased), credits, debts, and life style is intended or should be inferred.

## Personae

A JSON file represents what we call a "Personae": a profile with relevant credit risk indicators.
### [Harry Potter](https://raw.githubusercontent.com/algoan/fake-open-banking-data/main/samples/fr/harry_potter.json)

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

### [Lara Croft](https://raw.githubusercontent.com/algoan/fake-open-banking-data/main/samples/fr/lara_croft.json)

**Language**: French 🇫🇷

**Description**:

Good profile (Credit Score ~900/1000)

- Earns 2500€/month
- Pays a mortgage of 500€/month
- Has 4 consumer credits with two different lenders (2 with lender "A" and 2 with lender "B")
- Has done 2 split payments.
- Has no incident or fees
- Stable cash flows
