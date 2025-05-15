import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    hide : true,
};

export const labelMarkMapSlice = createSlice({
    name: 'labelMark',
    initialState,
    reducers: {
        labelMarkChangeAction: (state, action) => {
            state.hide = action.payload
        },
       
    },
});

//action
export const { labelMarkChangeAction } = labelMarkMapSlice.actions;

//reducer
const labelMarkMapSliceReducer = labelMarkMapSlice.reducer;

//selector
export const labelMarkSelector = (state) => state.labelMarkMapSliceReducer.hide;

export default labelMarkMapSliceReducer;
