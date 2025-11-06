import { useLottie } from "lottie-react";
import animationData from "./SuccessLottie.json";
const SuccessLottie = () => {
      //animationData: success,
  const options = {
    loop: true,
    autoplay: true,
    animationData: animationData.default,
     rendererSettings: {
       preserveAspectRatio: "xMidyMid slice",
     }
      };

  const { View } = useLottie(options);

  return View;
};
export default SuccessLottie;