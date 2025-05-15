import React from 'react';
import Nothing from '../../components/Nothing';
import { FixedSizeList as List } from 'react-window';
const Row = ({ index, style }) => <div style={style}>Row {index}</div>;
export default function History() {
    return <Nothing />;
}
