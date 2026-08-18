# Creating a virtual account from the admin panel

> Base URL `https://gorro.online` · Swagger `/docs` · all routes need
> `Authorization: Bearer <token>`

---

## What a virtual account is

The bank account number a customer funds their wallet with. Money sent to it
lands in their Gorro wallet. No account number, no way to add money — the
customer is stuck.

## How it normally happens

**Automatically, when the customer completes KYC Tier 1.** Nobody presses
anything. Provider is Fincra.

This screen is for when that failed — a provider outage, a QoreID timeout, KYC
data corrected afterwards. The customer is sitting there with no account
number and support needs to give them one.

**Today 607 active customers have no virtual account.** Most of them simply
haven't done KYC yet (see *Who can actually be provisioned* below).

---

## The flow

### Step 1 — load the providers

```
GET /admin/users/virtual-account-providers          MODERATOR / SUPER_ADMIN
```

```json
{
  "default": "fincra",
  "providers": [
    { "value": "fincra", "label": "Fincra", "isDefault": true, "accountsIssued": 882,
      "banks": [ { "name": "Guaranty Trust Bank", "accounts": 667 },
                 { "name": "GLOBUS BANK", "accounts": 204 } ] },
    { "value": "flutterwave", "label": "Flutterwave", "isDefault": false, "accountsIssued": 390,
      "banks": [ { "name": "Flutterwave MFB (Formerly OK MFB)", "accounts": 389 } ] }
  ]
}
```

**Build the dropdown from this, not from Swagger's enum.** The enum lists four
providers; only these two work. The other two return *"Account provider not
supported"*.

Preselect the one with `isDefault: true`.

`banks` is worth showing — the customer sees a bank name and account number,
not a provider, so that is the real choice. It varies per account, listed
busiest first.

### Step 2 — create it

```
POST /admin/users/{userId}/virtual-account          MODERATOR / SUPER_ADMIN
```

```json
{ "provider": "fincra" }
```

`provider` is **optional** — omit it and you get Fincra, the same one KYC uses.

```json
{
  "success": true,
  "message": "Virtual account created successfully",
  "data": {
    "ownerId": "uuid",
    "internalAccountNumber": "8123456789",
    "nuban": {
      "accountNumber": "9901234567",
      "accountName": "ADA OBI",
      "bankName": "Guaranty Trust Bank",
      "bankCode": "035"
    }
  }
}
```

Show `nuban.accountNumber` and `nuban.bankName` — that is what support reads
back to the customer.

**Safe to press twice.** If the customer already has an account with that
provider, the existing details are returned. It does not create a second one.

---

## What the customer needs before this works

| Requirement | Error if missing |
|---|---|
| Exists | `User not found` |
| Phone number | `User phone number is required` |
| NIN **or** BVN | `User NIN or BVN is required` |

### The trap

The check says "NIN **or** BVN", but **Fincra needs the BVN specifically.** A
customer with only a NIN passes validation and then fails at the provider with
a much less helpful error.

Of the 607 customers with no account:

| | Count | What happens |
|---|---|---|
| BVN + date of birth | **67** | ✅ works |
| BVN, no date of birth | 5 | ❌ fails at Fincra — DOB is in the payload |
| NIN only, no BVN | 7 | ❌ fails at Fincra — it wants the BVN |
| Neither NIN nor BVN | 528 | ❌ rejected up front — they have not done KYC |

So roughly **67 customers can be helped by this screen today.** The other 540
need their KYC finished first, not an account number issued.

**Worth doing in the UI:** if the customer record shows no BVN, say so on the
button rather than letting support press it and read out a provider error.

---

## Not the same thing: regenerate

```
POST /admin/users/{userId}/regenerate-virtual-account      SUPER_ADMIN
{ "provider": "flutterwave" }
```

**Replaces** the details on an account that already exists, and 404s if there
isn't one. Use it when an account number is wrong or has to be reissued — not
to give someone their first one.

| | Use |
|---|---|
| Customer has **no** account | `POST .../virtual-account` |
| Customer's account is **wrong** | `POST .../regenerate-virtual-account` |

---

## Suggested screen

On the customer detail page, where the account number would normally show:

```
Funding account
  ⚠ No virtual account

  Provider  [ Fincra  ▾ ]        ← from step 1, default preselected
  [ Create account ]

  ⚠ This customer has no BVN on file — creation will fail.
    Complete their KYC first.      ← only when BVN is missing
```

After success, replace the block with the account number, bank and a copy
button.

Errors come back as a plain `message` — show it as-is; they are written to be
read by a person.
