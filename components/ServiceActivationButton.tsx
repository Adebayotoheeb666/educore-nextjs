'use client';

import { useState } from 'react';
import { useServicePayment } from '@/lib/hooks/useServicePayment';

interface ServiceActivationButtonProps {
  serviceSlug: string;
  serviceName: string;
  price?: number;
  billingPeriod?: string;
  isActive?: boolean;
  onSuccess?: (serviceSlug: string) => void;
}

/**
 * ServiceActivationButton Component
 * Handles service activation with payment flow
 * 
 * Usage:
 * <ServiceActivationButton
 *   serviceSlug="attendance"
 *   serviceName="Attendance Management"
 *   price={2500}
 *   billingPeriod="monthly"
 *   onSuccess={() => refreshServices()}
 * />
 */
export function ServiceActivationButton({
  serviceSlug,
  serviceName,
  price,
  billingPeriod = 'monthly',
  isActive = false,
  onSuccess,
}: ServiceActivationButtonProps) {
  const { subscribe, isLoading } = useServicePayment();
  const [isHovered, setIsHovered] = useState(false);

  const handleActivate = async () => {
    const result = await subscribe(serviceSlug);
    if (result && result.success && onSuccess) {
      onSuccess(serviceSlug);
    }
  };

  if (isActive) {
    return (
      <button disabled className="btn-dashboard-outline" style={{ width: '100%', fontSize: '0.9rem', padding: '0.5rem' }}>
        ✓ Active
      </button>
    );
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative' }}
    >
      <button
        onClick={handleActivate}
        disabled={isLoading}
        className="btn-dashboard-primary"
        style={{ width: '100%', fontSize: '0.9rem', padding: '0.5rem' }}
      >
        {isLoading ? (
          <>
            <span style={{ display: 'inline-block', marginRight: '0.5rem', animation: 'spin 1s linear infinite' }}>
              ⟳
            </span>
            Processing...
          </>
        ) : price ? (
          `Activate (₦${price.toLocaleString()})/${billingPeriod}`
        ) : (
          'Activate'
        )}
      </button>

      {isHovered && price && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          right: 0,
          marginBottom: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#1f2937',
          color: 'white',
          fontSize: '0.75rem',
          borderRadius: '0.375rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          whiteSpace: 'nowrap',
          zIndex: 10,
        }}>
          Click to activate {serviceName}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
