
import axios from "axios";

const MSG91_AUTHKEY = '414206Ao8o3EGO65d9bc45P1'; 
const MSG91_FLOW_ID ='65d98f8dd6fc055272476682';
const MSG91_SENDER = "PRGMTQ"; 

export async function sendOtp(mobileNo, otp) {
  console.log('OTP SERVICE - Sending OTP:', otp, 'to mobile:', mobileNo);
  const url = "https://api.msg91.com/api/v5/flow/";

  const body = {
    flow_id: MSG91_FLOW_ID,
    mobiles: `91${mobileNo}`,
    authkey: MSG91_AUTHKEY,
    sender: MSG91_SENDER,
    otp: otp,
  };

  try {
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        Authkey: MSG91_AUTHKEY,
      },
    });
    console.log('resssssssssssss',response)

    if (response.data.type === "success") {
      console.log("OTP sent successfully");
      return { success: true };
    } else {
      console.error("Failed to send OTP", response.data);
      return { success: false, error: response.data };
    }
  } catch (err) {
    console.error("Msg91 error:", err.message);
    return { success: false, error: err.message };
  }
}
