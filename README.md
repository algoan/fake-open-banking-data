<p align="center">
  <a href="http://algoan.com/" target="blank"><img src="https://media.licdn.com/dms/image/C4E0BAQH-hIlc5g9g7w/company-logo_200_200/0?e=2159024400&v=beta&t=j5y9KO1P22GsMx3vBNawrpvyvjD2iyBWGeVPUsRkn5s" width="320" alt="Algoan Logo" /></a>
</p>

# Fake Open Banking data samples

This repository shares different open banking data samples in order to test easily [Algoan Scoring APIs](https://docs.algoan.com). Balance and transaction dates are automatically refreshed by a daily cron job.

> 💡 The Open Banking data shared in the `samples/` directory is totally fake. Any resemblance to real and actual names is purely coincidental.

## Personae

A JSON file represents what we call a "Personae": a profile with relevant credit risk indicators.
### [Julie Verdeau](https://raw.githubusercontent.com/algoan/fake-open-banking-data/main/samples/fr/julie_verdeau.json)

**Language**: French 🇫🇷

**Description**:

Risky profile (Credit Score ~150-200/1000)

  - Earns 2500€/month
  - Pays a rent of 500€/month
  - Has 6 consumer credits with three different lenders (3 with lender "A", 2 with lender "B" and 1 with lender "C")
  - Has done 3 fractioned payments.
  - Has overdraft fees
  - Has 1 payment rejection on a credit and on a subscription
  - Falling cash flows

### [Maxime Vert](https://raw.githubusercontent.com/algoan/fake-open-banking-data/main/samples/fr/maxime_vert.json)


**Language**: French 🇫🇷

**Description**:

Good profile (Credit Score ~900/1000)

  - Earns 2500€/month
  - Pays a mortgage of 500€/month
  - Has 4 consumer credits with two different lenders (2 with lender "A" and 2 with lender "B")
  - Has done 2 fractioned payments.
  - Has no incident or fees
  - Stable cash flows
