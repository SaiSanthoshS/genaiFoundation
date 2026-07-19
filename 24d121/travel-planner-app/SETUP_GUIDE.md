# Setup & Configuration Guide

## Pre-Setup Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Anthropic API key obtained from https://console.anthropic.com
- [ ] Git installed (optional, for version control)

## Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd travel-planner-app/backend
```

### Step 2: Install Dependencies
```bash
npm install
```

Expected output should show all packages installing without errors.

### Step 3: Configure Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

Edit `.env` with your text editor:
```
ANTHROPIC_API_KEY=sk-ant-xxx (paste your actual key here)
PORT=5000
NODE_ENV=development
```

### Step 4: Test Backend

Start the server:
```bash
npm start
```

You should see:
```
Travel Planner API server running on http://localhost:5000
```

Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Travel Planner API is running"
}
```

Keep this terminal running, open a new one for frontend.

## Frontend Setup

### Step 1: Navigate to Frontend Directory
```bash
cd travel-planner-app/frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment (Optional)

Create `.env.local` if you need a different API base:
```bash
cp .env.example .env.local
```

Default uses `http://localhost:5000` which is correct for local development.

### Step 4: Start Development Server
```bash
npm run dev
```

You should see:
```
VITE v5.0.x ready in xxx ms

➜  Local:   http://localhost:3000/
```

### Step 5: Open in Browser

Navigate to `http://localhost:3000`

You should see the Travel Planner home page with the "Let's Plan Your Group Trip!" form.

## Verification Steps

### 1. Check Backend is Running
```bash
curl -X GET http://localhost:5000/api/health
```
Should return: `{"status":"ok",...}`

### 2. Check Frontend is Running
Open `http://localhost:3000` - you should see the app loaded

### 3. Test Trip Planning

Fill in the form with test data:
- **Emails**: john@test.com, jane@test.com
- **Departing Cities**: New York, Los Angeles
- **Budget**: 2000
- **Duration**: 5
- **Start Date**: 2024-06-01
- **End Date**: 2024-06-06
- **Vibes**: beach, city

Click "Plan My Trip" and wait 3-8 seconds for the AI agent to process.

You should see the comparison grid with 3 destination options.

## Troubleshooting

### Backend won't start

**Error**: `ANTHROPIC_API_KEY not found`
- **Solution**: Make sure you added the key to `.env`

**Error**: `Port 5000 is already in use`
- **Solution**: Change PORT in `.env` or kill process: `lsof -ti:5000 | xargs kill -9`

**Error**: `npm ERR! Cannot find module`
- **Solution**: Delete `node_modules` and `package-lock.json`, then `npm install` again

### Frontend won't start

**Error**: `VITE error`
- **Solution**: Check Node.js version: `node --version` (should be 18+)

**Error**: `Cannot resolve axios`
- **Solution**: Run `npm install` in frontend directory

### API not connecting

**Error**: Network error when clicking "Plan My Trip"
- **Solution**: Check backend is running on port 5000
- **Solution**: Check CORS - it should be enabled in server.js
- **Solution**: Open browser DevTools (F12) → Console tab for detailed errors

### Claude API errors

**Error**: `401 Unauthorized`
- **Solution**: API key is invalid, get a new one from console.anthropic.com

**Error**: `429 Rate Limited`
- **Solution**: Wait a minute, Claude API has rate limits

**Error**: `500 Internal Server Error`
- **Solution**: Check backend console for error details

## Configuration Details

### Backend Configuration

**server.js** key settings:
- API port: `process.env.PORT || 5000`
- CORS enabled for frontend access
- Session storage: in-memory (use Redis for production)
- Timeout: 30 seconds for agent calls

### Frontend Configuration

**vite.config.js** key settings:
- Dev server port: 3000
- Proxy: `/api` → `http://localhost:5000`
- React plugin enabled

**App.jsx** workflow:
1. InputForm → POST /api/plan-trip
2. ComparisonGrid → Select itinerary
3. ItinerarySelector → Review details
4. BookingPreviewModal → Generate email

## Environment Variables Reference

### Backend (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Required | Your Anthropic API key |
| `PORT` | 5000 | Backend server port |
| `NODE_ENV` | development | Environment (development/production) |

### Frontend (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | http://localhost:5000 | Backend API URL |

## Production Setup

### Using Docker Compose

**Requires**: Docker and Docker Compose installed

```bash
# In project root directory
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Services available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Manual Production Build

**Backend**:
```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

**Frontend**:
```bash
cd frontend
npm run build
npm install -g serve
serve -s dist -l 3000
```

## Next Steps After Setup

1. **Explore the Agent**: Modify `travelAgent.js` to customize agent behavior
2. **Add Real APIs**: Replace mock data in `travelDataService.js`
3. **Customize UI**: Edit React components and CSS
4. **Deploy**: Follow DEPLOYMENT.md for cloud deployment
5. **Monitor**: Set up logging and error tracking

## Getting Help

- **Backend issues**: Check server console for errors
- **Frontend issues**: Open DevTools (F12) and check Console tab
- **API issues**: Test with cURL to isolate problems
- **Claude API issues**: Check API dashboard for rate limits/errors

## Performance Tips

1. **Faster responses**: Cache destinations and weather
2. **Better UX**: Add loading spinners (already implemented)
3. **Scalability**: Use Redis for sessions and caching
4. **Monitoring**: Add logging for all API calls

## Security Notes

- Never commit `.env` file (added to `.gitignore`)
- API keys should always be in environment variables
- Validate all user inputs on backend
- Use HTTPS in production
- Add rate limiting for production

---

**You're now ready to use the Travel Planner!** 🎉

For detailed documentation, see:
- README.md - Full features
- QUICK_START.md - Fast overview
- ARCHITECTURE.md - System design
