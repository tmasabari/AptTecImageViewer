export class Downloader {
    constructor(url, chunkSize = 1024 * 1024, maxRetries = 3, retryDelay = 1000) {
        this.url = url;
        this.chunkSize = chunkSize;
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
    }
    getCompletedEvent(data) {
        return new CustomEvent('chunkCompleted', { bubbles: true }, data);
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
        let downloadedSize = 0;
        let retryCount = 0;

        while (downloadedSize < totalSize) {
            try {
                const response = await fetch(this.url, {
                    headers: {
                        Range: `bytes=${downloadedSize}-${downloadedSize + this.chunkSize - 1}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Chunk download failed with status code: ${response.status}`);
                }

                const { value, done } = await response.body.getReader().read();

                if (done) {
                    throw new Error('Unexpected end of chunk.');
                }

                downloadedSize += value.length;
                // Push the chunk into the array along with its starting byte position.
                chunks.push({ data: value, start: downloadedSize - value.length });

                // Calculate and dispatch the download progress.
                const progress = (downloadedSize / totalSize) * 100;
                window.dispatchEvent(this.getCompletedEvent({
                    downloadedSize,
                    totalSize,
                    progress,
                }));

                // You can update a progress bar or display the progress to the user here.
            } catch (error) {
                console.error('Chunk download error:', error);

                // Retry the chunk download if the maximum retry count is not exceeded.
                if (retryCount < this.maxRetries) {
                    retryCount++;
                    await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
                    console.log(`Retrying chunk download (Retry ${retryCount})...`);
                } else {
                    throw error; // Max retries reached, propagate the error.
                }
            }
        }

        // Sort the downloaded chunks by their start byte position.
        chunks.sort((a, b) => a.start - b.start);
        // Assemble the chunks in order to create the final blob.
        const blobData = new Uint8Array(totalSize);
        let currentIndex = 0; 
        for (const chunk of chunks) {
            blobData.set(chunk.data, currentIndex);
            currentIndex += chunk.data.length;
        } 
        const blob = new Blob([blobData]);
        return blob;
    }

    async downloadSimple() {
        let retryCount = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                const response = await fetch(this.url);
        
                if (!response.ok) {
                    throw new Error(`Simple download failed with status code: ${response.status}`);
                }
        
                const blob = await response.blob();
                return blob;
            } catch (error) {
                console.error('Simple download error:', error);

                // Retry the simple download if the maximum retry count is not exceeded.
                if (retryCount < this.maxRetries) {
                    retryCount++;
                    await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
                    console.log(`Retrying simple download (Retry ${retryCount})...`);
                } else {
                    throw error; // Max retries reached, propagate the error.
                }
            }
        }
    }
}