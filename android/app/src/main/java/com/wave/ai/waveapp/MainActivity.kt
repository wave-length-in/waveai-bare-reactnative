package com.wave.ai.waveapp

import expo.modules.splashscreen.SplashScreenManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import org.json.JSONObject

class MainActivity : ReactActivity() {
  
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    
    super.onCreate(null)
    
    // Handle notification click intent
    handleNotificationIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    handleNotificationIntent(intent)
  }

  private fun handleNotificationIntent(intent: Intent?) {
    try {
      if (intent == null) {
        Log.d(TAG, "🔔 Intent is null")
        return
      }
      
      Log.d(TAG, "🔔 Intent received - action: ${intent.action}")
      Log.d(TAG, "🔔 Intent extras: ${intent.extras}")
      
      val notificationClicked = intent.getBooleanExtra("notification_clicked", false)
      val clickAction = intent.getStringExtra("clickAction")
      val hasNotificationData = intent.hasExtra("action") || intent.hasExtra("type") || intent.hasExtra("route")
      
      Log.d(TAG, "🔔 Intent received - notification_clicked: $notificationClicked, clickAction: $clickAction, hasNotificationData: $hasNotificationData")
      
      // Handle notification clicks from our service or from FCM with OPEN_CHAT action
      if (notificationClicked || clickAction == "OPEN_CHAT" || hasNotificationData) {
        val route = intent.getStringExtra("route") ?: "/(main)/chat/default"
        val action = intent.getStringExtra("action") ?: ""
        val type = intent.getStringExtra("type") ?: ""
        
        Log.d(TAG, "🔔 Notification clicked detected!")
        Log.d(TAG, "🔔 Route: $route, Action: $action, Type: $type")
        
        // Create JSON object with notification data
        val navigationData = JSONObject().apply {
          put("route", route)
          put("action", action)
          put("type", type)
          put("timestamp", System.currentTimeMillis())
          put("source", "android_notification")
        }
        
        // Store in SharedPreferences for React Native to read
        val sharedPrefs = getSharedPreferences("notification_prefs", Context.MODE_PRIVATE)
        sharedPrefs.edit()
          .putString("android_notification_click", navigationData.toString())
          .apply()
        
        Log.d(TAG, "🔔 Stored navigation data: $navigationData")
      }
    } catch (e: Exception) {
      Log.e(TAG, "🔔 Error handling notification intent", e)
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      object : DefaultReactActivityDelegate(
        this,
        mainComponentName,
        fabricEnabled
      ) {}
    )
  }

  /**
   * Align the back button behavior with Android S
   * where moving root activities to background instead of finishing activities.
   * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
   */
  override fun invokeDefaultOnBackPressed() {
    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
      if (!moveTaskToBack(false)) {
        // For non-root activities, use the default implementation to finish them.
        super.invokeDefaultOnBackPressed()
      }
      return
    }

    // Use the default back button implementation on Android S
    // because it's doing more than [Activity.moveTaskToBack] in fact.
    super.invokeDefaultOnBackPressed()
  }

  companion object {
    private const val TAG = "WaveMainActivity"
  }
}