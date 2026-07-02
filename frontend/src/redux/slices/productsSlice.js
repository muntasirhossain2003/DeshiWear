import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchProductsByFilters = createAsyncThunk(
  "products/fetchByFilters",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== "" && v !== null)
      );
      const { data } = await api.get("/api/products", { params });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to load products");
    }
  }
);

export const fetchProductDetails = createAsyncThunk(
  "products/fetchDetails",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/products/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Product not found");
    }
  }
);

export const fetchSimilarProducts = createAsyncThunk(
  "products/fetchSimilar",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/products/similar/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to load similar products");
    }
  }
);

export const fetchNewArrivals = createAsyncThunk(
  "products/fetchNewArrivals",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/products/new-arrivals");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to load new arrivals");
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  "products/fetchFeatured",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/products/featured");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to load featured products");
    }
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    selectedProduct: null,
    similarProducts: [],
    newArrivals: [],
    featuredProducts: [],
    loading: false,
    detailsLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsByFilters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByFilters.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProductsByFilters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProductDetails.pending, (state) => {
        state.detailsLoading = true;
        state.selectedProduct = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchSimilarProducts.fulfilled, (state, action) => {
        state.similarProducts = action.payload;
      })
      .addCase(fetchNewArrivals.fulfilled, (state, action) => {
        state.newArrivals = action.payload;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featuredProducts = action.payload;
      });
  },
});

export default productsSlice.reducer;
