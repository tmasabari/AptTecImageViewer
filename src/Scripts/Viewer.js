'use strict'; 
import { BaseViewer } from './BaseViewer.js';
import { fileInputViewer } from './fileInputViewer.js';
import '../css/viewer.css';

window.AptTec = window.AptTec || {};

//https://www.scaler.com/topics/enum-in-javascript/
window.AptTec.ViewerSources = Object.freeze({
    //supports both TIFF and browser formats
    Url: 'Url',
    Blob: 'Blob',
    ArrayBuffer: 'ArrayBuffer',
    //supports native browser file formats only. 
    //https://en.wikipedia.org/wiki/Comparison_of_web_browsers#Image_format_support
    //https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#tiff_tagged_image_file_format
    //JPEG, GIF, PNG, BMP, ICO, WebP, APNG, 2D Canvas, and SVG(partial)
    DataURL: 'DataURL'
});

window.AptTec.Viewer = BaseViewer;
window.AptTec.FileInputViewer = fileInputViewer;