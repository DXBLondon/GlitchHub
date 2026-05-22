# GlitchHub 🎮

A modern gaming and cool stuff showcase website built with Next.js, React, and TypeScript.

## Features

- 🎮 **Game Showcase** - Display and explore games
- 👥 **User Profiles** - Create profiles, follow users, rate games
- ⭐ **Ratings & Reviews** - Community feedback on games
- 🎨 **Modern UI** - Beautiful, responsive design
- 🔐 **Authentication** - Secure user accounts
- 📱 **Mobile-Friendly** - Works on all devices

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB Atlas account (free)

### Installation

```bash
# Clone the repository
git clone https://github.com/DXBLondon/GlitchHub.git
cd GlitchHub

# Install dependencies
npm install

# Create environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
GlitchHub/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Homepage
│   ├── layout.tsx         # Root layout
│   ├── api/               # API routes
│   ├── games/             # Games pages
│   ├── profile/           # User profile pages
│   └── auth/              # Auth pages
├── components/            # React components
├── lib/                   # Utilities and helpers
├── public/                # Static files
├── styles/                # Global styles
└── types/                 # TypeScript type definitions
```

## Environment Variables

Create `.env.local`:

```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
```

## Running the Project

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project however you like!

## Next Steps

1. ✅ Set up MongoDB database
2. ✅ Configure environment variables
3. ✅ Install dependencies: `npm install`
4. ✅ Start developing: `npm run dev`
5. ✅ Deploy to Vercel

---

**Built with ❤️ by DXBLondon**
