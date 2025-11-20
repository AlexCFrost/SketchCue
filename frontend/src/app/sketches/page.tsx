"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Image from "next/image";

interface Sketch {
  id: string;
  imageUrl: string;
  description: string;
  timestamp?: { seconds: number };
}

export default function MySketches() {
  const [sketches, setSketches] = useState<Sketch[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const itemsRef = collection(db, "sketches", user.uid, "items");
        const snapshot = await getDocs(itemsRef);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Sketch[];

        // Sort by timestamp descending (newest first)
        data.sort((a, b) => {
          const timeA = a.timestamp?.seconds || 0;
          const timeB = b.timestamp?.seconds || 0;
          return timeB - timeA;
        });

        setSketches(data);
      } catch (error) {
        console.error("Error fetching sketches:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your sketches...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleDelete = async (sketchId: string, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this sketch?")) {
      return;
    }

    setDeleting(sketchId);

    try {
      const response = await fetch("/api/delete-sketch", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sketchId,
          userId: user.uid,
          imageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete sketch");
      }

      // Remove from local state
      setSketches(sketches.filter((s) => s.id !== sketchId));
      console.log("✅ Sketch deleted successfully");
    } catch (error) {
      console.error("Error deleting sketch:", error);
      alert(error instanceof Error ? error.message : "Failed to delete sketch");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-700 mb-2">My Sketches</h1>
          <p className="text-gray-600">View all your AI-analyzed sketches</p>
        </div>

        {sketches.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">No sketches yet!</h3>
            <p className="text-gray-500 mb-6">Start creating your first sketch to see it here.</p>
            <button
              onClick={() => router.push("/")}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Create a Sketch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sketches.map((sketch) => (
              <div
                key={sketch.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={sketch.imageUrl}
                    alt="User Sketch"
                    className="object-contain"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {sketch.description}
                  </p>
                  {sketch.timestamp && (
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(sketch.timestamp.seconds * 1000).toLocaleDateString()}
                    </p>
                  )}
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(sketch.id, sketch.imageUrl)}
                    disabled={deleting === sketch.id}
                    className="mt-3 w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deleting === sketch.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
