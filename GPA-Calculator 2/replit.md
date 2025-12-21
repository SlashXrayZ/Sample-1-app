# GPA Calculator

## Overview

A cross-platform GPA Calculator mobile application built with React Native and Expo. The app allows users to input courses with grades and credit units, view their course list, and calculate their cumulative GPA. This is a single-user utility app with local state management - no authentication or user accounts required.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation with native stack navigator (single screen, stack-only navigation)
- **State Management**: Local React state with useState hooks; TanStack React Query available for server state if needed
- **Styling**: Custom theme system with light/dark mode support via `useTheme` hook
- **Animations**: React Native Reanimated for smooth UI animations
- **Components**: Custom themed components (ThemedText, ThemedView, Button, Card) following a consistent design system

### Backend Architecture
- **Framework**: Express.js server
- **Purpose**: Serves static landing page and can provide API endpoints if needed
- **Current State**: Minimal routes configured; app primarily runs client-side

### Data Storage
- **Current Implementation**: In-memory storage using React state (no persistence)
- **Schema Ready**: Drizzle ORM configured with PostgreSQL schema (users table exists but unused)
- **Design Decision**: App is designed as a local calculator without data persistence requirements

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