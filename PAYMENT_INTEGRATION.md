# Service Payment Integration with Paystack

## Overview

This implementation enables schools to activate paid services through Paystack payment gateway. When a school wants to activate a paid service, they are redirected to Paystack for payment. After successful payment, the service is automatically activated.

## Flow Diagram

```
1. School clicks "Add Module" for a paid service
   ↓
2. Frontend calls POST /api/services/subscribe
   ↓
3. Backend validates dependencies and returns payment requirement
   ↓
4. If requires payment: Frontend initializes payment
   ↓
5. Frontend calls POST /api/services/initialize-payment
   ↓
6. Backend creates Paystack transaction, returns authorization_url
   ↓
7. Frontend redirects to Paystack payment page (authorization_url)
   ↓
8. User completes payment on Paystack
   ↓
9. Paystack redirects back to callback_url (/services?ref=SVC-...&status=success)
   ↓
10. Frontend verifies payment via GET /api/services/verify-payment?reference=SVC-...
    ↓
11. Backend confirms payment, activates service, records in billing_history
    ↓
12. Service is now available for the school
```

## API Endpoints

### 1. POST /api/services/subscribe
**Initiates service subscription**

Request:
```json
{
  "slug": "attendance"
}
```

Response (Free Service):
```json
{
  "message": "Service 'attendance' activated successfully",
  "requiresPayment": false,
  "activated": true
}
```

Response (Paid Service):
```json
{
  "message": "Service 'attendance' requires payment",
  "requiresPayment": true,
  "activated": false,
  "serviceSlug": "attendance",
  "serviceName": "Attendance Management",
  "price": 2500,
  "billingPeriod": "monthly",
  "paymentEndpoint": "/api/services/initialize-payment"
}
```

### 2. POST /api/services/initialize-payment
**Initializes Paystack payment for service**

Request:
```json
{
  "serviceSlug": "attendance",
  "callbackUrl": "https://app.educore.ng/services" // optional
}
```

Response:
```json
{
  "authorizationUrl": "https://checkout.paystack.com/...",
  "accessCode": "...",
  "reference": "SVC-ABC123XYZ",
  "amount": 2500,
  "serviceName": "Attendance Management",
  "schoolName": "My School"
}
```

### 3. GET /api/services/verify-payment?reference=SVC-...
**Verifies payment and activates service**

Query Parameters:
- `reference`: Payment reference from Paystack

Response (Success):
```json
{
  "verified": true,
  "status": "success",
  "reference": "SVC-ABC123XYZ",
  "amount": 2500,
  "channel": "card",
  "serviceSlug": "attendance",
  "alreadyRecorded": false
}
```

Response (Already Processed):
```json
{
  "verified": true,
  "status": "success",
  "reference": "SVC-ABC123XYZ",
  "amount": 2500,
  "channel": "card",
  "serviceSlug": "attendance",
  "alreadyRecorded": true
}
```

### 4. POST /api/services/webhook/paystack
**Webhook endpoint for Paystack notifications**

Paystack sends:
```
POST /api/services/webhook/paystack
Headers: {
  "x-paystack-signature": "<HMAC-SHA512 signature>"
}
Body: {
  "event": "charge.success",
  "data": {
    "reference": "SVC-ABC123XYZ",
    "amount": 250000, // in kobo
    "status": "success",
    "metadata": {
      "school_id": "sch_...",
      "service_id": "svc_...",
      "service_slug": "attendance",
      "service_name": "Attendance Management"
    },
    "paid_at": "2025-01-15T10:30:00.000Z",
    "channel": "card"
  }
}
```

## Database Schema Changes

No new tables required. Existing tables are used:

### school_services
- Stores active/inactive services for each school
- `price_paid`: Amount paid for the service subscription
- `status`: 'active', 'inactive', 'suspended', 'trial'

### billing_history
- Records all payments (both fees and services)
- `reference`: Paystack transaction reference
- `status`: 'pending', 'paid', 'failed', 'refunded'
- `service_id`: Links to the service

## Frontend Implementation

### 1. Using the Hook

```typescript
import { useServicePayment } from '@/lib/hooks/useServicePayment';

function MyComponent() {
  const { subscribe, verifyPayment, isLoading } = useServicePayment();

  const handleSubscribe = async () => {
    const result = await subscribe('attendance');
    if (result.success) {
      // Service activated or payment initiated
    }
  };

  return <button onClick={handleSubscribe}>Activate Service</button>;
}
```

### 2. Using the Service Activation Button

```typescript
import { ServiceActivationButton } from '@/components/ServiceActivationButton';

function ServiceCard() {
  return (
    <ServiceActivationButton
      serviceSlug="attendance"
      serviceName="Attendance Management"
      price={2500}
      billingPeriod="monthly"
      isActive={false}
      onSuccess={(slug) => refreshServices()}
    />
  );
}
```

### 3. Automatic Payment Verification

The ServicesClient component automatically verifies payments when the URL contains `reference` and `status=success` parameters:

```
https://app.educore.ng/services?reference=SVC-ABC123XYZ&status=success
```

## Configuration

### Environment Variables

```env
# Existing variables (for fee payments)
PAYSTACK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_public_key

# Optional: Customize callback URL
NEXT_PUBLIC_APP_URL=https://app.educore.ng
```

### Paystack Dashboard Setup

1. Go to Dashboard → Settings → API Keys & Webhooks
2. Add webhook URL: `https://app.educore.ng/api/services/webhook/paystack`
3. Subscribe to: `charge.success` event

## Important Security Notes

1. **HMAC Verification**: All webhook requests are verified using HMAC-SHA512 signature
2. **School ID Validation**: Payment verification checks that `school_id` in metadata matches the authenticated school
3. **Idempotency**: Payment processing is idempotent - duplicate webhook calls won't double-charge
4. **Authentication**: All payment endpoints require authentication (school_owner, principal, or super_admin)

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Unknown service" | Service slug doesn't exist | Check service catalog |
| "missing required services" | Dependencies not met | Activate required services first |
| "already active" | Service already subscribed | User already has service |
| "free and doesn't require payment" | Service price is 0 | Don't call payment endpoint |
| "Payment verification failed" | Invalid reference or wrong school | Check reference is correct |

## Testing

### Local Testing

1. Use Paystack test keys (not live keys)
2. Use test card: 4084084084084081 (Verve, success)
3. Any future date for expiry
4. Any 3-digit CVC

### Webhook Testing

Use Paystack's webhook testing in dashboard or ngrok for local testing:

```bash
# In another terminal
ngrok http 3000

# Then use ngrok URL in Paystack dashboard
https://your-ngrok-url.ngrok.io/api/services/webhook/paystack
```

## Troubleshooting

### Service doesn't activate after payment

1. Check `billing_history` table - is payment recorded?
2. Check `school_services` table - is record updated?
3. Review API logs for errors
4. Verify webhook is being called by Paystack

### Payment verification fails

1. Ensure `reference` parameter is correct
2. Check network tab - is verify-payment endpoint called?
3. Verify school_id matches in metadata
4. Check browser console for JavaScript errors

### Webhook not processing

1. Check Paystack dashboard - is webhook being sent?
2. Verify HMAC signature in logs
3. Ensure `PAYSTACK_SECRET_KEY` is correct
4. Check that webhook URL is publicly accessible

## Future Enhancements

1. **Recurring Billing**: Auto-charge at end of billing period
2. **Service Tiers**: Different pricing tiers for services
3. **Bulk Discounts**: Price breaks for multiple services
4. **Trial Periods**: Free trial before charging
5. **Payment Plans**: Split payments over multiple months
6. **Cancellation**: Handle service cancellation and refunds

## Code Examples

### Full Service Activation Flow

```typescript
// 1. Click button in UI
function ServiceCard({ service }) {
  const { subscribe } = useServicePayment();

  return (
    <button onClick={() => subscribe(service.slug)}>
      Activate {service.name}
    </button>
  );
}

// 2. subscribe() calls /api/services/subscribe
// 3. If paid, calls /api/services/initialize-payment
// 4. The app opens the returned Paystack checkout URL using the Capacitor Browser plugin or a browser fallback
// 5. After payment, user returns to /services?ref=SVC-...&status=success
// 6. ServicesClient verifies payment
// 7. Service is activated in school_services
```

### Manual Payment Initialization

```typescript
async function initializeServicePayment(serviceSlug: string) {
  const response = await fetch('/api/services/initialize-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceSlug }),
  });

  const { authorizationUrl } = await response.json();

  if (typeof window !== 'undefined') {
    window.location.href = authorizationUrl; // Redirect to Paystack in web
  }
}
```

### Mobile / Capacitor Payment Guidance

For mobile builds inside Capacitor, avoid direct browser redirects via `window.location.href`.
Use the shared `openExternal(url)` helper from `lib/utils/openExternal.ts`, which opens external URLs through Capacitor Browser when available and falls back to a normal browser tab.

- Prefer `openExternal(authorizationUrl)` for Paystack checkout links.
- For WebView builds, use system browser or Capacitor Browser so the payment session can complete reliably.
- If the Capacitor Browser plugin is unavailable, display the URL and let the user open it externally.

## References

- [Paystack API Documentation](https://paystack.com/docs/api/)
- [EduCore Service Catalog](config/services/catalog.ts)
- [Database Schema](lib/db/schema.sql)
