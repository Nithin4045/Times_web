// "use client";
// import { useEffect } from "react";
// import { signIn } from "next-auth/react";
// import { useRouter } from "next/navigation";
// import { Spin } from "antd";
// import "antd/dist/reset.css";
// import axios from "axios";
// import { commonStore } from "@/store/common/common";


// export default function AutoLogin() {
//   const router = useRouter();
//   const accessCode = "stu@gmail.com"; // Get the dynamic slug from params
//   const { settingsData,setSettingsData } = commonStore();
//   let url = window.location.href
//   // let url = "https://purpleclass.pragmatiqinc.com/autologin?username=kadarla.archana@gmail.com"; 
//   console.log(url,"new url")

//  let urlObj = new URL(url); // Use the URLSearchParams API to get the parameters
//  let username = urlObj.searchParams.get("username");
//  console.log(username,"new category")

//   const fetchItems = async () => {
//       try {
//         const response = await axios.get(`/api/settings?domain=${window.location.hostname.split(".")[0]}`);
//         setSettingsData(response.data);
//       } catch (error) {
//         console.error("Failed to fetch items:", error);
//       }
//     };

//   function decrypt(s: string): string {
//     let r: string = "";
//     s = s.replace(s.substr(0, 6), "");

//     for (let i = 1; i <= s.length / 2; i++) {
//       let ch: number;
//       ch = parseInt("0x" + s.substr((i - 1) * 2, 2), 16) ^ 111;
//       if (i % 4 === 1) {
//         r += String.fromCharCode(ch);
//       }
//     }
//     return r;
//   }

//   useEffect(() => {
//     const autoLogin = async () => {
//       if (accessCode) {
//         const decryptedAccessCode = decrypt(accessCode);

//         try {
//           // Call the API directly to fetch the user's data
//           const response = await fetch("/api/common/login", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               email: username,
//               password: "1234", // Use the same password for auto-login
//             }),
//           });

//           if (!response.ok) {
//             console.error("API call failed");
//             return;
//           }

//           const user = await response.json();
//           console.log(user, "user data")
//           // Use the credentials provider to complete the NextAuth login
//           const result = await signIn("credentials", {
//             email: user.email,
//             password: "1234",
//             redirect: false,
//           });

//           if (result?.ok) {
//             // router.replace("/dashboard");
//             window.location.href = "/dashboard";
//           } else {
//             console.error("NextAuth signIn failed");
//           }
//         } catch (error) {
//           console.error("Error in autoLogin:", error);
//         }
//       }
//     };
//     fetchItems();
//     autoLogin();
//   }, [router, accessCode]);

//   return (
//     <main className="flex justify-center items-center h-screen">
//       <div className="flex items-center space-x-2">
//         <Spin size="large" />
//         <span
//           style={{
//             color: "purple",
//             fontSize: "26px",
//             fontWeight: 500,
//             marginLeft: "15px",
//           }}
//         >
//           {`Logging in >>>`}
//         </span>
//       </div>
//     </main>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import "antd/dist/reset.css";
import axios from "axios";
import { commonStore } from "@/store/common/common";

export default function AutoLogin() {
  const router = useRouter();
  const { settingsData, setSettingsData } = commonStore();
  const setautoLogoutUrl = commonStore((state) => state.setautoLogoutUrl);
  const setLogoutUrl = commonStore((state) => state.setLogoutUrl);
  const [username, setUsername] = useState<string | null>(null);
  const accessCode = "stu@gmail.com"; // Replace with dynamic value if needed

  function decrypt(s: string): string {
    let r: string = "";
    s = s.replace(s.substr(0, 6), "");

    for (let i = 1; i <= s.length / 2; i++) {
      let ch: number;
      ch = parseInt("0x" + s.substr((i - 1) * 2, 2), 16) ^ 111;
      if (i % 4 === 1) {
        r += String.fromCharCode(ch);
      }
    }
    return r;
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Fetch username from URL parameters
      const url = window.location.href;
      // console.log(window.location,"window location")
      // console.log(window.location.origin, "window origin")
      // setLogoutUrl(window.location.origin);

      // let url = "https://purpleclass.pragmatiqinc.com/autologin?username=stu@gmail.com&host=https://aicas.learnsquare.co";
      // console.log(url, "urlinlogin")
      const urlObj = new URL(url);
      const extractedUsername = urlObj.searchParams.get("username");
      const extractedLogoutUrl = urlObj.searchParams.get("host"); 
      setautoLogoutUrl(extractedLogoutUrl || "");
      setLogoutUrl("");
      setUsername(extractedUsername);
      // console.log(extractedUsername, "Extracted username");

      // Fetch settings data
      const fetchItems = async () => {
        try {
          const domain = window.location.hostname.split(".")[0];
          const response = await axios.get(`/api/settings?domain=${domain}`);
          setSettingsData(response.data);
        } catch (error) {
          console.error("Failed to fetch items:", error);
        }
      };
      fetchItems();
    }
  }, [setautoLogoutUrl, setLogoutUrl]);

  useEffect(() => {
    const autoLogin = async () => {
      if (username) {
        const decryptedAccessCode = decrypt(accessCode);

        try {
          // Call the API directly to fetch the user's data
          const response = await fetch("/api/common/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: username,
              password: "1234", // Auto-login password
            }),
          });

          if (!response.ok) {
            console.error("API call failed");
            return;
          }

          const user = await response.json();
          console.log(user, "User data");

          // Use NextAuth credentials provider for login
          const result = await signIn("credentials", {
            email: user.email,
            password: "1234",
            redirect: false,
          });

          if (result?.ok) {
            window.location.href = "/dashboard";
          } else {
            console.error("NextAuth signIn failed");
          }
        } catch (error) {
          console.error("Error in autoLogin:", error);
        }
      }
    };

    if (username) {
      autoLogin();
    }
  }, [username, router, accessCode]);

  return (
    // <main className="flex justify-center items-center h-screen">
    //   <div className="flex items-center space-x-2">
    //     <Spin size="large" />
    //     <span
    //       style={{
    //         color: "purple",
    //         fontSize: "26px",
    //         fontWeight: 500,
    //         marginLeft: "15px",
    //       }}
    //     >
    //       {`Logging in >>>`}
    //     </span>
    //   </div>
    // </main>
    <></>
  );
}
