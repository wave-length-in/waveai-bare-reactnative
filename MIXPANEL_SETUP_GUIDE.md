# Mixpanel Analytics Setup Guide

## ✅ Setup Complete!

Your Mixpanel analytics has been successfully integrated into your WaveAI app. Here's what has been implemented:

## 🔧 Configuration Required

### 1. Set Your Mixpanel Token

You need to set your Mixpanel token in your environment variables. Since .env files are blocked, you have two options:

#### Option A: Set Environment Variable
```bash
# Add this to your shell profile (.bashrc, .zshrc, etc.)
export EXPO_PUBLIC_MIXPANEL_TOKEN="your_actual_mixpanel_token_here"
```

#### Option B: Update the Service Directly
Edit `services/analytics.ts` and replace:
```typescript
const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || 'your_mixpanel_token_here';
```
with:
```typescript
const MIXPANEL_TOKEN = 'your_actual_mixpanel_token_here';
```

### 2. Get Your Mixpanel Token
1. Go to [Mixpanel Dashboard](https://mixpanel.com)
2. Select your project
3. Go to Project Settings → Access Keys
4. Copy your Project Token

## 📊 Events Being Tracked

Following the [official Mixpanel React Native documentation](https://docs.mixpanel.com/docs/tracking-methods/sdks/react-native):

### User Identity Management
- ✅ **User Identification** - Properly identifies users with `identify()` method
- ✅ **User Profiles** - Sets user profile properties using `getPeople().set()`
- ✅ **User Reset** - Clears user data on logout using `reset()` method
- ✅ **Opt-in/Opt-out** - Privacy controls for user tracking

### Authentication Events
- ✅ **User Login** - Tracks login method (Google, OTP) and user ID
- ✅ **User Signup** - Tracks signup method and user ID

### Chat Events
- ✅ **Chat Initiated** - When user starts chatting with a character
- ✅ **Message Sent** - Text, audio, and image messages with metadata
- ✅ **AI Response Received** - When AI responds to user messages
- ✅ **Voice Recording** - Start, stop, cancel voice recording
- ✅ **Image Upload** - Success/failure of image uploads

### Navigation Events
- ✅ **Page Views** - All major screens (Login, Onboarding, Chat)
- ✅ **Navigation** - Route changes and redirects

### User Interaction Events
- ✅ **Button Clicks** - All interactive buttons with context
- ✅ **Feature Usage** - Voice recording, image upload, etc.

## 🎯 Event Examples

### Login Event
```javascript
{
  event: "User Login",
  properties: {
    login_method: "google", // or "otp"
    user_id: "user123",
    platform: "ios",
    timestamp: "2024-01-15T10:30:00Z"
  }
}
```

### Chat Message Event
```javascript
{
  event: "Message Sent",
  properties: {
    message_type: "text", // or "audio", "image"
    character_id: "688210873496b5e441480d22",
    message_length: 25,
    platform: "ios",
    timestamp: "2024-01-15T10:30:00Z"
  }
}
```

### AI Response Event
```javascript
{
  event: "AI Response Received",
  properties: {
    character_id: "688210873496b5e441480d22",
    response_time_ms: 2500,
    platform: "ios",
    timestamp: "2024-01-15T10:30:00Z"
  }
}
```

## 🔍 Analytics Dashboard

Once configured, you can view your analytics in the Mixpanel dashboard:

1. **Funnels** - Track user journey from onboarding to chat
2. **Retention** - See how often users return
3. **Cohorts** - Analyze user behavior patterns
4. **Insights** - Get automated insights about user behavior

## 🚀 Key Metrics to Monitor

### User Engagement
- Daily/Monthly Active Users
- Session duration
- Messages per session
- Feature adoption rates

### Chat Performance
- AI response times
- Message success rates
- Voice vs text usage
- Image upload success rates

### User Journey
- Onboarding completion rate
- Login method preferences
- Navigation patterns
- Drop-off points

## 🛠️ Custom Events

You can add custom events anywhere in your app:

```typescript
import { trackEvent, identifyUser, setUserProperties, resetUser } from '@/services/analytics';

// Track custom event
trackEvent('Custom Event Name', {
  custom_property: 'value',
  user_segment: 'premium'
});

// Identify user and set profile properties
identifyUser('user123', {
  email: 'user@example.com',
  name: 'John Doe',
  plan: 'premium'
});

// Set user properties only if they don't exist
setUserPropertiesOnce({
  first_login_date: new Date().toISOString()
});

// Reset user data on logout
resetUser();
```

## 📱 Platform Support

- ✅ **iOS** - Full support
- ✅ **Android** - Full support
- ✅ **Web** - Full support (if applicable)

## 🔧 Troubleshooting

### Events Not Appearing
1. Check your Mixpanel token is correct
2. Verify network connectivity
3. Check console logs for error messages
4. Ensure Mixpanel project is active

### Common Issues
- **Token not set**: Events will be logged to console but not sent to Mixpanel
- **Network issues**: Events are queued and sent when connection is restored
- **Invalid token**: Check Mixpanel dashboard for project token

## 📈 Next Steps

1. **Set your Mixpanel token** (see Configuration section above)
2. **Test the integration** by using the app and checking Mixpanel dashboard
3. **Set up funnels** to track key user journeys
4. **Create cohorts** to segment users
5. **Set up alerts** for important metrics

Your analytics are now ready to provide valuable insights into user behavior! 🎉
