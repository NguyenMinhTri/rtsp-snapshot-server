import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data_chart: [],
    list_sensor: [],
};

export const dataSensorSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {
        dataChartDetail: (state, action) => {
            state.data_chart = action.payload;
        },
        listSensorOfStation: (state, action) => {
            state.list_sensor = action.payload;
        },
    },
});

//action
export const { dataChartDetail, listSensorOfStation } = dataSensorSlice.actions;

//reducer
const dataSensorSliceReducer = dataSensorSlice.reducer;

//selector
export const dataChartSelector = (state) => state.dataSensorSliceReducer.data_chart;
export const listSensorStationSelector = (state) => state.dataSensorSliceReducer.list_sensor;

export default dataSensorSliceReducer;
