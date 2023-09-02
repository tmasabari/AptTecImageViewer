export function getViewerSources() {
    return {
        //supports both TIFF and browser formats
        Url: 'Url',
        Blob: 'Blob',
        ArrayBuffer: 'ArrayBuffer',
        //supports native browser file formats only. 
        //https://en.wikipedia.org/wiki/Comparison_of_web_browsers#Image_format_support
        //https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#tiff_tagged_image_file_format
        //JPEG, GIF, PNG, BMP, ICO, WebP, APNG, 2D Canvas, and SVG(partial)
        DataURL: 'DataURL'
    };
}