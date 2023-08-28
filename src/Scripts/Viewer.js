'use strict'; 
import UTIF from './UTIF.js';
import { ImageOperations } from './ImageOperations.js';
import { PageNavigationToolbar } from './PageNavigationToolbar.js';
import '../css/viewer.css';

window.AptTec = window.AptTec || {};

//https://www.scaler.com/topics/enum-in-javascript/
window.AptTec.ViewerSources = Object.freeze({
    Url: 'Url',
    Blob: 'Blob',
    ArrayBuffer: 'ArrayBuffer'
});

window.AptTec.Viewer = class TiffViewer {

    #type ='';
    #source= null;
    #imageUri = null;
    #buffer = null;
    #ifds = null;

    constructor(type, source, imageContainerId, toolbarContainer, pageToolbarContainer) {
        if (!type) throw new Error('Mandatory property \'type\' is missing');
        if (!source) throw new Error('Mandatory property \'source\' is missing');
        if (!imageContainerId) throw new Error('Mandatory property \'imageContainerId\' is missing');

        this.#type = type;
        if (this.#type === window.AptTec.ViewerSources.ArrayBuffer) {
            this.#buffer = source;
        }
        else {
            this.#source = source;
        }
        this.imageContainerId = imageContainerId;
        this.toolbarContainer = toolbarContainer;
        this.pageToolbarContainer = pageToolbarContainer;

        this.imageSelector = `#${this.imageContainerId} #tiffImage`;
        this.imageOperations = new ImageOperations(this.imageContainerId, this.toolbarContainer);
        this.navigationToolbar = null;
    }
    
    async show(pageIndex=1) {
        if (this.#buffer) this.loadImage(pageIndex);

        //load the buffer if not already loaded
        if (this.#type === window.AptTec.ViewerSources.Url) {
            await fetch(this.#source)
                .then((response) => response.arrayBuffer())
                .then((buffer) => {  //containing TIFF or EXIF data
                    this.#buffer= buffer;
                    this.loadImage(pageIndex); //so the image once the buffer is ready
                });
        }
    }
    //make sure the buffer is loaded before calling the loadImage
    loadImage(pageIndex) { 
        const zoomerDiv =  document.getElementById(this.imageContainerId);
        zoomerDiv.innerHTML = ''; //clear the dom
        zoomerDiv.innerHTML = '<img id="tiffImage" alt="ViewerImage">';
        this.imageOperations.image = document.querySelector(this.imageSelector) ; 
        //delete old uri object
        if (this.#imageUri) URL.revokeObjectURL(this.#imageUri);
        //containing TIFF or EXIF data
        this.#imageUri = this.#bufferToURI(this.#buffer, pageIndex);
        this.imageOperations.image.src = this.#imageUri;

    }

    pagechanged() {
        console.log(`Page changed to ${this.navigationToolbar.currentPage}`);
        // Implement your logic to update the content for the new page
        this.loadImage(this.navigationToolbar.currentPage);
    }

    //taken from UTIF library and modified to select the page
    #bufferToURI(buff, pageNumber) {
        const pageIndex = pageNumber-1;

        if(!(this.navigationToolbar)) { // check the buffer is parsed for the first time

            this.#ifds = UTIF.decode(buff);  //this operation is required only once per document. not for each page.
            //returns an array of "IFDs" (image file directories). ?? Pages
            //Each IFD is an object, keys are "tXYZ" (XYZ is a TIFF tag number), values are values of these tags. 
            //You can get the the dimension (and other properties, "metadata") of the image without decompressing pixel data.
            this.pageCount = this.#ifds.length;

            // Create an instance of PageNavigationToolbar with this.pageCount pages 
            // eslint-disable-next-line no-unused-vars
            this.navigationToolbar = new PageNavigationToolbar(this.pageCount, this.pageToolbarContainer,
                () => this.pagechanged());
            // Subscribe to the page change event 
        }

        var vsns = this.#ifds, ma = 0, page = vsns[pageIndex]; 
        if (this.#ifds[pageIndex].subIFD) vsns = vsns.concat(this.#ifds[pageIndex].subIFD);
        for (var i = 0; i < vsns.length; i++)
        {
            var img = vsns[i];
            if (img['t258'] == null || img['t258'].length < 3) continue;
            var ar = img['t256'] * img['t257'];
            if (ar > ma) { ma = ar; page = img; }
        }
        UTIF.decodeImage(buff, page, this.#ifds);
        //If there is an image inside the IFD, it is decoded and three new properties are added to the IFD:
        //width: the width of the image
        //height: the height of the image
        //data: decompressed pixel data of the image
        var w = page.width, h = page.height;
        const rgba = UTIF.toRGBA8(page);  // Uint8Array with RGBA pixels
        //returns Uint8Array of the image in RGBA format, 8 bits per channel 
        //(ready to use in context2d.putImageData() etc.)
        var cnv = document.createElement('canvas'); cnv.width = w; cnv.height = h;
        var ctx = cnv.getContext('2d');
        var imgd = new ImageData(new Uint8ClampedArray(rgba.buffer), w, h);
        ctx.putImageData(imgd, 0, 0);
        return cnv.toDataURL();
    }
};