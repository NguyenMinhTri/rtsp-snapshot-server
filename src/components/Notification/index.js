import { useState, useEffect } from 'react';
import axios from 'axios';

function Notification() {
  const [data, setData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [deviceId, setDeviceId] = useState("DEMO-ICT");
  
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const response = await axios.get('https://navis-app.web.app/noti-data', {
      params: {
        offset,
        deviceId
      },
    });
    setData(prevData => [...prevData, ...response.data]);
  }

  function handleScroll(event) {
    const { scrollTop, clientHeight, scrollHeight } = event.target;
    if (scrollHeight - scrollTop === clientHeight) {
      setOffset(prevOffset => prevOffset + 50);
    }
  }

  return (
    <div className="App" onScroll={handleScroll}>
      {data.map((row, index) => (
        <div key={index}>{JSON.stringify(row)}</div>
      ))}
    </div>
  );
}

export default Notification;