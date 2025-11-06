 
 "use client";
import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay } from "swiper/modules";
import styles from "../assets/styles/landingpagecards.module.css";
 
import firstgif from "@/assets/images/loginimages/firstimage.gif";
import secondgif from "@/assets/images/loginimages/secondgif.gif";
import thirdgif from "@/assets/images/loginimages/thirdgif.gif";
import { Flex } from "antd";
 
interface CardItem {
  Heading: string;
  Subheading: string;
  image?: string;
}
 
const fallbackData: CardItem[] = [
  {
    image: firstgif.src,
    Heading: "Enhance your skills and knowledge with Purplegene",
    Subheading: "Embark on an educational journey like never before with Purplegene. Discover limitless learning opportunities and expand your horizons with us!",
  },
  {
    image: thirdgif.src,
    Heading: "Evaluate your progress, understand your path",
    Subheading: "Evaluate your progress with clear insights to identify strengths and areas for improvement.",
  },
  {
    image: secondgif.src,
    Heading: "Excel in every task, reach new heights!",
    Subheading: "Excel effortlessly by surpassing expectations and achieve your ultimate potential.",
  },
];
 
const MyLandingPage: React.FC = () => {
  const [initialData] = useState<CardItem[]>(fallbackData);
 
  return (
    <div style={{ display: "flex" }}>
      <Swiper
        modules={[Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        centeredSlides={true}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        loop={true}
        grabCursor={true}
        style={{ width: "37vw" }}
      >
        {initialData.map((item, index) => (
          <SwiperSlide key={index}>
            <Flex vertical align="center" style={{ width: "37vw" }}>
              {item.image && (
                <img
                  src={item.image}
                  alt={item.Heading}
                  style={{ width: "70%" }}
                />
              )}
              <h3
                className={`${styles.CarouselTestheader} ${styles.animateHeading}`}
              >
                {item.Heading}
              </h3>
              <p
                className={`${styles.Carouseltestcontent} ${styles.animateParagraph}`}
              >
                {item.Subheading}
              </p>
            </Flex>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
 
export default MyLandingPage;
 
 
 