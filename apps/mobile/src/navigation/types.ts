// ParamList types for every navigator.
// Static-data prototype — most routes pass an optional `id` for detail screens
// and look the entity up in `@/mock/*`.

export type AuthParamList = {
  SignIn: undefined;
  CreateAccount: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

// When a screen is launched from the Account Setup checklist, it carries a
// `returnTo` param so its completion handler knows to navigate back to the
// checklist (or Home) instead of doing its normal in-tab goBack().
export type SetupReturnTo = "AccountSetup" | "Home";

export type HomeParamList = {
  Dashboard: undefined;
  CardExpanded: { cardId: string };
  SleepExpanded: undefined;
  Spo2Expanded: undefined;
  StepsExpanded: undefined;
  Notifications: undefined;
  AccountSetup: undefined;
};

export type RecordsFilters = {
  /** ISO yyyy-mm-dd; null = no lower bound. */
  dateFrom: string | null;
  /** ISO yyyy-mm-dd; null = no upper bound. */
  dateTo: string | null;
  fileTypes: string[]; // lowercase extensions, empty = no filter
  providers: string[]; // selected provider names, empty = no filter
};

export type AvailableProvider = { id: string; name: string };

export type RecordsParamList = {
  RecordsList: { filters?: RecordsFilters } | undefined;
  RecordDetailLabs: { recordId: string };
  RecordDetailImaging: { recordId: string };
  RecordDetailNotes: { recordId: string };
  // patientId is set only when these screens are reached from the PDA
  // "representing" stack — it switches the data fetch to the PDA-scoped endpoint.
  RecordDetailFHIR: { recordId: string; patientId?: string };
  RecordDetailLabPanel: { recordIds: string[]; date: string; source: string | null; patientId?: string };
  UploadSheet: undefined;
  FilterSheet:
    | {
        current?: RecordsFilters;
        availableProviders?: AvailableProvider[];
      }
    | undefined;
  DocumentViewer: {
    fileId: string;
    fileURL: string;
    fileType: string;
    title: string;
    createdAt: string;
    source: string;
    userProviderId: string | null;
  };
  CameraCapture: { source: "camera" } | { source: "library" };
  UploadPreview: {
    uri: string;
    mimeType: string;
    name: string;
    width?: number;
    height?: number;
  };
};

export type ReleasesFilter = {
  dateFrom: string | null;
  dateTo: string | null;
  status: "active" | "pending" | "expired" | null;
};

export type ReleasesParamList = {
  ReleasesList: { filters?: ReleasesFilter } | undefined;
  WizardStep1: { returnTo?: SetupReturnTo } | undefined;
  WizardStep2: { providerType: string; providerId: string };
  WizardStep3: undefined;
  WizardStep4: undefined;
  WizardStep5: undefined;
  ActiveDetail: { releaseId: string };
  PendingDetail: { releaseId: string };
  FaxDialog: undefined;
  DateFilterSheet: { current?: ReleasesFilter } | undefined;
  ExportPDF: { releaseId: string };
};

export type ProvidersParamList = {
  MyProviders: undefined;
  AddProvider: { provider?: import("@/lib/api").UserProvider; returnTo?: SetupReturnTo } | undefined;
  ProviderDetail: { provider: import("@/lib/api").UserProvider };
};

export type ProfileParamList = {
  Profile: undefined;
  ConnectAppleHealth: { returnTo?: SetupReturnTo } | undefined;
  AccountSettings: undefined;
  EditProfile: { returnTo?: SetupReturnTo } | undefined;
  ChangePassword: { mode?: "change" | "set" } | undefined;
  DesignatedAgents: undefined;
  InviteRepresentative: { returnTo?: SetupReturnTo } | undefined;
  RepresentativeDetail: { agent: import("@/lib/api").DesignatedAgent };
  ActiveDevices: undefined;
  RoleSwitcher: undefined;
  TermsScreen: undefined;
  PrivacyScreen: undefined;
};

export type TabsParamList = {
  HomeTab: undefined;
  RecordsTab: undefined;
  ReleasesTab: undefined;
  ProvidersTab: undefined;
  ProfileTab: undefined;
};

// PDA flow

export type PdaRecordsFilters = {
  dateFrom: string | null;
  dateTo: string | null;
  fileTypes: string[];
  providers: string[];
};

export type PdaHomeParamList = {
  PdaHome: undefined;
  RoleSwitcher: undefined;
  PdaInvite: { invite: import("@/lib/api").PendingRepresentingInvite };
};

export type PdaRecordsParamList = {
  PdaRecords: { filters?: PdaRecordsFilters } | undefined;
  PdaRecordDetail: {
    fileId: string;
    fileURL: string;
    fileType: string;
    source: string;
    createdAt: string;
    pagecount: number | null;
    originalName: string | null;
    userProviderId: string | null;
    patientId: string;
    permission: "viewer" | "editor";
  };
  // Clinical (healthkitFHIR) records reuse the patient detail screens, scoped to
  // the represented patient via patientId.
  RecordDetailFHIR: { recordId: string; patientId?: string };
  RecordDetailLabPanel: { recordIds: string[]; date: string; source: string | null; patientId?: string };
  PdaFilterSheet: { current?: PdaRecordsFilters; availableProviders?: AvailableProvider[] } | undefined;
  PdaUploadSheet: { patientId: string };
  PdaCameraCapture: { patientId: string };
  PdaUploadPreview: {
    uri: string;
    mimeType: string;
    name: string;
    width?: number;
    height?: number;
    patientId: string;
  };
};

export type PdaProvidersParamList = {
  PdaProviders: undefined;
  PdaAddProvider: { provider?: import("@/lib/api").UserProvider } | undefined;
  PdaProviderDetail: { provider: import("@/lib/api").UserProvider };
};

export type PdaReleasesParamList = {
  PdaReleases: undefined;
  PdaReleaseDetail: { releaseId: string };
  PdaWizardStep1: undefined;
  PdaWizardStep2: { providerType: string; providerId: string };
  PdaWizardStep3: undefined;
  PdaWizardStep4: undefined;
};

export type PdaProfileParamList = {
  PdaProfile: undefined;
  PdaEditProfile: undefined;
  PdaPeopleIRepresent: undefined;
  RoleSwitcher: undefined;
  ActiveDevices: undefined;
  PdaInvite: { invite: import("@/lib/api").PendingRepresentingInvite };
};

export type PdaTabsParamList = {
  PdaHomeTab: undefined;
  PdaRecordsTab: undefined;
  PdaProvidersTab: undefined;
  PdaReleasesTab: undefined;
  PdaProfileTab: undefined;
};
