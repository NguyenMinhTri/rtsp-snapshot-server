import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    location : {
        longitude : null ,
        latitude : null ,
        id : null
    }
};

export const locationStationSlice = createSlice({
    name: 'locationStation',
    initialState,
    reducers: {
        locationChangeAction: (state, action) => {
            state.location = action.payload
        },
       
    },
});

//action
export const { locationChangeAction } = locationStationSlice.actions;

//reducer
const locationStationSliceReducer = locationStationSlice.reducer;

//selector
export const locationStationSelector = (state) => state.locationStationSliceReducer.location;

export default locationStationSliceReducer;
