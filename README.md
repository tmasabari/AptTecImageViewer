# AptTec Image Viewer

1. The image data is loaded as array buffer.
2. The array buffer is parsed to identify the number of pages
3. If the number of pages > 1, show the page navigation tool bar.

   1. Go to the first page
   2. Go to the previous page
   3. Go to the next page
   4. Go to the last page
   5. The numeric text box
4. Extract the first page
5. The basic image operations tool bar contains

   1. Rotate left
   2. Rotate 180
   3. Rotate right
   4. Zoom fit width
   5. Zoom fit width/height
   6. Zoom 100%
   7. Zoom in
   8. Zoom out
6. The zoom and rotate options set for a particular page are kept same even after a user navigates to other pages. These options will be reset if user opens a different docuement.


## Design

1. Viewer class - the object is created once per each document
   1. Generates the new image tag whenever a user loads a new document or page
   2. Extracts the page image from the TIFF file and generates the URI using the canvas object
2. ImageOperations class
   1. The object is created Provides the functionality for the basic image operations tool bar
3. Zoomer class - the object gets recreated for each document/page change
   1. Provides the functionality for the zoom operations
   2. Applies the transformation at the image tag
4. PageNavigationToolbar class - the object is created once per each document
   1. constructor(numPages, toolbarSelector, gotoCallback)
   2. numPages - either show simple 1/1 message or tool bar
   3. toolbarSelector - div id to generate the page navigation tool bar
   4. gotoCallback - call back function to execute in case of any action by the user to change the page
