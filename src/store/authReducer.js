// filepath: /Users/doston/Desktop/mock-exam/src/store.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/api";

// Async thunk for fetching profile data
export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await apiClient.get("api/v1/user/profile", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data; // Return profile data
    } catch (error) {
      if (error.response?.status === 401) {
        // Handle unauthorized access, e.g., redirect to login
        dispatch(logout());
        return rejectWithValue("Unauthorized access, please log in again.");
      }
      return rejectWithValue(error.response?.data || "Failed to fetch profile");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isLoggedIn: !!localStorage.getItem("accessToken"), // Check if token exists in localStorage
    accessToken: localStorage.getItem("accessToken") || null,
    user: null,
    error: null,
  },
  reducers: {
    login(state, action) {
      const { accessToken } = action.payload;
      state.isLoggedIn = true;
      state.accessToken = accessToken;
      localStorage.setItem("accessToken", accessToken); // Save token to localStorage
    },
    logout(state) {
      state.isLoggedIn = false;
      state.accessToken = null;
      state.user = null;
      localStorage.removeItem("accessToken"); // Remove token from localStorage
      localStorage.removeItem("refreshToken"); // Remove token from localStorage
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload; // Set user profile data
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;