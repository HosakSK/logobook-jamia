export const STORAGE_LIMITS: Record<string, number> = {
  FREE: 500, // 500 MB
  COMPANY: 1000, // 1 000 MB (1 GB)
  FREELANCER: 2500, // 2 500 MB (2.5 GB)
  AGENCY: 10000, // 10 000 MB (10 GB)
  PLATINUM: 999999, // Unlimited
};

export interface UsageStats {
  tier: string;
  brandsUsed: number;
  brandsMax: number;
  storageUsedMb: number;
  storageMaxMb: number;
}

export interface PricingPlan {
  id: "FREE" | "COMPANY" | "FREELANCER" | "AGENCY" | "PLATINUM";
  name: string;
  priceMonthly: number;
  priceYearly: number; // total per year
  priceYearlyPerMonth: number; // discounted monthly equivalent
  maxBrands: number;
  storageMb: number;
  teamSeats: number;
  popular?: boolean;
  features: {
    customDomain: boolean;
    passwordProtect: boolean;
    watermark: "visible" | "custom" | "hidden";
    agencyDefaults: boolean;
    figmaTokens: boolean;
    offlineZip: boolean;
  };
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "FREE",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    priceYearlyPerMonth: 0,
    maxBrands: 1,
    storageMb: 500,
    teamSeats: 1,
    features: {
      customDomain: false,
      passwordProtect: false,
      watermark: "visible",
      agencyDefaults: false,
      figmaTokens: false,
      offlineZip: false,
    },
  },
  {
    id: "COMPANY",
    name: "Company",
    priceMonthly: 9,
    priceYearly: 89,
    priceYearlyPerMonth: 7.4,
    maxBrands: 3,
    storageMb: 1000,
    teamSeats: 3,
    features: {
      customDomain: true,
      passwordProtect: true,
      watermark: "visible",
      agencyDefaults: false,
      figmaTokens: false,
      offlineZip: true,
    },
  },
  {
    id: "FREELANCER",
    name: "Freelancer",
    priceMonthly: 19,
    priceYearly: 189,
    priceYearlyPerMonth: 15.75,
    maxBrands: 8,
    storageMb: 2500,
    teamSeats: 3,
    popular: true,
    features: {
      customDomain: true,
      passwordProtect: true,
      watermark: "visible",
      agencyDefaults: false,
      figmaTokens: false,
      offlineZip: true,
    },
  },
  {
    id: "AGENCY",
    name: "Agency",
    priceMonthly: 49,
    priceYearly: 489,
    priceYearlyPerMonth: 40.75,
    maxBrands: 30,
    storageMb: 10000,
    teamSeats: 10,
    features: {
      customDomain: true,
      passwordProtect: true,
      watermark: "custom",
      agencyDefaults: true,
      figmaTokens: true,
      offlineZip: true,
    },
  },
  {
    id: "PLATINUM",
    name: "Platinum",
    priceMonthly: 99,
    priceYearly: 989,
    priceYearlyPerMonth: 82.4,
    maxBrands: 999999,
    storageMb: 999999,
    teamSeats: 999999,
    features: {
      customDomain: true,
      passwordProtect: true,
      watermark: "custom",
      agencyDefaults: true,
      figmaTokens: true,
      offlineZip: true,
    },
  },
];
