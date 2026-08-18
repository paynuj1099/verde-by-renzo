"use client";

import { useEffect, useRef, useState } from "react";
import { Crop, X } from "lucide-react";

type Props = {
  file: File | null;
  previewUrl: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

export default function AdminImageCropModal({
  file,
  previewUrl,
  onCancel,
  onConfirm,
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    positionX: number;
    positionY: number;
  } | null>(null);

  useEffect(() => {
    setZoom(1);
    setPositionX(0);
    setPositionY(0);
  }, [previewUrl]);

  if (!file || !previewUrl) return null;

  const cropImage = async () => {
    const image = new window.Image();
    image.src = previewUrl;
    await image.decode();
    const viewport = 320;
    const baseScale = Math.max(
      viewport / image.naturalWidth,
      viewport / image.naturalHeight,
    );
    const scale = baseScale * zoom;
    const renderedWidth = image.naturalWidth * scale;
    const renderedHeight = image.naturalHeight * scale;
    const offsetX = ((renderedWidth - viewport) / 2) * (positionX / 100);
    const offsetY = ((renderedHeight - viewport) / 2) * (positionY / 100);
    const sourceX =
      Math.max(0, (renderedWidth - viewport) / 2 + offsetX) / scale;
    const sourceY =
      Math.max(0, (renderedHeight - viewport) / 2 + offsetY) / scale;
    const sourceSize = viewport / scale;
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    canvas
      .getContext("2d")
      ?.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        640,
        640,
      );
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error("Crop failed")),
        "image/jpeg",
        0.9,
      ),
    );
    onConfirm(
      new File([blob], file.name.replace(/\.[^.]+$/, "") + "-cropped.jpg", {
        type: "image/jpeg",
      }),
    );
  };

  const viewport = 320;
  const baseScale = Math.max(
    viewport / imageSize.width,
    viewport / imageSize.height,
  );
  const renderedWidth = imageSize.width * baseScale * zoom;
  const renderedHeight = imageSize.height * baseScale * zoom;
  const translateX = ((renderedWidth - viewport) / 2) * (positionX / 100);
  const translateY = ((renderedHeight - viewport) / 2) * (positionY / 100);

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-gold-600">
              Profile picture
            </p>
            <h2 className="font-serif text-xl text-forest-900">Crop photo</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="Close cropper"
          >
            <X size={20} />
          </button>
        </div>
        <div
          className="mx-auto h-80 w-80 max-w-full cursor-move touch-none overflow-hidden rounded-full bg-gray-100 ring-4 ring-white shadow-inner"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = {
              startX: event.clientX,
              startY: event.clientY,
              positionX,
              positionY,
            };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag) return;
            const maxOffsetX = Math.max(0, (renderedWidth - viewport) / 2);
            const maxOffsetY = Math.max(0, (renderedHeight - viewport) / 2);
            if (maxOffsetX > 0)
              setPositionX(
                Math.max(
                  -100,
                  Math.min(
                    100,
                    drag.positionX -
                      ((event.clientX - drag.startX) / maxOffsetX) * 100,
                  ),
                ),
              );
            if (maxOffsetY > 0)
              setPositionY(
                Math.max(
                  -100,
                  Math.min(
                    100,
                    drag.positionY -
                      ((event.clientY - drag.startY) / maxOffsetY) * 100,
                  ),
                ),
              );
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
        >
          <img
            src={previewUrl}
            alt="Crop preview"
            draggable={false}
            onLoad={(event) =>
              setImageSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
            className="max-w-none"
            style={{
              width: renderedWidth,
              height: renderedHeight,
              transform: `translate(${-((renderedWidth - viewport) / 2 + translateX)}px, ${-((renderedHeight - viewport) / 2 + translateY)}px)`,
            }}
          />
        </div>
        <div className="mt-5 space-y-3 text-xs text-gray-600">
          <p className="text-center text-gray-500">
            Drag the photo to position it inside the circle.
          </p>
          <label className="block">
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="mt-1 w-full accent-forest-700"
            />
          </label>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border px-4 py-3 text-sm font-semibold text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void cropImage()}
            className="flex items-center justify-center gap-2 rounded-xl bg-forest-700 px-4 py-3 text-sm font-semibold text-white"
          >
            <Crop size={17} /> Use crop
          </button>
        </div>
      </div>
    </div>
  );
}
