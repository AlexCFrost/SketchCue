"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CanvasDraw from "@/components/CanvasDraw";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { saveSketch } from "@/lib/sketch";
import { useUploadThing } from "@/lib/uploadthing";

export default function HomePage() {
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastAnalyzeTime, setLastAnalyzeTime] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const { user, loading } = useAuth();
  const router = useRouter();
  const { startUpload } = useUploadThing("sketchUploader");

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleSketch = async (imageBase64: string) => {
    if (!user) return;
    
    // Rate limiting: prevent requests within 10 seconds
    const now = Date.now();
    const timeSinceLastAnalyze = (now - lastAnalyzeTime) / 1000;
    
    if (timeSinceLastAnalyze < 10) {
      const remainingTime = Math.ceil(10 - timeSinceLastAnalyze);
      setCooldown(remainingTime);
      setDescription(`⏳ Please wait ${remainingTime} seconds before analyzing again to avoid quota limits.`);
      return;
    }
    
    setLastAnalyzeTime(now);
    setAnalyzing(true);
    setUploading(true);
    
    try {
      // Step 1: Analyze the sketch with Gemini AI
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64 }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to analyze sketch");
      }
      
      const data = await res.json();
      setDescription(data.description);
      setAnalyzing(false);
      
      // Step 2: Convert base64 to File object
      const blob = await (await fetch(imageBase64)).blob();
      const file = new File([blob], `sketch-${Date.now()}.png`, { type: "image/png" });
      
      // Step 3: Upload to UploadThing
      const uploadResult = await startUpload([file]);
      setUploading(false);
      
      if (!uploadResult || uploadResult.length === 0) {
        throw new Error("Upload failed");
      }
      
      const imageUrl = uploadResult[0].url;
      
      // Step 4: Save sketch metadata to Firestore
      const saveResult = await saveSketch(imageUrl, data.description);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || "Failed to save sketch");
      }
      
      console.log("✅ Sketch saved successfully:", imageUrl);
      
    } catch (error) {
      console.error("Error processing sketch:", error);
      setDescription(
        error instanceof Error 
          ? `Error: ${error.message}` 
          : "Error processing sketch. Please try again."
      );
    } finally {
      setAnalyzing(false);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex flex-col items-center p-6 space-y-6 max-w-4xl mx-auto">
        <div className="text-center space-y-2 mt-8">
          <h1 className="text-4xl font-bold text-indigo-700">Welcome to SketchCue</h1>
          <p className="text-gray-600">Draw your sketch and let AI analyze it for you</p>
        </div>
        
        <CanvasDraw onSketch={handleSketch} />
        
        {cooldown > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
            <p className="text-yellow-800 font-medium">
              ⏳ Please wait {cooldown} second{cooldown !== 1 ? 's' : ''} before analyzing again
            </p>
            <p className="text-yellow-600 text-sm mt-1">
              This helps prevent hitting API quota limits
            </p>
          </div>
        )}
        
        {(analyzing || uploading) && cooldown === 0 && (
          <div className="flex items-center space-x-2 text-indigo-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <span>
              {analyzing && "Analyzing your sketch..."}
              {!analyzing && uploading && "Uploading sketch..."}
            </span>
          </div>
        )}
        
        {description && !analyzing && !uploading && (
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl w-full">
            <h2 className="font-semibold text-gray-800 text-lg mb-3">AI Analysis:</h2>
            <p className="text-gray-700 leading-relaxed">{description}</p>
          </div>
        )}
      </main>
    </div>
  );
}
