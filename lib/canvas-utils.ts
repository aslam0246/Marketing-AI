
/**
 * Creates an Image element from a source URL.
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous"); // Needed to avoid CORS issues on CodeSandbox/External URLs
        image.src = url;
    });

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function getRotatedSize(width: number, height: number, rotation: number) {
    const rotRad = (rotation * Math.PI) / 180;
    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

/**
 * This function handles the actual cropping logic using an off-screen canvas.
 */
export default async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    rotation = 0,
    flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return null;
    }

    const rotRad = (rotation * Math.PI) / 180;

    // Calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = getRotatedSize(
        image.width,
        image.height,
        rotation
    );

    // Set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // Translation to center for rotation
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    // Draw the image onto the canvas
    ctx.drawImage(image, 0, 0);

    // Get the data from the cropped area
    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
    );

    // Resize canvas to the final crop size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Paste the cropped data into the resized canvas
    ctx.putImageData(data, 0, 0);

    // Return as Blob
    return new Promise((resolve) => {
        canvas.toBlob((file) => {
            resolve(file);
        }, "image/jpeg", 0.95);
    });
}

/**
 * Adds text overlay to an image blob
 */
export async function addTextOverlay(
    imageBlob: Blob,
    text: string,
    options: {
        color: string;
        position: "top" | "center" | "bottom";
        fontSize: number; // relative scale 1-5
    }
): Promise<Blob | null> {
    const imageUrl = URL.createObjectURL(imageBlob);
    const image = await createImage(imageUrl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = image.width;
    canvas.height = image.height;

    // Draw base image
    ctx.drawImage(image, 0, 0);

    if (text) {
        const baseSize = Math.max(canvas.width, canvas.height) * 0.05; // Base 5% of image size
        const fontSize = baseSize * options.fontSize;

        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = options.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Shadow/Outline for readability
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        ctx.lineWidth = fontSize * 0.05;
        ctx.strokeStyle = "rgba(0,0,0,0.5)";

        const x = canvas.width / 2;
        let y = canvas.height / 2;

        if (options.position === "top") y = canvas.height * 0.15;
        if (options.position === "bottom") y = canvas.height * 0.85;

        // Draw Text
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
    }

    return new Promise((resolve) => {
        canvas.toBlob((file) => {
            resolve(file);
        }, "image/jpeg", 0.95);
    });
}
