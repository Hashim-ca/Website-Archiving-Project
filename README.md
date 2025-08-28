# Website Archiving Project - Backend

This is the backend for the Website Archiving Project. It provides an API and a background worker to capture, store, and serve snapshots of websites.

## Core Technologies

- **Runtime**: Node.js / TypeScript
- **Framework**: Express.js
- **Database**: MongoDB
- **Storage**: Cloudflare R2 (S3-compatible)
- **Scraping**: Firecrawl API

## Getting Started

### 1. Prerequisites

You will need Node.js (v18+), npm/yarn, and access to a MongoDB database.

### 2. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Website-Archiving-Project

# Install dependencies
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory by copying the example below. You must provide your own credentials for the services to work.

```bash
# .env file

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/website-archive

# Firecrawl API Key
FIRECRAWL_KEY=your_firecrawl_api_key

# Cloudflare R2 (or other S3-compatible) Credentials
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key
S3_API=https://<your_account_id>.r2.cloudflarestorage.com
R2_BUCKET_NAME=your-bucket-name

# Optional: Cloudflare R2 Configuration
CLOUDFLARE_TOKEN_VALUE=your_cloudflare_token
CLOUDFLARE_PUBLIC_DEVELOPMENT_URL_R2=your_public_dev_url
R2_BUCKET_PREFIX=web-archive-project

# Server Port and CORS
PORT=3000
FRONTEND_URL=http://localhost:3001
```

### 4. Running the Application

You need two separate terminals to run the API server and the background worker.

**Terminal 1: Start the API Server**

```bash
npm run dev
```

**Terminal 2: Start the Background Worker**

```bash
npm run worker
```

## Project Architecture

The system is composed of two main parts:

1. **The API Server**: An Express.js server that exposes REST endpoints. It handles incoming requests, validates them, and creates jobs in the database. It does not perform the actual archiving itself.

2. **The Worker**: A background process that polls the database for pending jobs. It performs the heavy lifting of calling the Firecrawl API, processing the scraped content and assets, and uploading everything to cloud storage.

This separation ensures that long-running archiving tasks do not block the API, making the system responsive and scalable.

## API Endpoints

### Archive Management
- **POST /api/archive** - Creates a new archiving job for a given URL

### Job Management
- **GET /api/jobs/:jobId** - Retrieves the status of a specific job
- **GET /api/jobs?ids=id1,id2** - Retrieves the status for a list of job IDs

### Website Management
- **GET /api/websites?domain=<domain>** - Lists all archived snapshots for a specific domain

### Site Page Suggestions
- **GET /api/site-page-suggestions** - Retrieves page suggestions for archiving

### Content Serving
- **GET /view/:snapshotId/*** - Serves archived website content (HTML, CSS, images) from storage

## Project Structure

```
backend/
├── config/
│   └── environment.ts          # Environment configuration and validation
├── controllers/
│   ├── ArchiveController.ts    # Archive job creation logic
│   ├── JobController.ts        # Job status and management
│   ├── WebsiteController.ts    # Website listing and management
│   ├── ViewController.ts       # Serving archived content
│   └── SitePageSuggestionsController.ts
├── models/
│   ├── Job.ts                  # Job data model
│   ├── Website.ts              # Website data model
│   └── Snapshot.ts             # Snapshot data model
├── routes/
│   ├── archive.ts              # Archive routes
│   ├── jobs.ts                 # Job management routes
│   ├── websites.ts             # Website routes
│   ├── view.ts                 # Content serving routes
│   └── site-page-suggestions.ts
├── services/
│   ├── ArchiveService.ts       # Core archiving logic
│   ├── JobService.ts           # Job management service
│   ├── WebsiteService.ts       # Website management service
│   ├── ViewService.ts          # Content serving service
│   ├── R2StorageService.ts     # Cloudflare R2 storage integration
│   └── SitePageSuggestionsService.ts
├── workers/
│   ├── index.ts                # Worker entry point
│   └── WorkerService.ts        # Background job processing
├── types/
│   ├── index.ts                # Common type definitions
│   └── errors.ts               # Error type definitions
├── utils/
│   └── url.ts                  # URL utility functions
└── index.ts                    # Main application entry point
```

## Available Scripts

- **`npm run dev`** - Start the API server in development mode with auto-reload
- **`npm run worker`** - Start the background worker
- **`npm run build`** - Build the TypeScript project
- **`npm start`** - Start the production server (requires build first)
- **`npm run format`** - Format code with Prettier
- **`npm run lint`** - Run ESLint
- **`npm run lint:fix`** - Run ESLint with auto-fix
- **`npm run typecheck`** - Run TypeScript type checking

## Development Notes

- The project uses TypeScript for type safety
- MongoDB is used for storing job metadata, website information, and snapshots
- Cloudflare R2 is used for storing the actual archived content (HTML, assets, etc.)
- The Firecrawl API handles the complex task of web scraping and content extraction
- CORS is configured to work with the frontend running on port 3001

## License

MIT