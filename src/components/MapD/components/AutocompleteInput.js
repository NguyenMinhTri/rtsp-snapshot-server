


import React, { useState, useEffect } from "react";
import debounce from "lodash/debounce"; // Import debounce from Lodash
import "./AutocompleteInput.css"; // Import file CSS tạo kiểu cho component
import { memo } from "react";

const AutocompleteInput = ({ onClickItem}) => {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const handleConfirm = (v) => {
  
    onClickItem(v.place_id);
  };
  const handleResultItemClick = (selectedItem) => {
    onClickItem(selectedItem.place_id);
  //  setInput(); // Gán giá trị vào input khi click vào một mục
    setResults([]); // Xóa danh sách kết quả
  };
  // Sử dụng debounce để tạo một phiên bản mới của hàm gửi request sau khi người dùng dừng gõ trong 1 giây
  const sendSearchRequestDebounced = debounce((searchInput) => {
    if (searchInput) {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", `https://rsapi.goong.io/Place/AutoComplete?api_key=wKzieQsXK3Vaa70q6o9oprwEUdeNnWOAvHyCDRmy&input=${input}`);
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          setResults(data.predictions);
        }
      };
      xhr.send();
    }
  }, 1000); // Chờ 1 giây sau khi dừng gõ để gửi request

  useEffect(() => {
    // Gọi hàm gửi request debounce khi input thay đổi
    sendSearchRequestDebounced(input);
    
    // Cleanup để tránh memory leak
    return () => {
      sendSearchRequestDebounced.cancel();
    };
  }, [input]);

  return (
    <div className="autocomplete-container">
      <input
        type="text"
        placeholder="Search for a place"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="material-input" // Thêm class cho hiệu ứng Material Design
      />
      <ul className="results-list">
        {results.map((result) => (
          <li key={result.place_id}
           onClick={() => handleResultItemClick(result)}>
            {result.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default memo(AutocompleteInput);