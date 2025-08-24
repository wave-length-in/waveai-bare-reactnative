import { API_URL } from "@/config/apiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    mobileNumber: string;
    mobileNumberVerified: boolean;
    age: number;
    gender: string;
  };
}

export interface RegisterPayload {
  userName: string;
  mobileNumber: string;
  mobileNumberVerified: boolean;
  age: number;
  gender: "Male" | "Female";
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
  data: {
    userId: string;
    userName: string;
    mobileNumber: string;
    mobileNumberVerified: boolean;
    age: number;
    gender: string;
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
      [STORAGE_KEYS.MOBILE_NUMBER, loginResponse.data.mobileNumber]
    ]);
    console.log('Auth data stored successfully');
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
      token: values[0][1],
      userId: values[1][1],
      userData: values[2][1] ? JSON.parse(values[2][1]) : null,
      mobileNumber: values[3][1]
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
export const loginUser = async (mobileNumber: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mobileNumber }),
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