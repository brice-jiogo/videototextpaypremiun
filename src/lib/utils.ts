import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Premium status utilities
export function isPremiumActive(premiumStatus: string | null | undefined, premiumEndDate: any): boolean {
  if (!premiumStatus || premiumStatus === 'FREE') return false;
  if (premiumStatus === 'PREMIUM' || premiumStatus === 'PREMIUM_TRIAL') {
    if (!premiumEndDate) return true; // Lifetime
    const endDate = premiumEndDate.toDate?.() || new Date(premiumEndDate);
    return endDate > new Date();
  }
  return false;
}

export function getDaysRemainingInTrial(premiumStatus: string | null | undefined, premiumStartDate: any, premiumEndDate: any): number {
  if (premiumStatus !== 'PREMIUM_TRIAL') return 0;
  if (!premiumEndDate) return 0;
  
  const startDate = premiumStartDate?.toDate?.() || new Date(premiumStartDate);
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const now = new Date();
  const trialStartPlusSeven = new Date(start);
  trialStartPlusSeven.setDate(trialStartPlusSeven.getDate() + 7);
  
  if (now > trialStartPlusSeven) return 0;
  const daysRemaining = Math.ceil((trialStartPlusSeven.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysRemaining);
}

export function getDaysRemainingInSubscription(premiumEndDate: any): number {
  if (!premiumEndDate) return 0;
  const endDate = premiumEndDate.toDate?.() || new Date(premiumEndDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  const now = new Date();
  
  if (now > end) return 0;
  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysRemaining);
}

export function formatDate(date: any): string {
  if (!date) return 'N/A';
  const d = date.toDate?.() || new Date(date);
  return d instanceof Date ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Check if premium trial has expired
export function hasTrialExpired(premiumStatus: string | null | undefined, premiumStartDate: any): boolean {
  if (premiumStatus !== 'PREMIUM_TRIAL') return false;
  if (!premiumStartDate) return false;
  
  const start = premiumStartDate.toDate?.() || new Date(premiumStartDate);
  const startDate = start instanceof Date ? start : new Date(start);
  const now = new Date();
  const trialExpire = new Date(startDate);
  trialExpire.setDate(trialExpire.getDate() + 7);
  
  return now > trialExpire;
}

// Check if premium subscription has expired
export function hasSubscriptionExpired(premiumEndDate: any): boolean {
  if (!premiumEndDate) return false;
  const endDate = premiumEndDate.toDate?.() || new Date(premiumEndDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  return new Date() > end;
}

// Calculate what the premium status should be based on dates
export function calculateCorrectPremiumStatus(premiumStatus: string | null | undefined, premiumStartDate: any, premiumEndDate: any): string {
  if (!premiumStatus || premiumStatus === 'FREE') return 'FREE';
  
  if (premiumStatus === 'PREMIUM_TRIAL') {
    if (hasTrialExpired(premiumStatus, premiumStartDate)) {
      // Trial has expired, but subscription might still be active
      if (!hasSubscriptionExpired(premiumEndDate)) {
        return 'PREMIUM'; // Auto-promote to PREMIUM
      }
      return 'FREE'; // Trial expired and no active subscription
    }
    return 'PREMIUM_TRIAL';
  }
  
  if (premiumStatus === 'PREMIUM') {
    if (!premiumEndDate) return 'PREMIUM'; // Lifetime
    if (hasSubscriptionExpired(premiumEndDate)) {
      return 'FREE'; // Subscription expired
    }
    return 'PREMIUM';
  }
  
  return 'FREE';
}

// Check premium status and return corrected status with all relevant data
export function checkPremiumStatus(userData: any): {
  status: string;
  isPremiumActive: boolean;
  premiumExpiresAt: any;
  daysRemainingInTrial: number;
  daysRemainingInSubscription: number;
} {
  const premiumStatus = userData?.premiumStatus || 'FREE';
  const premiumStartDate = userData?.premiumStartDate;
  const premiumEndDate = userData?.premiumEndDate;
  
  const correctedStatus = calculateCorrectPremiumStatus(premiumStatus, premiumStartDate, premiumEndDate);
  const isActive = isPremiumActive(correctedStatus, premiumEndDate);
  
  return {
    status: correctedStatus,
    isPremiumActive: isActive,
    premiumExpiresAt: premiumEndDate,
    daysRemainingInTrial: getDaysRemainingInTrial(correctedStatus, premiumStartDate, premiumEndDate),
    daysRemainingInSubscription: getDaysRemainingInSubscription(premiumEndDate)
  };
}
