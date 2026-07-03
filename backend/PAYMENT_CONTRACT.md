# Lumo Payment/Nomba API Contract

The Go backend is the only service that calls Nomba. Frontend, AI tooling, and workers should call these Lumo endpoints instead of calling Nomba directly.

## Auth And User Context

Protected routes currently accept the existing backend auth middleware. During hackathon development, requests may also pass:

```http
X-User-Id: 00000000-0000-0000-0000-000000000001
```

If no user is available, the backend uses the seeded demo user from `002_payment_service.sql`.

## Nomba Credential Model

The backend authenticates to Nomba using:

```env
NOMBA_BASE_URL=https://sandbox.nomba.com
NOMBA_PARENT_ACCOUNT_ID=
NOMBA_SUB_ACCOUNT_ID=
NOMBA_CLIENT_ID=
NOMBA_CLIENT_SECRET=
```

Rules:

- `NOMBA_PARENT_ACCOUNT_ID` goes in the Nomba `accountId` header.
- `NOMBA_SUB_ACCOUNT_ID` goes in sub-account scoped endpoint paths.
- Nomba access tokens never leave the backend.
- Use test credentials for the hackathon.

## Response Envelope

Success:

```json
{
  "success": true,
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  }
}
```

## Transaction Statuses

```txt
pending_confirmation
confirmed
processing
success
failed
refunded
reversed
cancelled
```

Only these are final:

```txt
success
failed
refunded
reversed
cancelled
```

## Endpoints

Base path:

```txt
/api/v1
```

### Banks

```txt
GET /api/v1/payments/banks
```

Response:

```json
{
  "success": true,
  "data": {
    "banks": [
      {
        "name": "Guaranty Trust Bank",
        "code": "058",
        "logo": ""
      }
    ]
  }
}
```

### Verify Recipient

```txt
POST /api/v1/payments/recipients/verify
```

Request:

```json
{
  "accountNumber": "0554772814",
  "bankCode": "053"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "accountNumber": "0554772814",
    "accountName": "M.A Animashaun",
    "bankCode": "053"
  }
}
```

### Create Draft

```txt
POST /api/v1/transactions/draft
```

Bank transfer:

```json
{
  "type": "bank_transfer",
  "amount": 1000,
  "accountNumber": "0554772814",
  "bankCode": "053",
  "narration": "Lumo transfer"
}
```

Airtime:

```json
{
  "type": "airtime",
  "amount": 50,
  "phoneNumber": "08012345678",
  "network": "MTN"
}
```

Data:

```json
{
  "type": "data",
  "amount": 200,
  "phoneNumber": "08012345678",
  "network": "MTN"
}
```

Electricity:

```json
{
  "type": "electricity",
  "amount": 2000,
  "disco": "phcn",
  "customerId": "1234567890",
  "meterType": "PREPAID",
  "payerName": "John Doe"
}
```

### Confirm Transaction

```txt
POST /api/v1/transactions/:id/confirm
```

Request:

```json
{
  "pin": "1234"
}
```

### Execute Transaction

```txt
POST /api/v1/transactions/:id/execute
```

No request body.

### Get Transaction

```txt
GET /api/v1/transactions/:id
```

### List Transactions

```txt
GET /api/v1/transactions
```

### Data Plans

```txt
GET /api/v1/payments/data/plans?network=MTN
```

### Electricity Providers

```txt
GET /api/v1/payments/electricity/providers
```

### Nomba Webhook

```txt
POST /webhooks/nomba
```

This endpoint is for Nomba only. The backend stores the raw payload, matches transactions by `merchantTxRef`, provider transaction ID, or session ID, and updates status idempotently.

## Role Assumptions

### AI/Backend Lead

- AI can create drafts and fetch statuses.
- AI must not confirm or execute transactions.
- Real PIN/OTP verification can later replace the temporary PIN length check.

### Frontend Lead

- Show preview before confirmation.
- Treat `processing` as non-final.
- Poll `GET /api/v1/transactions/:id` after execution until a final status is returned.

### Payment Lead

- All Nomba calls use sandbox credentials.
- Live credentials are not used in hackathon development.
- Webhook URL to submit to Nomba is `https://<backend-domain>/webhooks/nomba`.
