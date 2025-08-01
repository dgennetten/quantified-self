# Quantified Self Dashboard

A personal health and wellness dashboard that integrates with various data sources including Oura Ring, Rivian, Xcel smart meter, BMI scale, weather, and investments. Built with Node.js, TypeScript, and React.

## Features

- 🔐 **Secure 2FA Authentication** - Restricted to authorized email addresses
- 📊 **Oura Ring Integration** - Real-time health metrics and sleep analysis
- 📈 **Interactive Charts** - Beautiful visualizations using Recharts
- 🎨 **Modern UI** - Dark theme with Material-UI components
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔄 **Real-time Data** - Live updates from connected devices
- 📋 **Trend Analysis** - Historical data insights and recommendations

## Tech Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** for API server
- **JWT** for authentication
- **Axios** for HTTP requests
- **Winston** for logging
- **Helmet** for security

### Frontend
- **React** with TypeScript
- **Material-UI** for components
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API calls

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Oura Ring account with API access

## Installation

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
   cp env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   
   # Oura Ring API Configuration
   OURA_CLIENT_ID=your-oura-client-id
   OURA_CLIENT_SECRET=your-oura-client-secret
   OURA_REDIRECT_URI=http://localhost:3001/api/auth/oura/callback
   
   # Allowed Email for 2FA
   ALLOWED_EMAIL=douglas@gennetten.com
   ```

4. **Set up Oura Ring API**
   - Go to [Oura Cloud](https://cloud.ouraring.com/)
   - Create a new application
   - Get your Client ID and Client Secret
   - Add the redirect URI: `http://localhost:3001/api/auth/oura/callback`

## Running the Application

### Development Mode

1. **Start the server**
   ```bash
   npm run dev:server
   ```

2. **Start the client** (in a new terminal)
   ```bash
   npm run dev:client
   ```

3. **Or run both simultaneously**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Usage

### Authentication

1. Navigate to the login page
2. Enter your email (must be `douglas@gennetten.com`)
3. Enter your password
4. Complete 2FA verification with the code sent to your email
5. Access your personalized dashboard

### Dashboard Features

- **Today's Overview**: View current day's health metrics
- **7-Day Trends**: Track your progress over the past week
- **Weekly Averages**: Compare performance across weeks
- **Insights**: Get personalized recommendations based on your data

### Oura Ring Integration

The dashboard automatically fetches and displays:
- Sleep Score
- Activity Score
- Readiness Score
- Heart Rate Variability (HRV)
- Sleep duration and efficiency
- Step count and calorie burn

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-2fa` - 2FA verification
- `GET /api/auth/verify` - Token verification

### Oura Data
- `GET /api/oura/daily` - Daily activity data
- `GET /api/oura/sleep` - Sleep data
- `GET /api/oura/heartrate` - Heart rate data
- `GET /api/oura/weekly` - Weekly averages
- `GET /api/oura/today` - Today's summary

### Dashboard
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/sleep-analysis` - Sleep analysis
- `GET /api/dashboard/activity-analysis` - Activity analysis

## Deployment

### Dreamhost Setup

1. **Upload your code** to your Dreamhost server
2. **Set environment variables** in production
3. **Install dependencies**:
   ```bash
   npm install --production
   cd client && npm install --production
   ```
4. **Build the application**:
   ```bash
   npm run build
   ```
5. **Configure your web server** to serve the application
6. **Set up SSL certificates** for secure access

### Environment Variables for Production

Make sure to update these in production:
- `NODE_ENV=production`
- `JWT_SECRET` - Use a strong, unique secret
- `OURA_CLIENT_ID` and `OURA_CLIENT_SECRET`
- `OURA_REDIRECT_URI` - Update to your production domain

## Security Features

- **2FA Authentication** - Two-factor authentication required
- **Email Restriction** - Only authorized emails can access
- **JWT Tokens** - Secure session management
- **Rate Limiting** - API rate limiting to prevent abuse
- **CORS Protection** - Cross-origin request protection
- **Helmet Security** - Security headers and protection

## Future Enhancements

- [ ] Rivian vehicle data integration
- [ ] Xcel smart meter energy usage
- [ ] BMI scale weight tracking
- [ ] Weather data correlation
- [ ] Investment portfolio tracking
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Email notifications
- [ ] Mobile app
- [ ] Data export functionality
- [ ] Advanced analytics and machine learning insights

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support or questions, please contact douglas@gennetten.com

---

**Note**: This is a personal dashboard application. Make sure to secure your API keys and tokens properly in production environments. 