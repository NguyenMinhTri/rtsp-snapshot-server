import { useEffect } from 'react';
import { useState, memo, useRef } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

const createDataPoint = (time = Date.now(), magnitude = 1000, offset = 0) => {
    return [time + offset * magnitude, 0];
};
const createRandomData = (time, magnitude, points = 20) => {
    const data = [];
    let i = points * -1 + 1;
    for (i; i <= 0; i++) {
        data.push(createDataPoint(time, magnitude, i));
    }

    return data;
};

const addDataPoint = (data, toAdd) => {
    if (!toAdd) toAdd = createDataPoint();
    const newData = data.slice(0); // Clone
    if (newData.length > 20) {
        newData.reverse().pop();
        newData.reverse();
    }

    newData.push(toAdd);

    return newData;
};

function MainChart2({ dataSensorChart }) {
    const [stateLegend, setStateLegend] = useState({
        opacity: {
            uv: 1,
            pv: 1,
        },
    });
    // data = [
    //     {
    //         name: 'A',
    //         x: 10,
    //     },
    //     {
    //         name: 'B',
    //         x: 5,
    //     },
    // ];
    // let data = [
    //     {
    //         pH: '6.68',
    //         DO: '2.83',
    //         NH4: '2.83',
    //         name: '09:20 15/11/2022',
    //     },
    //     {
    //         pH: '5',
    //         DO: '2',
    //         NH4: '1',
    //         name: '09:20 15/11/2022',
    //     },
    //     {
    //         pH: '3',
    //         DO: '2',
    //         NH4: '1',
    //         name: '09:20 15/11/2022',
    //     },
    // ];
    let data = [];
    data = dataSensorChart;
    console.log(dataSensorChart);
    const handleMouseEnter = (o) => {
        const { dataKey } = o;
        const { opacity } = stateLegend;

        setStateLegend({
            opacity: { ...opacity, [dataKey]: 0.5 },
        });
    };

    const handleMouseLeave = (o) => {
        const { dataKey } = o;
        const { opacity } = stateLegend;

        setStateLegend({
            opacity: { ...opacity, [dataKey]: 1 },
        });
    };
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                width={500}
                height={500}
                data={data}
                margin={{
                    top: 20,
                    right: 35,
                    left: 5,
                    bottom: 5,
                }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                {/* <Legend /> */}
                <Legend onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} />
                <Line
                    type="monotone"
                    strokeWidth={3}
                    dataKey={'pH'}
                    stroke="#8884d8"
                    activeDot={{ r: 5 }}
                />
                <Line
                    type="monotone"
                    strokeWidth={3}
                    dataKey={'Temp'}
                    stroke="#8884d8"
                    activeDot={{ r: 5 }}
                />

                <Line
                    type="monotone"
                    strokeWidth={3}
                    dataKey={'TSS'}
                    stroke="#8884d8"
                    activeDot={{ r: 5 }}
                />

                <Line
                    type="monotone"
                    strokeWidth={3}
                    dataKey={'NH4'}
                    stroke="#8884d8"
                    activeDot={{ r: 5 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

export default memo(MainChart2);
