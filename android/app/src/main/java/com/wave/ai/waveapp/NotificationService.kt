package com.wave.ai.waveapp

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class NotificationService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM token: $token")
        // Token will be sent to backend via the JS layer
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "🔔 FCM message received from: ${remoteMessage.from}")
        Log.d(TAG, "🔔 Message ID: ${remoteMessage.messageId}")
        Log.d(TAG, "🔔 Has notification payload: ${remoteMessage.notification != null}")
        Log.d(TAG, "🔔 Has data payload: ${remoteMessage.data.isNotEmpty()}")

        // Check if message contains data payload
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "🔔 Message data payload: ${remoteMessage.data}")
        }

        // Check if message contains notification payload
        remoteMessage.notification?.let { notification ->
            Log.d(TAG, "🔔 Message notification body: ${notification.body}")
            Log.d(TAG, "🔔 Message notification title: ${notification.title}")
            Log.d(TAG, "🔔 Creating custom notification...")
            
            // Always use custom sound and ignore server sound setting
            Log.d(TAG, "🔔 Ignoring server sound setting, using custom sound.wav")
            
            // Use default values to avoid compilation issues
            sendNotification(
                notification.title ?: "Wave AI", 
                notification.body ?: "New message",
                remoteMessage.data,
                "chat_channel", // Use chat_channel from server
                "OPEN_CHAT" // Use OPEN_CHAT action from server
            )
        } ?: run {
            Log.d(TAG, "🔔 No notification payload found")
        }

        // Handle data-only messages
        if (remoteMessage.data.isNotEmpty() && remoteMessage.notification == null) {
            Log.d(TAG, "🔔 Data-only message received")
            sendNotification(
                "Wave AI",
                "New message",
                remoteMessage.data
            )
        }
    }

    private fun sendNotification(title: String, messageBody: String, data: Map<String, String> = emptyMap(), channelId: String? = null, clickAction: String? = null) {
        Log.d(TAG, "🔔 Sending notification: title=$title, body=$messageBody, data=$data")
        
        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        
        // Add notification data to intent
        data.forEach { (key, value) ->
            intent.putExtra(key, value)
            Log.d(TAG, "🔔 Added intent extra: $key = $value")
        }
        
        // Add deep link to navigate to chat screen when notification is clicked
        intent.putExtra("route", "/(main)/chat/default")
        intent.putExtra("notification_clicked", true)
        
        // Add clickAction from FCM if available
        clickAction?.let { action ->
            intent.putExtra("clickAction", action)
            Log.d(TAG, "🔔 Added clickAction: $action")
        }
        
        Log.d(TAG, "🔔 Added notification click intent extras")

        val pendingIntent = PendingIntent.getActivity(
            this, 
            System.currentTimeMillis().toInt(), 
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // Use the channel ID from server or default
        val finalChannelId = channelId ?: getString(R.string.default_notification_channel_id)
        // Use custom sound file
        val customSoundUri = Uri.parse("android.resource://" + packageName + "/raw/sound")
        Log.d(TAG, "🔔 Using custom sound URI: $customSoundUri")
        Log.d(TAG, "🔔 Channel ID: $finalChannelId")

        val notificationBuilder = NotificationCompat.Builder(this, finalChannelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(messageBody)
            .setAutoCancel(true)
            .setSound(customSoundUri)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_VIBRATE) // Keep vibration, disable default sound

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create notification channel for Android O and above
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Delete existing channel to force recreation with custom sound
            notificationManager.deleteNotificationChannel(finalChannelId)
            
            val channel = NotificationChannel(
                finalChannelId,
                "Wave AI Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications from Wave AI"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 250, 250)
                // Force custom sound - ignore server settings completely
                setSound(customSoundUri, AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build())
                setShowBadge(true)
                enableLights(true)
                lightColor = Color.BLUE
                // Ensure sound bypasses DND
                setBypassDnd(true)
                // Set importance to HIGH to ensure sound plays
                importance = NotificationManager.IMPORTANCE_HIGH
            }
            notificationManager.createNotificationChannel(channel)
            Log.d(TAG, "🔔 Notification channel '$finalChannelId' created with forced custom sound")
        }

        val notificationId = System.currentTimeMillis().toInt()
        notificationManager.notify(notificationId, notificationBuilder.build())
        Log.d(TAG, "🔔 Notification sent with ID: $notificationId")
        Log.d(TAG, "🔔 PendingIntent created with intent: ${intent.action}")
        Log.d(TAG, "🔔 Intent extras: ${intent.extras}")
    }

    companion object {
        private const val TAG = "WaveNotificationService"
    }
}

