import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    sensor : null,
};

export const chooseSensorChartSlice = createSlice({
    name: 'filterMark',
    initialState,
    reducers: {
        chooseSensorAction: (state, action) => {
            state.sensor = action.payload
        },
       
    },
});

//action
export const { chooseSensorAction } = chooseSensorChartSlice.actions;

//reducer
const chooseSensorChartReducer = chooseSensorChartSlice.reducer;

//selector
export const chooseSensorSelector = (state) => state.chooseSensorChartReducer.sensor;

export default chooseSensorChartReducer;
