

import React, { useState, useEffect } from 'react';

const InternetSpeedTest: React.FC = () => {
  const [speed, setSpeed] = useState<string | null>(null);

  const measureSpeed = async () => {
    const fileUrl = 'https://www.shutterstock.com/shutterstock/photos/2377534991/display_1500/stock-photo-fast-internet-connection-speedtest-network-bandwidth-technology-man-using-high-speed-internet-with-2377534991.jpg'; 
    const startTime = performance.now();

    try {
      const response = await fetch(fileUrl);
      const fileSizeInBytes = parseInt(response.headers.get('Content-Length') || '0', 10);
      await response.blob();

      const endTime = performance.now();
      const durationInSeconds = (endTime - startTime) / 1000;
      const speedInKbps = ((fileSizeInBytes * 8) / 1024) / durationInSeconds;
      const speedInMbps = speedInKbps / 1024;

      setSpeed(speedInMbps.toFixed(2));
    } catch (error) {
      setSpeed('Error measuring speed');
      console.error('Speed test failed:', error);
    }
  };

  useEffect(() => {
   
    const interval = setInterval(() => {
      measureSpeed();
    }, 5000); // 5 secs

    
    return () => clearInterval(interval);
  }, []); 

  return (
    <div style={{ textAlign: "right", padding: "5px 10px 5px 10px "}}>
      
      {speed ? (
        <p >
          Your internet speed: <span className="font-bold">{speed}</span> mb/s
        </p>
      ) : (
        <p >Measuring speed...</p>
      )}
    </div>
  );
};

export default InternetSpeedTest;



// import React, { useState, useEffect } from "react";

// const InternetSpeedTest: React.FC = () => {
//   const [speed, setSpeed] = useState<string | null>("Measuring...");

//   const measureSpeed = async () => {
//     try {
//       const connection = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
//       connection.createDataChannel("speedTest");

//       const startTime = performance.now();
//       connection.onicecandidate = () => {
//         const endTime = performance.now();
//         const duration = (endTime - startTime) / 1000; 
//         const estimatedSpeed = (500 * 8) / duration / 1024;
//         setSpeed(estimatedSpeed.toFixed(2) + " Mbps");
//         connection.close();
//       };

//       await connection.createOffer();
//       await connection.setLocalDescription();
//     } catch (error) {
//       console.error("Speed test failed:", error);
//       setSpeed("Error measuring speed");
//     }
//   };

//   useEffect(() => {
//     measureSpeed();
//     const interval = setInterval(measureSpeed, 5000); 

//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div style={{ textAlign: "right", padding: "5px 20px 0px 0px" }}>
//       <p>Your internet speed: <span className="font-bold">{speed}</span></p>
//     </div>
//   );
// };

// export default InternetSpeedTest;
