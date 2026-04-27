// ParamList types for every navigator.
// Static-data prototype — most routes pass an optional `id` for detail screens
// and look the entity up in `@/mock/*`.

export type AuthParamList = {
  SignIn: undefined;
  CreateAccount: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  BiometricUnlock: undefined;
};

export type HomeParamList = {
  Dashboard: undefined;
  CardExpanded: { cardId: string };
  SleepExpanded: undefined;
  GlucoseExpanded: undefined;
  StepsExpanded: undefined;
  Notifications: undefined;
  AccountSetup: undefined;
};

export type RecordsParamList = {
  RecordsList: undefined;
  RecordDetailLabs: { recordId: string };
  RecordDetailImaging: { recordId: string };
  RecordDetailNotes: { recordId: string };
  UploadSheet: undefined;
  FilterSheet: undefined;
  DocumentViewer: { recordId: string };
};

export type ReleasesParamList = {
  ReleasesList: undefined;
  WizardStep1: undefined;
  WizardStep2: undefined;
  WizardStep3: undefined;
  WizardStep4: undefined;
  WizardStep5: undefined;
  ActiveDetail: { releaseId: string };
  PendingDetail: { releaseId: string };
  FaxDialog: undefined;
  DateFilterSheet: undefined;
  ExportPDF: { releaseId: string };
};

export type ProvidersParamList = {
  MyProviders: undefined;
  AddProvider: undefined;
  ProviderDetail: { providerId: string };
};

export type ProfileParamList = {
  Profile: undefined;
  ConnectAppleHealth: undefined;
  AccountSettings: undefined;
  EditProfile: undefined;
  DesignatedAgents: undefined;
  InviteRepresentative: undefined;
  RepresentativeDetail: { agentId: string };
};

export type TabsParamList = {
  HomeTab: undefined;
  RecordsTab: undefined;
  ReleasesTab: undefined;
  ProvidersTab: undefined;
  ProfileTab: undefined;
};

// PDA flow

export type PdaHomeParamList = {
  PdaHome: undefined;
};

export type PdaRecordsParamList = {
  PdaRecords: undefined;
  PdaRecordDetail: { recordId: string };
};

export type PdaProvidersParamList = {
  PdaProviders: undefined;
  PdaAddProvider: undefined;
  PdaProviderDetail: { providerId: string };
};

export type PdaReleasesParamList = {
  PdaReleases: undefined;
  PdaReleaseDetail: { releaseId: string };
  PdaWizardStep1: undefined;
  PdaWizardStep2: undefined;
  PdaWizardStep3: undefined;
  PdaWizardStep4: undefined;
};

export type PdaProfileParamList = {
  PdaProfile: undefined;
  PdaEditProfile: undefined;
  PdaPeopleIRepresent: undefined;
  RoleSwitcher: undefined;
  PdaInvite: undefined;
};

export type PdaTabsParamList = {
  PdaHomeTab: undefined;
  PdaRecordsTab: undefined;
  PdaProvidersTab: undefined;
  PdaReleasesTab: undefined;
  PdaProfileTab: undefined;
};
