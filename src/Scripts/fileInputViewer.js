export class fileInputViewer {

    constructor(fileIputId, imageContainerId, imageToolbarContainer, 
        pageToolbarContainer, infoToolbarContainer) {
        this.fileIputId = fileIputId;
        this.imageContainerId = imageContainerId;
        this.imageToolbarContainer = imageToolbarContainer;
        this.pageToolbarContainer = pageToolbarContainer;
        this.infoToolbarContainer = infoToolbarContainer;

        this.imageToolbarControl = document.querySelector(this.imageToolbarContainer);
        this.pageToolbarControl = document.querySelector(this.pageToolbarContainer);
        this.infoToolbarControl = document.querySelector(this.infoToolbarContainer);
        this.infoToolbarControl.innerHTML =
            `<strong>Type: </strong><span class="img-type"></span>
                <strong> Size: </strong><span class="img-size"></span>`;
        this.selectedFileType = null; 

        const fileInputControl = document.getElementById(this.fileIputId);
        fileInputControl.addEventListener('change', (e) => this.#OnFileInputChanged(e) );
    }

    #OnFileInputChanged(event) {
        //let allowedFiles = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png', 'image/tif', 'image/tiff'];
        if (event.target.files.length > 0) {
            const selectedFile = event.target.files[0];

            this.selectedFileType = selectedFile.type;

            this.imageToolbarControl.style.display = 'inline-block';
            this.pageToolbarControl.style.display = 'inline-block';
            this.infoToolbarControl.style.display = 'inline-block';

            // document.querySelector(".img-name").innerText = selectedFile.name;
            document.querySelector(this.infoToolbarContainer + ' .img-type').innerText 
                = this.selectedFileType;
            document.querySelector(this.infoToolbarContainer + ' .img-size').innerText 
                = (selectedFile.size / 1024).toFixed(3) + ' KB';
            // Check if the browser can directly render the file type
            if (!this.selectedFileType.startsWith('image/')
                && !selectedFile.name.toLowerCase().includes('.tif')) {
                this.#showError('Please select a picture file format');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => this.#OnReaderLoaded(e);
            if (this.selectedFileType.includes('/tif')
                || selectedFile.name.toLowerCase().includes('.tif')) {
                this.isTiff = true;
                reader.readAsArrayBuffer(selectedFile);
            } else {
                // CONVERTS FILE TO BASE 64
                this.isTiff = false;
                reader.readAsDataURL(selectedFile);
            }
        } else {
            this.#showError('Please select a picture file format');
        }
    }
    
    #OnReaderLoaded(e) {
        var dataType = null, fileData = null;
        if (this.isTiff) {
            dataType = window.AptTec.ViewerSources.ArrayBuffer;
            fileData = new Uint8Array(e.target.result);
        } else {
            dataType = window.AptTec.ViewerSources.DataURL;
            fileData = e.target.result;
        }
        const tiffViewer = new window.AptTec.Viewer(dataType,
            fileData, this.selectedFileType, 
            this.imageContainerId, this.imageToolbarContainer, this.pageToolbarContainer);

        (async function () { await tiffViewer.show(); })();

    }

    #showError(message) {
        this.errorMessageControl = document.getElementById(this.imageContainerId);
        this.errorMessageControl.innerHTML = `<h1>${message}</h1>`;

        this.imageToolbarControl.style.display = 'none';
        this.pageToolbarControl.style.display = 'none';
        this.infoToolbarControl.style.display = 'none';
    }

}