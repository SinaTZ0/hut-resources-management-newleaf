# Home Page Flow

## User Journey

- User visits `/` → `app/page.tsx` → Hero section (this file) → Link to create entity or features anchor

## Flow Summary

| Step | URL | Component      | User Action          |
| ---- | --- | -------------- | -------------------- |
| 1    | `/` | `app/page.tsx` | View Hero, click CTA |

## Data Queries

- None (static hero)

## Edge Cases

- Mobile: hero stacks vertically and hides floating preview cards
- Accessibility: CTAs are keyboard-focusable
