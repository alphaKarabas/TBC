import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const loadAdmins = createAsyncThunk(
  "flow/fetchAdmin",
  async ({ botId }) => {
    try {
      const response = await axios.get(
        `${process.env.React_App_SERVER_URL}/api/admin?botId=${botId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return { data: response.data };
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const addAdmin = createAsyncThunk(
  "flow/fetchAddAdmin",
  async ({ botId, rule, terminationDate }) => {
    
    try {
      const response = await axios.post(
        `${process.env.React_App_SERVER_URL}/api/admin`,
        {
          botId,
          rule,
          terminationDate,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return { data: response.data };
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const deleteAdmin = createAsyncThunk(
  "flow/fetchDeleteAdmin",
  async ({ id }) => {
    try {
      const response = await axios.delete(
        `${process.env.React_App_SERVER_URL}/api/admin?id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return { data: response.data, id: id };
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

const AdminListSlice = createSlice({
  name: "admin",
  initialState: {
    admins: [],
  },
  extraReducers: {
    [loadAdmins.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { data } = action?.payload;
      if (!data) return;
      state.admins = data.admins;
    },
    [addAdmin.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { data } = action?.payload;
      if (!data) return;
      state.admins.push(data.admin);
    },
    [deleteAdmin.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { id } = action?.payload;
      if (!id) return;
      state.admins = state.admins.filter((admin) => admin.slot._id !== id);
    },
  },
  reducers: {
    resetAdminData(state, action) {
      state.admins = [];
    },
  },
});

export const {
  resetAdminData
} = AdminListSlice.actions;

export default AdminListSlice.reducer;
