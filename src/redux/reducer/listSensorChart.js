import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    listSensor : [],
};

export const listSensorChartSlice = createSlice({
    name: 'listSensorChart',
    initialState,
    reducers: {
        listSensorChartAction: (state, action) => {
            state.listSensor = action.payload
        },
       
    },
});

//action
export const { listSensorChartAction } = listSensorChartSlice.actions;

//reducer
const listSensorChartReducer = listSensorChartSlice.reducer;

//selector
export const listSensorChartSelector = (state) => state.listSensorChartReducer.listSensor;

export default listSensorChartReducer;
