// "use client";
// import React, { useEffect, useState } from "react";
// import { useRouter, usePathname } from "next/navigation"; // Added usePathname for current path
// import { getSession } from "next-auth/react"; // For session management

// /**
//  * HOC to protect routes based on authentication and user module access.
//  * 
//  * @param Component - The wrapped component to render if access is granted.
//  * @param allowedModules - Array of allowed module IDs for the component.
//  */
// const withAuth = (
//   Component: React.FC,
//   allowedModules: string[] // List of allowed module IDs
// ) => {
//   const AuthenticatedComponent: React.FC = (props) => {
//     const router = useRouter();
//     const pathname = usePathname(); // Get the current path
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//       const validateSession = async () => {
//         try {
//           const session = await getSession(); // Fetch session details
//           console.log("Session in HOC:", session);

//           // If no session, redirect to login
//           if (!session) {
//             message.error("You need to log in to access this page.");
//             router.replace("/login");
//             return;
//           }

//           const userModule = session?.user?.module; // Fetch user module from session

//           // If user's module is not allowed, redirect to error page
//           if (!userModule || !allowedModules.some((module) => userModule.includes(module))) {
//             message.error("You do not have permission to view this page.");
//             router.replace("/error");
//             return;
//           }

//           // Path validation based on allowed modules
//           const isAllowedPath = () => {
//             // If userModule contains multiple modules (e.g., "1,2"), split by ',' and check
//             const userModules = userModule.split(',');
//             if (userModule === "0") {
//                 return true; // Allow access to all
//             }
//             if (userModules.includes("1") && pathname.startsWith("/class")) {
//               return true; // Module 1: Allow only /class paths
//             }
//             if (userModules.includes("2") && pathname.startsWith("/codecompiler")) {
//               return true; // Module 2: Allow only /codecompiler paths
//             }
//             if (userModules.includes("3") && pathname.startsWith("/evaluate")) {
//               return true; // Module 3: Allow only /evaluate paths
//             }

//             return false; // If no valid path
//           };

//           if (!isAllowedPath()) {
//             message.error("Access to this path is not allowed for your role.");
//             router.replace("/error"); // Redirect to error if path is not allowed
//             return;
//           }

//           setLoading(false); // Set loading to false when validation is complete
//         } catch (error) {
//           console.error("Error validating session:", error);
//           message.error("An error occurred. Redirecting to login...");
//           router.replace("/error");
//         }
//       };

//       validateSession();
//     }, [router, pathname, allowedModules]);

//     // Show a loading spinner while validating the session
//     if (loading) {
//       return (
//         <div style={{ textAlign: "center", marginTop: "20%" }}>
//           <Spin size="large" tip="Authenticating..." />
//         </div>
//       );
//     }

//     // Render the wrapped component if authentication and authorization pass
//     return <Component {...props} />;
//   };

//   return AuthenticatedComponent;
// };

// export default withAuth;
