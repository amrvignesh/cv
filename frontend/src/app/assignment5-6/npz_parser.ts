import JSZip from 'jszip';

// Define cv type as any since it's loaded from script
// Helper to get cv from window
function getCv() {
    return (window as any).cv;
}

export class NPZParser {
    data: any = null;

    async parseNPZ(arrayBuffer: ArrayBuffer) {
        try {
            const zip = await JSZip.loadAsync(arrayBuffer);
            const result: any = {};

            for (const filename in zip.files) {
                if (filename.endsWith('.npy')) {
                    const file = zip.files[filename];
                    const buffer = await file.async('arraybuffer');
                    const arrayName = filename.replace('.npy', '');
                    result[arrayName] = this.parseNPY(buffer);
                }
            }
            return result;
        } catch (error) {
            console.error('Error parsing NPZ file:', error);
            throw error;
        }
    }

    parseNPY(arrayBuffer: ArrayBuffer) {
        const view = new DataView(arrayBuffer);
        const uint8View = new Uint8Array(arrayBuffer);
        let offset = 6;

        // Check magic
        if (uint8View[0] !== 0x93 || uint8View[1] !== 0x4E) {
            console.warn('Magic number mismatch');
        }

        const version = view.getUint8(offset);
        offset += 1;
        offset += 1; // minor version

        let headerLength;
        if (version === 1) {
            headerLength = view.getUint16(offset, true);
            offset += 2;
        } else {
            headerLength = view.getUint32(offset, true);
            offset += 4;
        }

        const headerBytes = uint8View.slice(offset, offset + headerLength);
        let headerStr = new TextDecoder().decode(headerBytes);
        headerStr = headerStr.trim();

        // Find actual end of header dict
        const lastBrace = headerStr.lastIndexOf('}');
        if (lastBrace !== -1) {
            headerStr = headerStr.substring(0, lastBrace + 1);
        }

        const header = this.parseHeader(headerStr);
        offset += headerLength;

        // Align offset
        if (offset % 64 !== 0) {
            // NPY format specifies padding but usually we just read from offset
            // However, some implementations might align data. 
            // The original JS parser didn't align explicitly beyond headerLength.
            // We'll trust offset + headerLength points to data.
        }

        const data = new Uint8Array(arrayBuffer, offset);
        const typedArray = this.convertToTypedArray(data, header.descr, header.shape);

        return {
            data: typedArray,
            shape: header.shape,
            dtype: header.descr,
            fortran_order: header.fortran_order
        };
    }

    parseHeader(headerStr: string) {
        const header: any = {};

        // Shape
        let shapeMatch = headerStr.match(/shape\s*:\s*\(([^)]+)\)/);
        if (!shapeMatch) shapeMatch = headerStr.match(/shape\s*:\s*([^\s,}]+(?:,\s*[^\s,}]+)*)/);

        if (shapeMatch) {
            header.shape = shapeMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        } else {
            header.shape = [];
        }

        // Dtype
        let dtypeMatch = headerStr.match(/'descr'\s*:\s*'([^']+)'/);
        if (!dtypeMatch) dtypeMatch = headerStr.match(/"descr"\s*:\s*"([^"]+)"/);
        if (!dtypeMatch) dtypeMatch = headerStr.match(/descr\s*:\s*['"]([^'"]+)['"]/);

        if (dtypeMatch) {
            header.descr = dtypeMatch[1];
            if (header.descr[0] === '|') header.descr = '<' + header.descr.slice(1);
        } else {
            header.descr = '<f4';
        }

        // Fortran order
        header.fortran_order = headerStr.includes("fortran_order': True") || headerStr.includes('fortran_order": True');

        return header;
    }

    convertToTypedArray(data: Uint8Array, dtype: string, shape: number[]) {
        const totalElements = shape.reduce((a, b) => a * b, 1);
        let bytes = 1;
        let typeChar = dtype[1] || 'u';
        if (dtype.length > 2) bytes = parseInt(dtype.slice(2));

        let TypedArray: any = Uint8Array;
        if (typeChar === 'f') TypedArray = bytes === 8 ? Float64Array : Float32Array;
        else if (typeChar === 'i') TypedArray = bytes === 1 ? Int8Array : (bytes === 2 ? Int16Array : Int32Array);
        else if (typeChar === 'u') TypedArray = bytes === 1 ? Uint8Array : (bytes === 2 ? Uint16Array : Uint32Array);

        const expectedBytes = totalElements * bytes;
        const bytesToRead = Math.min(expectedBytes, data.byteLength);

        // Create a copy of the buffer slice to ensure alignment
        const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + bytesToRead);
        return new TypedArray(buffer);
    }

    numpyToMat(npArray: any) {
        const cv = getCv();
        const shape = npArray.shape;
        if (shape.length === 2) {
            const rows = shape[0];
            const cols = shape[1];
            const mat = new cv.Mat(rows, cols, cv.CV_8UC1);
            const data = npArray.data;
            for (let i = 0; i < rows * cols; i++) {
                mat.data[i] = data[i] > 0 ? 255 : 0;
            }
            return mat;
        } else if (shape.length === 3) {
            const numMasks = shape[0];
            const rows = shape[1];
            const cols = shape[2];
            const masks = [];
            const data = npArray.data;
            for (let n = 0; n < numMasks; n++) {
                const mat = new cv.Mat(rows, cols, cv.CV_8UC1);
                const offset = n * rows * cols;
                for (let i = 0; i < rows * cols; i++) {
                    mat.data[i] = data[offset + i] > 0 ? 255 : 0;
                }
                masks.push(mat);
            }
            return masks;
        }
        throw new Error('Unsupported array shape');
    }
}
