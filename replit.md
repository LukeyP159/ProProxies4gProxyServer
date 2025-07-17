# 4G Proxy Server - System Architecture

## Overview

This is a full-stack 4G proxy server application built with React (TypeScript) on the frontend and Express.js on the backend. The system manages multiple 4G modems, provides proxy services, handles IP rotation, and offers OpenVPN configuration generation. It features a modern dashboard interface with real-time monitoring capabilities and WebSocket communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **January 17, 2025**: Fixed deployment script build issues with comprehensive multi-layer solution
- **January 17, 2025**: Added project directory structure auto-detection and correction in deployment script
- **January 17, 2025**: Enhanced deployment script with multiple build fallback approaches and graceful degradation
- **January 17, 2025**: Implemented robust error handling for "Could not resolve entry module 'index.html'" Vite build error
- **January 17, 2025**: Enhanced proxy configuration system with 12 advanced settings fields
- **January 17, 2025**: Added professional proxy config editor with tabbed interface (Basic, Authentication, Access Control, Performance, Advanced)
- **January 17, 2025**: Integrated 3proxy with IP filtering, bandwidth limits, and connection control
- **January 17, 2025**: Created comprehensive Ubuntu Server installation guide with systemd service configuration
- **January 17, 2025**: Added navigation menu items for new proxy management interfaces

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Real-time Communication**: WebSocket client for live updates

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Real-time Communication**: WebSocket server for broadcasting updates
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **Proxy Backend**: 3proxy software for HTTP and SOCKS5 proxy services
- **Proxy Management**: Automated 3proxy configuration generation and service management

## Key Components

### Data Layer
- **Database Schema**: Located in `/shared/schema.ts`
- **Tables**: users, modems, vpnConnections, ipRotationLogs, systemLogs, proxyConfiguration, analytics
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL with Neon serverless driver
- **Migrations**: Managed through drizzle-kit (`npm run db:push`)
- **Storage**: DatabaseStorage class replaced MemStorage for persistent data

### API Layer
- **REST Endpoints**: Express routes for CRUD operations
- **WebSocket**: Real-time communication for live updates
- **Storage Interface**: Abstracted storage layer with in-memory fallback
- **Error Handling**: Centralized error middleware

### Frontend Components
- **Dashboard**: Real-time monitoring with stats, modem status, and activity logs
- **Modems Management**: View and control 4G modems
- **IP Rotation**: Manual and automated IP rotation controls
- **OpenVPN**: VPN configuration generation and management
- **Analytics**: Usage statistics and performance metrics
- **Configuration**: System and proxy settings
- **API Documentation**: Interactive API endpoint testing

### UI/UX Design
- **Design System**: shadcn/ui components with Tailwind CSS
- **Theme**: "New York" style with neutral base colors
- **Responsive**: Mobile-first design with breakpoint utilities
- **Icons**: Lucide React icons throughout the interface

## Data Flow

### Real-time Updates
1. Backend WebSocket server broadcasts system changes
2. Frontend WebSocket client receives updates
3. React Query cache invalidation triggers UI updates
4. Components re-render with fresh data

### API Communication
1. Frontend makes HTTP requests via TanStack Query
2. Express routes handle requests and interact with storage
3. Drizzle ORM manages database operations
4. Responses are cached and managed by React Query

### State Management
1. Server state managed by TanStack Query
2. Local component state managed by React hooks
3. Real-time updates via WebSocket connections
4. Form state handled by React Hook Form with Zod validation

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL database
- **Connection**: Via DATABASE_URL environment variable
- **Migrations**: Automated through drizzle-kit

### Development Tools
- **Vite**: Development server and build tool
- **TypeScript**: Static type checking
- **ESLint/Prettier**: Code quality and formatting
- **Hot Module Replacement**: Fast development experience

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Class Variance Authority**: Component variant management
- **React Hook Form**: Form state management

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `/dist/public`
2. **Backend**: ESBuild bundles Express server to `/dist`
3. **Database**: Drizzle migrations applied via `db:push`

### Production Setup
- **Start Command**: `npm start` runs the built Express server
- **Static Files**: Express serves built React app
- **Database**: Connects to production PostgreSQL via DATABASE_URL
- **Environment**: NODE_ENV=production for optimizations

### Development Workflow
- **Dev Server**: `npm run dev` runs both frontend and backend
- **Hot Reload**: Vite HMR for instant frontend updates
- **Type Safety**: TypeScript checking across entire stack
- **Database**: Development database via DATABASE_URL

### Key Features
- **4G Modem Management**: Monitor connection status, signal strength, and bandwidth
- **IP Rotation**: Automated and manual IP address rotation
- **OpenVPN Integration**: Generate and manage VPN configurations
- **3proxy Integration**: Professional HTTP and SOCKS5 proxy backend with advanced configuration
- **Real-time Monitoring**: Live dashboard with WebSocket updates
- **Analytics**: Usage tracking and performance metrics
- **System Logs**: Comprehensive logging and monitoring
- **Proxy Dashboard**: Replica of threebrum4.ddns.net interface with table-based layout
- **M300z Controller**: Vodafone M300z modem-specific API integration for IP rotation and rebooting
- **Two-Stage Modem Setup**: Stage 1 (Database registration) → Stage 2 (Port assignment + OpenVPN config)