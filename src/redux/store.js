import { configureStore } from '@reduxjs/toolkit';
import dataSensorSliceReducer from './reducer/dataSensorSlice';
import locationStationSliceReducer from './reducer/locationStationSlice';
import filterMarkMapSliceReducer from './reducer/filterMarkMapSlice';
import labelMarkMapSliceReducer from './reducer/labelMarkMapSlice';
import chooseSensorChartReducer from './reducer/chooseSensorChart';
import listSensorChartReducer from './reducer/listSensorChart';

export const store = configureStore({
    reducer: { dataSensorSliceReducer,locationStationSliceReducer,filterMarkMapSliceReducer,labelMarkMapSliceReducer, chooseSensorChartReducer, listSensorChartReducer },
});
