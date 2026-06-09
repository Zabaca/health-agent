// Apple App Store CTA. The href is intentionally a placeholder ("#") until
// Veladon ships to the App Store — wire the real URL here in one place.
export const APP_STORE_URL = "#";

export function AppStoreButton({ label = "Download on the App Store" }: { label?: string }) {
  return (
    <a className="btn" href={APP_STORE_URL} aria-label={label}>
      <svg viewBox="0 0 384 512" aria-hidden="true" fill="currentColor">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM248.4 92.8c19.2-21.7 16.5-41.4 15.6-48.5-15.7 0-33.9 9.8-44.2 21.9-11.4 13-18.1 29.2-16.7 47.4 17 1.3 32.5-7.3 45.3-20.8z" />
      </svg>
      <span>{label}</span>
    </a>
  );
}
