// ============================================
// LAYOUT COMPONENTS - Reusable Grid Wrappers
// ============================================

import React,  {useRef ,  useEffect ,useState } from "react";
import { 
  Grid, 
  Skeleton, 
  Paper, 
  Typography, 
  Box,
  TextField, 
  Button, 
  Divider,
  Chip,
  Stack 
} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import ImageIcon from '@mui/icons-material/Image';
import ImageNote from "../../components/ImageNote";
// Styles
import "./CoilGridSection.scss";
import moment from "moment";
/**
 * Responsive Grid Item Wrapper
 */
export const ResponsiveGridItem = ({ gridConfig, children, ...props }) => {
  if (!gridConfig || gridConfig.xs === 0) return null;

  return (
    <Grid item {...gridConfig} {...props}>
      {children}
    </Grid>
  );
};

/**
 * Bordered Content Container
 */
export const BorderedContent = ({ show = true, children, className = "" }) => {
  if (!show) return null;

  return (
    <div className={`borderd-content ${className}`}>
      <div className="content">{children}</div>
    </div>
  );
};

/**
 * Sensor Grid Section
 */
export const SensorGridSection = ({
  gridConfig,
  isCNVDevice,
  fullRS485Data,
  onSettingClick,
  onAlarmClick,
  dataSensor,
  dataChange,
  valueSelect,
  isRerenderCard,
  onClickSensorDevice,
  styleForCard,
  CNVDisplayComponent,
  SensorGridOptimized,
}) => {
  if (gridConfig.xs === 0) return null;

  return (
    <ResponsiveGridItem gridConfig={gridConfig}>
      <BorderedContent show={dataSensor?.[0]?.length > 0}>
        {isCNVDevice ? (
          <CNVDisplayComponent
            fullRS485Data={fullRS485Data}
            onSettingClick={onSettingClick}
            onAlarmClick={onAlarmClick}
          />
        ) : (
          <SensorGridOptimized
            dataSensor={dataSensor}
            dataChange={dataChange}
            valueSelect={valueSelect}
            isRerenderCard={isRerenderCard}
            onClickSensorDevice={onClickSensorDevice}
            styleForCard={styleForCard}
          />
        )}
      </BorderedContent>
    </ResponsiveGridItem>
  );
};

/**
 * Coil Grid Section
 */
export const CoilGridSection = ({
  gridConfig,
  dataCoil,
  fullRS485Data,
  valueSelect,
  onClickCoilDevice,
  dataChange,
  styleForCard,
  CoilValueDevice,
  IFrameSVGWrapper,
}) => {

  const rawCoils = dataCoil?.[0] || [];

  const visibleCoils = rawCoils.filter((obj) => {
    const shouldHide =
      obj.item?.IsHide &&
      (!obj.item.IsHighAlarm ||
        (obj.item.IsHighAlarm && obj.item.Value === 0));

    return !shouldHide;
  });

  // GROUPING
  const grouped = visibleCoils.reduce((acc, coil) => {
    const group = coil.item.GroupName || "Khác";
    if (!acc[group]) acc[group] = [];
    acc[group].push(coil);
    return acc;
  }, {});
  let sensorCount = (fullRS485Data.RS485Data.filter(item => item.MemoryType === 1))?.length || 0;

  const isSingleGroup = Object.keys(grouped).length === 1; // chỉ 1 group
  const coilGridXL = isSingleGroup ? 3 : 6; // 12 / 3 = 4 coil / dòng, 12 / 6 = 2 coil / dòng

  return (
    <ResponsiveGridItem gridConfig={gridConfig}>
      <BorderedContent>
        <Grid container spacing={2}>
          {/* --- IFrameSVGWrapper --- */}
          {fullRS485Data?.IsPIDAnimation && (
            <Grid item xs={12}>
              <div className="pid-animation-wrapper">
                <IFrameSVGWrapper valueSelectId={valueSelect.id} />
              </div>
            </Grid>
          )}

          {/* --- GROUPS --- */}
          {Object.entries(grouped).map(([groupName, items], groupIndex) => (
            <Grid
              key={groupIndex}
              item
              xl={isSingleGroup ? 12 : (sensorCount <= 1 ? 3: 6)}
              lg={isSingleGroup ? 12 : (sensorCount <= 1 ? 3: 6)}
              md={12}
              sm={12}
              xs={12}
            >
              <div className="coil-group-box">
                <div className="coil-group-title">{groupName}</div>

                <Grid container spacing={1.2}>
                  {items.map((v, index) => (
                    <Grid
                      key={index}
                      item
                      xl={coilGridXL}
                      lg={coilGridXL}
                      md={4}
                      sm={6}
                      xs={12}
                    >
                      <div
                        className="coil-card-wrapper"
                        onClick={() => onClickCoilDevice(v)}
                      >
                        <CoilValueDevice
                          item={v.item}
                          isHighAlarm={v.IsHighAlarm}
                          label={v.item.Name}
                          lastTime={dataChange.last_time}
                          deviceId={valueSelect.id + v.sensor}
                          value={v.value.split("*")[0]}
                          unit={` ${v.unit || ""}`}
                          state={styleForCard(v.value)}
                          fillColor="red"
                          IsRevHighAlarm = {fullRS485Data?.IsHighAlarm || false}
                        />
                      </div>
                    </Grid>
                  ))}
                </Grid>
              </div>
            </Grid>
          ))}
        </Grid>
      </BorderedContent>
    </ResponsiveGridItem>
  );
};




/**
 * Map Section
 */
export const MapSection = ({
  gridConfig,
  valueSelect,
  dataCoordinates,
  listDevice,
  MapComponent,
  height = "460px",
  zoomDefault = 15,
}) => {
  if (!valueSelect) {
    return (
      <ResponsiveGridItem gridConfig={gridConfig}>
        <Skeleton animation="wave" variant="rounded" height={500} />
      </ResponsiveGridItem>
    );
  }

  return (
    <ResponsiveGridItem gridConfig={gridConfig}>
      <div className="home_map">
        <MapComponent
          height={height}
          zoomDefault={zoomDefault}
          data={dataCoordinates}
          showTabState={false}
          showBtnAll={false}
          longitudeDefault={listDevice[valueSelect.id]?.longitude}
          latitudeDefault={listDevice[valueSelect.id]?.latitude}
          showMarkerInfo={true}
          showButtonHideLabel={false}
        />
      </div>
    </ResponsiveGridItem>
  );
};

/**
 * Notes/Chat Section
 */


// Enhanced NotesSection Component
export const NotesSection = ({
  gridConfig,
  deviceId,
  deviceType,
  textList = [],
  inputText,
  handleInputChange,
  handleKeyPress,
  addTextToList,
  classes,
  IFrameExcelCheckList,
  isLoading = false, // Thêm prop isLoading
}) => {
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef(null);
  
  const isNNV = deviceId?.includes("NNV");
  const isBienTan = deviceId?.includes("A-BIENTAN-1");
  const showNotes = deviceId?.includes("NNV") || deviceId?.includes("TPN") || deviceType !== 0;

  // Tính chiều cao của content
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [textList]);

  if (!showNotes) return null;

 
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return moment(timestamp).format("HH:mm DD/MM/YYYY");
  };

  return (
    <ResponsiveGridItem gridConfig={gridConfig}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.default'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="h6" fontWeight={600} color="text.primary">
            {isNNV ? '💬 Tin nhắn' : '📝 Danh sách ghi chú'}
          </Typography>
          {textList.length > 0 && (
            <Chip 
              label={textList.length} 
              size="small" 
              color="primary"
              sx={{ 
                minWidth: 32,
                fontWeight: 600,
                height: 24
              }}
            />
          )}
        </Stack>
      </Paper>

      {/* Content */}
      {isBienTan ? (
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <IFrameExcelCheckList 
            valueSelectId="https://docs.google.com/spreadsheets/d/1dKFjIrD4pPdA8BgLOaDNBWlXOFIEIel0_7n1zokufbs/edit?usp=sharing&rm=minimal&single=false&zoom=75" 
          />
        </Box>
      ) : (
        <Paper 
          elevation={0}
          sx={{ 
            flexGrow: 1,
            bgcolor: '#fafafa',
            position: 'relative',
            overflow: contentHeight > 392 ? 'auto' : 'visible',
            maxHeight: contentHeight > 392 ? '392px' : 'none',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.3)',
              }
            }
          }}
        >
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              <Stack spacing={2}>
                {[1, 2, 3].map((item) => (
                  <Box key={item}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Skeleton variant="text" width={120} height={20} />
                        <Skeleton variant="text" width={100} height={16} />
                      </Stack>
                      <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1 }} />
                    </Stack>
                    {item < 3 && <Divider sx={{ my: 1.5 }} />}
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : (
            <Stack spacing={0} sx={{ p: 2 }} ref={contentRef}>
              {textList.length === 0 ? (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    color: 'text.secondary'
                  }}
                >
                  <ImageIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                  <Typography variant="body1" sx={{ opacity: 0.6 }}>
                    Đang tải ghi chú...
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.5 }}>
                    Vui lòng chờ trong giây lát
                  </Typography>
                </Box>
              ) : (
                textList.map((message, index) => (
                  <Box key={index}>
                    <Stack 
                      spacing={0.75}
                      sx={{ 
                        py: 2,
                        px: 1.5,
                        borderRadius: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.03)',
                        }
                      }}
                    >
                      <Stack 
                        direction="row" 
                        alignItems="center" 
                        spacing={1.5}
                        flexWrap="wrap"
                      >
                        <Typography 
                          variant="subtitle2" 
                          fontWeight={600}
                          color="primary"
                          sx={{ fontSize: '0.9rem' }}
                        >
                          {message.name}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontSize: '0.75rem'
                          }}
                        >
                          🕒 {formatTime(message.timestamp)}
                        </Typography>
                      </Stack>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: 1.6,
                          color: 'text.primary'
                        }}
                      >
                        {message.content}
                      </Typography>

                      {message.Image && message.Image.length > 0 && (
                        <Stack 
                          direction="row" 
                          spacing={1.5} 
                          flexWrap="wrap"
                          sx={{ mt: 1, gap: 1.5 }}
                        >
                          {message.Image.map((urlImg, idx) => (
                            <ImageNote key={idx} imageUrl={urlImg} />
                          ))}
                        </Stack>
                      )}
                    </Stack>
                    {index < textList.length - 1 && (
                      <Divider sx={{ my: 0.5, opacity: 0.6 }} />
                    )}
                  </Box>
                ))
              )}
            </Stack>
          )}
        </Paper>
      )}

      {/* Input Area */}
      {isNNV && (
        <Paper 
          elevation={4}
          sx={{ 
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-end">
            <TextField
              fullWidth
              placeholder="Nhập tin nhắn của bạn..."
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              size="small"
              multiline
              maxRows={4}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f5f5f5',
                  '&:hover': {
                    bgcolor: '#eeeeee'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'background.paper'
                  }
                }
              }}
            />
            <Button 
              variant="contained" 
              onClick={addTextToList}
              disabled={!inputText?.trim()}
              startIcon={<SendIcon />}
              sx={{ 
                minWidth: 100,
                height: 40,
                px: 2,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              Gửi
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
    </ResponsiveGridItem>
  );
};
/**
 * Chart Section with Date Controls
 */
export const ChartSection = ({
  gridConfig,
  valueSelect,
  isShowColChart,
  chartType,
  endDate,
  startDate,
  listSensor,
  startDateTemp,
  endDateTemp,
  handleChangeStartDate,
  handleChangeEndDate,
  handleApplyDate,
  exportButtons,
  ChartTab,
  MainChart,
  ColumnChartSensor,
  MyDateRange,
  MyButton,
}) => {
  if (!valueSelect) return null;

  const ChartComponent = chartType === "ChartTab" ? ChartTab : MainChart;

  return (
    <ResponsiveGridItem gridConfig={gridConfig}>
      <Grid container spacing={0.5}>
        {/* Main Chart */}
        <Grid
          item
          xl={isShowColChart ? 6 : 12}
          lg={isShowColChart ? 6 : 12}
          md={isShowColChart ? 6 : 12}
          sm={12}
          xs={12}
        >
          <div className="home_chart">
            <ChartComponent
              endDate={endDate}
              startDate={startDate}
              deviceId={valueSelect.id}
              deviceUser={valueSelect.id}
              inputLstSensor={listSensor}
            />
          </div>
        </Grid>

        {/* Column Chart */}
        {isShowColChart && (
          <Grid item xl={6} lg={6} md={6} sm={6} xs={6}>
            <div className="home_chart">
              <ColumnChartSensor
                endDate={endDate}
                startDate={startDate}
                deviceUser={valueSelect.id}
              />
            </div>
          </Grid>
        )}

        {/* Date Controls */}
        <Grid item xs={12}>
          <Grid container spacing={1}>
            <Grid item xs={3}>
              <MyDateRange
                label="Bắt đầu"
                onChange={handleChangeStartDate}
                value={startDateTemp}
              />
            </Grid>
            <Grid item xs={3}>
              <MyDateRange
                label="Kết thúc"
                onChange={handleChangeEndDate}
                value={endDateTemp}
              />
            </Grid>
            <Grid item xs={3}>
              <MyButton icon={null} name="Áp dụng" onClick={handleApplyDate} />
            </Grid>
            <Grid item xs={3}>
              {exportButtons.map((btn, idx) => (
                <MyButton
                  key={idx}
                  icon={null}
                  name={btn.label}
                  onClick={btn.onClick}
                />
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </ResponsiveGridItem>
  );
};

/**
 * Camera Section
 */
export const CameraSection = ({ gridConfig, cameraList, CameraDialog }) => {
  if (!gridConfig) return null;

  return (
    <ResponsiveGridItem gridConfig={gridConfig}>
      <CameraDialog cameraList={cameraList} />
    </ResponsiveGridItem>
  );
};