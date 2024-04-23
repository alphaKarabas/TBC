import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const registration = createAsyncThunk(
  "registration/fetchUser",
  async ({ email, phoneNumber, password, callback }, {rejectWithValue}) => {
    try {
      const response = await axios.post(
        `${process.env.React_App_SERVER_URL}/api/auth/registration`,
        {
          email,
          phoneNumber,
          password,
        }
      );
      
      console.log(`${response.data.message}: ${response.data.user.email}`);
      localStorage.setItem("JWT_Token", response.data.token);
      callback();
      return response.data.user;
    } catch (e) {
      console.log(e.response.data.message);
      console.log(e.response.data.errors);
      return rejectWithValue(e.response.data.message)
    }
  }
);

export const login = createAsyncThunk(
  "login/fetchUser",
  async ({ email, password, callback }, {rejectWithValue}) => {
    try {
      const response = await axios.post(
        `${process.env.React_App_SERVER_URL}/api/auth/login`,
        {
          email,
          password,
        }
      );
      console.log(`${response.data.message}: ${response.data.user.email}`);
      localStorage.setItem("JWT_Token", response.data.token);
      callback();
      return response.data.user;
    } catch (e) {
      console.log(e.response.data.message);
      console.log(e.response.data.errors);
      return rejectWithValue(e.response.data.message)
    }
  }
);

export const auth = createAsyncThunk(
  "auth/fetchUser",
  async (_, {rejectWithValue}) => {
    try {
      const response = await axios.get(
        `${process.env.React_App_SERVER_URL}/api/auth/auth`,
        {
          headers: {Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`}
        }
      );
      console.log(`${response.data.message}: ${response.data.user.email}`);
      localStorage.setItem("JWT_Token", response.data.token);
      return response.data.user;
    } catch (e) {
      localStorage.removeItem("JWT_Token")
      console.log(e.response.data.message);
      console.log(e.response.data.errors);
      return rejectWithValue(e.response.data.message)
    }
  }
);

const UserSlice = createSlice({
  name: "user",
  initialState: {
    currentUser: {},
    isAuth: false,
  },
  reducers: {
    logout: (state, action) => {
      localStorage.removeItem("JWT_Token")
      state.currentUser = {};
      state.isAuth = false;
    },
  },
  extraReducers: {
    [registration.fulfilled]: (state, action) => {
      state.currentUser = action.payload;
      state.isAuth = true;
    },
    [registration.rejected]: (state, action) => {
      state.currentUser = {};
      state.isAuth = false;
    },
    [login.fulfilled]: (state, action) => {
      state.currentUser = action.payload;
      state.isAuth = true;
    },
    [login.rejected]: (state, action) => {
      state.currentUser = {};
      state.isAuth = false;
    },
    [auth.fulfilled]: (state, action) => {
      state.currentUser = action.payload;
      state.isAuth = true;
    },
    [auth.rejected]: (state, action) => {
      state.currentUser = {};
      state.isAuth = false;
    },
  }
});

export const {logout} = UserSlice.actions;

export default UserSlice.reducer;
