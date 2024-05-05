require("dotenv").config();
const path = require("path");
const { writeFileSync } = require('fs');
const { rm, writeFile, mkdir } = require("fs/promises");
const { createCanvas, loadImage } = require('canvas');
const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require('notion-to-md');
const EleventyFetch = require("@11ty/eleventy-fetch");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const notion = new Client({
    auth: NOTION_TOKEN,
});
const n2m = new NotionToMarkdown({
    notionClient: notion
});
n2m.setCustomTransformer('image', async block => {
    const postImagesBaseFolder = `src/images/posts`;
    const { caption } = block.image;
    const imageCaption = caption.map(i => i.plain_text).join('');
    let imageUrl = block.image?.file?.url || block.image?.external?.url;
    if (imageUrl) {
        let imageName = slugify(imageCaption);
        if (imageName == '') {
            imageName = block.id;
        }
        imageUrl = await downloadFile(imageUrl, `${postImagesBaseFolder}/${block.parent.page_id.substring(0, block.parent.page_id.indexOf('-'))}-${imageName}`);
    }
    return `![${imageCaption}](${imageUrl.replace('src/', '/')})`;
});
/*n2m.setCustomTransformer('code', async block => {
    let { language } = block.code;
    const filename = block.code.caption ? block.code.caption[0]?.plain_text : '';
    const code = block.code.rich_text[0]?.plain_text.trim();
    if (language === "plain text") {
        language = "text";
    }

    return `${filename ? `${filename}\n` : ''}\`\`\`${language}
${code}
\`\`\``;
});*/

async function getPostsFromNotion() {
    try {
        let today = new Date();
        let currentDate = today.getFullYear() + "-" + (today.getMonth() + 1).toString().padStart(2, "0") + "-" + today.getDate().toString().padStart(2, "0");
        let response = await notion.databases.query({
            database_id: NOTION_DATABASE_ID,
            filter: {
                and: [
                    {
                        property: 'Status',
                        status: {
                            equals: 'Live'
                        }
                    },
                    {
                        property: 'Title',
                        title: {
                            is_not_empty: true
                        }
                    },
                    {
                        property: 'Publish date',
                        date: {
                            is_not_empty: true
                        }
                    },
                    {
                        property: 'Publish date',
                        date: {
                            on_or_before: currentDate
                        }
                    },
                    {
                        property: 'Tags',
                        multi_select: {
                            is_not_empty: true
                        }
                    }
                ]
            },
            sorts: [
                {
                    timestamp: "last_edited_time",
                    direction: "descending"
                }
            ],
            page_size: 100
        });
        //console.log(JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error(error);
    }
}

async function getPostContentFromNotion(id) {
    try {
        const mdblocks = await n2m.pageToMarkdown(id);
        const mdstring = n2m.toMarkdownString(mdblocks);
        let mdcontent = '';
        for (const property in mdstring) {
            mdcontent += `${mdstring[property]}`;
        }
        return mdcontent.replace(/^#/img, '##');
    } catch (error) {
        console.error(error);
    }
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

async function run() {
    const postsBaseFolder = `src/posts`;
    const postImagesBaseFolder = `src/images/posts`;

    // create post images folder path
    await mkdir(postImagesBaseFolder, { recursive: true });

    // get posts from Notion
    const notionPosts = await getPostsFromNotion();

    const posts = notionPosts.results.map((result) => ({
        id: result.id,
        title: result.properties['Title'].title.pop().plain_text,
        cover: result.cover?.file?.url || result.cover?.external?.url || '',
        date: result.properties['Publish date']?.date.start,
        slug: result.properties['Slug'].url || '',
        tags: result.properties['Tags'].multi_select.map((option) => option.name) || '',
        thumbnail: result.properties['Thumbnail'].files[0]?.file.url || '',
    }));

    for (const post of posts) {
        // generate slug if one is not set
        if (post.slug === '') {
            post.slug = slugify(post.title);
        }
        // set folder & file paths
        const postDate = new Date(post.date);
        const postFolderPath = `${postsBaseFolder}/${postDate.getFullYear()}/${(postDate.getMonth() + 1).toString().padStart(2, "0")}`;
        // create post folder path
        await mkdir(postFolderPath, { recursive: true });
        const imagesFolderPath = `${postImagesBaseFolder}/${post.id.substring(0, post.id.indexOf('-'))}-${post.slug}`;
        // generate content
        post.tags.unshift('post');
        const mdContent = await getPostContentFromNotion(post.id) || '';
        // generate md file
        let mdString = `---\ntitle: "${post.title}"\ndate: ${post.date}\ntags: ${JSON.stringify(post.tags)}\n`;
        if (post.cover !== '') {
            const coverImage = await downloadFile(post.cover, `${imagesFolderPath}-cover`);
            if (coverImage) {
                mdString += `cover: "${coverImage.replace('src/', '/')}"\n`;
            }
        }
        if (post.thumbnail !== '') {
            let thumbnailImage = await downloadFile(post.thumbnail, `${imagesFolderPath}-thumbnail`);
            if (thumbnailImage) {
                thumbnailImage = await createPostThumbnail(thumbnailImage, post.title);
                mdString += `thumbnail: "${thumbnailImage.replace('src/', '/')}"\n`;
            }
        }
        mdString += `---\n` + mdContent;
        // save post to file
        console.log(`Saving ${postFolderPath}/${post.slug}.md`);
        //console.log(mdString);
        await writeFile(`${postFolderPath}/${post.slug}.md`, mdString, (err) => {
            err && console.log(err);
        });
    }
}

run();