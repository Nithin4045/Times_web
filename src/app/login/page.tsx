"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Form } from "antd";
import { ArrowLeftOutlined, ReloadOutlined } from "@ant-design/icons";
import { signIn, useSession } from "next-auth/react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Landingpagecards from "@/components/landingpagecards";
import { commonStore } from "@/store/common/common";
import "../global.css";
import styles from "./login.module.css";

type Step = "MOBILE" | "OTP";

export default function SignIn() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { settingsData, setSettingsData } = commonStore();
  const [form] = Form.useForm();

  const [step, setStep] = useState<Step>("MOBILE");
  const [mobileNo, setMobileNo] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0); // seconds
  const [siteName, setSiteName] = useState("");

  // ---------- Settings / Logo ----------
  const parsedSettings = useMemo(() => {
    try {
      const raw = settingsData?.[0]?.SETTINGS_JSON || "{}";
      const sanitized = String(raw)
        .replace(/'/g, '"')
        .replace(/(\w+)\s*:/g, '"$1":');
      return JSON.parse(sanitized);
    } catch (e) {
      console.error("Failed to parse SETTINGS_JSON:", e);
      return {};
    }
  }, [settingsData]);

  const logoName: string = parsedSettings.logo_name || "";
  const logoUrl = logoName?.trim() ? logoName : "/TIME_Logo_Square.svg";

  // ---------- Fetch settings on mount ----------
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const subdomain = window.location.hostname.split(".")[0];
        const res = await axios.get(`/api/settings?domain=${subdomain}`);
        setSettingsData(res.data);
        setSiteName(res.data?.[0]?.SITE_NAME ?? "");
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    };
    fetchSettings();
  }, [setSettingsData]);

  // ---------- Handle Auth Redirect ----------
  useEffect(() => {
    if (status !== "authenticated") return;
    // Normalize modules (string like "10,20") across legacy/new keys
    const user: any = session?.user || {};
    const role = user.role as string | undefined;

    console.log("User session:", user);

    const modulesStr =
      (user.modules as string | undefined) ??
      (user.module as string | undefined) ??
      "";
    const userModules = modulesStr
      ? String(modulesStr)
        .split(",")
        .map((x) => Number(x.trim()))
        .filter((x) => !Number.isNaN(x))
      : [];

    if (!role) {
      setError("Please contact your administrator1");
      return;
    }

    if (role === "ADM" || role === "STU") {
      // if (userModules.length === 0) {
      //   setError("Please contact your administrator2");
      //   return;
      // }
      if (userModules.includes(0)) {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/student");
      }
    } else {
      setError("Please contact your administrator3");
    }
  }, [status, session, router]);

  // ---------- Resend OTP Timer ----------
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  // ---------- Actions ----------
  const handleBack = () => {
    setStep("MOBILE");
    setOtp("");
    setError("");
  };

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(mobileNo)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/sendotp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNo }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Failed to send OTP");
        return;
      }

      setStep("OTP");
      setResendIn(45); // lock resend for 45s
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    await handleSendOtp();
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{4}$/.test(otp)) {
      setError("Please enter a valid 4-digit OTP");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      // NextAuth Credentials sign-in; user gets placed into JWT in jwt() callback
      const res = await signIn("credentials", {
        mobileNo,
        otp,
        redirect: false,
      });

      if (!res || res.error) {
        setError("Invalid OTP. Please try again.");
        return;
      }
      // No manual session polling—useSession() will move to "authenticated" and the effect will redirect.
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <main>
      <div className={styles.loginContainer}>
        {/* Left: Carousel */}
        <div className={styles.carouselContainer}>
          <Landingpagecards />
        </div>

        {/* Right: Auth Card */}
        <div className={styles.loginFormContainer}>
          <div className={styles.formWrapper}>
            <div className={styles.formContent}>
              {/* Logo + Site Name */}
              <div className={styles.logoContainer}>
                <img
                  src={logoUrl}
                  alt="Logo"
                  className={styles.logoImage}
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    if (t.src !== "/TIME_Logo_Square.svg") t.src = "/TIME_Logo_Square.svg";
                  }}
                />
                <span className={styles.siteName}>{siteName}</span>
              </div>

              {/* Header */}
              <div className={styles.headerSection}>
                {step === "OTP" && (
                  <div className={styles.backButton}>
                    <Button onClick={handleBack} aria-label="Back to mobile entry">
                      <ArrowLeftOutlined />
                    </Button>
                  </div>
                )}
                <div className={styles.headerTitle}>Start By Logging In</div>
              </div>

              {/* Error */}
              {error && <div className={styles.errorDisplay}>{error}</div>}

              {/* Form */}
              <Form form={form} className={styles.form} onFinish={() => false} autoComplete="off">
                {step === "MOBILE" ? (
                  <>
                    <Form.Item
                      name="mobileNo"
                      rules={[
                        { required: true, message: "Mobile number is required" },
                        { pattern: /^\d{10}$/, message: "Enter a valid 10-digit number" },
                      ]}
                    >
                      <Input
                        value={mobileNo}
                        inputMode="numeric"
                        placeholder="Enter your mobile number"
                        className={styles.input}
                        maxLength={10}
                        disabled={sending}
                        onChange={(e) => {
                          setMobileNo(e.target.value.replace(/\D/g, ""));
                          setError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (/^\d{10}$/.test(mobileNo) && !sending) handleSendOtp();
                          }
                        }}
                      />
                    </Form.Item>

                    <Button
                      loading={sending}
                      disabled={sending}
                      onClick={handleSendOtp}
                      className={styles.loginButton}
                    >
                      Send OTP
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Number hint (above input) */}
                    <div className={styles.otpLabel}>
                      OTP sent to{" "}
                      <strong>
                        {mobileNo.replace(/^(\d{2})(\d{4})(\d{4})$/, "+91 $1****$3")}
                      </strong>
                    </div>

                    <Form.Item
                      name="otp"
                      rules={[
                        { required: true, message: "OTP is required" },
                        { pattern: /^\d{4}$/, message: "Enter a valid 4-digit OTP" },
                      ]}
                    >
                      <Input
                        value={otp}
                        inputMode="numeric"
                        placeholder="Enter OTP"
                        className={styles.input}
                        maxLength={4}
                        disabled={verifying}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, ""));
                          setError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (/^\d{4}$/.test(otp) && !verifying) handleVerifyOtp();
                          }
                        }}
                      />
                    </Form.Item>

                    <Button
                      loading={verifying}
                      disabled={verifying}
                      onClick={handleVerifyOtp}
                      className={styles.loginButton}
                    >
                      Verify OTP
                    </Button>

                    {/* Resend below, right-aligned */}
                    <div className={styles.resendRow}>
                      <Button
                        size="small"
                        icon={<ReloadOutlined />}
                        onClick={handleResend}
                        disabled={verifying || sending || resendIn > 0}
                        className={styles.resendBtn}
                        aria-label="Resend OTP"
                      >
                        {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
                      </Button>
                    </div>
                  </>
                )}
              </Form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );


}
