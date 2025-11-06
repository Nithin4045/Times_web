import React, { useMemo, useState, useEffect } from "react";
import styles from "./page.module.css";

type Props = {
  imageUrl: string;
  title: string;
  subtitle?: string;
  price: number;
  offerPrice?: number;
  offerEndTime?: string | Date;
  currencySymbol?: string;
  onClick?: () => void;
  tagText?: string;
};
const DEFAULT_IMG = "/images/courses/default.jpeg";
const isHttpUrl = (src: string) => /^https?:\/\//i.test(src);
const isPublicPath = (src: string) => src.startsWith("/");

const formatMoney = (value: number, currencySymbol = "₹") => {
  const parts = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
  return `${currencySymbol}${parts}`;
};

const getTimeLeft = (end?: string | Date) => {
  if (!end) return null;
  const endTime = typeof end === "string" ? new Date(end) : end;
  const diffMs = endTime.getTime() - Date.now();
  if (diffMs <= 0) return "Ended";
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays >= 1) return `${diffDays}d Left`;
  if (diffHours >= 1) return `${diffHours}h Left`;
  const diffMins = Math.ceil((diffMs / (1000 * 60)) % 60);
  return `${diffMins}m Left`;
};

const CourseOfferCard: React.FC<Props> & { Skeleton: React.FC } = ({
  imageUrl,
  title,
  subtitle,
  price,
  offerPrice,
  offerEndTime,
  currencySymbol = "₹",
  onClick,
  tagText,
}) => {
  const computedTag = useMemo(() => tagText ?? getTimeLeft(offerEndTime), [tagText, offerEndTime]);
  const hasValidOffer = typeof offerPrice === "number" && offerPrice! > 0 && computedTag !== "Ended";

  // FIXED: Image handling - try the actual imageUrl first, fallback only on error
  const [src, setSrc] = useState<string>(imageUrl || DEFAULT_IMG);
  const [isLoadingImg, setIsLoadingImg] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    // Reset states when imageUrl changes
    setHasError(false);
    setIsLoadingImg(true);
    console.log("Image Url: ",imageUrl)
    if (!imageUrl) {
      // If no imageUrl provided, use default immediately
      setSrc(DEFAULT_IMG);
      setIsLoadingImg(false);
    } else {
      // Try to load the actual image from database
      setSrc(imageUrl);
    }
  }, [imageUrl]);

  const handleLoad = () => {
    setIsLoadingImg(false);
    setHasError(false);
  };

  const handleError = () => {
    console.log(`🖼️ Image failed to load: ${src}, falling back to default`);
    if (src !== DEFAULT_IMG) {
      setSrc(DEFAULT_IMG);
      setHasError(true);
    }
    setIsLoadingImg(false);
  };

  // Debug: log what image we're trying to load
  useEffect(() => {
    console.log(`🔍 Course Image Data:`, {
      courseName: title,
      imageFromDB: imageUrl,
      finalImageUrl: src,
      hasImageInDB: !!imageUrl,
      isLoading: isLoadingImg,
      hasError: hasError
    });
  }, [title, imageUrl, src, isLoadingImg, hasError]);

  return (
    <div className={styles.card} onClick={onClick} role={onClick ? "button" : undefined}>
      {/* LEFT: image */}
      <div className={styles.imageWrap}>
        {isLoadingImg && <div className={styles.skeletonImg} aria-hidden />}
        <img
          src={src}
          alt={title}
          className={`${styles.image} ${isLoadingImg ? styles.imageHidden : ""}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={isHttpUrl(src) ? "eager" : "lazy"}
        />
      </div>

      {/* RIGHT: text only has padding */}
      <div className={styles.body}>
        <div className={styles.texts}>
          <div className={styles.title}>{title}</div>
          {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
        </div>

        <div className={styles.pricesRow}>
          <div className={styles.priceColumn}>
            {hasValidOffer ? (
              <>
                <div className={styles.mrpStriked}>{formatMoney(price, currencySymbol)}</div>
                <div className={styles.offerBlockVertical}>
                  <span className={styles.forYou}>For you</span>
                  <span className={styles.offerPrice}>{formatMoney(offerPrice!, currencySymbol)}</span>
                </div>
              </>
            ) : (
              <div className={styles.mrpOnly}>
                {price > 0 ? formatMoney(price, currencySymbol) : ""}
              </div>
            )}
          </div>

          {computedTag ? (
            <div className={styles.tag}>
              <svg className={styles.clockIcon} viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M12 7v5l3 2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>{computedTag}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

CourseOfferCard.Skeleton = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonImg} />
    <div className={styles.body}>
      <div className={`${styles.skeletonLine} ${styles.title}`}></div>
      <div className={`${styles.skeletonLine} ${styles.subtitle}`}></div>
      <div className={`${styles.skeletonLine} ${styles.price}`}></div>
    </div>
  </div>
);

export default CourseOfferCard;