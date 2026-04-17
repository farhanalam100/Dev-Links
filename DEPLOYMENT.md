# 🚀 Deploy DevLinks to Netlify

## 📋 Prerequisites
- GitHub account with DevLinks repository
- Netlify account (free tier is fine)

## 🌐 Deployment Options

### Option 1: Netlify Drop (Easiest)
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your entire `Dev-Links` folder onto the drop zone
3. Your site will be live at `https://your-site-name.netlify.app`

### Option 2: GitHub Integration (Recommended)
1. **Connect GitHub**:
   - Go to Netlify dashboard
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and authorize access
   - Select your `Dev-Links` repository

2. **Configure Build Settings**:
   - Build command: Leave blank (static site)
   - Publish directory: `.` (root directory)
   - Click "Deploy site"

3. **Automatic Deployments**:
   - Every push to GitHub will auto-deploy
   - Your site URL: `https://dev-links.netlify.app`

### Option 3: Netlify CLI (Advanced)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from your project folder
cd "c:\Users\Farhan\Desktop\Dev-Links"
netlify deploy --prod --dir=.
```

## 🔧 Configuration Files

### netlify.toml (Create this file in root)
```toml
[build]
  publish = "."

[build.environment]
  NODE_VERSION = "18"
```

### _redirects file (Optional - for clean URLs)
```
# Redirect server.html to root
/server.html  /
```

## 🌍 Your Live URLs

After deployment, your DevLinks will be accessible at:
- **Primary**: `https://dev-links.netlify.app`
- **Custom**: Your own domain if configured

## ✅ Verification Checklist
- [ ] All pages load correctly
- [ ] Theme toggle works
- [ ] Search functionality works
- [ ] Cards display properly
- [ ] Mobile responsive
- [ ] No console errors

## 🔄 Updates
- Push to GitHub → Auto-deploy to Netlify
- Manual deploy via Netlify dashboard anytime

## 📞 Support
- Netlify docs: https://docs.netlify.com
- GitHub repo: https://github.com/farhanalam100/Dev-Links
