// services/useServicePayment.ts
// Frontend hook to handle service payment flow

import { useState } from 'react';
import { toast } from 'sonner';

interface PaymentResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  amount: number;
  serviceName: string;
  schoolName: string;
}

interface SubscribeResponse {
  requiresPayment: boolean;
  activated: boolean;
  serviceSlug: string;
  serviceName: string;
  price: number;
  billingPeriod: string;
  paymentEndpoint: string;
  message: string;
}

interface SubscribeResult {
  success: boolean;
  activated?: boolean;
  requiresPayment?: boolean;
  payment?: PaymentResponse;
  error?: string;
}

interface VerifyResult {
  success: boolean;
  verified?: boolean;
  serviceSlug?: string;
  error?: string;
}

export function useServicePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);

  /**
   * Subscribe to a service. If the service requires payment, initiates the payment flow.
   */
  const subscribe = async (serviceSlug: string): Promise<SubscribeResult> => {
    try {
      setIsLoading(true);

      // Step 1: Call subscribe endpoint to validate and check if payment is needed
      const subscribeRes = await fetch('/api/services/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: serviceSlug }),
      });

      if (!subscribeRes.ok) {
        const error = await subscribeRes.json();
        throw new Error(error.message || 'Failed to subscribe to service');
      }

      const subscribeData: SubscribeResponse = await subscribeRes.json();

      // Service is free or already activated
      if (!subscribeData.requiresPayment && subscribeData.activated) {
        toast.success(`${subscribeData.serviceName} activated successfully!`);
        return { success: true, activated: true };
      }

      // Service requires payment - initialize payment
      if (subscribeData.requiresPayment) {
        const paymentRes = await fetch('/api/services/initialize-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceSlug }),
        });

        if (!paymentRes.ok) {
          const error = await paymentRes.json();
          throw new Error(error.message || 'Failed to initialize payment');
        }

        const payment: PaymentResponse = await paymentRes.json();
        setPaymentData(payment);

        // Redirect to Paystack payment page
        if (typeof window !== "undefined" && window.location) {
          window.location.href = payment.authorizationUrl;
        } else {
          toast.info(`Open this payment link in your browser: ${payment.authorizationUrl}`);
        }
        return { success: true, requiresPayment: true, payment };
      }

      return { success: false, error: 'Unexpected response from server' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify payment after user returns from Paystack
   * Call this on a callback page (e.g., /services?ref=SVC-...&status=success)
   */
  const verifyPayment = async (reference: string): Promise<VerifyResult> => {
    try {
      setIsLoading(true);

      const verifyRes = await fetch(`/api/services/verify-payment?reference=${reference}`);

      if (!verifyRes.ok) {
        const error = await verifyRes.json();
        throw new Error(error.message || 'Failed to verify payment');
      }

      const result = await verifyRes.json();

      if (result.verified && result.status === 'success') {
        toast.success(`Service activated successfully! Payment confirmed.`);
        return { success: true, verified: true, serviceSlug: result.serviceSlug };
      } else {
        throw new Error(`Payment verification failed: ${result.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      toast.error(message);
      return { success: false, verified: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscribe,
    verifyPayment,
    isLoading,
    paymentData,
  };
}
