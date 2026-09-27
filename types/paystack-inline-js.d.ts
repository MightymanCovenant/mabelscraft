declare module "@paystack/inline-js" {
  interface CheckoutOptions {
    key: string;
    email: string;
    amount: number;
    currency?: string;
    reference?: string;
    onSuccess?: (transaction: unknown) => void;
    onLoad?: (response: unknown) => void;
    onCancel?: () => void;
    onError?: (error: { message: string }) => void;
  }
  export default class PaystackPop {
    checkout(options: CheckoutOptions): void;
    newTransaction(options: CheckoutOptions): void;
    resumeTransaction(accessCode: string): void;
  }
}
