# UI/UX Design

## Design Philosophy
SmartRead adopts a "Content-First" design philosophy. The interface is clean, distraction-free, and highly responsive, prioritizing the reading experience while keeping management tools accessible but unobtrusive.

## Component Implementation Details

### 1. Reader View (Infinite Scroll)
Located in `src/components/reader-view.tsx`.
*   **Architecture**: Uses a custom solution similar to virtual lists, combined with manual DOM synchronization.
*   **State**: Maintains a `loadedChapters` array containing content from the previous, current, and next chapters.
*   **Infinite Loading**:
    *   **Load Down**: Triggered by a bottom `IntersectionObserver` sentinel. Appends content to `loadedChapters`.
    *   **Load Up**: Triggered by a top sentinel. Prepends content to `loadedChapters`.
*   **Scroll Sync**: When prepending chapters, the browser's default behavior is to jump to the top. We use `useLayoutEffect` to calculate the height difference (`newScrollHeight - prevScrollHeight`) and immediately adjust `scrollTop`, creating a seamless "scroll up" experience.

### 2. Theme System
*   **Provider**: Wraps the application using `next-themes` provider.
*   **Implementation**: Toggles `class` (dark/light/sepia) on the `<html>` tag.
*   **Tailwind**: Components use the `dark:bg-zinc-950` modifier. The "Sepia" theme is implemented by overriding CSS variables for background and text colors via a custom class.

## Key Interface Modules

### 1. Reader View (`/novel/[id]/chapter/[chapterId]` & `/paper/[id]/read`)
The core part of the application, supporting immersive reading for papers and novels.
*   **Infinite Scroll**: Automatically loads the next chapter when reaching the bottom.
*   **Context Menu**: Hidden by default, invoked by clicking the center of the screen.
*   **Personalization**: Users can adjust font size, background color (Sepia, Dark, Light), and line height.
*   **VIP Paywall**: VIP chapters display a blur mask and an "Unlock" button.

### 2. Author Workbench (`/author`)
Dedicated space for creators.
*   **Data Table**: Uses `shadcn/ui` Table component to display manuscript lists and status badges.
*   **Editor**: Rich text editor (Markdown supported) for writing chapters.
*   **Real-time Validation**: Forms use `zod` schema validation, providing instant error feedback.

### 3. Admin Dashboard (`/admin`)
For platform governance.
*   **Dashboard**: Overview metrics (Total Users, Daily Active Users).
*   **Audit Queue**: Split-screen interface for reviewing chapters pending publication, highlighting AI suggestions.
*   **Journal Management**: Create/Edit journals, assign admins and reviewers.
*   **User Audit**: View user behavior logs and login records.

### 4. Journal & Paper Browsing (`/journals`, `/browse`)
*   **Journal Display**: Card layout displaying journal covers and descriptions.
*   **Paper List**: Supports filtering papers and novels by journal and category.
*   **Search**: Global search functionality supporting title and author retrieval.

## Responsive Strategy
*   **Mobile First**: All layouts are built prioritizing mobile screens, then extended for tablets and desktops.
*   **Navigation**:
    *   *Desktop*: Top horizontal navigation bar.
    *   *Mobile*: Bottom tab bar or hamburger menu for secondary actions.

## User Flow
1.  **Discovery**: Home Recommendation -> Journal/Category Browse -> Manuscript Detail -> Start Reading.
2.  **Creation**: Author Workbench -> Create Manuscript/Submit to Journal -> Add Chapter/Upload PDF -> Submit for Review.
3.  **Review**: Admin/Reviewer receives notification -> Reviews Content -> Publish or Reject.
