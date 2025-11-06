"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

interface Author {
  id: string;
  name: string;
}

interface UploadZoneProps {
  onUploadComplete?: () => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
}

export function UploadZone({
  onUploadComplete,
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB default (to support videos)
  acceptedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"],
}: UploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch authors
  const { data: authorsData } = useQuery<{ data: Author[] }>({
    queryKey: ["authors"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/authors`
      );
      if (!response.ok) throw new Error("Failed to fetch authors");
      return response.json();
    },
  });

  const authors = authorsData?.data || [];

  // Auto-select first author if available
  useEffect(() => {
    if (authors.length > 0 && !selectedAuthorId) {
      setSelectedAuthorId(authors[0].id);
    }
  }, [authors, selectedAuthorId]);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please upload images or videos.`;
    }

    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit.`;
    }

    return null;
  };

  const createPreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;

    const fileArray = Array.from(newFiles);

    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files at once.`);
      return;
    }

    const uploadFiles: UploadFile[] = fileArray.map((file) => {
      const validationError = validateFile(file);

      return {
        id: Math.random().toString(36).substring(7),
        file,
        preview: createPreview(file),
        status: validationError ? "error" : "pending",
        progress: 0,
        error: validationError || undefined,
      };
    });

    setFiles((prev) => [...prev, ...uploadFiles]);
  }, [files.length, maxFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    handleFiles(droppedFiles);
  }, [handleFiles]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    if (!selectedAuthorId) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "error", error: "Please select an author" }
            : f
        )
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile.file);
    formData.append("title", uploadFile.file.name.replace(/\.[^/.]+$/, ""));
    formData.append("status", "PUBLISHED");
    formData.append("authorId", selectedAuthorId);

    // Get token from localStorage or your auth context
    const token = localStorage.getItem("accessToken");

    try {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, progress, status: "uploading" }
                : f
            )
          );
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: "success", progress: 100 }
                : f
            )
          );
        } else {
          const error = JSON.parse(xhr.responseText);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: "error", error: error.message || "Upload failed" }
                : f
            )
          );
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "error", error: "Network error occurred" }
              : f
          )
        );
      });

      xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/gallery/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "error", error: "Upload failed" }
            : f
        )
      );
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");

    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    // Check if all uploads are complete
    setTimeout(() => {
      const allSuccess = files.every((f) => f.status === "success");
      if (allSuccess && onUploadComplete) {
        onUploadComplete();
        // Clear files after successful upload
        setFiles([]);
      }
    }, 500);
  };

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "uploading":
        return (
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <ImageIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;

  return (
    <div className="space-y-4">
      {/* Author Selection */}
      <div className="bg-card border border-border rounded-lg p-4">
        <label htmlFor="author-select" className="block text-sm font-medium mb-2">
          Select Author <span className="text-red-500">*</span>
        </label>
        <select
          id="author-select"
          value={selectedAuthorId}
          onChange={(e) => setSelectedAuthorId(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">-- Select an author --</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))}
        </select>
        {authors.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            No authors available. Please create an author first.
          </p>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-primary/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full ${isDragging ? "bg-primary/10" : "bg-muted"}`}>
            <Upload className={`h-8 w-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-1">
              {isDragging ? "Drop files here" : "Upload Gallery Items"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              Browse Files
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Supported: Images (JPEG, PNG, GIF, WebP) and Videos (MP4, WebM)
            <br />
            Max file size: {Math.round(maxFileSize / 1024 / 1024)}MB
          </p>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                Files ({files.length})
                {uploadingCount > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    Uploading {uploadingCount}...
                  </span>
                )}
              </h4>

              {pendingCount > 0 && (
                <button
                  onClick={uploadAllFiles}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm"
                >
                  Upload All ({pendingCount})
                </button>
              )}
            </div>

            <div className="grid gap-3">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
                >
                  {/* Preview */}
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    {file.file.type.startsWith("image/") ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(file.status)}
                      <p className="font-medium truncate">{file.file.name}</p>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    {/* Progress Bar */}
                    {(file.status === "uploading" || file.status === "success") && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {file.progress}%
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {file.status === "error" && file.error && (
                      <p className="text-sm text-red-500 mt-1">{file.error}</p>
                    )}
                  </div>

                  {/* Remove Button */}
                  {file.status !== "uploading" && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 hover:bg-muted rounded-lg transition"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
