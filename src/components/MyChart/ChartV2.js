import React, { useEffect, useRef, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Box, LinearProgress, Typography, Dialog, DialogTitle, DialogContent, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
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
  // State lưu trữ thống kê status (calib/error)
  const [statusStats, setStatusStats] = useState({ calib: 0, error: 0 });
  // State lưu trữ status data cho từng sensor theo thời gian
  const [statusLookup, setStatusLookup] = useState({});
  // State lưu trữ chi tiết status để hiển thị trong dialog
  const [statusDetails, setStatusDetails] = useState([]);
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('calib'); // 'calib' or 'error'
  const sensorChartShow = useSelector(chooseSensorSelector);

  // Track if initial data has been loaded to prevent API refetch in live mode
  const initialLoadDoneRef = useRef(false);
  const lastFetchParamsRef = useRef({ deviceId: null, startDate: null, endDate: null, listSensor: null });

  // Real-time data refs
  const lastCaptureTimeRef = useRef(null);
  const MAX_REALTIME_POINTS = 120; // 10 minutes at 5 second intervals
  const prevDeviceIdRef = useRef(deviceId);

  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  // Reset chart when device changes
  useEffect(() => {
    if (prevDeviceIdRef.current !== deviceId) {
      // Device changed - reset everything
      setCategoryTime([]);
      setChartData([]);
      setCumulativeFlow({});
      setStatusStats({ calib: 0, error: 0 });
      setStatusLookup({});
      setTemplateOptions(null);
      setLoading(true);
      initialLoadDoneRef.current = false;
      lastFetchParamsRef.current = { deviceId: null, startDate: null, endDate: null, listSensor: null };
      prevDeviceIdRef.current = deviceId;
    }
  }, [deviceId]);

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
      enableFill: true,
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

    console.log({ res });

    // Sort data theo thời gian ASC
    res = res.sort(
      (a, b) => new Date(a.time.value) - new Date(b.time.value)
    );

    // Track seen time+sensor combinations to deduplicate
    const seenEntries = new Set();

    // Bước 1: Thu thập tất cả timestamps unique
    const timeCategory = [];
    const timeSet = new Set();
    res.forEach((v) => {
      const entryKey = `${v.time.value}_${v.sensor}`;
      if (seenEntries.has(entryKey)) return;
      seenEntries.add(entryKey);

      const timeStr = moment(v.time.value).format("HH:mm:ss DD/MM/YYYY");
      if (!timeSet.has(timeStr)) {
        timeSet.add(timeStr);
        timeCategory.push(timeStr);
      }
    });

    // Reset seenEntries for actual processing
    seenEntries.clear();

    // Bước 2: Thu thập danh sách sensors và tạo lookup map
    const listSensorExistData = new Set();
    const dataLookup = {}; // {sensor: {timeStr: value}}
    const statusDataLookup = {}; // {sensor: {timeStr: status}}
    const sensorPoints = {}; // For flow calculation
    const statusDetailsList = []; // Chi tiết các điểm có status
    let calibCount = 0;
    let errorCount = 0;

    res.forEach((v) => {
      const entryKey = `${v.time.value}_${v.sensor}`;
      if (seenEntries.has(entryKey)) return;
      seenEntries.add(entryKey);

      const timeStr = moment(v.time.value).format("HH:mm:ss DD/MM/YYYY");
      listSensorExistData.add(v.sensor);

      if (!dataLookup[v.sensor]) {
        dataLookup[v.sensor] = {};
      }
      dataLookup[v.sensor][timeStr] = v.value;

      // Track status data
      if (!statusDataLookup[v.sensor]) {
        statusDataLookup[v.sensor] = {};
      }
      const status = v.status !== undefined ? v.status : null;
      statusDataLookup[v.sensor][timeStr] = status;

      // Count status statistics and save details
      if (status === 1) {
        calibCount++;
        statusDetailsList.push({
          sensor: v.sensor,
          time: timeStr,
          value: v.value,
          status: 1,
          statusLabel: 'Calib'
        });
      } else if (status === 2) {
        errorCount++;
        statusDetailsList.push({
          sensor: v.sensor,
          time: timeStr,
          value: v.value,
          status: 2,
          statusLabel: 'Lỗi'
        });
      }

      // Nếu sensor có chứa "flow" thì lưu lại để tính tích lũy
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

    // Update status lookup, stats and details
    setStatusLookup(statusDataLookup);
    setStatusStats({ calib: calibCount, error: errorCount });
    setStatusDetails(statusDetailsList);

    // Bước 3: Tạo data arrays với null cho timestamps không có data
    const dataChart = new Map();
    listSensorExistData.forEach(sensor => {
      const dataArray = timeCategory.map((timeStr, index) => {
        const value = dataLookup[sensor][timeStr] !== undefined
          ? dataLookup[sensor][timeStr]
          : null;
        const status = statusDataLookup[sensor][timeStr];

        // Return object with value and marker info for status points
        if (status === 1 || status === 2) {
          return {
            y: value,
            marker: {
              enabled: true,
              radius: 4,
              fillColor: status === 1 ? '#FFC107' : '#F44336', // Yellow for calib, Red for error
              lineColor: status === 1 ? '#FFA000' : '#D32F2F',
              lineWidth: 1,
              symbol: 'circle'
            },
            status: status
          };
        }
        return value;
      });
      dataChart.set(sensor, {
        name: sensor,
        data: dataArray,
      });
    });

    // Tính tích lũy lưu lượng (m³) cho mỗi sensor có chứa "flow"
    const cumulativeFlowMap = {};
    for (const sensor in sensorPoints) {
      const points = sensorPoints[sensor];
      points.sort((a, b) => a.time - b.time);
      let cumulative = 0;
      for (let i = 1; i < points.length; i++) {
        const dtHours = (points[i].time - points[i - 1].time) / (1000 * 3600);
        cumulative += points[i - 1].value * dtHours;
      }
      cumulativeFlowMap[sensor] = cumulative;
    }
    setCumulativeFlow(cumulativeFlowMap);

    const endDataChart = Array.from(dataChart.values());
    setLoading(false);

    if ([...listSensorExistData].length > 0 && endDataChart.length > 0) {
      setCategoryTime(timeCategory);
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

    // Reset status stats and details when fetching new data
    setStatusStats({ calib: 0, error: 0 });
    setStatusDetails([]);
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
        const stateNum = sensor?.StateNum; // Get StateNum for status

        // Create data point with marker if status indicates calib/error
        let newPoint;
        if (stateNum === 1 || stateNum === 2) {
          newPoint = {
            y: !isNaN(newValue) ? newValue : null,
            marker: {
              enabled: true,
              radius: 4,
              fillColor: stateNum === 1 ? '#FFC107' : '#F44336',
              lineColor: stateNum === 1 ? '#FFA000' : '#D32F2F',
              lineWidth: 1,
              symbol: 'circle'
            },
            status: stateNum
          };
        } else {
          newPoint = !isNaN(newValue) ? newValue : null;
        }

        let newData = [...series.data, newPoint];

        if (newData.length > MAX_REALTIME_POINTS) {
          newData = newData.slice(-MAX_REALTIME_POINTS);
        }

        return { ...series, data: newData };
      });
    });

    // Update status stats for realtime data
    setStatusStats(prevStats => {
      let calibInc = 0;
      let errorInc = 0;
      sensorData.forEach(sensor => {
        if (sensor.StateNum === 1) calibInc++;
        else if (sensor.StateNum === 2) errorInc++;
      });
      if (calibInc > 0 || errorInc > 0) {
        return {
          calib: prevStats.calib + calibInc,
          error: prevStats.error + errorInc
        };
      }
      return prevStats;
    });

    // Update cumulative flow for flow sensors in live mode
    setCumulativeFlow(prevFlow => {
      const updatedFlow = { ...prevFlow };
      const intervalHours = 5 / 3600; // 5 seconds in hours

      sensorData.forEach(sensor => {
        if (sensor.Name && sensor.Name.toLowerCase().includes("flow")) {
          const flowValue = parseFloat(sensor.Value);
          if (!isNaN(flowValue)) {
            // Add flow * time interval to cumulative
            const currentCumulative = updatedFlow[sensor.Name] || 0;
            updatedFlow[sensor.Name] = currentCumulative + (flowValue * intervalHours);
          }
        }
      });

      return updatedFlow;
    });

  }, [dataRealTime, isLiveMode, chartData.length]);

  useEffect(() => {
    if (chartData.length > 0) {
      // Make a deep copy of chartData to avoid mutation issues
      const processedChartData = chartData.map((v) => {
        const series = { ...v, data: [...v.data] };
        delete series.visible;
        // Show all if sensorChartShow is "1", null, or undefined
        if (sensorChartShow === "1" || !sensorChartShow) {
          series.visible = true;
        } else {
          series.visible = v.name === sensorChartShow;
        }
        return series;
      });

      // Calculate yAxis min/max based on visible series only
      let yMin = null;
      let yMax = null;
      processedChartData.forEach(series => {
        if (series.visible && series.data.length > 0) {
          const validData = series.data.filter(d => d !== null && !isNaN(d));
          if (validData.length > 0) {
            const seriesMin = Math.min(...validData);
            const seriesMax = Math.max(...validData);
            if (yMin === null || seriesMin < yMin) yMin = seriesMin;
            if (yMax === null || seriesMax > yMax) yMax = seriesMax;
          }
        }
      });

      // Add 10% padding to yAxis range
      if (yMin !== null && yMax !== null) {
        const range = yMax - yMin;
        const padding = range * 0.1 || 1; // At least 1 unit padding
        yMin = yMin - padding;
        yMax = yMax + padding;
      }

      const templateOptions = {
        chart: {
          type: "spline",
          height: 480,
          animation: false,
          spacingBottom: 40,
          marginBottom: 120,
        },
        title: null,
        exporting: {
          enabled: true,
        },
        yAxis: {
          title: {
            text: "Số liệu",
          },
          min: sensorChartShow !== "1" ? yMin : null,
          max: sensorChartShow !== "1" ? yMax : null,
          startOnTick: true,
          endOnTick: true,
        },
        tooltip: {
          crosshairs: true,
          shared: true,
          useHTML: true,
          formatter: function () {
            let html = `<div style="font-size:12px;padding:8px;">`;
            html += `<b>${this.x}</b><br/>`;

            this.points.forEach(point => {
              const value = typeof point.y === 'number' ? point.y.toFixed(2) : point.y;
              const status = point.point.status;
              let statusLabel = '';

              if (status === 1) {
                statusLabel = '<span style="color:#FFA000;font-weight:bold;margin-left:6px;">[Calib]</span>';
              } else if (status === 2) {
                statusLabel = '<span style="color:#D32F2F;font-weight:bold;margin-left:6px;">[Lỗi]</span>';
              }

              html += `<span style="color:${point.series.color}">●</span> ${point.series.name}: <b>${value}</b>${statusLabel}<br/>`;
            });

            html += '</div>';
            return html;
          }
        },
        xAxis: {
          categories: categoryTime.map(t => {
            // Format: "HH:mm:ss DD/MM" with seconds
            const parts = t.split(' ');
            if (parts.length >= 2) {
              const time = parts[0].substring(0, 8); // HH:mm:ss
              const date = parts[1].substring(0, 5); // DD/MM
              return `${time}\n${date}`;
            }
            return t;
          }),
          labels: {
            enabled: true,
            rotation: 0,
            style: {
              fontSize: '10px',
              color: '#333'
            },
            step: Math.max(1, Math.ceil(categoryTime.length / 6)),
            y: 25,
            overflow: 'allow',
            useHTML: true,
            formatter: function () {
              const val = this.value;
              if (val && val.includes && val.includes('\n')) {
                const [time, date] = val.split('\n');
                return `<div style="text-align:center"><span>${time}</span><br/><span style="font-size:8px;color:#666">${date}</span></div>`;
              }
              return val;
            }
          },
        },
        legend: {
          layout: "horizontal",
          align: "center",
          verticalAlign: "top",
          margin: 15,
          itemStyle: {
            fontSize: '11px'
          }
        },
        series: processedChartData,
        plotOptions: {
          series: {
            animation: false, // Disable series animation
            connectNulls: true, // Connect line through null points
            lineWidth: 2,
          },
          spline: {
            connectNulls: true,
            marker: {
              enabled: false,
            }
          }
        },
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
                  verticalAlign: "top",
                },
              },
            },
          ],
        },
      };
      setTemplateOptions(templateOptions);

      // Force chart redraw when sensor selection changes
      if (chartComponentRef.current?.chart) {
        setTimeout(() => {
          chartComponentRef.current?.chart?.reflow();
        }, 100);
      }
    }
  }, [categoryTime, chartData, sensorChartShow]);

  return (
    <>
      {/* Phần hiển thị thông tin lưu lượng tích lũy (m³) và thống kê status */}
      <Box sx={{ p: 2, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        {listSensor && listSensor.length > 0
          ? listSensor.map((v) =>
            v.toLowerCase().includes("flow") && (
              <Box key={v} sx={{ mr: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {v}
                </Typography>
                <Typography variant="h6" sx={{ color: "blue" }}>
                  {chartData.length == 0 ? "..." : (cumulativeFlow[v] ? cumulativeFlow[v].toFixed(2) : 0)} m³
                </Typography>
              </Box>
            )
          )
          : null}

        {/* Status Statistics - only show when there's calib or error data */}
        {(statusStats.calib > 0 || statusStats.error > 0) && (
          <Box sx={{
            display: 'flex',
            gap: 2,
            ml: 2,
            pl: 2,
            borderLeft: '2px solid #e0e0e0'
          }}>
            {statusStats.calib > 0 && (
              <Box
                onClick={() => { setDialogType('calib'); setDialogOpen(true); }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: '#FFF8E1',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  border: '1px solid #FFE082',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#FFE082',
                    transform: 'scale(1.02)',
                  }
                }}>
                <Box sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: '#FFC107',
                  border: '2px solid #FFA000'
                }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#F57F17' }}>
                  Calib: {statusStats.calib}
                </Typography>
              </Box>
            )}
            {statusStats.error > 0 && (
              <Box
                onClick={() => { setDialogType('error'); setDialogOpen(true); }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: '#FFEBEE',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  border: '1px solid #FFCDD2',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#FFCDD2',
                    transform: 'scale(1.02)',
                  }
                }}>
                <Box sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: '#F44336',
                  border: '2px solid #D32F2F'
                }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#C62828' }}>
                  Lỗi: {statusStats.error}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
      {/* Phần biểu đồ giữ nguyên như trước đó */}
      {chartData.length > 0 ? (
        <HighchartsReact
          highcharts={Highcharts}
          options={templateOptions}
          ref={chartComponentRef}
        />
      ) : (
        <Box
          sx={{
            height: "420px",
            backgroundColor: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <>
              <Box
                component="img"
                src="/image/navis.png"
                alt="Loading"
                sx={{
                  width: 80,
                  height: 80,
                  objectFit: "contain",
                  borderRadius: "16px",
                  animation: "pulse 1.5s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 1, transform: "scale(1)" },
                    "50%": { opacity: 0.5, transform: "scale(0.95)" },
                  },
                }}
              />
              <Typography sx={{ mt: 2, color: "text.secondary" }}>
                Đang tải dữ liệu biểu đồ...
              </Typography>
            </>
          ) : (
            <>
              <Box
                component="img"
                src="/image/navis.png"
                alt="No data"
                sx={{
                  width: 60,
                  height: 60,
                  objectFit: "contain",
                  borderRadius: "12px",
                  opacity: 0.4,
                  filter: "grayscale(50%)",
                }}
              />
              <Typography sx={{ mt: 2, fontWeight: 600, color: "text.primary" }}>
                Không có dữ liệu
              </Typography>
              <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: "0.9rem" }}>
                Vui lòng chọn thời điểm khác hoặc kiểm tra kết nối
              </Typography>
            </>
          )}
        </Box>
      )}

      {/* Status Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: dialogType === 'calib' ? '#FFF8E1' : '#FFEBEE',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: dialogType === 'calib' ? '#FFC107' : '#F44336',
              border: `2px solid ${dialogType === 'calib' ? '#FFA000' : '#D32F2F'}`
            }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Chi tiết {dialogType === 'calib' ? 'Calib' : 'Lỗi'} ({statusDetails.filter(d => d.status === (dialogType === 'calib' ? 1 : 2)).length} điểm)
            </Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Sensor</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Thời gian</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Giá trị</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statusDetails
                  .filter(d => d.status === (dialogType === 'calib' ? 1 : 2))
                  .map((detail, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{detail.sensor}</TableCell>
                      <TableCell>{detail.time}</TableCell>
                      <TableCell>{typeof detail.value === 'number' ? detail.value.toFixed(2) : detail.value}</TableCell>
                      <TableCell>
                        <Chip
                          label={detail.statusLabel}
                          size="small"
                          sx={{
                            bgcolor: detail.status === 1 ? '#FFC107' : '#F44336',
                            color: detail.status === 1 ? '#000' : '#fff',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ChartV2;
