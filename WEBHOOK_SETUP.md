# Webhook Setup Guide

## Local Development with ngrok

### 1. Install ngrok

```bash
# Using Homebrew (macOS)
brew install ngrok

# Or download from https://ngrok.com/download
```

### 2. Start your Django server

```bash
cd /Users/hafsahnasir/Developer/psifi_portal
python manage.py runserver
```

### 3. In a new terminal, start ngrok

```bash
ngrok http 8000
```

### 4. Copy the ngrok URL

You'll see output like:

```
Forwarding    https://abc123.ngrok.io -> http://localhost:8000
```

### 5. Configure Cognito Forms webhook

- Go to your form's Settings
- Check "Post JSON Data to a Website"
- Set Submit Entry Endpoint to: `https://abc123.ngrok.io/api/create-payment/`

**Note:** Free ngrok URLs change every time you restart ngrok. For a permanent URL, upgrade to a paid plan or deploy your app.

---

## Production Deployment Options

Once you're ready to deploy:

### Option 1: Railway (Free tier available)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 2: Render (Free tier available)

- Push your code to GitHub
- Connect GitHub repo to Render
- Set environment variables (PAYMO_API_KEY, PAYMO_API_SECRET)
- Deploy automatically

### Option 3: Heroku (Paid only now)

```bash
heroku create your-app-name
git push heroku main
heroku config:set PAYMO_API_KEY=your_key
heroku config:set PAYMO_API_SECRET=your_secret
```

---

## Webhook vs Current Approach

### Current (iframe + JavaScript):

```
User submits form → Cognito Form → afterSubmit event → JavaScript → Your API
```

### Webhook (recommended):

```
User submits form → Cognito Form → Directly calls your API
```

**Benefits:**

- More reliable (Cognito handles retries)
- No client-side dependencies
- Works even if user closes browser
- Automatic retry up to 15 times over 72 hours

---

## Testing Webhooks

### Using webhook.site (for inspection):

1. Go to https://webhook.site
2. Copy the unique URL
3. Set it as your Cognito webhook endpoint
4. Submit a test form
5. View the raw JSON payload at webhook.site
6. Use this to verify field names and structure

---

## Keeping Both Approaches (Hybrid)

You can keep both working:

1. **Webhook** (primary): Reliable payment creation
2. **iframe callback** (secondary): Immediate redirect for UX

Update your `embed_cognito.html` to handle this:

```javascript
window.addEventListener("afterSubmit.cognito", function (event) {
  // Just redirect - webhook will handle payment
  window.location.href = "/dashboard/";
});
```

The webhook will create the payment in the background, and the user gets redirected immediately.
