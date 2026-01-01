# GPA Calculator - Design Guidelines

## Architecture Decisions

### Authentication
**No authentication required.** This is a single-user utility app with local state only. No profile or settings screen needed for this simple calculator.

### Navigation
**Stack-only navigation.** Single screen app with no additional navigation layers required.

### Screen Specifications

#### Main Screen: GPA Calculator
**Purpose:** Allow users to input courses, view their course list, and see their calculated GPA.

**Layout:**
- **Header:** Default navigation header
  - Title: "GPA Calculator"
  - Background: Transparent
  - No header buttons
  - No search bar

- **Main Content Area:**
  - Root view: Scrollable (ScrollView)
  - Safe area insets: 
    - Top: `insets.top + Spacing.xl`
    - Bottom: `insets.bottom + Spacing.xl`
    - Horizontal: `Spacing.lg`

**Content Structure (top to bottom):**

1. **Input Form Section**
   - Card-style container with subtle border
   - Course Name input field (text input)
   - Grade selector (A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F)
     - Use a dropdown/picker component
   - Credit Units input (numeric, 1-4 typical range)
   - "Add Course" button
     - Full width within card
     - Primary color background
     - Disabled state when inputs incomplete

2. **GPA Display Section**
   - Prominent card positioned below input form
   - Large text displaying current GPA (e.g., "3.45")
   - Label: "Current GPA"
   - Background: Subtle accent color
   - If no courses added, show "—" or "0.00"

3. **Course List Section**
   - Heading: "Courses" with course count badge
   - List of added courses (FlatList)
   - Each course item shows:
     - Course name (bold)
     - Grade and credits (secondary text)
     - Delete icon button (right-aligned)
   - Empty state: "No courses added yet" centered text
   - Each course card has subtle background and spacing

4. **Reset Button**
   - Fixed at bottom of scroll view
   - Full width (with horizontal padding)
   - Destructive/secondary styling (outlined or text-style)
   - Label: "Clear All Courses"
   - Confirmation alert before clearing

**Component Specifications:**
- Text inputs: Rounded corners (8px), border on focus
- Buttons: Rounded (12px), press feedback with opacity change
- Course list items: Swipeable for delete OR delete icon button
- Picker: Native picker for grade selection
- All interactive elements: Minimum 44pt touch target

## Design System

### Color Palette
- **Primary:** `#4A90E2` (Blue - for Add Course button, active states)
- **Background:** `#FFFFFF` (White)
- **Card Background:** `#F8F9FA` (Light gray)
- **Text Primary:** `#1A1A1A` (Near black)
- **Text Secondary:** `#6B7280` (Medium gray)
- **Border:** `#E5E7EB` (Light gray)
- **GPA Display Background:** `#EEF6FF` (Light blue tint)
- **Destructive:** `#DC2626` (Red - for delete actions)

### Typography
- **GPA Number:** 48pt, Bold
- **Screen Title:** 20pt, Semibold
- **Course Name:** 16pt, Semibold
- **Input Labels:** 14pt, Medium
- **Body/Secondary Text:** 14pt, Regular
- **Button Text:** 16pt, Semibold

### Spacing Scale
- **xs:** 4px
- **sm:** 8px
- **md:** 12px
- **lg:** 16px
- **xl:** 24px
- **2xl:** 32px

### Visual Design Principles

**Interaction Feedback:**
- All buttons: Reduce opacity to 0.7 when pressed
- Input fields: Show blue border on focus
- Delete action: Confirmation alert ("Are you sure you want to delete this course?")
- Clear all: Confirmation alert ("Are you sure you want to clear all courses? This cannot be undone.")

**Card Styling:**
- Border radius: 12px
- Subtle border: 1px solid `Border` color
- No drop shadows (keep flat, minimal aesthetic)
- Padding: `Spacing.lg`

**Icons:**
- Use Feather icons from `@expo/vector-icons`
- Delete: "trash-2" icon, size 20px, color `Destructive`
- No decorative icons needed

**Form Design:**
- Labels above inputs
- Input fields full width
- Spacing between fields: `Spacing.md`
- Input height: 48px minimum

**List Design:**
- Spacing between courses: `Spacing.sm`
- Course cards slightly inset from screen edges
- Dividers between courses: Optional subtle 1px line

**Empty States:**
- Use secondary text color
- Icon optional: "book" icon from Feather
- Centered, with `Spacing.2xl` vertical padding

**No Custom Assets Required:**
- Use system icons for all actions
- No background images
- No illustrations needed
- Pure typography and color for GPA display