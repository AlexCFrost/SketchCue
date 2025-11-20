"use client";
import { useEffect, useRef, useState } from "react";
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl";

export default function CanvasDraw({ onSketch }: { onSketch: (data: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize camera and model
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initCameraAndModel = async () => {
      try {
        setLoading(true);
        setCameraError("");

        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise<void>((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => resolve();
            }
          });
          await videoRef.current.play();
        }

        // Load handpose model
        const loadedModel = await handpose.load();
        setModel(loadedModel);
        setLoading(false);
      } catch (error) {
        console.error("Camera/Model initialization error:", error);
        setCameraError(
          error instanceof Error 
            ? `Camera Error: ${error.message}. Please allow camera access.`
            : "Failed to access camera. Please check permissions."
        );
        setLoading(false);
      }
    };

    initCameraAndModel();

    // Cleanup
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Hand tracking and drawing loop
  useEffect(() => {
    if (!model || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up canvas styling
    ctx.strokeStyle = "#2563EB";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let animationId: number;
    let isDetecting = true;

    const detectHands = async () => {
      if (!isDetecting || !videoRef.current || !canvasRef.current) return;

      try {
        const predictions = await model.estimateHands(videoRef.current);

        if (predictions.length > 0) {
          const hand = predictions[0];
          
          // Get key landmarks - SIMPLE approach
          const indexTip = hand.landmarks[8];      // Index finger tip
          const indexMCP = hand.landmarks[5];      // Index finger base
          const middleTip = hand.landmarks[12];    // Middle finger tip
          const ringTip = hand.landmarks[16];      // Ring finger tip
          const pinkyTip = hand.landmarks[20];     // Pinky tip
          
          // Mirror the X coordinate (flip horizontally like Photo Booth)
          const x = canvas.width - indexTip[0];
          const y = indexTip[1];

          // SIMPLE detection: Just check if index finger is higher (more extended) than other fingers
          // This makes it work anywhere on screen
          const indexHeight = indexMCP[1] - indexTip[1]; // How far index extends upward
          const middleHeight = indexMCP[1] - middleTip[1];
          const ringHeight = indexMCP[1] - ringTip[1];
          const pinkyHeight = indexMCP[1] - pinkyTip[1];
          
          // Drawing happens when:
          // 1. Index finger is extended upward (at least 40 pixels)
          // 2. Index is MORE extended than other fingers
          const indexExtended = indexHeight > 40;
          const indexIsHighest = indexHeight > middleHeight + 20 && 
                                 indexHeight > ringHeight + 20 && 
                                 indexHeight > pinkyHeight + 20;
          
          const isPointing = indexExtended && indexIsHighest;

          if (isPointing) {
            // Drawing active - draw line
            if (lastPointRef.current) {
              ctx.beginPath();
              ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
              ctx.lineTo(x, y);
              ctx.stroke();
            }
            lastPointRef.current = { x, y };
            setIsDrawing(true);
          } else {
            // Not pointing - stop drawing
            lastPointRef.current = null;
            setIsDrawing(false);
          }
        } else {
          // No hand detected
          lastPointRef.current = null;
          setIsDrawing(false);
        }
      } catch (error) {
        console.error("Hand detection error:", error);
      }

      animationId = requestAnimationFrame(detectHands);
    };

    detectHands();

    return () => {
      isDetecting = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [model]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastPointRef.current = null;
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const imageBase64 = canvasRef.current.toDataURL("image/png");
    if (imageBase64) onSketch(imageBase64);
  };

  if (cameraError) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-center max-w-md">
        <p className="text-red-700 font-medium">{cameraError}</p>
        <p className="text-red-600 text-sm mt-2">
          Please allow camera access in your browser settings and refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {loading && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-blue-700 font-medium">Loading camera and AI model...</p>
        </div>
      )}

      <div className="relative bg-white rounded-lg shadow-lg p-4">
        {/* Camera video feed - mirrored like Photo Booth */}
        <video
          ref={videoRef}
          className="absolute top-4 left-4 rounded-md border-2 border-gray-300"
          style={{ 
            width: 640, 
            height: 480,
            transform: 'scaleX(-1)', // Mirror horizontally
            WebkitTransform: 'scaleX(-1)' // Safari support
          }}
          playsInline
        />

        {/* Drawing canvas overlay */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="relative rounded-md border-2 border-indigo-300"
        />

        {/* Drawing status indicator */}
        {isDrawing && (
          <div className="absolute top-8 right-8 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            ✏️ Drawing
          </div>
        )}

        {!loading && !isDrawing && (
          <div className="absolute top-8 right-8 bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            👆 Point to draw
          </div>
        )}
      </div>

      <div className="text-center text-gray-600 text-sm max-w-md">
        <p className="font-medium text-base mb-2">✋ How to Draw:</p>
        <ol className="text-left space-y-1 inline-block">
          <li>1. Show your hand to the camera</li>
          <li>2. Make a <strong>&quot;pointing&quot; gesture</strong> (like pointing at something)</li>
          <li>3. Keep only your index finger extended, other fingers curled</li>
          <li>4. Move your pointing finger to draw in the air</li>
        </ol>
        <p className="mt-2 text-xs text-gray-500">
          💡 Tip: Make a &quot;gun&quot; hand shape - only index finger should be straight!
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={clearCanvas}
          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition font-medium"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          Analyze Sketch
        </button>
      </div>
    </div>
  );
}
