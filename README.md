<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js 14">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/n8n-Automation-EA4B71?style=for-the-badge&logo=n8n" alt="n8n">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</p>

<h1 align="center">🎬 CronoStudio</h1>

<p align="center">
  <strong>Production Management System for YouTube Creators</strong><br>
  Local-first SaaS • Dashboard • Automation • Analytics
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-stack">Stack</a> •
  <a href="#-documentation">Docs</a>
</p>

---

## 🎯 Overview

**CronoStudio** is a complete production management system designed for YouTube content creators. It provides a unified dashboard to track your content pipeline from idea to publication, with integrated automation via n8n.

### Why CronoStudio?

- **100% Local**: No cloud dependencies, your data stays on your machine
- **Production Pipeline**: Visual tracking from idea → script → recording → editing → publication
- **Automation Ready**: n8n integration for SEO, thumbnails, scheduling, and more
- **Multi-Channel**: Manage multiple YouTube channels from one dashboard

---

## ✨ Features

| Module | Description | Status |
|--------|-------------|--------|
| 🏠 **Dashboard** | Production pipeline, priority actions, automations | ✅ Ready |
| 💡 **Ideas** | Idea bank with AI evaluation and categorization | ✅ Ready |
| 📝 **Scripts** | Script editor with structure templates | ✅ Ready |
| 🖼️ **Thumbnails** | Thumbnail management and A/B testing | 🔄 In Progress |
| 🔍 **SEO** | Title, description, tags optimization | 🔄 In Progress |
| 📺 **Channels** | Multi-channel management and analytics | ✅ Ready |
| 📊 **Analytics** | YouTube API integration for metrics | ✅ Ready |
| ⚡ **Automations** | n8n workflows for content pipeline | 🔄 In Progress |

---

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://docker.com/products/docker-desktop) v24+
- [Node.js](https://nodejs.org) v20+ (LTS)
- [pnpm](https://pnpm.io) v8+
- External SSD (recommended for assets)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/NaktoG/cronostudio.git
cd cronostudio

# 2. Start infrastructure (PostgreSQL, n8n)
docker compose -f infra/docker/compose.yml up -d

# 3. Install dependencies
pnpm install

# 4. Configure environment
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your settings

# 5. Run database migrations
docker exec -i cronostudio-postgres psql -U crono -d cronostudio < infra/docker/init.sql

# 6. Start development server
pnpm dev
```

**Access:**
| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3001 |
| n8n | http://localhost:5678 |
| PostgreSQL | localhost:5432 |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CRONOSTUDIO                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Dashboard     │  │   n8n Agents    │  │  YouTube    │ │
│  │   (Next.js)     │◄─┤   (Automation)  │◄─┤  API        │ │
│  │   Port: 3001    │  │   Port: 5678    │  │             │ │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┘ │
│           │                    │                            │
│           ▼                    ▼                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              PostgreSQL Database                        ││
│  │              Port: 5432                                 ││
│  │  [users] [channels] [productions] [ideas] [scripts]... ││
│  └─────────────────────────────────────────────────────────┘│
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              External SSD Storage                       ││
│  │  /Volumes/SSD-QVO/cronostudio/assets                   ││
│  │  [videos] [thumbnails] [exports] [backups]             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations

### Backend
- **Next.js API Routes** - REST endpoints
- **PostgreSQL 16** - Relational database
- **JWT** - Authentication tokens

### Infrastructure
- **Docker Compose** - Local containerization
- **n8n** - Workflow automation
- **External SSD** - Fast asset storage

---

## 📁 Project Structure

```
cronostudio/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/app/
│       │   ├── api/            # API routes
│       │   ├── components/     # React components
│       │   ├── contexts/       # React contexts
│       │   └── [pages]/        # Page routes
│       └── public/             # Static assets
├── infra/
│   └── docker/
│       ├── compose.yml         # Docker Compose config
│       ├── init.sql            # Database schema
│       └── migration_*.sql     # Migrations
├── docs/
│   ├── SETUP.md                # Installation guide
│   └── RUNBOOK.md              # Operations manual
└── assets/                     # Media files (on SSD)
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [SETUP.md](docs/SETUP.md) | Complete installation guide |
| [RUNBOOK.md](docs/RUNBOOK.md) | Daily operations, backups, troubleshooting |
| [API.md](docs/API.md) | API endpoints reference |

---

## 🔐 Security

- JWT-based authentication with httpOnly cookies
- Password hashing with bcrypt (12 rounds)
- CORS protection enabled
- Rate limiting on API endpoints
- Input validation with Zod schemas

---

## 🗺️ Roadmap

- [ ] YouTube Data API integration
- [ ] AI-powered SEO suggestions
- [ ] Thumbnail A/B testing automation
- [ ] Multi-language support
- [ ] Mobile companion app

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for YouTube Creators<br>
  <strong>CronoStudio</strong> © 2025
</p>
