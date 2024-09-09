'use client';

import { Analytics } from "@vercel/analytics/react"
import React, { useState, useCallback } from 'react';
import { useDropzone, DropzoneRootProps } from 'react-dropzone';
import Image from 'next/image';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import { X } from 'lucide-react';

interface UploadedImage {
  file: File;
  preview: string;
  enhanced?: string;
  enhancedBlob?: Blob;
}

type MotionDropzoneProps = MotionProps & DropzoneRootProps;

export default function Home() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.gif']
    },
    multiple: true
  });

  const enhanceImages = async () => {
    setIsEnhancing(true);
    setProgress(0);
    const totalImages = images.length;
    const enhancedImages = await Promise.all(
      images.map(async (image, index) => {
        const formData = new FormData();
        formData.append('file', image.file);

        try {
          const response = await fetch('/api/enhance', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const blob = await response.blob();
            setProgress(((index + 1) / totalImages) * 100);
            return {
              ...image,
              enhanced: URL.createObjectURL(blob),
              enhancedBlob: blob,
            };
          } else {
            console.error('Error enhancing image:', await response.text());
            return image;
          }
        } catch (error) {
          console.error('Error enhancing image:', error);
          return image;
        }
      })
    );

    setImages(enhancedImages);
    setIsEnhancing(false);
  };

  const downloadEnhancedImage = (image: UploadedImage, index: number) => {
    if (image.enhancedBlob) {
      const url = window.URL.createObjectURL(image.enhancedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `enhanced_image_${index + 1}.png`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };

  const deleteImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">AI Image Enhancer</h1>
        
        <motion.div
          {...getRootProps() as MotionDropzoneProps}
          className={`border-2 border-dashed rounded-lg p-12 mb-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input {...getInputProps()} />
          <AnimatePresence>
            {isDragActive ? (
              <motion.p
                className="text-blue-500 text-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                Drop the images here
              </motion.p>
            ) : (
              <motion.p
                className="text-gray-500 text-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                Drag 'n' drop images here, or click to select files
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {images.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Preview:</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {images.map((image, index) => (
                <motion.div
                  key={index}
                  className="space-y-4 bg-white p-4 rounded-lg shadow-md relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <motion.button
                    onClick={() => deleteImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={16} />
                  </motion.button>

                  <div className="relative h-48 rounded-md overflow-hidden">
                    <Image
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-md"
                    />
                  </div>
                  {image.enhanced && (
                    <div className="space-y-2">
                      <div className="relative h-48 rounded-md overflow-hidden">
                        <Image
                          src={image.enhanced}
                          alt={`Enhanced ${index + 1}`}
                          fill
                          style={{ objectFit: 'cover' }}
                          className="rounded-md"
                        />
                      </div>
                      <motion.button
                        onClick={() => downloadEnhancedImage(image, index)}
                        className="w-full bg-green-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Download Enhanced Image
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <motion.button
          onClick={enhanceImages}
          className="w-full bg-blue-500 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={images.length === 0 || isEnhancing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isEnhancing ? 'Enhancing...' : 'Enhance Images'}
        </motion.button>

        {isEnhancing && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <motion.div
                className="bg-blue-500 h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-center mt-2 text-gray-600">{Math.round(progress)}% Complete</p>
          </div>
        )}
      </div>
    </main>
  );
}