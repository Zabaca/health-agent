import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      type: 'patient' | 'agent' | 'admin' | 'patient_designated_agent';
      mustChangePassword: boolean;
      onboarded?: boolean;
    };
  }
}
