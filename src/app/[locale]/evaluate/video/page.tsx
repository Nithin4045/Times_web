"use client";

import React, { useState, useEffect } from "react";
import { Button } from "antd";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useTestStore from "@/store/evaluate/teststore";
import AppLayout from "@/components/evaluate/layout";
import styles from "./video.module.css";

const Video: React.FC = () => {
  const [video, setVideo] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const userId = session?.user?.email || "anonymous";
  // const college_code = session?.user?.college_code || "anonymous";
  const college_code = "anonymous";
  const router = useRouter();
  const { testId, userTestId } = useTestStore();
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!testId) {
        console.error("Test ID is missing.");
        return;
      }

      try {
        const response = await fetch(`/api/evaluate/video?test_id=${testId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.questions[0]?.video === 0) {
            fetchLinkedTestDetails()
          }
        } else {
          console.error("Error fetching questions:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setIsLoading(false); 
      }
    };

    fetchQuestions();
  }, [testId]);
  const fetchLinkedTestDetails = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/evaluate/getlinkedtest?test_id=${testId}`);

      if (!response.ok) {
        const errorData = await response.json();
        router.push("/evaluate/feedback");
      }

      const data = await response.json();
      if (data && data.linkedTestDetails && Array.isArray(data.linkedTestDetails) && data.linkedTestDetails.length > 0) {
        const testDetails = data.linkedTestDetails[0]; 
        console.log("this is my data of linked test", testDetails);

        const { TEST_ID, TEST_TYPE, TEST_TITLE } = testDetails;

        
        // const queryParams = new URLSearchParams({
        //   TEST_ID: String(TEST_ID),
        //   TEST_TYPE: TEST_TYPE,
        //   TEST_TITLE: TEST_TITLE,
        // }).toString();
        // const encodedQueryParams = queryParams.replace(/\+/g, "%20");

        const url = `/codecompiler/home/test-pattern?TEST_ID=${TEST_ID.toString()}&TEST_TYPE=${TEST_TYPE}&TEST_TITLE=${TEST_TITLE}`;
        router.push(url); 
      } else {
        router.push("/evaluate/feedback");
      }
      
    } catch (err) {
      console.log("Error fetching linked test: " + err);
    } finally {
      setIsLoading(false);
    }
  };
  const getVideo = async () => {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      const recorder = new MediaRecorder(videoStream, {
        mimeType: "video/webm",
      });
      const localChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          localChunks.push(event.data); // Use a local array for chunks
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(localChunks, { type: "video/webm" });
        if (blob.size > 0) {
          const data = new FormData();
          const fileName = `${userId}_${Date.now()}.webm`;

          if (testId && userTestId) {
            data.append("video", blob, fileName);
            data.append("testId", testId);
            data.append("userTestId", userTestId);
            data.append('college_code',college_code)
          } else {
            console.error("testId or userTestId is null");
            return;
          }

          try {
            const response = await fetch("/api/evaluate/video", {
              method: "POST",
              body: data,
            });

            if (response.ok) {
              fetchLinkedTestDetails()
              // router.push("/evaluate/feedback");
            } else {
              alert("Failed to upload video.");
            }
          } catch (err) {
            console.error("Error uploading video:", err);
            alert("An error occurred while uploading the video.");
          }
        } else {
          alert("No video data was recorded. Please try again.");
        }

        video?.getTracks().forEach((track) => track.stop());
        setVideo(null);
        setMediaRecorder(null);
        setIsRecording(false);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setVideo(videoStream);
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing video stream:", error);
    }
  };

  const stopVideo = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (video) {
      video.getTracks().forEach((track) => track.stop());
      setVideo(null);
    }
  };

  const handleVideoClick = () => {
    if (isRecording) {
      stopVideo();
    } else {
      getVideo();
    }
  };

  return (
   
      <div className={styles["video-container"]}>
        <div className={styles["video-button-container"]}>
          <Button
            className={styles["video-button"]}
            onClick={handleVideoClick}
            disabled={!video && isRecording}
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>
        </div>
        <h1 className={styles["video-title"]}>Record Video</h1>
        <p className={styles["video-text"]}>
          Dear patron, thank you for reaching the final leg of this test. When
          you are ready, press the button below to start recording a video to
          explain about yourself. Once you are done with your recording, press
          stop recording to submit the results. <span style={{color:'red'}}>please make sure your video do not exceeded more than 2 Mins</span>
        </p>
        {video && (
          <div className={styles["video-preview"]}>
            <video
              className={styles["video-element"]}
              autoPlay
              muted
              ref={(videoElement) => {
                if (videoElement && video) {
                  videoElement.srcObject = video;
                }
              }}
            ></video>
          </div>
        )}
        {isLoading && <p>Loading video...</p>}
      </div>
 
  );
};
export default Video;
