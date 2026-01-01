# GPA Calculator

## Overview

A cross-platform GPA Calculator mobile application built with React Native and Expo. The app offers both free and premium features:

**Free Features:**
- Basic GPA calculation for a single semester
- Support for US (4.0) and Australian (7.0) grading scales
- Course management with grades and credits
- Data persistence using AsyncStorage

**Premium Features (one-time unlock, no subscription):**
- Weighted GPA calculation (AP/Honours courses with +1.0/+0.5 multipliers)
- Multiple semester management with cumulative GPA
- GPA prediction tool for future planning
- Course profiles for different degrees/majors
- Export to PDF/image with sharing
- Visual analytics with trend charts

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation with native stack navigator (Home, GPACalculator, UnlockPremium, Semesters, SemesterDetail, Prediction, Profiles, Analytics, Export screens)
- **State Management**: Local React state with useState hooks; PremiumContext for premium feature gating; AsyncStorage for data persistence
- **Styling**: Custom theme system with light/dark mode support via `useTheme` hook
- **Animations**: React Native Reanimated for smooth UI animations
- **Haptic Feedback**: expo-haptics for tactile feedback on button presses and selections
- **Components**: Custom themed components (ThemedText, ThemedView, Button, Card, PremiumGate) following a consistent design system

### Backend Architecture
- **Framework**: Express.js server
- **Purpose**: Serves static landing page and can provide API endpoints if needed
- **Current State**: Minimal routes configured; app primarily runs client-side

### Data Storage
- **AsyncStorage Keys**: 
  - `@gpa_premium_unlocked`: Boolean for premium status
  - `@gpa_courses_US`, `@gpa_courses_AU`: Course data per grading scale
  - `@gpa_semesters`: Semester data for premium users
  - `@gpa_profiles`: Profile data for premium users
- **Schema Ready**: Drizzle ORM configured for PostgreSQL (optional for future cloud sync)

### Project Structure
```
client/           # React Native app code
  components/     # Reusable UI components
  screens/        # Screen components (GPACalculatorScreen)
  navigation/     # Navigation configuration
  hooks/          # Custom React hooks
  constants/      # Theme and design tokens
  lib/            # Utilities (query client)
server/           # Express backend
shared/           # Shared types and schemas
assets/           # Images and static assets
```

### Design Patterns
- **Theming**: Centralized color palette in `constants/theme.ts` with semantic color tokens
- **Error Handling**: ErrorBoundary component wraps the app for graceful error recovery
- **Keyboard Handling**: KeyboardAwareScrollViewCompat for cross-platform keyboard behavior
- **Path Aliases**: `@/` maps to `client/`, `@shared/` maps to `shared/`

## External Dependencies

### Core Framework
- **Expo**: Managed workflow for React Native development
- **React Native**: Cross-platform mobile framework

### Navigation & UI
- **React Navigation**: Native stack navigation
- **React Native Gesture Handler**: Touch gesture handling
- **React Native Reanimated**: Animation library
- **React Native Safe Area Context**: Safe area insets handling
- **Expo Vector Icons**: Icon library (Feather icons used)

### Data & State
- **TanStack React Query**: Server state management (available but app uses local state)
- **Drizzle ORM**: Database ORM configured for PostgreSQL (schema defined but not actively used)
- **Zod**: Schema validation

### Server
- **Express**: HTTP server framework
- **PostgreSQL**: Database (configured via DATABASE_URL, optional for current functionality)

### Development
- **TypeScript**: Type safety throughout
- **Babel**: Module resolver for path aliases
- **ESLint/Prettier**: Code formatting and linting