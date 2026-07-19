# Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Anthropic API key

### Setup

1. **Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY
npm start
```

2. **Frontend** (in another terminal)
```bash
cd frontend
npm install
npm run dev
```

3. Open `http://localhost:3000` in your browser

## Docker Deployment

### Build Images
```bash
docker-compose build
```

### Run Containers
```bash
docker-compose up -d
```

Services will be available at:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

### Stop Containers
```bash
docker-compose down
```

## Cloud Deployment

### Heroku (Backend)

1. **Create Heroku app**
```bash
heroku create your-travel-planner-api
```

2. **Set environment variables**
```bash
heroku config:set ANTHROPIC_API_KEY=your_key_here
```

3. **Deploy**
```bash
git push heroku main
```

### Vercel (Frontend)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
cd frontend
vercel
```

3. **Configure environment**
- Set `VITE_API_BASE_URL` to your Heroku backend URL

### AWS Lambda + API Gateway (Backend)

1. **Install Serverless Framework**
```bash
npm i -g serverless
```

2. **Configure credentials**
```bash
serverless config credentials --provider aws --key xxx --secret xxx
```

3. **Deploy**
```bash
cd backend
serverless deploy
```

### Google Cloud Run (Backend)

1. **Build image**
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/travel-planner-backend
```

2. **Deploy**
```bash
gcloud run deploy travel-planner-backend \
  --image gcr.io/PROJECT_ID/travel-planner-backend \
  --set-env-vars ANTHROPIC_API_KEY=your_key_here \
  --platform managed \
  --region us-central1
```

### Azure Container Instances (Backend)

1. **Create resource group**
```bash
az group create --name travel-planner --location eastus
```

2. **Create container**
```bash
az container create \
  --resource-group travel-planner \
  --name travel-planner-backend \
  --image travel-planner-backend \
  --environment-variables ANTHROPIC_API_KEY=your_key_here \
  --ports 5000
```

## Production Checklist

### Backend
- [ ] Set up proper logging (Winston, Bunyan)
- [ ] Configure CORS properly (whitelist frontend domain)
- [ ] Add rate limiting (express-rate-limit)
- [ ] Set up error tracking (Sentry)
- [ ] Configure database for session storage (MongoDB, PostgreSQL)
- [ ] Enable HTTPS/TLS
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Set environment variables securely

### Frontend
- [ ] Build optimization (tree shaking, code splitting)
- [ ] Enable CDN caching
- [ ] Configure environment for production
- [ ] Set up analytics (Google Analytics, Mixpanel)
- [ ] Test all pages and flows
- [ ] Configure error reporting
- [ ] Set up monitoring
- [ ] Test on different browsers/devices

### Infrastructure
- [ ] Set up CI/CD pipeline (GitHub Actions, GitLab CI)
- [ ] Configure auto-scaling
- [ ] Set up load balancing
- [ ] Configure SSL/TLS certificates
- [ ] Set up automated backups
- [ ] Configure monitoring and alerting
- [ ] Set up log aggregation
- [ ] Document deployment process

## Performance Optimization

### Backend
```javascript
// Add caching for destination recommendations
const cache = new Map();

// Add compression
const compression = require('compression');
app.use(compression());

// Add rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Add database connection pooling
// Add response caching headers
```

### Frontend
```javascript
// vite.config.js optimization
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'axios': ['axios']
        }
      }
    },
    minify: 'terser',
    sourcemap: false
  }
}
```

## Monitoring & Analytics

### Backend Monitoring
- API response times
- Error rates
- Claude API call latency
- Cost tracking
- Active sessions

### Frontend Monitoring
- Page load times
- Error rates
- User interactions
- Browser compatibility issues

### Recommended Tools
- Datadog
- New Relic
- AWS CloudWatch
- Google Cloud Monitoring
- Azure Monitor
- Sentry

## Scaling Strategy

### Horizontal Scaling
1. Load balancer (nginx, AWS ELB)
2. Multiple backend instances
3. Session storage in Redis/MongoDB
4. Database connection pooling

### Vertical Scaling
1. Upgrade server resources
2. Optimize database queries
3. Cache frequently used data
4. Implement CDN for static assets

### Database Scaling
1. Read replicas
2. Sharding by destination
3. Archive old sessions
4. Implement data retention policy

## Troubleshooting Deployments

### Backend Issues
```bash
# Check logs
docker logs travel-planner-backend

# Verify environment variables
docker exec travel-planner-backend env

# Test API
curl http://localhost:5000/api/health
```

### Frontend Issues
```bash
# Check build output
npm run build

# Verify environment variables
cat .env

# Test on different ports
npm run dev -- --port 3001
```

### Claude API Issues
- Verify API key is valid
- Check rate limits
- Monitor token usage
- Implement retry logic
- Use exponential backoff

## Disaster Recovery

1. **Backup Strategy**
   - Daily database backups
   - Backup session data
   - Version control for code

2. **Recovery Plan**
   - Documented runbook
   - Test recovery procedures
   - Maintain backup infrastructure

3. **High Availability**
   - Multiple instances
   - Database replication
   - Failover procedures

## Cost Optimization

1. **Claude API Costs**
   - Batch similar requests
   - Cache results
   - Monitor token usage
   - Use appropriate model size

2. **Infrastructure Costs**
   - Use spot instances
   - Auto-scaling policies
   - Reserved capacity
   - CDN optimization

3. **Monitoring Costs**
   - Sample logs (not 100%)
   - Adjust retention policies
   - Aggregate metrics

## Support & Maintenance

- Set up support email/channel
- Document common issues
- Create FAQ
- Regular security updates
- Performance optimization
- Feature releases schedule
