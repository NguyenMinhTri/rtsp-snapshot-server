import { useState, useCallback,useEffect } from "react";
import moment from "moment";


export const useNotes = (valueSelect, user) => {
  const [textList, setTextList] = useState([]);
  const [inputText, setInputText] = useState("");

  // ✅ RESET khi valueSelect đổi
  useEffect(() => {
    setTextList([]);
    setInputText("");
  }, [valueSelect?.id]);

  const fetchDataNote = useCallback(async () => {
    if (!valueSelect?.id) return;

    try {
      const url = valueSelect.id.includes("NNV")
        ? `https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/get-note?deviceId=${valueSelect.id}`
        : `https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/get-note-tpn?locationId=${valueSelect.id}`;
      
      const res = await fetch(url, { method: "GET" });
      const result = await res.json();
      
      const mapped = (Array.isArray(result) ? result : []).map(r => ({
        name: r.UserName,
        content: r.Content,
        Image: r.Image,
        timestamp: moment(
          valueSelect.id.includes("NNV")
            ? r?.CreateTime?.value
            : r?.CreateTime?.value?.replace("Z", "")
        ).format("YYYY/MM/DD HH:mm"),
      }));
      
      setTextList(mapped);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }, [valueSelect?.id]);

  const addNote = useCallback(async () => {
    if (!user || !inputText.trim()) return;

    try {
      const contentStr = `${user.displayName}(${user.email}): ${inputText.trim()}`;
      
      await fetch(
        "https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/create-note",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: inputText.trim(),
            deviceId: valueSelect?.id,
            userName: `${user.displayName}(${user.email})`,
          }),
        }
      );

      const newMessage = {
        name: `${user.displayName}(${user.email})`,
        content: contentStr,
        timestamp: moment(new Date()).format("YYYY/MM/DD HH:mm"),
      };
      
      setTextList(prev => [newMessage, ...prev]);
      setInputText("");
    } catch (error) {
      console.error("Error adding note:", error);
    }
  }, [user, inputText, valueSelect?.id]);

  return {
    textList,
    inputText,
    setInputText,
    fetchDataNote,
    addNote,
  };
};
