const he = require("he");
const striptags = require("striptags");
const path = require("path");
const EleventyFetch = require("@11ty/eleventy-fetch");
const {writeFile, rm} = require("fs/promises");
const {createCanvas, loadImage} = require("canvas");
const {writeFileSync} = require("fs");

function extractExcerpt(content) {
    // Remove HTML headings
    content = String(content).replace(/^(\<h{1,6})(.*?)$/gim, '');
    // Strip HTML tags and decode HTML entities.
    content = he.decode(striptags(content));
    // Remove Markdown headings
    content = String(content).replace(/^(#{1,6})(.*?)$/gim, '');
    // Strip excess whitespace
    content = content.replace(/\s+/g, ' ');
    // Truncate content and add ellipsis.
    return content.slice(0, 200).trim() + '…';
}

function slugify(str) {
    return String(str)
        .normalize('NFKD') // split accented characters into their base characters and diacritical marks
        .replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
        .trim() // trim leading or trailing whitespace
        .toLowerCase() // convert to lowercase
        .replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-'); // remove consecutive hyphens
}

async function downloadFile(remoteUrl, saveFilePrefix) {
    try {
        const extUrl = new URL(remoteUrl);
        const saveFile = `${saveFilePrefix}${path.extname(extUrl.pathname)}`;
        const file = await EleventyFetch(
            remoteUrl,
            {
                directory: ".cache",
                duration: "8w",
                type: "buffer"
            }
        );
        await writeFile(saveFile, file, (err) => {
            err && console.error(err);
        });
        return saveFile;
    } catch (error) {
        console.error(error);
        return false;
    }
}

// Function to fill wrapped text
function fillWrappedText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let textHeight = 0;

    // Calculate text height
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            line = words[n] + ' ';
            textHeight += lineHeight;
        } else {
            line = testLine;
        }
    }
    textHeight += lineHeight;

    // Adjust Y to start text vertically centered
    let newY = y - textHeight / 2 + lineHeight / 2;

    // Write text
    line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, newY);
            line = words[n] + ' ';
            newY += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, newY);
}

async function createPostThumbnail(sourceThumbnailFile, title) {
    try {
        const thumbnailFile = sourceThumbnailFile.replace(path.extname(sourceThumbnailFile), '.png');
        const width = 600; // Width of the final image
        const height = 300; // Height of the final image
        const lineHeight = 40; // Line height for wrapped text
        const canvas = createCanvas(width, height);
        const context = canvas.getContext('2d');

        // Set the background color
        context.fillStyle = '#00a8ff';
        context.fillRect(0, 0, width, height);

        // Set the style for the text
        context.fillStyle = '#fff';
        context.font = 'bold 28px Montserrat';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Add wrapped text on the left half
        fillWrappedText(context, title, width / 4, height / 2, (width / 2) - 25, lineHeight);

        // Load an image and draw it on the right half
        loadImage(sourceThumbnailFile).then(image => {
            context.drawImage(image, width / 2, 0, width / 2, height);

            // Save the canvas as an image
            const buffer = canvas.toBuffer('image/png');
            writeFileSync(thumbnailFile, buffer);
        });

        // Cleanup source thumbnail if not overwritten
        if (sourceThumbnailFile !== thumbnailFile) {
            rm(sourceThumbnailFile);
        }

        return thumbnailFile;
    } catch (error) {
        console.error(error);
        return false;
    }
}

module.exports = {
    extractExcerpt,
    slugify,
    downloadFile,
    createPostThumbnail,
}