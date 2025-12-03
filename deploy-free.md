# Free Deployment Options

## 🚀 Recommended: Vercel + Railway (Best Free Combo)

### Frontend: Vercel (FREE)
- **Cost**: $0/month
- **Limits**: 100GB bandwidth, 1000 functions/month
- **Perfect for**: Next.js apps

**Deploy Steps:**
1. Connect GitHub repo to Vercel
2. Auto-deploys on git push
3. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app/api`

### Backend: Railway (FREE with $5 credit)
- **Cost**: $5/month credit (enough for small apps)
- **Limits**: 512MB RAM, 1GB disk
- **Perfect for**: Python Flask apps

**Deploy Steps:**
1. Connect GitHub repo to Railway
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `python app.py`
4. Set PORT environment variable

---

## 🛩️ Alternative: Vercel + Fly.io

### Backend: Fly.io (FREE)
- **Cost**: $0/month (with limits)
- **Limits**: 3 shared CPUs, 256MB RAM, 1GB disk
- **Perfect for**: Simple Python apps

**Deploy Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. `fly launch` (follow prompts)
3. `fly deploy`

---

## 📋 Comparison Table

| Service | Frontend Cost | Backend Cost | Setup Difficulty | Scaling |
|---------|---------------|--------------|------------------|---------|
| **Vercel + Railway** | FREE | $5/month | Easy | Good |
| **Vercel + Fly.io** | FREE | FREE | Medium | Limited |
| **Render Blueprint** | $7/month | $7/month | Easy | Excellent |

---

## 🎯 Quick Start (Vercel + Railway)

### 1. Deploy Frontend to Vercel
```bash
# Connect your GitHub repo to Vercel
# It will auto-detect Next.js and deploy
```

### 2. Deploy Backend to Railway
```bash
# Connect your GitHub repo to Railway
# Set root directory to: backend/
# Railway will auto-detect Python and deploy
```

### 3. Update Frontend Environment
In Vercel dashboard, add environment variable:
```
NEXT_PUBLIC_API_URL=https://your-railway-project.up.railway.app/api
```

**That's it!** Your app will be live on free tiers! 🎉
