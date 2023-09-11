import UTIF from './UTIF.js';
import { Downloader } from './Downloader.js';
import { ImageOperations } from './ImageOperations.js';
import { PageNavigationToolbar } from './PageNavigationToolbar.js';
import { jsPDF } from 'jspdf';
// todo https://github.com/WangYuLue/image-conversion
//import * as imageConversion from 'image-conversion';

export class BaseViewer {
    #viewerSource ='';
    #source= null;
    #imageUri = null;
    #buffer = null;
    #dataUrl = null;
    #ifds = null;
    #fileFormat = null;
    #internalSource = null;

    // todo detect file type from array buffer https://www.npmjs.com/package/file-type
    // https://stackoverflow.com/questions/18299806/how-to-check-file-mime-type-with-javascript-before-upload
    constructor(viewerSource, source, fileFormat, imageContainerId, toolbarContainer, pageToolbarContainer,
        progressContainer) {
        if (!viewerSource) throw new Error('Mandatory argument \'viewerSource\' is missing');
        if (!source) throw new Error('Mandatory argument \'source\' is missing');
        if (!fileFormat) throw new Error('Mandatory argument \'fileFormat\' is missing');
        if (!imageContainerId) throw new Error('Mandatory argument \'imageContainerId\' is missing');

        this.#fileFormat = fileFormat;
        this.#viewerSource = viewerSource;
        this.#source = source;
        if (this.#viewerSource === window.AptTec.ViewerSources.ArrayBuffer) {
            this.#buffer = source;
            this.#internalSource = this.#viewerSource;
        }
        else if (this.#viewerSource === window.AptTec.ViewerSources.DataURL) {
            this.#dataUrl = source;
            this.#internalSource = this.#viewerSource;
        }
        this.page = null;
        this.imageContainerId = imageContainerId;
        this.toolbarContainer = toolbarContainer;
        this.pageToolbarContainer = pageToolbarContainer;
        this.progressContainer = progressContainer;

        this.zoomerDiv = document.querySelector('#' + imageContainerId);
        this.zoomerDiv.innerHTML = '';

        this.imageSelector = `#${this.imageContainerId} #viewerImage`;
        this.imageOperations = new ImageOperations(this.imageContainerId, this.toolbarContainer);
        this.navigationToolbar = null;
        this.progressSpinner = document.querySelector('.progress-spinner');

        // Add an event listener to handle the chunkCompleted event.
        document.addEventListener('chunkCompleted', (event) => {
            const { downloadedSize, totalSize, progress } = event.detail;
            const message = `Loading: ${downloadedSize} / ${totalSize} bytes (${progress.toFixed(2)}%)`;
            this.showMessage(message);
        });
    }
    showMessage(message) {
        console.log(message);
        this.messageControl = document.querySelector(this.progressContainer);
        this.messageControl.innerHTML = `${message}`;
        this.messageControl.style.display = 'flex';
    }
    
    async show(pageNumber =1) {
        this.showMessage('Loading...');
        try {
            //this.progressSpinner.style.display = 'block';
            if (this.#internalSource) 
                this.loadImage(pageNumber);

            //load the buffer ONLY if not already loaded
            if (this.#viewerSource === window.AptTec.ViewerSources.Url) {
                const chunkedDownloader = new Downloader(this.#source);
                const blob = await chunkedDownloader.download();
                this.loadfromBlob(blob, pageNumber);
            }
            else if (this.#viewerSource === window.AptTec.ViewerSources.Blob) {
                await this.loadfromBlob(this.#source, pageNumber);
            }
                
        } catch (error) {
            console.error(error);
        }

        this.messageControl.style.display = 'none';
        //this.progressSpinner.style.display = 'none';
    }
    
    async loadfromBlob(blob, pageNumber) {
        if (this.#fileFormat.includes('/tif')) {
            //containing TIFF or EXIF data. conver to to buffer
            await blob.arrayBuffer()
                .then(buffer => {
                    this.#internalSource = window.AptTec.ViewerSources.ArrayBuffer;
                    this.#buffer = buffer;
                    this.loadImage(pageNumber); //so load the image as the buffer is ready
                });
        } else { //directly convert blob to dataurl
            this.blobToDataURL(blob, (dataurl) => {
                this.#internalSource = window.AptTec.ViewerSources.DataURL;
                this.#dataUrl = dataurl;
                this.loadImage(pageNumber);
            });
        }
    }
    //**blob to dataURL**
    // https://stackoverflow.com/questions/23150333/html5-javascript-dataurl-to-blob-blob-to-dataurl
    blobToDataURL(blob, callback) {
        var a = new FileReader();
        a.onload = (e) => { callback(e.target.result); };
        a.readAsDataURL(blob);
    }

    //make sure the buffer is loaded before calling the loadImage
    loadImage(pageNumber) { 
        this.zoomerDiv.innerHTML = '<img id="viewerImage" alt="ViewerImage">';
        this.imageOperations.image = document.querySelector(this.imageSelector) ; 
        //delete old uri object
        if (this.#imageUri) URL.revokeObjectURL(this.#imageUri);

        if (this.#internalSource === window.AptTec.ViewerSources.DataURL) {
            this.#imageUri = this.#dataUrl;
            this.pageCount =1;
        } else {
            //containing TIFF or EXIF data
            this.#imageUri = this.#bufferToURI(this.#buffer, pageNumber);
        }

        if (!(this.navigationToolbar)) { // check the buffer is parsed for the first time
            // Create an instance of PageNavigationToolbar with this.pageCount pages
            this.navigationToolbar = new PageNavigationToolbar(this.pageCount, this.pageToolbarContainer,
                () => this.pagechanged()); // Subscribe to the page change event 
        }
        this.imageOperations.image.src = this.#imageUri;
    }

    pagechanged() {
        console.log(`Page changed to ${this.navigationToolbar.currentPage}`);
        // Implement your logic to update the content for the new page
        this.loadImage(this.navigationToolbar.currentPage);
    }

    exportToPDF() {
        if (!this.#internalSource) {
            alert('Please load the image first');
            return;
        }

        // https://stackoverflow.com/questions/37677750/pdf-file-size-too-big-created-using-jspdf
        // Default export is a4 paper, portrait, using millimeters for units
        const doc = new jsPDF({
            orientation: 'portrait',       // "portrait" or "landscape" shortcuts "p" or "l"
            unit: 'in',     //Possible values are "pt" (points), "mm", "cm", "in", "px", "pc", "em" or "ex".
            format: [this.page.widthInch, this.page.heightInch],
            putOnlyUsedFonts: true,
            compress: true
        });
        for (let pageIndex = 1; pageIndex <= this.pageCount; pageIndex++) {
            const uint8Array = this.#getPageImage(this.#buffer, pageIndex);
            // Creates an ImageData object from a given Uint8ClampedArray and the size of the image it contains.
            // https://developer.mozilla.org/en-US/docs/Web/API/ImageData
            // A Uint8ClampedArray representing a one-dimensional array containing the data in the RGBA order, with integer values between 0 and 255 (inclusive). The order goes by rows from the top-left pixel to the bottom-right.
            const imgd = new ImageData(new Uint8ClampedArray(uint8Array.buffer), this.page.width, this.page.height);
            doc.addImage(imgd, 'JPEG', 0, 0, this.page.widthInch, this.page.heightInch, undefined, 'MEDIUM');
            if (pageIndex < this.pageCount)
                doc.addPage();
        }
        //doc.save('exported image.pdf');
        doc.output('save', 'exported image.pdf');
    }

    #bufferToURI(buff, pageNumber) {
        const uint8Array = this.#getPageImage(buff, pageNumber);

        //returns Uint8Array of the image in RGBA format, 8 bits per channel 
        //(ready to use in context2d.putImageData() etc.)
        var cnv = document.createElement('canvas'); cnv.width = this.page.width; cnv.height = this.page.height;
        var ctx = cnv.getContext('2d');
        var imgd = new ImageData(new Uint8ClampedArray(uint8Array.buffer), this.page.width, this.page.height);
        ctx.putImageData(imgd, 0, 0);
        return cnv.toDataURL();
    }

    //taken from UTIF library and modified to select the page
    // returns Uint8Array of the image in RGBA format, 8 bits per channel 
    #getPageImage(buff, pageNumber) {
        const pageIndex = pageNumber-1;
        if (!(this.#ifds)) {
            this.#ifds = UTIF.decode(buff);  //this operation is required only once per document. not for each page.
            //returns an array of "IFDs" (image file directories). ?? Pages
            //Each IFD is an object, keys are "tXYZ" (XYZ is a TIFF tag number), values are values of these tags. 
            //You can get the the dimension (and other properties, "metadata") of the image without decompressing pixel data.
            this.pageCount = this.#ifds.length;
        }
        //the below commented lines taken from UTIF library but they are not inline with other viewer tools and it is not taking correct page information.
        // var vsns = this.#ifds, ma = 0, page = vsns[pageIndex]; 
        // if (this.#ifds[pageIndex].subIFD) vsns = vsns.concat(this.#ifds[pageIndex].subIFD);
        // for (var i = 0; i < vsns.length; i++)
        // {
        //     var img = vsns[i];
        //     if (img['t258'] == null || img['t258'].length < 3) continue;
        //     var ar = img['t256'] * img['t257'];
        //     if (ar > ma) { ma = ar; page = img; }
        // }
        this.page = this.#ifds[pageIndex];
        UTIF.decodeImage(buff, this.page, this.#ifds);
        //If there is an image inside the IFD, it is decoded and three new properties are added to the IFD:
        //width: the width of the image
        //height: the height of the image
        //data: decompressed pixel data of the image
        // https://www.loc.gov/preservation/digital/formats/content/tiff_tags.shtml
        // 296	0128	ResolutionUnit	The unit of measurement for XResolution and YResolution.
        //      RESUNIT_NONE = 1; RESUNIT_INCH = 2; RESUNIT_CENTIMETER = 3;
        // 282	011A	XResolution	The number of pixels per ResolutionUnit in the ImageWidth direction.
        // 283	011B	YResolution	The number of pixels per ResolutionUnit in the ImageLength direction.
        // 274	0112	Orientation	The orientation of the image with respect to the rows and columns.
        this.page.ResolutionUnit = this.page.t296[0];
        this.page.XResolution = this.page.t282[0][0];
        this.page.YResolution = this.page.t283[0][0];
        //this.page.Orientation = this.page.t274[0];
        this.page.widthInch = this.page.width / this.page.XResolution;
        this.page.heightInch = this.page.height / this.page.YResolution;
        const uint8Array = UTIF.toRGBA8(this.page);  // Uint8Array with RGBA pixels
        return uint8Array;
    }
}