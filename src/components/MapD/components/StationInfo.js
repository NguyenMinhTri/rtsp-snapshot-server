import { memo } from 'react';

function StationInfo({ info, showMarkerInfo }) {
    return (
        <div>
            {showMarkerInfo
                ? info && info.length > 0
                    ? info.map((v, index) => <p key={index}>{v.name}</p>)
                    : (info = [] ? <p>Chưa cập nhật tọa độ</p> : null)
                : info.name}
        </div>
    );
}

export default memo(StationInfo);
