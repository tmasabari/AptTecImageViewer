
'use strict'; 
// https://dev.to/stackfindover/zoom-image-point-with-mouse-wheel-11n3
export class Zoomer {

    #image = null;
    #pointX = 0;
    #pointY = 0;
    #isDragging = false;
    #dragStartCoords = null;
    #imageProperties = {
        currentRotation: 0,
        currentScale: 1
    };

    constructor() {
    }

    resetTransform() {
        this.#image.style.transform = `translate(0px, 0px) 
            scale(1) rotate(${this.#imageProperties.currentRotation}deg)`; //${this.#imageProperties.currentScale}
        this.#pointX = 0;
        this.#pointY = 0;
        this.#imageProperties.currentScale = 1;
    }

    applyTransform() {
        this.#image.style.transform = `translate(${this.#pointX}px, ${this.#pointY}px) 
            scale(${this.#imageProperties.currentScale}) rotate(${this.#imageProperties.currentRotation}deg)`;
    }

    rotate(degrees) {
        this.#imageProperties.currentRotation = (this.#imageProperties.currentRotation + degrees) % 360;
        this.applyTransform();
    }

    zoomOnly(isIn, isTransform=true) {
        isIn ? (this.#imageProperties.currentScale *= 1.2) : (this.#imageProperties.currentScale /= 1.2);
        // Restrict scale to 8 times maximum or minimum of original size
        //the image size depends up on the fit method type. so do not put restriction 
        //this.#imageProperties.currentScale = Math.min(Math.max(0.25, this.#imageProperties.currentScale), 8);
        if (isTransform) this.applyTransform();
    }

    setImage(image) {
        this.#image = image;
        this.#isDragging = false;
        this.#dragStartCoords = null; 
        this.#image.onmousedown = (e) => { this.mousedown(e); };
        this.#image.onwheel = (e) => { this.onwheel(e); };
        this.#image.ondblclick = () => { this.zoomOnly(true); };

        this.applyTransform(); //reply the transformations
    }
    mousedown(event) {
        event.preventDefault(); 
        this.#isDragging = true;
        this.#dragStartCoords = { x: event.clientX - this.#pointX, y: event.clientY - this.#pointY };
        this.#image.style.cursor = 'grabbing';
    }

    mousemoved(event) {
        if (!this.#isDragging) return;
        if (event.buttons === 0) { //mouse moved without buttons
            this.#isDragging = false;
            return;
        }
        this.#pointX = event.clientX - this.#dragStartCoords.x;
        this.#pointY = event.clientY - this.#dragStartCoords.y;
        this.applyTransform();
    }

    mousereleased() {
        if (!this.#isDragging) return;

        this.#isDragging = false;
        this.#image.style.cursor = 'grab';
    }

    onwheel(e) {
        e.preventDefault(); 

        // var xs = (e.clientX - pointX) / scale,
        //     ys = (e.clientY - pointY) / scale,
        //     delta = (e.wheelDelta ? e.wheelDelta : -e.deltaY);
        // (delta > 0) ? (scale *= 1.2) : (scale /= 1.2);
        // pointX = e.clientX - xs * scale;
        // pointY = e.clientY - ys * scale;


        const delta = (e.wheelDelta ? e.wheelDelta : -e.deltaY);
        this.zoomReposition(e.clientX, e.clientY, (delta > 0));
    }

    zoomReposition(mouseX, mouseY, isIn) {
        const xs = (mouseX - this.#pointX) / this.#imageProperties.currentScale,
            ys = (mouseY - this.#pointY) / this.#imageProperties.currentScale;

        this.zoomOnly(isIn, false); //calculate the new scale
        //adjust the x and y based on the new scale.
        this.#pointX = mouseX - xs * this.#imageProperties.currentScale;
        this.#pointY = mouseY - ys * this.#imageProperties.currentScale;

        this.applyTransform(); 
    }
}