# LEARNEXA Frontend

Modern, responsive student skill exchange platform built with Next.js and React.

## Features

- 🔐 **Secure Authentication** - JWT-based token authentication
- 🤖 **AI Recommendations** - AI-powered matching of learning partners
- 💬 **Skill Exchange** - Profile management with skills to teach and learn
- 📋 **Request Management** - Send and receive learning requests
- 📅 **Session Tracking** - Schedule and track learning sessions
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5000/api" > .env.local

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx          # Home/Dashboard page
│   ├── layout.tsx        # Root layout
│   ├── globals.css       # Global styles
│   ├── login/
│   │   └── page.tsx      # Login page
│   ├── register/
│   │   └── page.tsx      # Registration page
│   ├── profile/
│   │   └── page.tsx      # User profile page
│   ├── requests/
│   │   └── page.tsx      # Learning requests page
│   └── sessions/
│       └── page.tsx      # Learning sessions page
├── lib/
│   └── api.ts           # API client utilities
├── package.json
├── next.config.js       # Next.js configuration
└── postcss.config.mjs   # PostCSS configuration
```

## Key Components

### API Client (`lib/api.ts`)

Centralized API communication with:
- Automatic token management
- Error handling
- Request/response interceptors
- Built-in auth headers

Usage:
```typescript
import { apiGet, apiPost } from '@/lib/api';

const res = await apiGet('/me');
if (res.ok) {
  console.log(res.data);
}
```

### Pages

| Page | Purpose |
|------|---------|
| `/` | Dashboard with AI recommendations |
| `/login` | User login |
| `/register` | New user registration |
| `/profile` | Edit profile & select skills |
| `/requests` | View & manage learning requests |
| `/sessions` | View scheduled learning sessions |

## Configuration

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5000/api
```

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Security Features

- ✅ Input validation on forms
- ✅ XSS protection headers
- ✅ CSRF awareness
- ✅ Secure token handling
- ✅ Protected routes (redirect to login if not authenticated)

## Styling

- **Framework**: Tailwind CSS 4.0
- **Colors**: Custom CSS variables in `globals.css`
- **Responsive**: Mobile-first design

## Technologies Used

- **Next.js 16.2** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4.0** - Styling
- **Lucide React** - Icons (optional)

## API Integration

The frontend communicates with a Flask backend at `http://127.0.0.1:5000/api`

### Key Endpoints

- `POST /login` - User login
- `POST /register` - User registration
- `GET /me` - Current user profile
- `GET /skills` - Available skills
- `POST /profile` - Update profile
- `GET /recommendations` - AI recommendations
- `GET /requests` - User's learning requests
- `POST /requests` - Send learning request
- `PATCH /requests/:id` - Update request status
- `GET /sessions` - User's learning sessions

## Troubleshooting

### API Connection Error
- Verify backend is running on `http://127.0.0.1:5000`
- Check `.env.local` has correct `NEXT_PUBLIC_API_BASE_URL`

### Authentication Issues
- Ensure token is stored in localStorage
- Login page should be accessible even without token
- Token auto-expires - re-login if session expires

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Development

```bash
# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Format code (if configured)
npm run format

# Lint code (if configured)
npm run lint
```

## License

This project is part of LEARNEXA - a student skill exchange platform.
