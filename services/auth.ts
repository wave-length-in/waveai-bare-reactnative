import { API_URL } from "@/config/apiUrl";
import { getFCMToken, sendTokenToBackend } from '@/services/notifications';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export interface SendOtpPayload {
  mobileNumber: string;
}

export interface VerifyOtpPayload {
  otp: string;
  encryptedToken: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  encryptedToken?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  data: {
    userId: string;
    userName: string;
    mobileNumber?: string;
    mobileNumberVerified?: boolean;
    email?: string;
    emailVerified?: boolean;
    age?: number;
    gender?: string;
  };
}

export interface RegisterPayload {
  userName: string;
  mobileNumber?: string;
  mobileNumberVerified?: boolean;
  email?: string;
  emailVerified?: boolean;
  age?: number;
  gender?: "Male" | "Female";
  profilePicture?: string;
  authMethod?: 'mobile' | 'google';
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
  data: {
    userId: string;
    userName: string;
    mobileNumber?: string;
    mobileNumberVerified?: boolean;
    email?: string;
    emailVerified?: boolean;
    age?: number;
    gender?: string;
  };
}

// AsyncStorage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_ID: 'userId',
  USER_DATA: 'userData',
  MOBILE_NUMBER: 'mobileNumber',
  ENCRYPTED_TOKEN: 'encryptedToken'
};

// Storage Helper Functions
export const storeAuthData = async (loginResponse: LoginResponse) => {
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.AUTH_TOKEN, loginResponse.token],
      [STORAGE_KEYS.USER_ID, loginResponse.data.userId],
      [STORAGE_KEYS.USER_DATA, JSON.stringify(loginResponse.data)],
      [STORAGE_KEYS.MOBILE_NUMBER, loginResponse.data.mobileNumber || '']
    ]);
    console.log('Auth data stored successfully');

    // Attempt to register FCM token post-login if userId is valid
    try {
      const userId = loginResponse.data.userId?.trim();
      const isValidObjectId = !!userId && /^[a-f0-9]{24}$/i.test(userId);
      if (!isValidObjectId) {
        console.log('[auth] Skipping FCM registration post-login: invalid userId', { userId });
      } else {
        const token = await getFCMToken();
        if (token) {
          console.log('[auth] Registering FCM token post-login');
          await sendTokenToBackend(token, userId);
        } else {
          console.log('[auth] No FCM token available post-login; will register on next startup');
        }
      }
    } catch (e) {
      console.warn('[auth] Failed to register FCM token post-login', e);
    }
  } catch (error) {
    console.error('Error storing auth data:', error);
    throw error;
  }
};

export const getStoredAuthData = async () => {
  try {
    const values = await AsyncStorage.multiGet([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.MOBILE_NUMBER
    ]);
    
    const authData = {
      token: values[0][1] || '',
      userId: values[1][1] || '',
      userData: values[2][1] ? JSON.parse(values[2][1]) : null,
      mobileNumber: values[3][1] || ''
    };
    
    return authData;
  } catch (error) {
    console.error('Error getting stored auth data:', error);
    return null;
  }
};

export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.MOBILE_NUMBER,
      STORAGE_KEYS.ENCRYPTED_TOKEN
    ]);
    console.log('Auth data cleared successfully');
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};

// Send OTP
export const sendOtp = async (mobileNumber: string): Promise<SendOtpResponse> => {
  try {
    console.log("")
    console.log("Calling Send OTP")

    // Check if this is the bypass mobile number
    if (mobileNumber === "+918739900038") {
      console.log("🔓 Bypassing OTP for mobile number:", mobileNumber);
      // Store a mock encrypted token for bypass
      const mockEncryptedToken = "bypass_token_" + Date.now();
      await AsyncStorage.setItem(STORAGE_KEYS.ENCRYPTED_TOKEN, mockEncryptedToken);
      
      return {
        success: true,
        message: "OTP bypassed for development",
        encryptedToken: mockEncryptedToken
      };
    }

    const res = await fetch(`${API_URL}/send-otp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mobileNumber }),
    });

    console.log("API URL", `${API_URL}/send-otp/`)
    const data = await res.json();
    console.log("Send OTP Response", data);
    
    // Store encrypted token if provided
    if (data.success && data.encryptedToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.ENCRYPTED_TOKEN, data.encryptedToken);
    };
    
    return data;
  } catch (error) {
    console.error("Error in sendOtp:", error);
    return { success: false, message: "Failed to send OTP" };
  }
};

// Verify OTP
export const verifyOtp = async (otp: string): Promise<VerifyOtpResponse> => {
  try {
    // Get stored encrypted token
    const encryptedToken = await AsyncStorage.getItem(STORAGE_KEYS.ENCRYPTED_TOKEN);
    
    if (!encryptedToken) {
      throw new Error("No encrypted token found. Please request OTP again.");
    }

    // Check if this is a bypass token
    if (encryptedToken.startsWith("bypass_token_")) {
      console.log("🔓 Bypassing OTP verification for development");
      return {
        success: true,
        message: "OTP verification bypassed for development",
        token: "bypass_verification_token_" + Date.now()
      };
    }

    const res = await fetch(`${API_URL}/verify-otp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ otp, encryptedToken }),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return { success: false, message: "OTP verification failed" };
  }
};

// Login User (Check if user exists)
export const loginUser = async (mobileNumber?: string, email?: string): Promise<LoginResponse> => {
  try {
    const payload: any = {};
    if (mobileNumber) {
      payload.mobileNumber = mobileNumber;
    }
    if (email) {
      payload.email = email;
    }

    const response = await fetch(`${API_URL}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to login user");
    }

    const data: LoginResponse = await response.json();
    
    // Store auth data if login successful
    if (data.success) {
      await storeAuthData(data);
    }
    
    return data;
  } catch (error: any) {
    console.error("Login error:", error);
    throw new Error(error.message || "Something went wrong");
  }
};

// Create Account
export const createUser = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  try {
    const response = await fetch(`${API_URL}/user/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to register user");
    }

    const data: RegisterResponse = await response.json();
    
    // Store auth data if registration successful
    if (data.success) {
      await storeAuthData(data);
    }
    
    return data;
  } catch (error: any) {
    console.error("Registration error:", error);
    throw new Error(error.message || "Something went wrong");
  }
};

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  console.log('🔧 Configuring Google Sign-In...');
  
  // Use minimal configuration - let google-services.json handle the rest
  const config = {
    offlineAccess: false,
    hostedDomain: '',
    forceCodeForRefreshToken: false,
  };
  
  console.log('🔧 Google Sign-In Configuration (using google-services.json):', {
    offlineAccess: config.offlineAccess,
    hostedDomain: config.hostedDomain,
    forceCodeForRefreshToken: config.forceCodeForRefreshToken,
    note: 'Web client ID will be read from google-services.json'
  });
  
  try {
    GoogleSignin.configure(config);
    console.log('✅ Google Sign-In configuration completed');
  } catch (error) {
    console.error('❌ Error configuring Google Sign-In:', error);
  }
};

// Google Sign-In
export const signInWithGoogle = async (): Promise<GoogleUserInfo> => {
  try {
    console.log('🔍 Starting Google Sign-In process...');
    
    // Check if Google Play Services is available
    console.log('🔍 Checking Google Play Services...');
    await GoogleSignin.hasPlayServices();
    console.log('✅ Google Play Services is available');
    
    // Attempt to sign in with account selection
    console.log('🔍 Attempting Google Sign-In...');
    
    // Sign out first to force account selection
    try {
      await GoogleSignin.signOut();
      console.log('🔍 Signed out from previous Google account');
    } catch (e) {
      console.log('ℹ️ No previous Google account to sign out');
    }
    
    const userInfo = await GoogleSignin.signIn();
    console.log('📱 Google Sign-In response:', JSON.stringify(userInfo, null, 2));
    
    if (userInfo.type === 'success' && userInfo.data) {
      const user = userInfo.data.user;
      console.log('✅ Google Sign-In successful, user data:', user);
      
      return {
        id: user.id,
        email: user.email,
        name: user.name || '',
        picture: user.photo || undefined,
        given_name: user.givenName || undefined,
        family_name: user.familyName || undefined,
      };
    } else {
      console.error('❌ Google Sign-In failed - invalid response type or data');
      throw new Error('Google sign in failed - invalid response');
    }
  } catch (error: any) {
    console.error('❌ Google Sign-In Error Details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      fullError: error
    });
    
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('ℹ️ User cancelled Google Sign-In');
      throw new Error('Sign in was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('⚠️ Google Sign-In already in progress');
      throw new Error('Sign in is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log('❌ Google Play Services not available');
      throw new Error('Play services not available');
    } else if (error.code === 'DEVELOPER_ERROR') {
      console.log('❌ Developer Error - Configuration issue');
      throw new Error('DEVELOPER_ERROR: Google Sign-In configuration is invalid');
    } else {
      console.log('❌ Unknown Google Sign-In error');
      throw new Error(`Google sign in failed: ${error.message || 'Unknown error'}`);
    }
  }
};

// Google Sign-Out
export const signOutGoogle = async () => {
  try {
    console.log('🔍 Signing out from Google...');
    
    // Check if user has previous sign-in (API in v16)
    const hasPrev = await GoogleSignin.hasPreviousSignIn();
    console.log('🔍 Google previous sign-in status:', hasPrev);
    
    if (hasPrev) {
      await GoogleSignin.signOut();
      console.log('✅ Google Sign-Out successful');
    } else {
      console.log('ℹ️ User was not signed in to Google');
    }
    
    // Clear any cached tokens
    await GoogleSignin.revokeAccess();
    console.log('✅ Google access revoked');
    
  } catch (error) {
    console.error('❌ Google Sign-Out Error:', error);
  }
};