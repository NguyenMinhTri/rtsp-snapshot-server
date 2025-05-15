import { handleGetSettingThreshold } from "./handleGetSettingThreshold";

export const handleDataMainForTable = (arr) => {
    let dataForTable = arr.map((v, index) => {
        let s = v.status_station.split("*")[1];
        let c = v.data_sensor.map((v2) => {
            // console.log(s);
            const isOVer = handleGetSettingThreshold(
                v.id_station,
                v2.Name,
                v2.Value
            );
  
            let b;
            if (s === "NOOK") {
                b = `${v2.Value}*${
                    typeof v2.StateNum === "undefined" ? 0 : v2.StateNum
                }*STATION_OFF*${v2.Unit}`;
             
            } else {
                if(v2.MemoryType === 1)
                v2.StateNum =
              v2.AlarmSetting.LowAlarmSetting === 0 &&
                  v2.AlarmSetting.HighAlarmSetting === 0
                        ? v2.StateNum 
                        : v2.Value < v2.AlarmSetting.LowAlarmSetting ||
                          v2.Value > v2.AlarmSetting.HighAlarmSetting
                        ? 2
                        : v2.StateNum ;
                
                
                if (isOVer && v2.StateNum === 0 ) {
                    b = `${v2.Value}*${5}*${v2.Unit}`;
                } else {
                   
                    b = `${v2.Value}*${
                        typeof v2.StateNum === "undefined" ? 0 : v2.StateNum
                    }*${v2.Unit}`;
                    if(v2.MemoryType === 0 ) {
                        b = `Alarm*${
                            typeof v2.StateNum === "undefined" ? 2 : v2.StateNum
                        }* `;
                     
                    }
                  
                }
            }
            let a = v2.Name;
            let obj = { [a]: b };

            return obj;
        });
       
        c.push({ id_station: v.id_station });
        c.push({ station: v.full_name });
        c.push({ stt: index + 1 });
        c.push({ time: v.last_time });
        c.push({ status: v.status_station });
        c.push({ deviceType: v.deviceType });


        let r = [];
        let o = {};
        c.map((v) => {
            let a = Object.keys(v)[0];
            let b = String(Object.values(v)[0]);
            r.push({ a, b });
        });
        // console.log({ r });
        r.map((v) => {
            o[v.a] = v.b;
        });

        return o;
    });

    return dataForTable;
};
