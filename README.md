# Website Archiving Project

A full-stack web application for archiving websites, built with Node.js/TypeScript backend and Next.js frontend.

## Project Structure

```
├── backend/              # Node.js/TypeScript backend
│   ├── config/          # Environment configuration
│   ├── controllers/     # Request handlers and business logic coordination
│   ├── models/          # MongoDB data models and types
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic and external integrations
│   ├── types/           # Shared TypeScript types and interfaces
│   ├── utils/           # Utility functions
│   └── workers/         # Background job processing
├── frontend/            # Next.js/React frontend
│   ├── src/
│   │   ├── app/         # Next.js App Router pages
│   │   ├── components/  # React components (shadcn/ui)
│   │   └── lib/         # Frontend utilities
│   └── public/          # Static assets
└── dist/                # Compiled backend code
```

## Getting Started

### Backend Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run background worker
npm run worker
```

### Frontend Development

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Storage**: AWS S3/R2 compatible storage
- **Web Scraping**: Firecrawl
- **Background Jobs**: Custom worker system

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Environment Setup

1. Copy `.env.example` to `.env` and configure your environment variables
2. Ensure MongoDB is running and accessible
3. Configure your storage provider credentials
4. Set up Firecrawl API credentials if using web scraping features

## Development

The project follows a clean architecture pattern with strict separation of concerns:
- Controllers handle HTTP requests and responses
- Services contain business logic
- Models define data structures and database interactions
- Workers handle background processing

All code is fully type-safe with strict TypeScript configuration.
