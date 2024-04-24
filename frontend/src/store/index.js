import {configureStore} from '@reduxjs/toolkit'
import UserSlice from './UserSlice'
import BotListSlice from './BotListSlice'
import FlowSlice from './FlowSlice'

export default configureStore({
  reducer: {
    UserSlice,
    BotListSlice,
    FlowSlice,
  }
})