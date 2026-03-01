export interface PixelCrop {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Cria uma imagem a partir de uma URL (suporta blob: e base64).
 */
function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', (err) => reject(err));
        img.setAttribute('crossOrigin', 'anonymous');
        img.src = url;
    });
}

/**
 * Converte graus para radianos.
 */
function getRadianAngle(degreeValue: number) {
    return (degreeValue * Math.PI) / 180;
}

/**
 * Retorna a dimensão correta de uma imagem rotacionada.
 */
function rotateSize(width: number, height: number, rotation: number) {
    const rotRad = getRadianAngle(rotation);
    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

/**
 * Gera a imagem recortada como um Blob JPEG.
 * @param imageSrc URL da imagem original (blob: URL)
 * @param pixelCrop Área a ser recortada em pixels
 * @param rotation Rotação em graus (padrão: 0)
 * @param outputSize Tamanho final da imagem (padrão: 512x512)
 * @returns Blob da imagem recortada
 */
export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: PixelCrop,
    rotation = 0,
    outputSize = 512,
): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Não foi possível criar contexto do canvas');

    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

    // Configurar canvas para a bounding box da rotação
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // Transladar para o centro e rotacionar
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.naturalWidth / 2, -image.naturalHeight / 2);

    // Desenhar imagem
    ctx.drawImage(image, 0, 0);

    // Extrair a área recortada para um novo canvas
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');

    if (!croppedCtx) throw new Error('Não foi possível criar contexto do canvas recortado');

    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    croppedCtx.drawImage(
        canvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
    );

    // Redimensionar para o tamanho de saída
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const outputCtx = outputCanvas.getContext('2d');

    if (!outputCtx) throw new Error('Não foi possível criar contexto do canvas de saída');

    outputCtx.drawImage(croppedCanvas, 0, 0, outputSize, outputSize);

    return new Promise((resolve, reject) => {
        outputCanvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Falha ao gerar blob da imagem'));
            },
            'image/jpeg',
            0.92,
        );
    });
}
