/**
 * Image processing utilities for LogoBook assets.
 */

/**
 * Removes solid or near-white artboard background from a canvas by flood-filling (BFS) from outer borders.
 * This preserves internal white artwork inside the logo (e.g. badges, teeth, text fills)
 * while making the rectangular artboard/canvas background completely transparent.
 */
export function removeCanvasWhiteBackground(canvas: HTMLCanvasElement): void {
  try {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    if (width <= 0 || height <= 0) return;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Helper: is pixel near white (threshold 235 across R, G, B with non-zero alpha)
    const isNearWhite = (dIdx: number) => {
      const a = data[dIdx + 3];
      if (a < 15) return false; // already transparent
      const r = data[dIdx];
      const g = data[dIdx + 1];
      const b = data[dIdx + 2];
      return r >= 235 && g >= 235 && b >= 235;
    };

    // Inspect the 4 corners: if fewer than 2 corners are white, do not strip (e.g. dark logo or non-white artboard)
    const cornerIndices = [
      0,
      (width - 1) * 4,
      ((height - 1) * width) * 4,
      (((height - 1) * width) + (width - 1)) * 4,
    ];

    const whiteCornersCount = cornerIndices.filter(isNearWhite).length;
    if (whiteCornersCount < 2) return;

    // Flood fill (BFS) starting from all 4 borders
    const totalPixels = width * height;
    const visited = new Uint8Array(totalPixels);
    const queue = new Int32Array(totalPixels);
    let qStart = 0;
    let qEnd = 0;

    const tryPush = (x: number, y: number) => {
      const pIdx = y * width + x;
      if (visited[pIdx]) return;
      visited[pIdx] = 1;
      const dIdx = pIdx * 4;
      if (isNearWhite(dIdx)) {
        queue[qEnd++] = pIdx;
      }
    };

    // Push border pixels
    for (let x = 0; x < width; x++) {
      tryPush(x, 0);
      tryPush(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      tryPush(0, y);
      tryPush(width - 1, y);
    }

    while (qStart < qEnd) {
      const pIdx = queue[qStart++];
      const x = pIdx % width;
      const y = (pIdx / width) | 0;
      const dIdx = pIdx * 4;

      // Set alpha to 0 for connected white background pixel
      data[dIdx + 3] = 0;

      if (x > 0) tryPush(x - 1, y);
      if (x < width - 1) tryPush(x + 1, y);
      if (y > 0) tryPush(x, y - 1);
      if (y < height - 1) tryPush(x, y + 1);
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    console.warn("White background removal skipped:", err);
  }
}
