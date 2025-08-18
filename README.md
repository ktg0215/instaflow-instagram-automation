# InstaFlow - AI-Powered Instagram Automation Platform

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.4.6-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.7.2-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
</div>

## 🚀 Overview

InstaFlow is a comprehensive Instagram automation platform that combines AI-powered content generation with sophisticated scheduling and analytics capabilities. Built with modern web technologies, it provides a complete solution for managing Instagram content at scale.

## ✨ Key Features

### 🤖 AI-Powered Content Creation
- **Google Gemini Integration**: Advanced AI content generation using Gemini 1.5-flash
- **Interactive AI Assistant**: Real-time chat interface for content refinement
- **Tone & Style Control**: Customizable tone and length settings
- **Smart Hashtag Integration**: AI considers selected hashtags for content generation

### 📱 Instagram Integration
- **Graph API v23.0**: Full Instagram Graph API integration
- **Mock & Real Modes**: Development with mock data, production with real API
- **Media Management**: Support for images, videos, and carousel posts
- **Profile Analytics**: Comprehensive Instagram account analytics

### 📅 Advanced Scheduling
- **Smart Scheduling**: Intelligent post scheduling system
- **Calendar View**: Visual calendar interface for managing posts
- **Bulk Operations**: Manage multiple posts simultaneously
- **Status Tracking**: Complete post lifecycle management

### 🏷️ Hashtag Management
- **Category Organization**: Organize hashtags by categories
- **Usage Analytics**: Track hashtag performance and usage
- **Smart Suggestions**: AI-powered hashtag recommendations
- **Bulk Management**: Create and manage hashtags in bulk

## 🏗️ Technical Architecture

### Frontend
- **Next.js 15** with App Router for optimal performance
- **React 19** with modern hooks and concurrent features
- **TypeScript** for type safety and better developer experience
- **Tailwind CSS** for responsive, utility-first styling
- **React Query** for efficient server state management

### Backend & Database
- **Custom JWT Authentication** with NextAuth v5 integration
- **PostgreSQL** database with Docker containerization
- **Server-side API Routes** with comprehensive error handling
- **Mock Data Layer** for development without external dependencies

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- Google AI API Key (optional for AI features)
- Instagram Developer Account (optional for Instagram features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/instaflow.git
cd instaflow
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Start with Docker (Recommended)**
```bash
# Start all services (app + database + pgAdmin)
docker-compose up -d

# For development mode
docker-compose -f docker-compose.dev.yml up -d
```

5. **Access the application**
- Application: http://localhost:3000
- pgAdmin: http://localhost:5050

### Manual Setup

```bash
# Run development server
npm run dev
```

## 📖 Usage

### Authentication
- **Admin Account**: `ktg.shota@gmail.com` / `ktg19850215`
- **Test Account**: `test@example.com` / `test123`

### AI Content Generation
1. Navigate to Post Creation Studio
2. Open AI Chat Assistant
3. Describe your content requirements
4. Refine with interactive chat
5. Apply generated content to your post

### Instagram Integration
1. Go to Settings → Instagram
2. Enter your Instagram Access Token
3. Connect your Instagram Business Account
4. Start publishing and scheduling posts

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Create production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
```

### Docker Commands
```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up -d

# View application logs
docker-compose logs -f app

# Connect to database
docker-compose exec db psql -U postgres -d instaflow
```

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/instaflow

# Authentication
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_SECRET=your-nextauth-secret

# External APIs
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your-google-ai-key
INSTAGRAM_ACCESS_TOKEN=your-instagram-token
```

## 📚 API Endpoints

- `POST /api/auth/signin` - User login
- `GET /api/posts` - List all posts
- `POST /api/posts` - Create new post
- `GET /api/instagram/profile` - Get Instagram profile
- `POST /api/ai/generate` - Generate content with AI
- `GET /api/hashtags` - List hashtags

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Docker Production
```bash
docker build -t instaflow:production .
docker run -p 3000:3000 instaflow:production
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <p><strong>Built with ❤️ and AI assistance</strong></p>
  <p>🤖 Generated with <a href="https://claude.ai/code">Claude Code</a></p>
</div>
