# Quantified Self Dashboard

A personal health and wellness dashboard that integrates with Oura Ring and other health data sources. Built with Node.js, TypeScript, React, and Material-UI.

## Features

- 🔐 **Secure Authentication** with 2FA
- 📊 **Oura Ring Integration** - Real-time health data
- 📈 **Interactive Dashboards** with charts and trends
- 🎨 **Modern UI** with Material-UI components
- 🔄 **OAuth 2.0 Flow** for secure API access
- 📱 **Responsive Design** for all devices

## Tech Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** for API server
- **JWT** for authentication
- **Winston** for logging
- **Helmet** for security
- **CORS** and rate limiting

### Frontend
- **React** with TypeScript
- **Material-UI** v5 for components
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API calls

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Oura Ring account and API credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd quantified-self
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=3001
   JWT_SECRET=your-jwt-secret
   
   # Oura Ring API Configuration
   OURA_CLIENT_ID=your-oura-client-id
   OURA_CLIENT_SECRET=your-oura-client-secret
   OURA_REDIRECT_URI=http://localhost:3001/api/auth/oura/callback
   
   # Email Configuration (for 2FA)
   SMTP_HOST=smtp.your-provider.com
   SMTP_PORT=587
   SMTP_USER=your-email@domain.com
   SMTP_PASS=your-email-password
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Backend server
   npm run dev:server
   
   # Terminal 2: Frontend app
   npm run dev:client
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Oura Ring Setup

1. **Create Oura App**
   - Go to [Oura Cloud](https://cloud.ouraring.com/)
   - Create a new application
   - Set redirect URI to: `http://localhost:3001/api/auth/oura/callback`

2. **Get API Credentials**
   - Copy your Client ID and Client Secret
   - Add them to your `.env` file

3. **Connect Your Ring**
   - Login to the dashboard
   - Click "Connect Oura Ring"
   - Authorize the application

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-2fa` - 2FA verification
- `GET /api/auth/verify` - Token verification

### Oura Integration
- `GET /api/oura/auth/url` - Get OAuth URL
- `GET /api/auth/oura/callback` - OAuth callback
- `GET /api/oura/status` - Connection status
- `GET /api/oura/daily` - Daily activity data
- `GET /api/oura/sleep` - Sleep data
- `GET /api/oura/heartrate` - Heart rate data

### Dashboard
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/sleep-analysis` - Sleep analysis
- `GET /api/dashboard/activity-analysis` - Activity analysis

## Project Structure

```
quantified-self/
├── src/
│   └── server/
│       ├── index.ts              # Server entry point
│       ├── routes/               # API routes
│       ├── services/             # Business logic
│       ├── middleware/           # Express middleware
│       └── utils/                # Utilities
├── client/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── contexts/             # React contexts
│   │   └── App.tsx               # Main app component
│   └── package.json
├── package.json                  # Root package.json
└── README.md
```

## Development

### Available Scripts

```bash
# Install all dependencies
npm run install:all

# Development
npm run dev              # Start both servers
npm run dev:server       # Start backend only
npm run dev:client       # Start frontend only

# Build
npm run build            # Build both
npm run build:server     # Build backend
npm run build:client     # Build frontend

# Production
npm start                # Start production server
```

### Code Style

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Material-UI for consistent UI components

## Security Features

- **2FA Authentication** - Two-factor authentication required
- **JWT Tokens** - Secure session management
- **Rate Limiting** - API rate limiting
- **CORS Protection** - Cross-origin request protection
- **Helmet Security** - Security headers
- **Input Validation** - Request validation

## Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables

Make sure to set all required environment variables in production:
- `NODE_ENV=production`
- `JWT_SECRET` (strong secret)
- `OURA_CLIENT_ID` and `OURA_CLIENT_SECRET`
- `OURA_REDIRECT_URI` (production URL)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the documentation
- Review the code comments
- Open an issue on GitHub

---

**Note**: This is a personal dashboard application. Ensure you have proper authorization to access and store health data. 