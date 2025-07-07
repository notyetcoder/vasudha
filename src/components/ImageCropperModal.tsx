
'use client';

import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedImageUrl: string) => void;
}

// This was adapted from the official react-image-crop example
function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop,
  canvas: HTMLCanvasElement,
  scale = 1,
  rotate = 0
): Promise<string> {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  const pixelRatio = window.devicePixelRatio;
  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const rotateRads = (rotate * Math.PI) / 180;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;
  
  ctx.save();
  
  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotateRads);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
  );

  ctx.restore();

  return new Promise((resolve) => {
    // Add quality parameter for JPEG compression
    resolve(canvas.toDataURL('image/jpeg', 0.7));
  });
}

export default function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);

  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // aspect ratio 1:1
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  }

  const handleSaveCrop = async () => {
    if (completedCrop && previewCanvasRef.current && imgRef.current) {
        try {
            const dataUrl = await getCroppedImg(
                imgRef.current,
                completedCrop,
                previewCanvasRef.current,
                scale,
                rotate
            );
            onCropComplete(dataUrl);
            onClose();
        } catch (e) {
            console.error(e);
        }
    }
  };
  
  if (!imageSrc) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Crop Your Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
            <div className="w-full h-96 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  minWidth={100}
                  minHeight={100}
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageSrc}
                    style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                    onLoad={onImageLoad}
                    className="max-h-96"
                  />
                </ReactCrop>
            </div>
            <div className="w-full space-y-2">
                <label className="text-sm font-medium">Scale (Zoom)</label>
                <Slider
                    defaultValue={[1]}
                    min={0.5}
                    max={2}
                    step={0.01}
                    onValueChange={(value) => setScale(value[0])}
                />
            </div>
             <div className="w-full space-y-2">
                <label className="text-sm font-medium">Rotate</label>
                <Slider
                    defaultValue={[0]}
                    min={-180}
                    max={180}
                    step={1}
                    onValueChange={(value) => setRotate(value[0])}
                />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveCrop}>Save Picture</Button>
        </DialogFooter>
        {/* Hidden canvas for generating the cropped image */}
        <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
      </DialogContent>
    </Dialog>
  );
}
