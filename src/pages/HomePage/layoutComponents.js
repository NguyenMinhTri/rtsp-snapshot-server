// ============================================
// LAYOUT COMPONENTS - Reusable Grid Wrappers
// ============================================

import React from "react";
import { 
  Grid, 
  Skeleton, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Stack 
} from "@mui/material";
// Styles
import "./CoilGridSection.scss";

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
                          IsRevHighAlarm = {fullRS485Data?.IsRevHighAlarm || false}
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
  height = "548px",
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
export const NotesSection = ({
  gridConfig,
  deviceId,
  deviceType,
  textList,
  inputText,
  handleInputChange,
  handleKeyPress,
  addTextToList,
  classes,
  IFrameExcelCheckList,
  ImageNote, // Add ImageNote as prop
}) => {
  const isNNV = deviceId?.includes("NNV");
  const isBienTan = deviceId?.includes("A-BIENTAN-1");
  const showNotes = deviceId?.includes("NNV") || deviceId?.includes("TPN") || deviceType !== 0;

  if (!showNotes) return null;

  return (
    <ResponsiveGridItem gridConfig={gridConfig}>
      <div className={classes.container}>
        <div className={classes.inputContainer}>
          {isNNV ? (
            <Grid xs={12} sm={12}>
              <Stack spacing={1} direction="row">
                <TextField
                  className={classes.input}
                  label="Type a message"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  size="small"
                  multiline
                  variant="outlined"
                />
                <Button variant="contained" color="primary" onClick={addTextToList}>
                  Send
                </Button>
              </Stack>
            </Grid>
          ) : (
            <span style={{ fontSize: "18px", marginBottom: "10px", fontWeight: "600" }}>
              Danh sách ghi chú
            </span>
          )}
        </div>

        {isBienTan ? (
          <IFrameExcelCheckList valueSelectId="https://docs.google.com/spreadsheets/d/1dKFjIrD4pPdA8BgLOaDNBWlXOFIEIel0_7n1zokufbs/edit?usp=sharing&rm=minimal&single=false&zoom=75" />
        ) : (
          <Paper className={classes.chatContainer}>
            {textList.map((message, index) => (
              <div className={classes.message} key={index}>
                <Stack sx={{ p: 1 }} spacing={0.5}>
                  <Typography variant="subtitle1" color="primary">
                    {message.name} - {message.timestamp}
                  </Typography>
                  <Typography variant="body1">{message.content}</Typography>
                </Stack>
                {message.Image?.map((urlImg, idx) => (
                  <ImageNote key={idx} imageUrl={urlImg} />
                ))}
              </div>
            ))}
          </Paper>
        )}
      </div>
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