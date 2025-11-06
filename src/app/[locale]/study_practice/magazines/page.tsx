"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FilePdfOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { useSession } from "next-auth/react";
import { SetBreadcrumb } from "@/app/[locale]/study_practice/BreadcrumbContext";
import styles from "./page.module.css";

// Month names for display
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;

// ---- Types that match the DB function output -------------------------------
type CatalogItem = {
  id: number;
  magazine_id: string;
  title: string;
  year: number;
  type: "free" | "paid";
  nav_link?: string | null;
  price_one_year?: {
    base?: number;
    discount_price?: number;
    discount_percent?: number;
    discount_end_date?: string;
    discount_start_date?: string;
  } | null;
  price_two_year?: {
    base?: number;
    discount_price?: number;
    discount_percent?: number;
    discount_end_date?: string;
    discount_start_date?: string;
  } | null;
};

type UserOrder = {
  order_id: number;
  user_id: number;
  magazine_id: number;
  subscription: "1_year" | "2_year" | string;
  status: string;
  order_date?: string | null;
  description?: string | null;
  nav_link?: string | null;
  magazine: CatalogItem;
};

type ApiResponse = {
  user: {
    id_card_no: string;
    user_id: number | null;
    completed_magazine_order_ids: number[];
  };
  user_orders: UserOrder[];
  catalog: CatalogItem[];
  meta: {
    requested_at: string;
    catalog_years: [number, number];
  };
};

// ---- Local helpers ----------------------------------------------------------
const MONTH_CODE = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
} as const;

function monthIndexFromMagazineId(magazine_id?: string): number | null {
  if (!magazine_id) return null;
  const m = magazine_id.match(/[A-Z]{3}$/i)?.[0]?.toUpperCase();
  return m && m in MONTH_CODE ? MONTH_CODE[m as keyof typeof MONTH_CODE] : null;
}

function monthLabelFromTitleOrId(title: string, magazine_id?: string): string {
  const idxFromId = monthIndexFromMagazineId(magazine_id);
  if (idxFromId !== null) return monthNames[idxFromId];
  const match = title.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i);
  if (match) {
    const monthIndex = new Date(Date.parse(match[0] + " 1, 2000")).getMonth();
    return monthNames[monthIndex];
  }
  return "Jan";
}

function effectivePrice(
  p?: CatalogItem["price_one_year"] | CatalogItem["price_two_year"] | null
) {
  if (!p) return 0;
  if (typeof p.discount_price === "number" && !Number.isNaN(p.discount_price)) return p.discount_price;
  if (typeof p.base === "number" && !Number.isNaN(p.base)) return p.base;
  return 0;
}

const DocumentIcon = () => (
  <div className={styles["pdf-icon"]}>
    <FilePdfOutlined style={{ fontSize: 56, color: "#dc2626" }} />
  </div>
);

type View = "main" | "pdfDetails" | "details" | "printMaterial" | "failureDetails" | "editionProgress";

const SubscriptionDashboard: React.FC = () => {
  const { data: session, status: sessionStatus } = useSession();

  // --- Pull id_card_no from session (preferred: session.user.id_card_no) ----
  const idCardNo = useMemo(() => {
    const anySession = session as any;
    return (
      anySession?.user?.id_card_no ||
      anySession?.id_card_no ||
      "" // fallback empty if not present
    );
  }, [session]);

  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<ApiResponse | null>(null);

  // Academic year tabs (current and previous)
  const availableYears = useMemo(() => {
    const y = new Date().getFullYear();
    return [`${y}-${y + 1}`, `${y - 1}-${y}`];
  }, []);

  const [activeTab, setActiveTab] = useState<string>("");
  const [currentView, setCurrentView] = useState<View>("main");
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogItem | null>(null);
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState({ line1: " --- " });
  const [selectedDuration, setSelectedDuration] = useState<"1" | "2">("2");
  const [showSubscriptionType, setShowSubscriptionType] = useState(false);

  // Catalog grouped by academic year string
  const [catalogData, setCatalogData] = useState<
    Record<string, (CatalogItem & { isPurchased?: boolean })[]>
  >({});

  // Initialize active tab on first render
  useEffect(() => {
    if (!activeTab && availableYears.length) {
      setActiveTab(availableYears[0]);
    }
  }, [availableYears, activeTab]);

  // Fetch API once session is ready
  useEffect(() => {
    // Wait for session to resolve
    if (sessionStatus === "loading") return;

    // If unauthenticated or missing id_card_no, stop loading and show hint
    if (sessionStatus !== "authenticated" || !idCardNo) {
      setLoading(false);
      return;
    }

    // We have id_card_no => fetch
    setLoading(true);
    const years = availableYears;

    console.log("ID card no: ",idCardNo)

    fetch(`/api/study_practice/magazines?id_card_no=${encodeURIComponent(idCardNo)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: ApiResponse) => {
        setApi(data);
        const byYear: Record<string, (CatalogItem & { isPurchased?: boolean })[]> = {};

        years.forEach((yr) => {
          const startYear = parseInt(yr.split("-")[0], 10);
          const items = (data.catalog || [])
            .filter((c) => Number(c.year) === startYear)
            .map((c) => {
              const purchased = (data.user_orders || []).some(
                (o) => Number(o.magazine_id) === Number(c.id)
              );
              return { ...c, isPurchased: purchased };
            })
            .sort((a, b) => {
              const ai = monthIndexFromMagazineId(a.magazine_id) ?? 99;
              const bi = monthIndexFromMagazineId(b.magazine_id) ?? 99;
              return ai - bi;
            });
          byYear[yr] = items;
        });

        setCatalogData(byYear);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching magazines:", err);
        setLoading(false);
      });
  }, [sessionStatus, idCardNo, availableYears]);

  const userOrders: UserOrder[] = api?.user_orders ?? [];

  // ---- UI handlers ----------------------------------------------------------
  const handlePdfClick = (catalog: CatalogItem) => {
    setSelectedCatalog(catalog);
    setCurrentView("pdfDetails");
    setActiveTab("details");
  };

  const handleViewClick = (catalog: CatalogItem) => {
    console.log('=== VIEW CLICK DEBUG ===');
    console.log('Catalog item:', catalog);
    console.log('Catalog type:', catalog.type);
    console.log('Catalog nav_link:', catalog.nav_link);
    console.log('User orders:', userOrders);
    
    // Check if magazine type is 'free'
    const isFreeMagazine = catalog.type?.toLowerCase() === 'free';
    console.log('Is free magazine:', isFreeMagazine);
    
    if (isFreeMagazine) {
      // For free magazines, open directly in iframe if nav_link exists
      const pdfLink = catalog.nav_link;
      console.log('Free magazine PDF link:', pdfLink);
      
      if (pdfLink) {
        console.log('Opening free magazine in iframe:', pdfLink);
        
        // Create a modal with iframe to display the magazine
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: center;
        `;
        
        const iframeContainer = document.createElement('div');
        iframeContainer.style.cssText = `
          width: 90%;
          height: 90%;
          background: white;
          border-radius: 8px;
          position: relative;
        `;
        
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
          position: absolute;
          top: 10px;
          right: 15px;
          background: #ff4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          font-size: 18px;
          cursor: pointer;
          z-index: 10000;
        `;
        
        const iframe = document.createElement('iframe');
        iframe.src = pdfLink;
        iframe.style.cssText = `
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 8px;
        `;
        
        closeButton.onclick = () => {
          document.body.removeChild(modal);
        };
        
        modal.onclick = (e) => {
          if (e.target === modal) {
            document.body.removeChild(modal);
          }
        };
        
        iframeContainer.appendChild(closeButton);
        iframeContainer.appendChild(iframe);
        modal.appendChild(iframeContainer);
        document.body.appendChild(modal);
      } else {
        console.log('Free magazine but no PDF link found');
        alert('PDF is not available for this free magazine yet. Please check back later.');
      }
    } else {
      // For paid magazines, check if user has purchased it
      const userOrderLink = userOrders.find(o => o.magazine_id === catalog.id)?.nav_link;
      console.log('User order link for paid magazine:', userOrderLink);
      
      const pdfLink = catalog.nav_link || userOrderLink;
      console.log('Final PDF link for paid magazine:', pdfLink);
      
      if (pdfLink) {
        console.log('User has access to paid magazine, opening in iframe:', pdfLink);
        
        // Create a modal with iframe to display the magazine
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: center;
        `;
        
        const iframeContainer = document.createElement('div');
        iframeContainer.style.cssText = `
          width: 90%;
          height: 90%;
          background: white;
          border-radius: 8px;
          position: relative;
        `;
        
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
          position: absolute;
          top: 10px;
          right: 15px;
          background: #ff4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          font-size: 18px;
          cursor: pointer;
          z-index: 10000;
        `;
        
        const iframe = document.createElement('iframe');
        iframe.src = pdfLink;
        iframe.style.cssText = `
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 8px;
        `;
        
        closeButton.onclick = () => {
          document.body.removeChild(modal);
        };
        
        modal.onclick = (e) => {
          if (e.target === modal) {
            document.body.removeChild(modal);
          }
        };
        
        iframeContainer.appendChild(closeButton);
        iframeContainer.appendChild(iframe);
        modal.appendChild(iframeContainer);
        document.body.appendChild(modal);
      } else {
        console.log('Paid magazine - no access, taking to payment screen');
        // For paid magazines without access, take to payment screens (existing behavior)
        handlePdfClick(catalog);
      }
    }
  };

  const handleDirectDetailsTab = () => {
    setActiveTab("details");
    setCurrentView("details");
    setShowSubscriptionType(false);
    setSelectedCatalog(null);
  };

  const handleChangeAddress = () => setIsChangingAddress(true);
  const handleSaveAddress = () => setIsChangingAddress(false);
  const handleNext = () => {
    setCurrentView("details");
    setShowSubscriptionType(true);
  };
  const handleProceedFromPrintMaterial = () => {
    setCurrentView("details");
    setShowSubscriptionType(true);
  };
  const handleViewFailureDetails = () => setCurrentView("failureDetails");
  const handleViewEditionProgress = () => setCurrentView("editionProgress");

  // ---- Small helpers used in views -----------------------------------------
  const getSubscriptionEndDate = (catalog: CatalogItem, duration: "1" | "2") => {
    const endYear = catalog.year + parseInt(duration) - 1;
    return `Dec-${endYear}`;
  };

  // ---- Tabs ----------------------------------------------------------------
  const renderTabs = () => (
    <>
      <div className={styles.divider} />
      <div className={styles.tabs}>
        {availableYears.map((year) => (
          <button
            key={year}
            className={`${styles.tab} ${activeTab === year ? styles.active : ""}`}
            onClick={() => {
              setActiveTab(year);
              setCurrentView("main");
              setShowSubscriptionType(false);
            }}
            title={`${year} Subscription`}
          >
            {year} Subscription
          </button>
        ))}
        <button
          className={`${styles.tab} ${activeTab === "details" ? styles.active : ""}`}
          onClick={handleDirectDetailsTab}
          title="View subscription details"
        >
          Subscription Details
        </button>
      </div>
    </>
  );

  // ---- Views ---------------------------------------------------------------
  const renderMainView = (year: string) => {
    const catalogs = catalogData[year] || [];
    return (
      <div className={styles["subscription-dashboard"]}>
        {renderTabs()}
        {sessionStatus !== "authenticated" && (
          <p style={{ marginBottom: 16 }}>
            Please sign in to view your subscription.
          </p>
        )}
        {sessionStatus === "authenticated" && !idCardNo && (
          <p style={{ marginBottom: 16 }}>
            Your session is missing <code>id_card_no</code>. Ask support to add it to your profile.
          </p>
        )}
        <div className={styles["subscription-grid"]}>
          {catalogs.map((catalog, idx) => (
            <div key={idx} className={styles["subscription-card"] + " " + (styles[catalog.type] || "")}>
              <div
                className={styles["card-body"]}
                onClick={() => handlePdfClick(catalog)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handlePdfClick(catalog);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className={styles["icon-wrap"]}>
                  <DocumentIcon />
                </div>
                <div className={styles["card-content"]}>
                  <h4>
                    {monthLabelFromTitleOrId(catalog.title, catalog.magazine_id)}-{catalog.year}
                  </h4>
                  <p>{catalog.title}</p>
                </div>
              </div>
              <button className={styles["view-btn"]} onClick={() => handleViewClick(catalog)}>
                VIEW <ArrowRightOutlined className={styles.arrow} />
              </button>
            </div>
          ))}
          {catalogs.length === 0 && (
            <div style={{ opacity: 0.7 }}>No catalog found for {year}.</div>
          )}
        </div>
      </div>
    );
  };

  const renderPdfDetailsView = () => {
    if (!selectedCatalog) return null;
    return (
      <div className={styles["subscription-dashboard"]}>
        {renderTabs()}
        <div className={styles["pdf-details-container"]}>
          <div className={styles["pdf-details-card"]}>
            <div className={styles["subscription-header"]}>
              <DocumentIcon />
              <h3>PDF Details - {selectedCatalog.title}</h3>
            </div>
            <hr className={styles.divider} />
            <div className={styles["pdf-details-grid"]}>
              <div className={styles["detail-item"]}>
                <label>Magazine ID:</label>
                <span>{selectedCatalog.magazine_id}</span>
              </div>
              <div className={styles["detail-item"]}>
                <label>Year:</label>
                <span>{selectedCatalog.year}</span>
              </div>
              <div className={styles["detail-item"]}>
                <label>Type:</label>
                <span className={`${styles["type-badge"]} ${styles[selectedCatalog.type] || ""}`}>
                  {selectedCatalog.type.charAt(0).toUpperCase() + selectedCatalog.type.slice(1)}
                </span>
              </div>
              <div className={styles["detail-item"]}>
                <label>Title:</label>
                <span>{selectedCatalog.title}</span>
              </div>
              {selectedCatalog.price_one_year && (
                <div className={styles["detail-item"]}>
                  <label>1 Year Price:</label>
                  <span>
                    ₹{effectivePrice(selectedCatalog.price_one_year)}
                    {selectedCatalog.price_one_year?.discount_percent && (
                      <span className={styles.discount}>
                        {" "}
                        ({selectedCatalog.price_one_year.discount_percent}% off)
                      </span>
                    )}
                  </span>
                </div>
              )}
              {selectedCatalog.price_two_year && (
                <div className={styles["detail-item"]}>
                  <label>2 Year Price:</label>
                  <span>
                    ₹{effectivePrice(selectedCatalog.price_two_year)}
                    {selectedCatalog.price_two_year?.discount_percent && (
                      <span className={styles.discount}>
                        {" "}
                        ({selectedCatalog.price_two_year.discount_percent}% off)
                      </span>
                    )}
                  </span>
                </div>
              )}
              {(selectedCatalog.nav_link ||
                userOrders.some((o) => o.magazine_id === selectedCatalog.id && o.nav_link)) && (
                <div className={styles["detail-item"]}>
                  <label>Status:</label>
                  <span>Available</span>
                </div>
              )}
            </div>
            <div className={styles["pdf-actions"]}>
              <button className={styles["view-btn"]} onClick={() => handleViewClick(selectedCatalog)}>
                {(selectedCatalog.nav_link || userOrders.find(o => o.magazine_id === selectedCatalog.id)?.nav_link) 
                  ? 'OPEN PDF' 
                  : 'VIEW SUBSCRIPTION'} <span className={styles.arrow}>→</span>
              </button>
              <button className={styles["back-btn"]} onClick={() => setCurrentView("main")}>
                ← Back to List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailsTable = () => (
    <div className={styles["subscription-status"]}>
      <div className={styles["status-header"]}>
        <DocumentIcon />
        <h3>Subscription Status:</h3>
        <hr className={styles.divider} />
      </div>
      <div className={styles["status-table"]}>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Magazine Month & Year</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {(userOrders || []).length > 0 ? (
              userOrders.map((order, index) => {
                const status = order.status
                  ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
                  : "Pending";
                const title = order.magazine?.title ?? `${order.magazine?.year ?? ""}`;
                const hasFailed = status.toLowerCase().includes("failed");
                const canView = Boolean(order.nav_link || order.magazine?.nav_link);

                return (
                  <tr key={order.order_id}>
                    <td>{String(index + 1).padStart(2, "0")}</td>
                    <td>{title}</td>
                    <td>
                      <span
                        className={`${styles["status-badge"]} ${
                          styles[status.toLowerCase().replace(/\s+/g, "-")] || ""
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td>
                      {hasFailed ? (
                        <button
                          onClick={() => {
                            setSelectedCatalog(order.magazine);
                            handleViewFailureDetails();
                          }}
                          className={styles["view-details-btn"]}
                        >
                          View Details
                        </button>
                      ) : canView ? (
                        <button
                          onClick={() => {
                            setSelectedCatalog(order.magazine);
                            handleViewEditionProgress();
                          }}
                          className={styles["view-details-btn"]}
                        >
                          View Details
                        </button>
                      ) : (
                        <span className={styles["remarks-text"]}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>
                  No subscription data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDetailsView = () => {
    if (!selectedCatalog) {
      return (
        <div className={styles["subscription-dashboard"]}>
          {renderTabs()}
          <div className={styles["details-container"]}>{renderDetailsTable()}</div>
        </div>
      );
    }

    const startMonth = monthLabelFromTitleOrId(
      selectedCatalog.title,
      selectedCatalog.magazine_id
    );
    const subscriptionNo = `SUB-${selectedCatalog.id}`;
    const startDate = `${startMonth}-${selectedCatalog.year}`;
    const endDate = getSubscriptionEndDate(selectedCatalog, selectedDuration);

    return (
      <div className={styles["subscription-dashboard"]}>
        {renderTabs()}
        <div className={styles["details-container"]}>
          {showSubscriptionType && (
            <div className={styles["subscription-info"]}>
              <div className={styles["subscription-header"]}>
                <DocumentIcon />
                <h3>
                  Subscription Type:{" "}
                  <span className={styles["blue-text"]}>
                    Printed Material - {selectedDuration} Year{selectedDuration === "2" ? "s" : ""}
                  </span>
                </h3>
              </div>
              <hr className={styles.divider} />
              <div className={styles["info-grid"]}>
                <div className={styles["subscription-details-column"]}>
                  <div className={styles["info-item"]}>
                    <label>Subscription No:</label>
                    <span>{subscriptionNo}</span>
                  </div>
                  <div className={styles["info-item"]}>
                    <label>Start Month/Year:</label>
                    <span>{startDate}</span>
                  </div>
                  <div className={styles["info-item"]}>
                    <label>End Month/Year:</label>
                    <span>{endDate}</span>
                  </div>
                </div>

                <div className={styles["address-section"]}>
                  <label>Despatch Address</label>
                  {isChangingAddress ? (
                    <div className={styles["address-edit"]}>
                      <textarea
                        value={tempAddress.line1}
                        onChange={(e) => setTempAddress({ line1: e.target.value })}
                        rows={3}
                      />
                      <div className={styles["address-buttons"]}>
                        <button onClick={handleSaveAddress} className={styles["save-btn"]}>
                          Save
                        </button>
                        <button
                          onClick={() => setIsChangingAddress(false)}
                          className={styles["cancel-btn"]}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles["address-display"]}>
                      <span>{tempAddress.line1}</span>
                    </div>
                  )}
                </div>

                <div className={styles["address-actions"]}>
                  {!isChangingAddress && (
                    <button
                      onClick={() => setIsChangingAddress(true)}
                      className={styles["change-address-btn"]}
                    >
                      Change Address?
                    </button>
                  )}
                  <button className={styles["next-btn"]} onClick={handleNext}>
                    PROCEED <span className={styles.arrow}>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {renderDetailsTable()}
        </div>
      </div>
    );
  };

  const renderPrintMaterialView = () => {
    if (!selectedCatalog) return null;

    const startMonth = monthLabelFromTitleOrId(
      selectedCatalog.title,
      selectedCatalog.magazine_id
    );
    const subscriptionNo = `SUB-${selectedCatalog.id}`;
    const startDate = `${startMonth}-${selectedCatalog.year}`;
    const endDate = getSubscriptionEndDate(selectedCatalog, selectedDuration);
    const durationYears = parseInt(selectedDuration, 10);

    const priceData: Record<"1" | "2", { price: number; issues: number; savings: string }> = {
      "1": {
        price: effectivePrice(selectedCatalog.price_one_year),
        issues: 11,
        savings: selectedCatalog.price_one_year?.discount_percent
          ? `${selectedCatalog.price_one_year.discount_percent}%`
          : "5%",
      },
      "2": {
        price: effectivePrice(selectedCatalog.price_two_year),
        issues: 22,
        savings: selectedCatalog.price_two_year?.discount_percent
          ? `${selectedCatalog.price_two_year.discount_percent}%`
          : "16%",
      },
    };

    return (
      <div className={styles["subscription-dashboard"]}>
        {renderTabs()}
        <div className={styles["print-material-container"]}>
          <div className={styles["subscription-details-card"]}>
            <div className={styles["subscription-header"]}>
              <DocumentIcon />
              <h3>Subscription Details</h3>
            </div>
            <div className={styles["details-list"]}>
              <div className={styles["detail-item"]}>
                <label>Subscription Type:</label>
                <span className={styles["blue-text"]}>Printed Material - {selectedDuration} Year{selectedDuration === "2" ? "s" : ""}</span>
              </div>
              <div className={styles["detail-item"]}>
                <label>Subscription No:</label>
                <span>{subscriptionNo}</span>
              </div>
              <div className={styles["detail-item"]}>
                <label>Starting Month/Year:</label>
                <span>{startDate}</span>
              </div>
              <div className={styles["detail-item"]}>
                <label>Ending Month/Year:</label>
                <span>{endDate}</span>
              </div>
              <div className={styles["detail-item"]}>
                <label>Duration:</label>
                <span>
                  {durationYears} Year{durationYears > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          <div className={styles["print-request-card"]}>
            <h3>Request for Print Material</h3>
            <hr />
            <div className={styles["duration-section"]}>
              <h4>Subscription Duration:</h4>
              <div className={styles["radio-options"]}>
                <label className={styles["radio-option"]}>
                  <input
                    type="radio"
                    name="duration"
                    value="1"
                    checked={selectedDuration === "1"}
                    onChange={() => setSelectedDuration("1")}
                    disabled={!selectedCatalog.price_one_year}
                  />
                  <span className={styles["radio-custom"]} />1 Year
                </label>
                <label className={styles["radio-option"]}>
                  <input
                    type="radio"
                    name="duration"
                    value="2"
                    checked={selectedDuration === "2"}
                    onChange={() => setSelectedDuration("2")}
                    disabled={!selectedCatalog.price_two_year}
                  />
                  <span className={styles["radio-custom"]} />2 Years
                </label>
              </div>
            </div>

            <div className={styles["pricing-info"]}>
              <p>
                Pay <span className={styles.price}>₹{priceData[selectedDuration].price}</span> and
                get {selectedDuration} Year{selectedDuration === "2" ? "s" : ""} of Printed Material –{" "}
                {priceData[selectedDuration].issues} issues
              </p>
              <p className={styles.savings}>Approx. Savings: {priceData[selectedDuration].savings}</p>
            </div>

            <button className={styles["proceed-btn"]} onClick={handleProceedFromPrintMaterial}>
              Proceed <span className={styles.arrow}>→</span>
            </button>
            <p className={styles.disclaimer}>
              Your digital subscription will continue. You will also receive printed material.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderEditionProgressView = () => {
    if (!selectedCatalog) return null;
    const relatedOrder = userOrders.find((o) => o.magazine_id === selectedCatalog.id);
    return (
      <div className={styles["view-details-page"]}>
        {renderTabs()}
        <div className={styles["edition-progress-container"]}>
          <div className={styles["progress-header"]}>
            <DocumentIcon />
            <h3>Edition Progress Report - {selectedCatalog.title}</h3>
            <hr className={styles.divider} />
          </div>

          <div className={styles["progress-details"]}>
            <div className={styles["detail-section"]}>
              <h4>Magazine Information</h4>
              <div className={styles["detail-grid"]}>
                <div className={styles["detail-item"]}>
                  <label>Magazine ID:</label>
                  <span>{selectedCatalog.magazine_id}</span>
                </div>
                <div className={styles["detail-item"]}>
                  <label>Title:</label>
                  <span>{selectedCatalog.title}</span>
                </div>
                <div className={styles["detail-item"]}>
                  <label>Year:</label>
                  <span>{selectedCatalog.year}</span>
                </div>
                <div className={styles["detail-item"]}>
                  <label>Type:</label>
                  <span className={`${styles["type-badge"]} ${styles[selectedCatalog.type] || ""}`}>
                    {selectedCatalog.type.charAt(0).toUpperCase() + selectedCatalog.type.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {relatedOrder && (
              <div className={styles["detail-section"]}>
                <h4>Order Information</h4>
                <div className={styles["detail-grid"]}>
                  <div className={styles["detail-item"]}>
                    <label>Order ID:</label>
                    <span>{relatedOrder.order_id}</span>
                  </div>
                  <div className={styles["detail-item"]}>
                    <label>Order Date:</label>
                    <span>
                      {relatedOrder.order_date
                        ? new Date(relatedOrder.order_date).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className={styles["detail-item"]}>
                    <label>Subscription Type:</label>
                    <span>{String(relatedOrder.subscription).replace("_", " ").toUpperCase()}</span>
                  </div>
                  <div className={styles["detail-item"]}>
                    <label>Status:</label>
                    <span
                      className={`${styles["status-badge"]} ${
                        styles[relatedOrder.status.toLowerCase().replace(/\s+/g, "-")] || ""
                      }`}
                    >
                      {relatedOrder.status.charAt(0).toUpperCase() + relatedOrder.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className={styles["progress-timeline"]}>
              <h4>Progress Timeline</h4>
              <div className={styles.timeline}>
                <div className={`${styles["timeline-item"]} ${styles.completed}`}>
                  <div className={styles["timeline-dot"]}></div>
                  <div className={styles["timeline-content"]}>
                    <h5>Order Placed</h5>
                    <p>{relatedOrder?.order_date ? new Date(relatedOrder.order_date).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>
                <div className={`${styles["timeline-item"]} ${relatedOrder?.status === "processing" ? styles.active : styles.completed}`}>
                  <div className={styles["timeline-dot"]}></div>
                  <div className={styles["timeline-content"]}>
                    <h5>Processing</h5>
                    <p>Your subscription is being processed</p>
                  </div>
                </div>
                <div className={`${styles["timeline-item"]} ${relatedOrder?.status === "delivered" ? styles.completed : styles.pending}`}>
                  <div className={styles["timeline-dot"]}></div>
                  <div className={styles["timeline-content"]}>
                    <h5>Ready for Access</h5>
                    <p>Magazine will be available for download</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button className={styles["back-btn"]} onClick={() => setCurrentView("details")}>
            ← Back to Subscription Details
          </button>
        </div>
      </div>
    );
  };

  const renderFailureDetailsView = () => {
    if (!selectedCatalog) return null;
    const failedOrder = userOrders.find(
      (o) => o.magazine_id === selectedCatalog.id && o.status?.toLowerCase().includes("failed")
    );
    return (
      <div className={styles["subscription-dashboard"]}>
        {renderTabs()}
        <div className={styles["failure-details"]}>
          <div className={styles["failure-card"]}>
            <h3>Delivery Failure Details</h3>
            <p>
              <strong>Magazine:</strong>{" "}
              {failedOrder?.magazine?.title || selectedCatalog.title}
            </p>
            <p>
              <strong>Failure Date:</strong>{" "}
              {failedOrder?.order_date || new Date().toLocaleDateString()}
            </p>
            <p>
              <strong>Reason:</strong> {failedOrder?.description || "Address not found"}
            </p>
            <p>
              <strong>Attempts Made:</strong> 3
            </p>
            <p>
              <strong>Action Required:</strong> Please Subscribe
            </p>
            <p>
              <strong>Subscription:</strong> {selectedCatalog.title} (SUB-{selectedCatalog.id})
            </p>
            <button className={styles["back-btn"]} onClick={() => setCurrentView("details")}>
              ← Back to Subscription Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    if (availableYears.includes(activeTab)) return renderMainView(activeTab);
    if (activeTab === "details") {
      switch (currentView) {
        case "pdfDetails": return renderPdfDetailsView();
        case "details": return renderDetailsView();
        case "printMaterial": return renderPrintMaterialView();
        case "failureDetails": return renderFailureDetailsView();
        case "editionProgress": return renderEditionProgressView();
        default: return renderDetailsView();
      }
    }
    return renderMainView(availableYears[0] || "2025-2026");
  };

  // Session-loading gate
  if (sessionStatus === "loading") {
    return <p>Loading session…</p>;
  }

  if (loading) {
    return (
      <>
        <SetBreadcrumb text="MBA Education & careers - Monthly Magazines" />
        <div className={styles.app}>
          <div className={styles["loading-container"]}>
            <Spin size="large" />
            <p className={styles["loading-text"]}>Loading magazines...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SetBreadcrumb text="MBA Education & careers - Monthly Magazines" />
      <div className={styles.app}>{renderCurrentView()}</div>
    </>
  );
};

export default SubscriptionDashboard;
