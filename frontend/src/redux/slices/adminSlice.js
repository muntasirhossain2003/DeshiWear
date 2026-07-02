import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const handle = (fn) => async (arg, { rejectWithValue }) => {
  try {
    return await fn(arg);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Request failed");
  }
};

export const fetchAdminStats = createAsyncThunk(
  "admin/fetchStats",
  handle(async () => (await api.get("/api/admin/stats")).data)
);

export const fetchAdminProducts = createAsyncThunk(
  "admin/fetchProducts",
  handle(async () => (await api.get("/api/admin/products")).data)
);

export const createProduct = createAsyncThunk(
  "admin/createProduct",
  handle(async (product) => (await api.post("/api/admin/products", product)).data)
);

export const updateProduct = createAsyncThunk(
  "admin/updateProduct",
  handle(async ({ id, ...product }) => (await api.put(`/api/admin/products/${id}`, product)).data)
);

export const deleteProduct = createAsyncThunk(
  "admin/deleteProduct",
  handle(async (id) => {
    await api.delete(`/api/admin/products/${id}`);
    return id;
  })
);

export const fetchAdminOrders = createAsyncThunk(
  "admin/fetchOrders",
  handle(async () => (await api.get("/api/admin/orders")).data)
);

export const updateOrderStatus = createAsyncThunk(
  "admin/updateOrderStatus",
  handle(async ({ id, status }) => (await api.put(`/api/admin/orders/${id}`, { status })).data)
);

export const fetchAdminUsers = createAsyncThunk(
  "admin/fetchUsers",
  handle(async () => (await api.get("/api/admin/users")).data)
);

export const updateUserRole = createAsyncThunk(
  "admin/updateUserRole",
  handle(async ({ id, role }) => (await api.put(`/api/admin/users/${id}`, { role })).data)
);

export const deleteUser = createAsyncThunk(
  "admin/deleteUser",
  handle(async (id) => {
    await api.delete(`/api/admin/users/${id}`);
    return id;
  })
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    stats: null,
    products: [],
    orders: [],
    users: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchAdminProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.unshift(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const i = state.products.findIndex((p) => p._id === action.payload._id);
        if (i !== -1) state.products[i] = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p._id !== action.payload);
      })
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const i = state.orders.findIndex((o) => o._id === action.payload._id);
        if (i !== -1) state.orders[i] = { ...state.orders[i], ...action.payload };
      })
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const i = state.users.findIndex((u) => u._id === action.payload._id);
        if (i !== -1) state.users[i] = { ...state.users[i], ...action.payload };
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u._id !== action.payload);
      });
  },
});

export default adminSlice.reducer;
