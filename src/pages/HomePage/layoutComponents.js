// ============================================
// LAYOUT COMPONENTS - Reusable Grid Wrappers
// ============================================

import React, { useRef, useEffect, useState } from "react";
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
  Stack,
  IconButton,
  Dialog,
} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import ImageIcon from '@mui/icons-material/Image';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
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
    // If IsHighAlarm=true AND IsHide=true, always hide this coil
    if (obj.item?.IsHighAlarm && obj.item?.IsHide) {
      return false;
    }

    // Normal IsHide logic: hide if IsHide=true and (not alarm OR alarm with value=0)
    const shouldHide =
      obj.item?.IsHide &&
      (!obj.item.IsHighAlarm ||
        (obj.item.IsHighAlarm && obj.item.Value === 0));

    return !shouldHide;
  });

  // If no visible coils and no PID, don't render the section
  if (visibleCoils.length === 0 && !fullRS485Data?.IsPIDAnimation) {
    return null;
  }

  // GROUPING
  const grouped = visibleCoils.reduce((acc, coil) => {
    const group = coil.item.GroupName || "Khác";
    if (!acc[group]) acc[group] = [];
    acc[group].push(coil);
    return acc;
  }, {});
  let sensorCount = (fullRS485Data.RS485Data.filter(item => item.MemoryType === 1))?.length || 0;

  const groupCount = Object.keys(grouped).length;
  const isSingleGroup = groupCount === 1;
  const totalCoils = visibleCoils.length;

  // Group width: fit all groups in row if possible
  // 1 group: 12, 2 groups: 6, 3 groups: 4, 4 groups: 3
  let groupWidth;
  if (isSingleGroup) {
    groupWidth = 12;
  } else if (groupCount === 2) {
    groupWidth = 6;
  } else if (groupCount === 3) {
    groupWidth = 4;
  } else {
    groupWidth = 3; // 4+ groups: 4 per row
  }

  return (
    <ResponsiveGridItem gridConfig={gridConfig}>
      <BorderedContent>
        <Grid container spacing={1}>
          {/* --- IFrameSVGWrapper --- */}
          {fullRS485Data?.IsPIDAnimation && (
            <Grid item xs={12}>
              <div className="pid-animation-wrapper">
                <IFrameSVGWrapper valueSelectId={valueSelect.id} />
              </div>
            </Grid>
          )}

          {/* --- GROUPS --- */}
          {Object.entries(grouped).map(([groupName, items], groupIndex) => {
            const coilsInGroup = items.length;

            // Check max name length in this group
            const maxNameLength = items.reduce((max, item) => {
              const nameLen = item.item?.Name?.length || 0;
              return Math.max(max, nameLen);
            }, 0);

            // If names are long (>15 chars), use wider columns
            const hasLongNames = maxNameLength > 15;
            const hasVeryLongNames = maxNameLength > 25;

            // Coil item size based on items in THIS group + name length
            let coilGridXL;
            if (coilsInGroup === 1) {
              coilGridXL = 12; // 1 coil in group: full width
            } else if (hasVeryLongNames) {
              coilGridXL = 12; // Very long names: 1 per row
            } else if (hasLongNames) {
              coilGridXL = 6; // Long names: max 2 per row
            } else if (coilsInGroup === 2) {
              coilGridXL = 6; // 2 coils: 2 per row
            } else if (coilsInGroup <= 4) {
              coilGridXL = 6; // 3-4 coils: 2 per row
            } else {
              coilGridXL = 4; // 5+ coils: 3 per row
            }

            return (
              <Grid
                key={groupIndex}
                item
                xl={groupWidth}
                lg={groupWidth}
                md={groupCount >= 3 ? 4 : 6}
                sm={6}
                xs={12}
              >
                <div className="coil-group-box">
                  <div className="coil-group-title">{groupName}</div>

                  <Grid container spacing={0.8}>
                    {items.map((v, index) => (
                      <Grid
                        key={index}
                        item
                        xl={coilGridXL}
                        lg={coilGridXL}
                        md={6}
                        sm={6}
                        xs={6}
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
                            IsRevHighAlarm={fullRS485Data?.IsHighAlarm || false}
                          />
                        </div>
                      </Grid>
                    ))}
                  </Grid>
                </div>
              </Grid>
            );
          })}
        </Grid>
      </BorderedContent>
    </ResponsiveGridItem>
  );
};


/**
 * Dashboard Card Wrapper - Modern card styling for dashboard sections
 */
export const DashboardCard = ({ title, icon, children, noPadding = false, minHeight, action }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      overflow: 'hidden',
      height: '100%',
      minHeight: minHeight || 'auto',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      },
    }}
  >
    {title && (
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          {icon && <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>}
          <Typography variant="subtitle1" fontWeight={600} color="text.primary">
            {title}
          </Typography>
        </Stack>
        {action}
      </Box>
    )}
    <Box sx={{ flexGrow: 1, p: noPadding ? 0 : 2, overflow: 'hidden' }}>
      {children}
    </Box>
  </Paper>
);

/**
 * Map Section - Compact mode with expand button
 * Uses Google Maps with full height display
 */
// Fixed height constant for consistent section heights
const SECTION_HEIGHT = 560;

export const MapSection = ({
  gridConfig,
  valueSelect,
  dataCoordinates,
  listDevice,
  MapComponent,
  height = "100%",
  zoomDefault = 15,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if device has valid coordinates
  const hasCoordinates = valueSelect &&
    listDevice[valueSelect.id]?.latitude &&
    listDevice[valueSelect.id]?.longitude;

  // Don't render map if no coordinates - save space
  if (!hasCoordinates) {
    return null;
  }

  const lat = listDevice[valueSelect.id]?.latitude;
  const lng = listDevice[valueSelect.id]?.longitude;
  const stationName = valueSelect?.label || valueSelect?.id;

  return (
    <>
      {/* Map Card - Fixed Height */}
      <ResponsiveGridItem gridConfig={gridConfig}>
        <Paper
          elevation={0}
          sx={{
            height: SECTION_HEIGHT,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} color="text.primary">
              📍 Vị trí
            </Typography>
            <IconButton
              size="small"
              onClick={() => setIsExpanded(true)}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                width: 28,
                height: 28,
              }}
            >
              <OpenInFullIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          {/* Map container */}
          <Box
            sx={{
              flexGrow: 1,
              cursor: 'pointer',
              overflow: 'hidden',
            }}
            onClick={() => setIsExpanded(true)}
          >
            <MapComponent
              height="100%"
              zoomDefault={zoomDefault}
              data={dataCoordinates}
              showTabState={false}
              showBtnAll={false}
              longitudeDefault={lng}
              latitudeDefault={lat}
              showMarkerInfo={true}
              showButtonHideLabel={false}
            />
          </Box>
        </Paper>
      </ResponsiveGridItem>

      {/* Full Screen Map Dialog */}
      <Dialog
        open={isExpanded}
        onClose={() => setIsExpanded(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '85vh',
            maxHeight: '85vh',
          }
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" fontWeight={600}>
            📍 Vị trí - {stationName}
          </Typography>
          <IconButton onClick={() => setIsExpanded(false)}>
            <CloseFullscreenIcon />
          </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1, height: 'calc(100% - 64px)' }}>
          <MapComponent
            height="100%"
            zoomDefault={zoomDefault + 2}
            data={dataCoordinates}
            showTabState={false}
            showBtnAll={false}
            longitudeDefault={lng}
            latitudeDefault={lat}
            showMarkerInfo={true}
            showButtonHideLabel={false}
          />
        </Box>
      </Dialog>
    </>
  );
};

/**
 * Notes/Chat Section
 */

// Enhanced NotesSection Component
// Hides when no data to save space
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
  isLoading = false,
}) => {
  const [contentHeight, setContentHeight] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Hide if not a device that needs notes
  if (!showNotes) return null;

  // Hide if empty data (not NNV which always shows input)
  if (!isNNV && !isBienTan && textList.length === 0 && !isLoading) {
    return null;
  }


  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return moment(timestamp).format("HH:mm DD/MM/YYYY");
  };

  // Render notes content (reused in both card and dialog)
  const renderNotesContent = (inDialog = false) => (
    <Box
      sx={{
        flexGrow: 1,
        bgcolor: '#fafafa',
        overflow: 'auto',
        maxHeight: inDialog ? 'calc(85vh - 180px)' : 'none',
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
      ) : textList.length === 0 ? (
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
        </Box>
      ) : (
        <Stack spacing={0} sx={{ p: 2 }}>
          {textList.map((message, index) => (
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
          ))}
        </Stack>
      )}
    </Box>
  );

  return (
    <>
      <ResponsiveGridItem gridConfig={gridConfig}>
        <Paper
          elevation={0}
          sx={{
            height: SECTION_HEIGHT,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
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
            <IconButton
              size="small"
              onClick={() => setIsExpanded(true)}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                width: 28,
                height: 28,
              }}
            >
              <OpenInFullIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {/* Content */}
          {isBienTan ? (
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <IFrameExcelCheckList
                valueSelectId="https://docs.google.com/spreadsheets/d/1dKFjIrD4pPdA8BgLOaDNBWlXOFIEIel0_7n1zokufbs/edit?usp=sharing&rm=minimal&single=false&zoom=75"
              />
            </Box>
          ) : (
            <Box
              sx={{
                flexGrow: 1,
                bgcolor: '#fafafa',
                overflow: 'auto',
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
            </Box>
          )}

          {/* Input Area */}
          {isNNV && (
            <Box
              sx={{
                p: 1.5,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                flexShrink: 0,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  placeholder="Nhập tin nhắn..."
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  size="small"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#f5f5f5',
                      borderRadius: 2,
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
                  sx={{
                    minWidth: 60,
                    height: 38,
                    borderRadius: 2,
                  }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      </ResponsiveGridItem>

      {/* Full Screen Notes Dialog */}
      <Dialog
        open={isExpanded}
        onClose={() => setIsExpanded(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: '85vh',
            maxHeight: '85vh',
          }
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h6" fontWeight={600}>
              {isNNV ? '💬 Tin nhắn' : '📝 Danh sách ghi chú'}
            </Typography>
            {textList.length > 0 && (
              <Chip
                label={textList.length}
                size="small"
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Stack>
          <IconButton onClick={() => setIsExpanded(false)}>
            <CloseFullscreenIcon />
          </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1, height: 'calc(100% - 64px)', overflow: 'auto' }}>
          {renderNotesContent(true)}
        </Box>
        {/* Input Area in Dialog */}
        {isNNV && (
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TextField
                fullWidth
                placeholder="Nhập tin nhắn..."
                value={inputText}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                size="small"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#f5f5f5',
                    borderRadius: 2,
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={addTextToList}
                disabled={!inputText?.trim()}
                startIcon={<SendIcon />}
                sx={{
                  minWidth: 80,
                  height: 40,
                  borderRadius: 2,
                }}
              >
                Gửi
              </Button>
            </Stack>
          </Box>
        )}
      </Dialog>
    </>
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
  dataRealTime,
  isLiveMode,
  handleToggleLiveMode,
  ChartTab,
  MainChart,
  ColumnChartSensor,
  MyDateRange,
  MyButton,
}) => {
  if (!valueSelect) return null;

  const ChartComponent =ChartTab;

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
              key={`main-chart-${valueSelect.id}`}
              endDate={endDate}
              startDate={startDate}
              deviceId={valueSelect.id}
              deviceUser={valueSelect.id}
              inputLstSensor={listSensor}
              dataRealTime={dataRealTime}
              isLiveMode={isLiveMode}
            />
          </div>
        </Grid>

        {/* Column Chart */}
        {isShowColChart && (
          <Grid item xl={6} lg={6} md={6} sm={6} xs={6}>
            <div className="home_chart">
              <ColumnChartSensor
                key={`col-chart-${valueSelect.id}`}
                endDate={endDate}
                startDate={startDate}
                deviceUser={valueSelect.id}
                isLiveMode={isLiveMode}
              />
            </div>
          </Grid>
        )}

        {/* Date Controls */}
        <Grid item xs={12}>
          <Grid container spacing={1} alignItems="center">
            {/* Live Mode Indicator & Toggle */}
            <Grid item xs={1.5}>
              <Box
                onClick={handleToggleLiveMode}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  p: 1,
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: isLiveMode ? '#e8f5e9' : '#fafafa',
                  border: isLiveMode ? '2px solid #4CAF50' : '1px solid #ddd',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: isLiveMode ? '#c8e6c9' : '#f0f0f0',
                    transform: 'scale(1.02)'
                  }
                }}
              >
                {isLiveMode && (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: '#4CAF50',
                      animation: 'livePulse 1.5s ease-in-out infinite',
                      '@keyframes livePulse': {
                        '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                        '50%': { opacity: 0.5, transform: 'scale(1.3)' }
                      }
                    }}
                  />
                )}
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    color: isLiveMode ? '#2E7D32' : '#666',
                    fontSize: '0.85rem'
                  }}
                >
                  {isLiveMode ? 'LIVE' : 'Đã dừng'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={2.5}>
              <MyDateRange
                label="Bắt đầu"
                onChange={handleChangeStartDate}
                value={startDateTemp}
              />
            </Grid>
            <Grid item xs={2.5}>
              <MyDateRange
                label="Kết thúc"
                onChange={handleChangeEndDate}
                value={endDateTemp}
              />
            </Grid>
            <Grid item xs={2.5}>
              <MyButton icon={null} name="Áp dụng" onClick={handleApplyDate} variant="excel" />
            </Grid>
            <Grid item xs={3}>
              {exportButtons.map((btn, idx) => (
                <MyButton
                  key={idx}
                  icon={null}
                  name={btn.label}
                  onClick={btn.onClick}
                  variant="excel"
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
 * Camera Section - Optimized width and consistent height
 * Uses SECTION_HEIGHT for consistency with other sections
 */
export const CameraSection = ({ gridConfig, cameraList, CameraDialog }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!gridConfig) return null;

  // Don't render if no cameras
  if (!cameraList || cameraList.length === 0) return null;

  return (
    <>
      {/* Camera Card - Fixed Height matching other sections */}
      <ResponsiveGridItem gridConfig={gridConfig}>
        <Paper
          elevation={0}
          sx={{
            height: SECTION_HEIGHT,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#1a1a2e',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'rgba(255,255,255,0.1)',
              bgcolor: 'rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} color="white">
              📹 Camera ({cameraList.length})
            </Typography>
            <IconButton
              size="small"
              onClick={() => setIsExpanded(true)}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                width: 28,
                height: 28,
              }}
            >
              <OpenInFullIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          {/* Camera container - full width, minimal padding */}
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'hidden',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CameraDialog cameraList={cameraList} />
          </Box>
        </Paper>
      </ResponsiveGridItem>

      {/* Full Screen Camera Dialog */}
      <Dialog
        open={isExpanded}
        onClose={() => setIsExpanded(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
            bgcolor: '#1a1a2e',
          }
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'rgba(255,255,255,0.1)',
          bgcolor: 'rgba(0,0,0,0.3)',
        }}>
          <Typography variant="h6" fontWeight={600} color="white">
            📹 Camera giám sát ({cameraList.length})
          </Typography>
          <IconButton onClick={() => setIsExpanded(false)} sx={{ color: 'white' }}>
            <CloseFullscreenIcon />
          </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1, height: 'calc(100% - 64px)', p: 1 }}>
          <CameraDialog cameraList={cameraList} resDialog={true} />
        </Box>
      </Dialog>
    </>
  );
};