import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const storedUser = localStorage.getItem("userInfo");

// Guest id survives reloads so anonymous carts persist
const initialGuestId = localStorage.getItem("guestId") || `guest_${Date.now()}`;
localStorage.setItem("guestId", initialGuestId);

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  guestId: initialGuestId,
  loading: false,
  error: null,
};

const persistAuth = (data) => {
  localStorage.setItem("userInfo", JSON.stringify(data.user));
  localStorage.setItem("userToken", data.token);
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/api/users/login", credentials);
      persistAuth(data);
      return data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/api/users/register", payload);
      persistAuth(data);
      return data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Registration failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.guestId = `guest_${Date.now()}`;
      localStorage.removeItem("userInfo");
      localStorage.removeItem("userToken");
      localStorage.setItem("guestId", state.guestId);
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.loading = true;
      state.error = null;
    };
    const fulfilled = (state, action) => {
      state.loading = false;
      state.user = action.payload;
    };
    const rejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };
    builder
      .addCase(loginUser.pending, pending)
      .addCase(loginUser.fulfilled, fulfilled)
      .addCase(loginUser.rejected, rejected)
      .addCase(registerUser.pending, pending)
      .addCase(registerUser.fulfilled, fulfilled)
      .addCase(registerUser.rejected, rejected);
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
