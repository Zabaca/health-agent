# health-agent-mobile Style Guide

## Screen Dimensions

- **Screen size:** 402×874px
- **Status bar:** 62px tall
- **Header bar:** 56px tall
- **Nav bar:** 95px tall

---

## Horizontal Spacing

- **Side gutter:** 24px (content inset from screen edge on both sides)
- **Content width:** 354px (402 − 24 − 24)

---

## Vertical Spacing (Padding Between Components)

| Rule | Value |
|---|---|
| Top padding — first component from content area top | 20px |
| Gap between distinct components / cards | 16px |
| Gap between section groups | 24px |
| Gap between tightly related items (same field group) | 8px |
| List row items (border-separated) | 0px |

---

## Bottom Button Layout

| Pattern | Wrapper size | Button size |
|---|---|---|
| Single button | 402×68px | 354×52px |
| Two buttons (stacked) | 402×116px (gap: 12px) | 354×52px each |

Button wrapper: `layout: horizontal, justifyContent: center, alignItems: center`
Two-button wrapper: `layout: vertical, gap: 12, alignItems: center`

Content area height when single button pinned to bottom: **672px** (874 − 62 − 56 − 68 − 16)
Content area height when two buttons pinned to bottom: **624px** (874 − 62 − 56 − 116 − 16)

---

## Color Tokens

| Token | Hex | Role |
|---|---|---|
| `$primary` | `#3D8A5A` | Green — primary action |
| `$primary-10` | `#3D8A5A10` | Tint |
| `$primary-15` | `#3D8A5A15` | Tint |
| `$primary-20` | `#3D8A5A20` | Tint |
| `$primary-40` | `#3D8A5A40` | Tint |
| `$primary-60` | `#3D8A5A99` | Tint |
| `$primary-bg` | `#E8F0EB` | Light green background |
| `$accent` | `#D89575` | Warm orange accent |
| `$accent-20` | `#D8957520` | Accent tint |
| `$bg` | `#F5F4F1` | Screen background (beige) |
| `$surface` | `#FFFFFF` | Card / white surface |
| `$surface-subtle` | `#F0EEE9` | Subtle surface |
| `$divider` | `#F0EEE9` | Dividers |
| `$border` | `#E8E6E1` | Standard border |
| `$border-muted` | `#D8D6D0` | Muted border |
| `$text-primary` | `#1A1A1A` | Primary text |
| `$text-secondary` | `#9B9B8A` | Secondary / muted text |
| `$text-placeholder` | `#C4C4B8` | Placeholder text |
| `$destructive` | `#C0392B` | Red — destructive actions |
| `$destructive-bg` | `#FDF2F2` | Destructive background |
| `$destructive-border` | `#C0392B30` | Destructive border tint |

---

## Typography

- **Icon fonts:** lucide (primary), feather, phosphor

---

## Components

### Buttons
- **Corner radius:** 14px
- **Primary:** fill `$primary`, text white, weight 600, size 16
- **Secondary (outline):** stroke `#1A1A1A` 1.5px inside, text `#1A1A1A`, weight 600, size 16
- **Destructive:** fill `$destructive`, text white

### Cards / Section Groups
- **Corner radius:** 14px (outer card containers)
- **Background:** `$surface` or `$bg`
- **Border:** stroke `$border`

### List Rows (field-list pattern)
- **Height:** 60px per row
- **Left padding:** 14px
- **Separator:** top border stroke 1px `#E8E8E0`
- **Label:** fontSize 13, fill `$text-secondary`, y=12
- **Value:** fontSize 16, fill `$text-primary`, y=29

### Content Layout Pattern
Screens use a vertical flex stack:
```
[Status Bar 62px]
[Header 56px]
[Content Area — flex: 1]
[Button Wrapper (if present)]
[16px spacer at bottom]
```

Content area children use **absolute positioning** with:
- First component at `y=20` (20px top padding)
- `16px` gap between distinct components
- `24px` gap between section groups
- `8px` gap between tightly related items

---

## Navigation Headers

### Standard Header (56px)
Used for all sub-screens with a named screen title.

| Element | Spec |
|---|---|
| Frame | 402×56px, background `$bg`, `layout: none` (absolute) |
| Back icon | lucide `arrow-left`, 24×24px, x=16 y=16 (vertically centered) |
| Title | fontSize 17, fontWeight 700, color `$text-primary`, x=0 width=402 `textAlign: center` |
| Right icon (optional) | 24×24px, x=362 y=16 (16px from right: 402−24−16) |
| Right text action (optional) | fontSize 17, color `$primary`, right-aligned x≈386 |

Title centering uses a **3-zone horizontal flex layout**:
- Left zone: 56×56px, `paddingLeft: 16` — contains the back icon
- Center zone: `fill_container` × 56px, `justifyContent: center` — contains the title text
- Right zone: 56×56px — empty, or contains right action

This keeps the title visually centered on screen regardless of left/right elements.

### Close icon variant
For modal/overlay screens: use lucide `x` instead of `arrow-left` (e.g., Export PDF screen).

### Record Breadcrumb (34px)
Used only in record detail screens (03a Labs · 03b Imaging · 03c Notes).
`< Category Name` text in `$primary` color, left-aligned at x=24.

### Document Viewer Header (56px, dark)
Used only for the document viewer screen. Dark background, filename + metadata two-line layout, share icon on right. Intentional departure from standard header — not applied elsewhere.

### HIPAA Wizard Step Header (36px)
Used only in the HIPAA release multi-step flow (04a–04d). Contains step indicator and × close. Not a standard navigation header.

---

## Navigation

- **Bottom tab bar:** 5 tabs — Home · Records · Releases · Access · Profile
- **Deep links:** Notification taps open directly to the relevant screen

---

## React Native / Expo Notes

- All pixel values are in logical pixels (dp), matching the 402px design canvas width
- Side gutter 24px → `paddingHorizontal: 24`
- Component gap 16px → `gap: 16` in a flex column
- Section group gap 24px → `gap: 24` between section containers
- Button height 52px, corner radius 14px → `borderRadius: 14`
- Status bar height: use `expo-status-bar` + `useSafeAreaInsets()` — do not hardcode
- Nav bar height: use `react-navigation` bottom tab bar with `useSafeAreaInsets()`
- Standard header (56px): 3-zone `flexDirection: row, alignItems: center` — left 56px (back icon), center `flex: 1` (title `textAlign: center`), right 56px (action or empty)
- Back icon: lucide `arrow-left`, 24×24, tinted `$text-primary`
