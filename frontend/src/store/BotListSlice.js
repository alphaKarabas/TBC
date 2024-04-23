import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getBots = createAsyncThunk("bot/fetchBots", async () => {
  try {
    const response = await axios.get(`${process.env.React_App_SERVER_URL}/api/bot`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("JWT_Token")}` },
    });
    return response.data;
  } catch (e) {
    console.log(e.response.data.message);
  }
});

export const createBot = createAsyncThunk(
  "bot/fetchCreateBot",
  async ({ name }) => {
    try {
      const response = await axios.post(
        `${process.env.React_App_SERVER_URL}/api/bot`,
        {
          name
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return response.data;
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const copyBot = createAsyncThunk(
  "bot/fetchCopyBot",
  async ({ name, id }) => {
    try {
      const response = await axios.put(
        `${process.env.React_App_SERVER_URL}/api/bot`,
        {
          name,
          id
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return response.data;
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const deleteBot = createAsyncThunk(
  "bot/fetchDeleteBot",
  async ({ id }) => {
    try {
      const response = await axios.delete(
        `${process.env.React_App_SERVER_URL}/api/bot?id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return response.data;
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const renameBot = createAsyncThunk(
  "bot/fetchRenameBot",
  async ({ name, id }) => {
    try {
      const response = await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/bot?id=${id}`,
        {
          patch: ["name"],
          name,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return response.data;
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const connectBot = createAsyncThunk(
  "bot/fetchConnectBot",
  async ({ token, id }) => {
    try {
      const response = await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/bot?id=${id}`,
        {
          patch: ["token"],
          token,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return response.data;
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const disconnectBot = createAsyncThunk(
  "bot/fetchDisconnectBot",
  async ({ id }) => {
    try {
      const response = await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/bot?id=${id}`,
        {
          patch: ["token"],
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return response.data;
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const startBot = createAsyncThunk(
  "bot/fetchStartBot",
  async ({ id }) => {
    try {
      const keyResponse = await axios.get(`${process.env.React_App_SERVER_URL}/api/bot/key`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
        },
      });
      const response = await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/bot?id=${id}`,
        {
          patch: ["isActive"],
          isActive: true,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return { authKey: keyResponse.data.authKey, ...response.data };
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const stopBot = createAsyncThunk("bot/fetchStopBot", async ({ id }) => {
  try {
    const response = await axios.patch(
      `${process.env.React_App_SERVER_URL}/api/bot?id=${id}`,
      {
        patch: ["isActive"],
        isActive: false,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
        },
      }
    );
    return response.data;
  } catch (e) {
    console.log(e.response.data.message);
  }
});

export const currentBot = createAsyncThunk("bot/fetchKey", async ({ id }) => {
  try {
    const response = await axios.get(`${process.env.React_App_SERVER_URL}/api/bot/key`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("JWT_Token")}` },
    });
    return { id, ...response.data };
  } catch (e) {
    console.log(e.response.data.message);
  }
});

const BotListSlice = createSlice({
  name: "bots",
  initialState: {
    bots: [],
    currentBotId: "",
    verificationKey: "",
  },
  extraReducers: {
    [currentBot.fulfilled]: (state, action) => {
      if (state.currentBotId === action.payload.id) return;
      state.currentBotId = action.payload.id;
      state.verificationKey = state.bots.find(
        (bot) => bot._id === action.payload.id
      ).isActive
        ? action.payload.authKey
        : "";
    },
    [getBots.fulfilled]: (state, action) => {
      if (!action.payload.bots) return;
      state.bots = action.payload.bots;
    },
    [getBots.rejected]: (state, action) => {
      state.bots = [];
      state.needToVerified = false;
      state.currentBotId = -1;
    },
    [createBot.fulfilled]: (state, action) => {
      if (!action.payload.bots) return;
      state.bots = action.payload.bots;
    },
    [copyBot.fulfilled]: (state, action) => {
      if (!action.payload.bots) return;
      state.bots = action.payload.bots;
    },
    [deleteBot.fulfilled]: (state, action) => {
      if (!action.payload.bots) return;
      state.bots = action.payload.bots;
    },
    [renameBot.fulfilled]: (state, action) => {
      if (!action.payload.bots) return;
      state.bots = action.payload.bots;
    },
    [startBot.fulfilled]: (state, action) => {
      if (!action.payload.bots) return;
      state.bots = action.payload.bots;
      state.verificationKey = action.payload.authKey
    },
    [stopBot.fulfilled]: (state, action) => {
      if (!action.payload.bots) return;
      state.bots = action.payload.bots;
    },
    [connectBot.fulfilled]: (state, action) => {
      if (!action.payload.bots) return;
      state.bots = action.payload.bots;
      state.needToVerified = action.payload.telegramIdVerification;
    },
    [disconnectBot.fulfilled]: (state, action) => {
      if (!action.payload.bots) return;
      state.bots = action.payload.bots;
    },
  },
  reducers: {
    resetBotListData(state, action) {
      state.bots = [];
      state.currentBotId = "";
      state.verificationKey = "";
    },
  },
});

export const {
  resetBotListData
} = BotListSlice.actions;

export const { notifiedAboutVerification } = BotListSlice.actions;

export default BotListSlice.reducer;
