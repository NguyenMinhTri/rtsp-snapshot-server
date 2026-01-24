import React, { useEffect, useRef, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Box, LinearProgress, Typography } from "@mui/material";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../config/firebase";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { chooseSensorSelector } from "../../redux/reducer/chooseSensorChart";
import { listSensorChartAction } from "../../redux/reducer/listSensorChart";
import BackDropLoading from "./../BackDropLoading";

function ChartV2({ listSensor, deviceId, startDate, endDate, isLiveMode, dataRealTime }) {
  const chartComponentRef = useRef(null);
  const [templateOptions, setTemplateOptions] = useState(null);
  const [categoryTime, setCategoryTime] = useState([]);
  const [chartData, setChartData] = useState([]);
  // State lưu trữ giá trị tích lũy (m³) cho sensor có chứa "flow"
  const [cumulativeFlow, setCumulativeFlow] = useState({});
  const sensorChartShow = useSelector(chooseSensorSelector);

  // Track if initial data has been loaded to prevent API refetch in live mode
  const initialLoadDoneRef = useRef(false);
  const lastFetchParamsRef = useRef({ deviceId: null, startDate: null, endDate: null, listSensor: null });

  // Real-time data refs
  const lastCaptureTimeRef = useRef(null);
  const MAX_REALTIME_POINTS = 120; // 10 minutes at 5 second intervals

  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  // Hàm điều chỉnh thời gian (trừ 7 giờ)
  const subTract7Hour = (startDateChoose, endDateChoose) => {
    const dateS = new Date(startDateChoose);
    const dateE = new Date(endDateChoose);

    const subtract7HoursStart = dateS.getTime() - 7 * 60 * 60 * 1000;
    const subtract7HoursEnd = dateE.getTime() - 7 * 60 * 60 * 1000;

    const startDate = moment(subtract7HoursStart).format("YYYY-MM-DD HH:mm:ss");
    const endDate = moment(subtract7HoursEnd).format("YYYY-MM-DD HH:mm:ss");
    return { startDate, endDate };
  };

  // Gọi hàm Firebase để lấy dữ liệu theo thời gian
  const handleData = async (startDate, endDate, idStation, listSensorId) => {

    const GetDataSensorByTime = httpsCallable(functions, "GetDataSensorByTime");
    const { startDate: start, endDate: end } = subTract7Hour(startDate, endDate);
    const data = {
      deviceId: idStation,
      startDate: moment(start).format("YYYY-MM-DD HH:mm:ss"),
      endDate: moment(end).format("YYYY-MM-DD HH:mm:ss"),
      listSensorId: listSensorId,
    };
    console.log({ data });

    try {
      const result = await GetDataSensorByTime(data);
      return JSON.parse(result.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Hàm xử lý dữ liệu: đồng thời xây dựng biểu đồ (giá trị tức thời) và tính tích lũy (m³)
  const run = async () => {
    setLoading(true);
    let res = await handleData(startDate, endDate, deviceId, listSensor);
    if (!res || !Array.isArray(res)) {
      setLoading(false);
      return;
    }
    const timeCategory = new Set();
    const dataChart = new Map();
    console.log({ res });
    res = res.sort(
      (a, b) => new Date(a.time.value) - new Date(b.time.value)
    );
    const listSensorExistData = new Set();

    // Object chứa dữ liệu dạng mảng gồm timestamp và giá trị flow để tính tích lũy
    const sensorPoints = {};

    // Track seen time+sensor combinations to deduplicate
    const seenEntries = new Set();

    res.forEach((v) => {
      // Create unique key for this time+sensor combination
      const entryKey = `${v.time.value}_${v.sensor}`;

      // Skip if we've already processed this time+sensor combination
      if (seenEntries.has(entryKey)) {
        return;
      }
      seenEntries.add(entryKey);

      // Xây dựng category time và dữ liệu cho biểu đồ (như cũ)
      timeCategory.add(
        moment(v.time.value).format("HH:mm:ss DD/MM/YYYY")
      );
      listSensorExistData.add(v.sensor);
      if (!dataChart.has(v.sensor)) {
        dataChart.set(v.sensor, {
          name: v.sensor,
          data: [],
        });
      }
      dataChart.get(v.sensor).data.push(v.value);

      // Nếu sensor có chứa "flow" thì lưu lại thời gian và giá trị để tính tích lũy
      if (v.sensor.toLowerCase().includes("flow")) {
        if (!sensorPoints[v.sensor]) {
          sensorPoints[v.sensor] = [];
        }
        sensorPoints[v.sensor].push({
          time: new Date(v.time.value).getTime(),
          value: v.value,
        });
      }
    });

    // Tính tích lũy lưu lượng (m³) cho mỗi sensor có chứa "flow"
    const cumulativeFlowMap = {};
    for (const sensor in sensorPoints) {
      const points = sensorPoints[sensor];
      // Đảm bảo các điểm được sắp xếp theo thời gian
      points.sort((a, b) => a.time - b.time);
      let cumulative = 0;
      for (let i = 1; i < points.length; i++) {
        const dtHours = (points[i].time - points[i - 1].time) / (1000 * 3600);
        // Tích phân đơn giản: dùng giá trị của điểm trước nhân với khoảng thời gian (giờ)
        cumulative += points[i - 1].value * dtHours;
      }
      cumulativeFlowMap[sensor] = cumulative;
    }
    setCumulativeFlow(cumulativeFlowMap);

    const endDataChart = Array.from(dataChart.values());
    setLoading(false);

    if (
      [...listSensorExistData].length > 0 &&
      endDataChart.length > 0 &&
      endDataChart.length >= chartData.length
    ) {
      setCategoryTime([...timeCategory]);
      setChartData(endDataChart);
      dispatch(listSensorChartAction([...listSensorExistData]));
    }
  };

  useEffect(() => {
    // Skip refetch if in live mode and initial data already loaded
    // Only refetch when:
    // 1. Device changes, OR
    // 2. listSensor changes, OR
    // 3. User manually changes date range (not in live mode)
    const listSensorChanged = JSON.stringify(listSensor) !== JSON.stringify(lastFetchParamsRef.current.listSensor);
    const shouldFetch =
      deviceId !== lastFetchParamsRef.current.deviceId ||
      listSensorChanged ||
      (!isLiveMode && (
        startDate !== lastFetchParamsRef.current.startDate ||
        endDate !== lastFetchParamsRef.current.endDate
      )) ||
      !initialLoadDoneRef.current;

    if (!shouldFetch || listSensor.length === 0) {
      return;
    }

    setChartData([]);
    run();

    // Mark initial load as done and save fetch params
    initialLoadDoneRef.current = true;
    lastFetchParamsRef.current = { deviceId, startDate, endDate, listSensor: [...listSensor] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, deviceId, listSensor, isLiveMode]);

  // Real-time data capture effect - append points to chart state
  useEffect(() => {
    if (!isLiveMode || !dataRealTime || dataRealTime.length === 0) {
      return;
    }

    // Don't add points if chart data is empty (still loading)
    if (chartData.length === 0) {
      return;
    }

    const now = Date.now();
    if (lastCaptureTimeRef.current && (now - lastCaptureTimeRef.current) < 5000) {
      return;
    }
    lastCaptureTimeRef.current = now;

    const sensorData = dataRealTime[0]?.data_sensor || [];
    if (sensorData.length === 0) return;

    const timeStr = moment(new Date()).format("HH:mm:ss DD/MM/YYYY");

    setCategoryTime(prev => {
      const newCategories = [...prev, timeStr];
      if (newCategories.length > MAX_REALTIME_POINTS) {
        return newCategories.slice(-MAX_REALTIME_POINTS);
      }
      return newCategories;
    });

    setChartData(prev => {
      return prev.map(series => {
        const seriesName = series.name;
        // Use exact match first to prevent CO2 matching O2
        const sensor = sensorData.find(s => {
          // Exact match
          if (seriesName === s.Name) return true;
          // Series name starts with sensor name followed by non-letter (e.g., "O2(ppm)" matches "O2")
          const pattern = new RegExp(`^${s.Name}(?![a-zA-Z])`, 'i');
          if (pattern.test(seriesName)) return true;
          // Sensor name exact match to beginning of series name
          if (seriesName.toLowerCase() === s.Name.toLowerCase()) return true;
          return false;
        });

        const newValue = sensor ? parseFloat(sensor.Value) : null;
        let newData = [...series.data, !isNaN(newValue) ? newValue : null];

        if (newData.length > MAX_REALTIME_POINTS) {
          newData = newData.slice(-MAX_REALTIME_POINTS);
        }

        return { ...series, data: newData };
      });
    });

  }, [dataRealTime, isLiveMode, chartData.length]);

  useEffect(() => {
    if (chartData.length > 0) {
      let chartObj = chartComponentRef.current?.chart;
      if (sensorChartShow) {
        chartData.map((v) => {
          delete v.visible;
          if (sensorChartShow == "1") {
            v.visible = true;
          } else {
            if (v.name != sensorChartShow) {
              v.visible = false;
            } else {
              v.visible = true;
            }
          }
          return v;
        });
      }
      const templateOptions = {
        chart: {
          type: "spline",
          height: 500,
        },
        title: null,
        exporting: {
          enabled: true,
        },
        yAxis: {
          title: {
            text: "Số liệu",
          },
        },
        tooltip: {
          crosshairs: true,
          shared: true,
        },
        xAxis: {
          categories: [...categoryTime],
        },
        legend: {
          layout: "horizontal",
          align: "center",
          verticalAlign: "bottom",
        },
        series: [...chartData],
        responsive: {
          rules: [
            {
              condition: {
                maxWidth: 500,
              },
              chartOptions: {
                legend: {
                  layout: "horizontal",
                  align: "center",
                  verticalAlign: "bottom",
                },
              },
            },
          ],
        },
      };
      setTemplateOptions(templateOptions);
    }
  }, [categoryTime, chartData, sensorChartShow]);

  return (
    <>
      {/* Phần hiển thị thông tin lưu lượng tích lũy (m³) */}
      <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
        {listSensor && listSensor.length > 0
          ? listSensor.map((v) =>
            v.toLowerCase().includes("flow") && (
              <div key={v} style={{ marginRight: 20 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mr: 2 }}>
                  {v}
                </Typography>
                <Typography variant="h6" sx={{ color: "blue" }}>
                  {chartData.length == 0 ? "..." : (cumulativeFlow[v] ? cumulativeFlow[v].toFixed(2) : 0)} m³
                </Typography>
              </div>
            )
          )
          : null}
      </Box>
      {/* Phần biểu đồ giữ nguyên như trước đó */}
      {chartData.length > 0 ? (
        <HighchartsReact
          highcharts={Highcharts}
          options={templateOptions}
          ref={chartComponentRef}
        />
      ) : (
        <Box style={{ height: "500px", backgroundColor: "white" }}>
          {loading && <LinearProgress />}
          <Typography sx={{ p: 2 }}>Không có dữ liệu</Typography>
        </Box>
      )}
    </>
  );
}

export default ChartV2;
