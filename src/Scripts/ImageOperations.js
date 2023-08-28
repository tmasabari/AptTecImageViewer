'use strict'; 
import {Zoomer} from './zoomer.js';
export class ImageOperations {
        
    #image = null;
    #currentFit = 0;
    constructor(imageContainerId, toolbarSelector) {
        this.imageContainerId = imageContainerId;
        this.imageContainer = document.querySelector('#' + imageContainerId);

        //reset toolbar
        this.toolbar = document.querySelector(toolbarSelector);
        this.toolbar.innerText = '';

        //zoom handler
        this.zoomer = new Zoomer();

        //rotate buttons
        this.addButton('btn-secondary rotateLeft', 'fa-solid fa-rotate-left', '', () => this.rotateFix(270) );
        this.addButton('btn-secondary rotate180', 'fa-solid fa-arrows-rotate', '', () => this.rotateFix(180) );
        this.addButton('btn-secondary rotateRight', 'fa-solid fa-rotate-right', '', () => this.rotateFix(90) );

        //zoom buttons
        this.addButton('btn-secondary', 'fa-solid fa-maximize', '', 
            () => { this.fitBest(); this.zoomer.resetTransform(); } );
        this.addButton('btn-secondary', 'fa-solid fa-arrows-left-right', '', 
            () => { this.fitWidth(); this.zoomer.resetTransform(); });
        this.addButton('btn-secondary', '', '100%', 
            () => { this.originalSize(); this.zoomer.resetTransform(); });

        this.addButton('btn-secondary', 'fa-solid fa-magnifying-glass-plus', '',
            () => { this.zoomer.zoomOnly(true); });
        this.addButton('btn-secondary', 'fa-solid fa-magnifying-glass-minus', '',
            () => { this.zoomer.zoomOnly(false); });
        window.addEventListener('mousemove', (e) => this.zoomer.mousemoved(e) );
        window.addEventListener('mouseup', (e) => this.zoomer.mousereleased(e) );
    }

    get image() {
        return this.#image;
    }
    set image(image) {
        this.#image = image;
        switch (this.#currentFit) {
        case 1:
            this.fitWidth();
            break;
        case 2:
            this.originalSize();
            break;
    
        default:
            this.fitBest();
            break;
        }

        //this will reset the transformation as well
        this.zoomer.setImage(this.#image);
    }
    createButton(buttonClass, iconClass, label, onClick) {
        const button = document.createElement('button');
        if (buttonClass) {
            const classArray = buttonClass.split(' ');
            classArray.forEach(cssClass => {
                button.classList.add(cssClass);
            });
        }
        button.classList.add('btn', 'rotate-button');
        if (iconClass) button.innerHTML = `<i class="fas ${iconClass}"></i>`;
        button.innerHTML += ` ${label}`;
        button.addEventListener('click', onClick);
        return button;
    }
    addButton(buttonClass, iconClass, label, onClick) {
        const button = this.createButton(buttonClass, iconClass, label, onClick);
        this.toolbar.appendChild(button);
    }
    rotateFix(degree) {
        //this.topLeftImage();
        this.zoomer.rotate(degree, this.#currentFit);
    }

    fitBest(){
        this.#currentFit = 0;
        this.#image.style.width = 'auto';
        this.#image.style.height = 'auto';
        this.#image.style.maxWidth = '100%';
        this.#image.style.maxHeight = '100%';
        this.centerTheImage();
    }
    
    fitWidth() {
        this.#currentFit = 1;
        this.#image.style.width = '100%';
        this.#image.style.height = 'auto';
        this.#image.style.maxWidth = 'none';
        this.#image.style.maxHeight = 'none';
        this.topLeftImage();
    }

    originalSize(){
        this.#currentFit = 2;
        this.#image.style.width = 'auto';
        this.#image.style.height = 'auto';
        this.#image.style.maxWidth = 'none';
        this.#image.style.maxHeight = 'none';
        this.topLeftImage();
    }
    topLeftImage() {
        this.imageContainer.style.display = '';
        this.imageContainer.style.alignItems = '';
        this.imageContainer.style.justifyContent = ''; 
    }
    centerTheImage() {
        this.imageContainer.style.display = 'flex';
        this.imageContainer.style.alignItems = 'center';
        this.imageContainer.style.justifyContent = 'center'; 
    }

}