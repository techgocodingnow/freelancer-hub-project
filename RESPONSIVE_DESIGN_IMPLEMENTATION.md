# Responsive Design Implementation Guide

## Overview

This document describes the responsive design implementation for the freelancer-hub-project. All pages have been updated to work seamlessly across mobile, tablet, and desktop devices.

---

## 📱 Breakpoints

The application uses the following breakpoints (defined in `src/theme/tokens.ts`):

| Device  | Breakpoint    | Media Query Hook |
| ------- | ------------- | ---------------- |
| Mobile  | < 768px       | `useIsMobile()`  |
| Tablet  | 768px - 992px | `useIsTablet()`  |
| Desktop | > 992px       | `useIsDesktop()` |

---

## 🛠️ Responsive Components

### 1. ResponsiveContainer

**Location:** `src/components/responsive/ResponsiveContainer.tsx`

**Purpose:** Provides consistent padding and max-width across breakpoints.

**Usage:**

```tsx
import { ResponsiveContainer } from "../../components/responsive";

<ResponsiveContainer maxWidth="lg">{/* Your content */}</ResponsiveContainer>;
```

**Props:**

- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'xl')
- `padding`: boolean (default: true)

**Behavior:**

- Mobile: 16px padding
- Tablet: 24px padding
- Desktop: 32px padding

---

### 2. ResponsiveGrid

**Location:** `src/components/responsive/ResponsiveGrid.tsx`

**Purpose:** Responsive grid layouts with automatic column adjustments.

**Usage:**

```tsx
import { ResponsiveGrid } from "../../components/responsive";

<ResponsiveGrid cols={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}>
  {items.map((item) => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</ResponsiveGrid>;
```

**Props:**

- `cols`: Object with breakpoint-specific column counts
- `gap`: number | [number, number] (default: 16)

---

### 3. ResponsiveSpace

**Location:** `src/components/responsive/ResponsiveSpace.tsx`

**Purpose:** Responsive spacing between elements.

**Usage:**

```tsx
import { ResponsiveSpace } from "../../components/responsive";

<ResponsiveSpace size={{ mobile: "small", tablet: "middle", desktop: "large" }}>
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</ResponsiveSpace>;
```

**Props:**

- `size`: SpaceSize | { mobile, tablet, desktop }
- All Ant Design Space props

---

## 📄 Updated Pages

### Task Pages

#### Task List (`src/pages/tasks/list.tsx`)

- ✅ ResponsiveContainer wrapper
- ✅ Responsive header layout (column mobile → row desktop)
- ✅ Responsive title sizing (h3 mobile → h2 desktop)
- ✅ Filter/Views buttons always visible, full-width on mobile
- ✅ View switcher buttons hidden on mobile
- ✅ Responsive table with horizontal scroll on mobile (x: 1000)
- ✅ Simple pagination on mobile, full pagination on desktop

#### Task Kanban (`src/pages/tasks/kanban.tsx`)

- ✅ ResponsiveContainer wrapper
- ✅ Responsive grid layout (1 column mobile → 2 tablet → 4 desktop)
- ✅ Full-width filter selects on mobile
- ✅ View switcher buttons hidden on mobile
- ✅ Responsive gap spacing (12px mobile → 16px desktop)

#### Task Calendar (`src/pages/tasks/calendar.tsx`)

- ✅ ResponsiveContainer wrapper
- ✅ Default view: agenda on mobile, month on desktop
- ✅ Responsive calendar toolbar (vertical mobile → horizontal desktop)
- ✅ Month/Week views hidden on mobile (only Day and Agenda)
- ✅ Responsive calendar height (400px mobile → 600px desktop)
- ✅ Responsive button sizes (small mobile → middle desktop)

#### Task Timeline (`src/pages/tasks/timeline.tsx`)

- ✅ ResponsiveContainer wrapper
- ✅ Responsive date range filter (vertical mobile → horizontal desktop)
- ✅ Full-width RangePicker and Clear button on mobile
- ✅ Responsive timeline padding (16px mobile → 24px desktop)

#### Task Create (`src/pages/tasks/create.tsx`)

- ✅ ResponsiveContainer wrapper (max-width: lg)
- ✅ Responsive form input sizes (middle mobile → large desktop)
- ✅ Responsive button layout (vertical mobile → horizontal desktop)
- ✅ Full-width buttons on mobile

#### Task Edit (`src/pages/tasks/edit.tsx`)

- ✅ ResponsiveContainer wrapper (max-width: lg)
- ✅ Responsive loading state
- ✅ Responsive form input sizes (middle mobile → large desktop)
- ✅ Responsive button layout (vertical mobile → horizontal desktop)

---

### Authentication Pages

#### Login Page (`src/pages/login/index.tsx`)

- ✅ Responsive padding (16px mobile, 24px desktop)
- ✅ Responsive Title level (h3 mobile, h2 desktop)
- ✅ Responsive Space size

#### Register Page (`src/pages/register/index.tsx`)

- ✅ Responsive padding (16px mobile, 24px desktop)
- ✅ Responsive Title level (h3 mobile, h2 desktop)
- ✅ Responsive Space size
- ✅ Full-width form on mobile

---

### Project Pages

#### Project List (`src/pages/projects/list.tsx`)

- ✅ ResponsiveContainer wrapper
- ✅ Responsive header layout (column on mobile, row on desktop)
- ✅ Responsive button text ("New" on mobile, "New Project" on desktop)
- ✅ Responsive grid gutter (12px mobile, 16px tablet, 24px desktop)
- ✅ Responsive Title level

#### Project Create (`src/pages/projects/create.tsx`)

- ✅ ResponsiveContainer wrapper (max-width: lg)
- ✅ Responsive form input sizes (middle on mobile, large on desktop)
- ✅ Responsive button layout (vertical stack on mobile, horizontal on desktop)
- ✅ Full-width buttons on mobile

#### Project Show (`src/pages/projects/show.tsx`)

- ✅ ResponsiveContainer wrapper
- ✅ Responsive header layout (column on mobile, row on desktop)
- ✅ Responsive title sizing (h3 on mobile, h2 on desktop)
- ✅ Responsive statistics grid (1/2/4 columns)
- ✅ Responsive tabs (small on mobile, middle on desktop)
- ✅ Responsive descriptions (1 column on mobile, 2 on desktop)
- ✅ Responsive action buttons (vertical stack on mobile, horizontal on desktop)
- ✅ Responsive tables with horizontal scroll on mobile
- ✅ Simple pagination on mobile

---

### User Management

#### User List (`src/pages/users/list.tsx`)

- ✅ ResponsiveContainer wrapper
- ✅ Responsive Title level (h3 mobile, h2 desktop)
- ✅ Full-width search and filter inputs on mobile
- ✅ Horizontal scroll for table on mobile (scroll={{ x: 800 }})
- ✅ Simple pagination on mobile
- ✅ Hide size changer on mobile

---

### Header Component

#### Header (`src/components/header/index.tsx`)

- ✅ Responsive padding (12px mobile, 24px desktop)
- ✅ Responsive height (56px mobile, 64px desktop)
- ✅ Responsive Switch size (small on mobile, default on desktop)
- ✅ Hide user name on mobile, show only small avatar
- ✅ Responsive Space size

---

## 🎨 Responsive Design Patterns

### 1. Mobile-First Approach

Always start with mobile layout and enhance for larger screens:

```tsx
const isMobile = useIsMobile();

<div style={{
  flexDirection: isMobile ? 'column' : 'row',
  gap: isMobile ? '12px' : '24px'
}}>
```

### 2. Conditional Rendering

Hide/show elements based on screen size:

```tsx
{
  !isMobile && <Text>{user.name}</Text>;
}
{
  isMobile && <Avatar size="small" />;
}
```

### 3. Responsive Sizing

Adjust component sizes for touch targets:

```tsx
<Button size={isMobile ? 'middle' : 'large'} />
<Input size={isMobile ? 'middle' : 'large'} />
```

### 4. Full-Width on Mobile

Make buttons and inputs full-width on mobile:

```tsx
<Button block={isMobile}>Submit</Button>
<Input style={{ width: isMobile ? '100%' : 300 }} />
```

### 5. Responsive Tables

Enable horizontal scroll on mobile:

```tsx
<Table
  scroll={{ x: isMobile ? 800 : undefined }}
  pagination={{
    simple: isMobile,
    showSizeChanger: !isMobile,
  }}
/>
```

---

## ✅ Testing Checklist

### Mobile (< 768px)

- [ ] All text is readable without zooming
- [ ] Touch targets are at least 44x44px
- [ ] No horizontal scrolling (except tables)
- [ ] Forms are easy to fill out
- [ ] Navigation is accessible
- [ ] Images scale properly

### Tablet (768px - 992px)

- [ ] Layout adapts to available space
- [ ] Multi-column layouts work well
- [ ] Portrait and landscape modes work
- [ ] Touch and mouse interactions work

### Desktop (> 992px)

- [ ] Full screen width is utilized
- [ ] Multi-column layouts are optimal
- [ ] Hover states work properly
- [ ] Keyboard shortcuts work
- [ ] No wasted whitespace

---

## 🚀 Performance Considerations

1. **Selective Re-renders:** Media query hooks use window.matchMedia for efficient updates
2. **CSS-based Responsive:** Ant Design Grid uses CSS for responsive behavior
3. **Lazy Loading:** Consider lazy loading images and heavy components
4. **Code Splitting:** Use dynamic imports for route-based code splitting

---

## 📚 Resources

- [Ant Design Responsive Design](https://ant.design/docs/spec/responsive)
- [Ant Design Grid System](https://ant.design/components/grid)
- [MDN Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries)
- [Web.dev Responsive Design](https://web.dev/responsive-web-design-basics/)

---

## 🔧 Maintenance

### Adding New Pages

When creating new pages, follow this pattern:

```tsx
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";

export const MyNewPage: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <ResponsiveContainer>
      <Title level={isMobile ? 3 : 2}>Page Title</Title>
      {/* Your content */}
    </ResponsiveContainer>
  );
};
```

### Updating Existing Components

1. Import responsive hooks: `useIsMobile()`, `useIsTablet()`
2. Wrap content in `ResponsiveContainer`
3. Apply responsive sizing to inputs, buttons, titles
4. Test on all breakpoints

---

## 📝 Summary

All pages in the freelancer-hub-project are now fully responsive and work seamlessly across:

- 📱 Mobile devices (< 768px)
- 📱 Tablets (768px - 992px)
- 💻 Desktop devices (> 992px)

The implementation follows best practices, maintains accessibility, and ensures a great user experience on all devices.
