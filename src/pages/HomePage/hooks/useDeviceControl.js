import { useCallback } from "react";
import Cookies from "js-cookie";

import Toast from "../../../utils/toasts";
export const useDeviceControl = (fullRS485Data, user) => {
  const refreshToken = useCallback(async () => {
    if (!user) return null;

    try {
      const idTokenResult = await user.getIdTokenResult();
      const token = idTokenResult.expirationTime <= Date.now()
        ? await user.getIdToken(true)
        : idTokenResult.token;
      
      Cookies.set("auth_token", token, { expires: 2147483647 });
      return token;
    } catch (error) {
      console.error("Token refresh error:", error);
      return null;
    }
  }, [user]);

  const sendCommand = useCallback(async (deviceId, commandData, isDemoUI, sensorSetting) => {
    await refreshToken();
    
    const token = Cookies.get("auth_token");
    
    try {
      const response = await fetch(
        "https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/handleCoilDevice",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sensorsetting: sensorSetting,
            message: JSON.stringify(commandData),
            deviceId,
            IsDemoUI: isDemoUI,
          }),
        }
      );

      const content = await response.json();
      
      if (!JSON.stringify(content).includes("RS485") && !isDemoUI) {
        Toast("error", "Thay đổi giá trị hoặc điều khiển thất bại. Vui lòng thử lại");
        return false;
      }
      
      Toast("success", "Tín hiệu gửi đi thành công.");
      return true;
    } catch (error) {
      console.error("Command send error:", error);
      Toast("error", "Đã xảy ra lỗi khi gửi lệnh");
      return false;
    }
  }, [refreshToken]);

  return { sendCommand };
};