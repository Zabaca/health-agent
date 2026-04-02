import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      type: 'admin' | 'user';
      isAgent: boolean;
      isPda: boolean;
      isPatient: boolean;
      mustChangePassword: boolean;
      onboarded?: boolean;
      disabled: boolean;
    };
  }
}
