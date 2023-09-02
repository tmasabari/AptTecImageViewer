'use strict';
import { getViewerSources } from './enums.js';
import { BaseViewer } from './BaseViewer.js';
import { fileInputViewer } from './fileInputViewer.js';
import '../css/viewer.css';

window.AptTec = window.AptTec || {};

//https://www.scaler.com/topics/enum-in-javascript/
window.AptTec.ViewerSources = Object.freeze(getViewerSources());

window.AptTec.Viewer = BaseViewer;
window.AptTec.FileInputViewer = fileInputViewer;