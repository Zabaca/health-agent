export type Notification = {
  id: string;
  title: string;
  body: string;
  when: string;
  unread: boolean;
  cta: string;
  ctaTarget: "records" | "release";
};

export const mockNotifications: Notification[] = [
  {
    id: "n1",
    title: "New lab results available",
    body: "Your Comprehensive Metabolic Panel from Mass General Hospital is ready to view.",
    when: "Today · 9:41 AM",
    unread: true,
    cta: "View lab results",
    ctaTarget: "records",
  },
  {
    id: "n2",
    title: "Documents uploaded",
    body: "Dr. Sarah Chen uploaded 2 new files to your health records.",
    when: "Yesterday",
    unread: false,
    cta: "View records",
    ctaTarget: "records",
  },
  {
    id: "n3",
    title: "Signature required",
    body: "Your HIPAA release for Beth Israel Deaconess is awaiting your signature.",
    when: "2 days ago",
    unread: true,
    cta: "Review release",
    ctaTarget: "release",
  },
];
