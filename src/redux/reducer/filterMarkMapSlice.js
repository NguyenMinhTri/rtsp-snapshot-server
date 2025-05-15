import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    category : null,
};

export const filterMarkMapSlice = createSlice({
    name: 'filterMark',
    initialState,
    reducers: {
        filterMarkChangeAction: (state, action) => {
            state.category = action.payload
        },
       
    },
});

//action
export const { filterMarkChangeAction } = filterMarkMapSlice.actions;

//reducer
const filterMarkMapSliceReducer = filterMarkMapSlice.reducer;

//selector
export const filterMarkSelector = (state) => state.filterMarkMapSliceReducer.category;

export default filterMarkMapSliceReducer;
