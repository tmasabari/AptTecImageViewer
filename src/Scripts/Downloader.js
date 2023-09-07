export class Downloader {
    constructor(url, chunkSize = 1024 * 1024, maxRetries = 3, retryDelay = 1000) {
        this.url = url;
        this.chunkSize = chunkSize;
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
        this.chunkCompleted = new Event('chunkCompleted');
    }

    async download() {
        try {
            // Check if the server supports byte-range requests and get file length.
            const { supportsChunked, fileLength } = await this.checkChunkedSupport();

            if (supportsChunked && fileLength >= this.chunkSize) {
                // If the server supports chunked responses and file length is sufficient, use chunked download.
                const blob = await this.downloadChunked(fileLength);
                console.log('Chunked download completed.');
                return blob;
            } else {
                // If not, use a simple download method.
                const blob = await this.downloadSimple(fileLength);
                console.log('Simple download completed.');
                return blob;
            }
        } catch (error) {
            console.error('An error occurred:', error);
            throw error;
        }
    }

    async checkChunkedSupport() {
        try {
            const response = await fetch(this.url, { method: 'HEAD' });
            const acceptRanges = response.headers.get('accept-ranges');
            const contentLength = parseInt(response.headers.get('content-length'));

            return {
                supportsChunked: acceptRanges === 'bytes',
                fileLength: contentLength,
            };
        } catch (error) {
            console.error('Error checking chunked support:', error);
            return {
                supportsChunked: false,
                fileLength: 0,
            };
        }
    }

    async downloadChunked(fileLength) {
        const totalSize = fileLength;
        const chunks = [];
        let startByte = 0;
        var downloadedSize=0;
        const promises = [];

        while (startByte < totalSize) {
            const endByte = Math.min(startByte + this.chunkSize - 1, totalSize - 1);
            const closureBlock = () => { //create a closure funciton to maintain the start and end variables
                const start = startByte, end = endByte;
                const promise = this.downloadChunk(start, end)
                    .then((chunk) => {
                        chunks.push({ start, chunk });

                        // Calculate and dispatch the download progress.
                        downloadedSize += end - start  + 1;
                        const progress = (downloadedSize / totalSize) * 100;
                        this.chunkCompleted.detail = {
                            downloadedSize,
                            totalSize,
                            progress,
                        };
                        document.dispatchEvent(this.chunkCompleted);

                        // You can update a progress bar or display the progress to the user here.
                    })
                    .catch((error) => {
                        // Handle download error, including retries.
                        return this.handleDownloadError(error, start, end);
                    });
                promises.push(promise);
            };
            closureBlock();
            startByte = endByte + 1;
        }

        // Wait for all chunk promises to complete.
        await Promise.all(promises);

        // Sort the chunks by their startByte to ensure they are in the correct order.
        chunks.sort((a, b) => a.start - b.start);

        // Concatenate the chunks in order to create the final Blob.
        const blob = new Blob(chunks.map((chunkData) => chunkData.chunk));
        return blob;
    }

    async downloadChunk(startByte, endByte, isSimple = false) {
        const response = isSimple 
            ? await fetch(this.url) 
            :  await fetch(this.url, {
                headers: { Range: `bytes=${startByte}-${endByte}` },
            });

        if (!response.ok) {
            throw new Error(`Chunk download failed with status code: ${response.status}`);
        }
        // const body = await response.body;
        // const readResult = await body.getReader().read();
        // const { value, done } = readResult;

        // if (done) {
        //     throw new Error('Unexpected end of chunk.');
        // }

        const value = await response.arrayBuffer();
        return value;
    }

    async downloadSimple(fileLength) {
        const totalSize = fileLength;
        const buffer = await this.downloadChunk(0, totalSize - 1, true);
        return new Blob([buffer] );
    }

    async handleDownloadError(error, startByte, endByte) {
        console.error('Chunk download error:', error);

        if (this.maxRetries > 0) {
            // Retry the chunk download with exponential backoff.
            await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
            console.log('Retrying chunk download...');
            this.maxRetries--;
            return this.handleDownloadError(
                await this.downloadChunk(startByte, endByte), startByte, endByte );
        } else {
            throw error; // Max retries reached, propagate the error.
        }
    }
}