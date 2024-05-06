require("dotenv").config();
const { writeFile, mkdir } = require("fs/promises");
const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require('notion-to-md');
const { extractExcerpt, slugify, downloadFile, createPostThumbnail } = require("./src/_11ty/helpers");

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
        if (mdContent !== '') {
            mdString += `description: "${extractExcerpt(mdContent)}"\n`;
        }
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