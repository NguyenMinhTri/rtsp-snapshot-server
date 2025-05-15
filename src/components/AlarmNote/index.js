import { memo } from 'react';
import './AlarmNote.scss';

function AlarmNote({ text, component = <></> }) {
    return (
        <div className="alarm_note_wrapper">
            <p className="note_text blink_me">{text}</p>
            {component}
        </div>
    );
}

export default memo(AlarmNote);
