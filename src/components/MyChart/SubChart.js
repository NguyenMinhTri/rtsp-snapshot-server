import { memo } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';

const myData = [
    {
        name: 'Page A',
        uv: 4000,
        pv: 2400,
        amt: 2400,
    },
    {
        name: 'Page B',
        uv: 3000,
        pv: 1398,
        amt: 2210,
    },
    {
        name: 'Page C',
        uv: 2000,
        pv: 9800,
        amt: 2290,
    },
    {
        name: 'Page D',
        uv: 2780,
        pv: 3908,
        amt: 2000,
    },
    {
        name: 'Page E',
        uv: 1890,
        pv: 4800,
        amt: 2181,
    },
    {
        name: 'Page F',
        uv: 2390,
        pv: 3800,
        amt: 2500,
    },
    {
        name: 'Page G',
        uv: 3490,
        pv: 4300,
        amt: 2100,
    },
];

// const CustomizedLabel = ({ x, y, stroke, value }) => {
//     return (
//         <text x={x} y={y} dy={-4} fill={stroke} fontSize={10} textAnchor="middle">
//             {value}
//         </text>
//     );
// };

const CustomTooltip = ({ active, payload, label }) => {
    // console.log({ active, payload, label });
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p
                    className="label"
                    style={{
                        backgroundColor: 'white',
                        padding: '5px',
                        borderRadius: '5px',
                        border: 'none',
                        color: 'black',
                    }}>{`${payload[0].payload.name} : ${payload[0].value}`}</p>
            </div>
        );
    }

    return null;
};

function SubChart({
    width = 300,
    height = 100,
    data = myData,
    color = '#8884d8',
    fill = '#8884d8',
}) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart width={width} height={height} data={data}>
                <defs>
                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFE61B" stopOpacity={1} />
                        <stop offset="95%" stopColor="#FFE61B" stopOpacity={0.2} />
                    </linearGradient>
                </defs>
                {/* <CartesianGrid strokeDasharray="3 3" stroke="#ccc" /> */}
                {/* <XAxis dataKey="name" /> */}
                {/* <YAxis /> */}
                {/* <Tooltip content={<CustomTooltip />} /> */}
                {/* <Legend /> */}
                <Area
                    type="monotone"
                    dataKey="pv"
                    stroke={color}
                    fill="url(#colorPv)"
                    fillOpacity={1}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export default memo(SubChart);
