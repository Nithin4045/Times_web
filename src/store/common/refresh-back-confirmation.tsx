
import { useEffect } from "react";

const useNavigationConfirmation = () => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "Are you sure you want to leave the Exam?"; 
    };

    const handlePopState = (event: PopStateEvent) => {
      const confirmLeave = window.confirm("Are you sure you want to leave the Exam?");
      if (!confirmLeave) {
      
        window.history.pushState(null, "", window.location.pathname);
      } else {
        window.history.back();
      }  
    };

    const initialUrl = window.location.pathname + window.location.search;
    window.history.pushState(null, "", initialUrl);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return null;
};

export default useNavigationConfirmation;