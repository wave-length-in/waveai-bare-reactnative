package com.wave.ai.waveapp

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.util.Log

class SharedPreferencesBridge(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SharedPreferencesBridge"
    }

    @ReactMethod
    fun getNotificationData(promise: Promise) {
        try {
            val sharedPrefs = reactApplicationContext.getSharedPreferences("notification_prefs", Context.MODE_PRIVATE)
            val data = sharedPrefs.getString("android_notification_click", null)
            
            Log.d("SharedPreferencesBridge", "🔔 Retrieved notification data: $data")
            
            if (data != null) {
                promise.resolve(data)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            Log.e("SharedPreferencesBridge", "🔔 Error getting notification data", e)
            promise.reject("ERROR", "Failed to get notification data", e)
        }
    }

    @ReactMethod
    fun clearNotificationData(promise: Promise) {
        try {
            val sharedPrefs = reactApplicationContext.getSharedPreferences("notification_prefs", Context.MODE_PRIVATE)
            sharedPrefs.edit().remove("android_notification_click").apply()
            
            Log.d("SharedPreferencesBridge", "🔔 Cleared notification data")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("SharedPreferencesBridge", "🔔 Error clearing notification data", e)
            promise.reject("ERROR", "Failed to clear notification data", e)
        }
    }
}
