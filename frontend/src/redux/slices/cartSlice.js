import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const emptyCart = { products: [], totalPrice: 0 };

const loadCart = () => {
  try {
    return JSON.parse(localStorage.getItem("cart")) || emptyCart;
  } catch {
    return emptyCart;
  }
};

const saveCart = (cart) => localStorage.setItem("cart", JSON.stringify(cart));

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async ({ userId, guestId }, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/cart", { params: { userId, guestId } });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to load cart");
    }
  }
);

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/api/cart", payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to add to cart");
    }
  }
);

export const updateCartItemQuantity = createAsyncThunk(
  "cart/updateQuantity",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.put("/api/cart", payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update cart");
    }
  }
);

export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.delete("/api/cart", { data: payload });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to remove item");
    }
  }
);

export const mergeCart = createAsyncThunk(
  "cart/mergeCart",
  async ({ guestId }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/api/cart/merge", { guestId });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to merge cart");
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState: { cart: loadCart(), loading: false, error: null },
  reducers: {
    clearCart: (state) => {
      state.cart = emptyCart;
      localStorage.removeItem("cart");
    },
  },
  extraReducers: (builder) => {
    const setCart = (state, action) => {
      state.loading = false;
      state.cart = action.payload;
      saveCart(action.payload);
    };
    builder
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, setCart)
      .addCase(addToCart.fulfilled, setCart)
      .addCase(updateCartItemQuantity.fulfilled, setCart)
      .addCase(removeFromCart.fulfilled, setCart)
      .addCase(mergeCart.fulfilled, setCart)
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
