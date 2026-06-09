import type { Page } from '@playwright/test';

export type Offer = '2_days' | '1_month' | '1_year';
export type PaymentMethod = 'card_ru' | 'stripe' | 'crypto';

export interface OfferLandingPage {
  goto(): Promise<void>;
  selectOffer(offer: Offer): Promise<void>;
  fillEmail(email: string): Promise<void>;
  submit(): Promise<void>;
}

export interface PaymentStep {
  choosePaymentMethod(method: PaymentMethod): Promise<void>;
  acceptTerms(): Promise<void>;
  submit(): Promise<void>;
}

export interface PurchaseRequest {
  page: Page;
  landing: OfferLandingPage;
  payment: PaymentStep;
  offer: Offer;
  method: PaymentMethod;
  email: string;
}

export async function purchaseVpn(request: PurchaseRequest): Promise<void> {
  const { page, landing, payment, offer, method, email } = request;
  await landing.goto();
  await landing.selectOffer(offer);
  await landing.fillEmail(email);
  await landing.submit();
  await page.waitForURL(/\/payment\//);
  await payment.choosePaymentMethod(method);
  await payment.acceptTerms();
  await payment.submit();
}
