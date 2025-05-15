import { memo } from 'react';
import './NormalNote.scss';

function NormalNote({ text, component = <></> }) {
    return (
        <div className="normal_note_wrapper">
            <p className="note_text">{text}</p>
            {component}
        </div>
    );
}

export default memo(NormalNote);
