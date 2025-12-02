import { useState, useCallback } from "react";
import Cookies from "js-cookie";
import moment from "moment";

export const useLicense = () => {
  const [licenseData, setLicenseData] = useState({});
  const [licenseDay, setLicenseDay] = useState(-1);
  const [licenseMessage, setLicenseMessage] = useState("");
  const [licenseLockLV1, setLicenseLockLV1] = useState(false);
  const [licenseLockLV2, setLicenseLockLV2] = useState(false);

  const fetchLicense = useCallback(async (deviceId) => {
    if (!deviceId) return;

    // Reset state
    setLicenseDay(-1);
    setLicenseMessage("");
    setLicenseLockLV1(false);
    setLicenseLockLV2(false);
    setLicenseData({});

    try {
      const token = Cookies.get("auth_token");
      const response = await fetch(
        "https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/get-license",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deviceId }),
        }
      );

      const content = await response.json();
      
      if (Object.keys(content).length === 0) return;

      // Calculate remaining days
      if (content.StartDate && content.NumberOfDays !== "0") {
        const startDate = moment(content.StartDate, "DD-MM-YYYY");
        const now = moment();
        const daysPassed = now.diff(startDate, "days");
        const daysRemaining = Math.max(0, Number(content.NumberOfDays) - daysPassed);
        
        setLicenseDay(daysRemaining);
        
        if (daysRemaining === 0) {
          setLicenseLockLV2(true);
        }
      }

      if (content.AlarmMessage) {
        setLicenseMessage(content.AlarmMessage);
      }

      if (content.Lock !== undefined) {
        setLicenseLockLV1(content.Lock);
      }

      if (content.LockLV2 !== undefined) {
        setLicenseLockLV2(content.LockLV2);
      }

      setLicenseData(content);
    } catch (error) {
      console.error("Error fetching license:", error);
    }
  }, []);

  return {
    licenseData,
    licenseDay,
    licenseMessage,
    licenseLockLV1,
    licenseLockLV2,
    fetchLicense,
  };
};