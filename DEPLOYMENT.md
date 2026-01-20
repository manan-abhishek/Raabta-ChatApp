# Deployment Guide - Raabta Chat Application

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] MongoDB database set up (local or Atlas)
- [ ] Backend tested and working locally
- [ ] Frontend builds successfully
- [ ] No hardcoded localhost URLs
- [ ] CORS configured correctly
- [ ] Security best practices followed

## 🔧 Backend Deployment

### Option 1: Heroku

1. **Install Heroku CLI** (if not already installed)

2. **Create Heroku App**
   ```bash
   cd Backend
   heroku create your-app-name
   ```

3. **Add MongoDB Atlas**
   - Create MongoDB Atlas account
   - Create cluster and database
   - Get connection string
   - Add to Heroku config vars

4. **Set Environment Variables**
   ```bash
   heroku config:set MONGO_URI="your_mongodb_atlas_uri"
   heroku config:set JWT_SECRET="your_production_jwt_secret"
   heroku config:set FRONTEND_URL="https://your-frontend-domain.com"
   heroku config:set NODE_ENV="production"
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 2: Railway / Render / DigitalOcean

1. **Connect Repository**
   - Connect your GitHub repository
   - Set root directory to `Backend`

2. **Configure Environment Variables**
   - `MONGO_URI`: MongoDB connection string
   - `JWT_SECRET`: Strong random string
   - `FRONTEND_URL`: Your frontend URL
   - `NODE_ENV`: `production`
   - `PORT`: Usually auto-assigned

3. **Build Settings**
   - Build Command: `npm install`
   - Start Command: `npm start`

### Option 3: VPS (DigitalOcean, AWS EC2, etc.)

1. **SSH into your server**

2. **Install Node.js and MongoDB**
   ```bash
   # Install Node.js (using nvm recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

3. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd "Chat Application/Backend"
   npm install --production
   ```

4. **Create .env file**
   ```env
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=https://your-frontend-domain.com
   NODE_ENV=production
   PORT=5000
   ```

5. **Use PM2 for Process Management**
   ```bash
   npm install -g pm2
   pm2 start server.js --name raabta-backend
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx (Reverse Proxy)**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd Frontend
   vercel
   ```

3. **Configure Environment Variables**
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Add:
     - `VITE_API_URL`: https://api.yourdomain.com/api
     - `VITE_SOCKET_URL`: https://api.yourdomain.com

4. **Redeploy** after adding environment variables

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and Deploy**
   ```bash
   cd Frontend
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Configure Environment Variables**
   - Netlify Dashboard → Site Settings → Environment Variables
   - Add `VITE_API_URL` and `VITE_SOCKET_URL`

### Option 3: Static Hosting (GitHub Pages, etc.)

1. **Update vite.config.js** for production base path if needed

2. **Build**
   ```bash
   npm run build
   ```

3. **Deploy `dist/` folder** to your hosting service

## 🔐 Security Checklist

- [ ] Use strong `JWT_SECRET` (random string, at least 32 characters)
- [ ] Use MongoDB Atlas with IP whitelist
- [ ] Enable HTTPS (SSL certificates)
- [ ] Set secure CORS origins (not `*`)
- [ ] Use environment variables for all secrets
- [ ] Never commit `.env` files
- [ ] Use rate limiting in production
- [ ] Enable MongoDB authentication

## 🌐 Production Environment Variables

### Backend
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/raabta?retryWrites=true&w=majority
JWT_SECRET=your_super_secure_random_string_at_least_32_chars
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
PORT=5000
```

### Frontend
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
```

## ✅ Post-Deployment Verification

1. **Test Backend Health**
   ```bash
   curl https://api.yourdomain.com/api/health
   ```

2. **Test Frontend**
   - Open frontend URL in browser
   - Try login/register
   - Test real-time messaging
   - Check Socket.IO connection

3. **Monitor Logs**
   - Backend: Check Heroku/Railway/Render logs
   - Frontend: Check browser console for errors

## 🐛 Troubleshooting

### Backend Issues
- **Connection refused**: Check MongoDB URI and network access
- **CORS errors**: Verify `FRONTEND_URL` matches actual frontend URL
- **JWT errors**: Ensure `JWT_SECRET` is set correctly

### Frontend Issues
- **API calls failing**: Check `VITE_API_URL` is correct
- **Socket.IO not connecting**: Verify `VITE_SOCKET_URL` matches backend
- **Build fails**: Check Node.js version (v16+)

## 📊 Monitoring Recommendations

- Use PM2 for process management on VPS
- Set up error tracking (Sentry, etc.)
- Monitor MongoDB Atlas metrics
- Set up uptime monitoring
- Configure log aggregation

---

**Note**: Always test thoroughly in a staging environment before deploying to production.
