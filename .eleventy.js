const path = require("path");
const striptags = require('striptags');
const he = require('he');
const NOT_FOUND_PATH = '_site/404.html';
const { DateTime } = require('luxon');
const { minify } = require('terser');
const postcss = require('postcss');
const postcssMinify = require('postcss-minify');
const pluginReadingTime = require('eleventy-plugin-reading-time');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");

// TODO: Implement search using https://pagefind.app/docs/installation/

module.exports = eleventyConfig => {

    eleventyConfig.addPlugin(pluginReadingTime);
    eleventyConfig.addPlugin(pluginRss);
    eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        // File extensions to process
        extensions: "html",

        // Output path
        urlPath: "/images/",

        // Output image formats ("auto" is original)
        formats: ["webp", "auto"], // "auto", "webp", "jpeg", "png", "svg", "avif"

        // Output image widths ("auto" is original)
        widths: ["1200"],

        // Default attributes assigned on <img> override these values.
        defaultAttributes: {
            loading: "lazy",
            decoding: "async",
        },

        // Filename format
        filenameFormat: function (id, src, width, format, options) {
            const name = path.basename(src, path.extname(src));
            return `${name}-${width}w.${format}`;
        },
    });

    eleventyConfig.addBundle("css", {
        transforms: [
            async function (content) {
                // Same as Eleventy transforms, this.page is available here.
                let result = await postcss([postcssMinify]).process(content, {
                    from: this.page.inputPath,
                    to: null
                });
                return result.css;
                return content;
            }
        ]
    });
    eleventyConfig.addBundle("js", {
        transforms: [
            async function (content) {
                try {
                    let result = await minify(content, { sourceMap: true });
                    return result.code;
                } catch (err) {
                    console.error('Terser error: ', err);
                }
                return content;
            }
        ]
    });

    eleventyConfig.addShortcode('excerpt', post => extractExcerpt(post));
    function extractExcerpt(post) {
        if (!post.templateContent) return '';
        // Strip HTML tags and decode HTML entities.
        const content = he.decode(striptags(post.templateContent));
        // Truncate content and add ellipsis.
        return content.slice(0, 200).trim() + '…';
    }

    eleventyConfig.addShortcode('copyrightDate', function () {
        return new Date().getFullYear().toString();
    });

    eleventyConfig.addCollection('tags', function(collectionApi) {
        let tags = new Set();
        let posts = collectionApi.getFilteredByTag('post');
        posts.forEach(p => {
            let t = p.data.tags;
            t.forEach(c => tags.add(c));
        });
        return Array.from(tags);
    });

    eleventyConfig.addFilter('filterByTag', function(posts, tag) {
        /*
        case matters, so let's lowercase the desired tag and we will lowercase our posts tags
        */
        tag = tag.toLowerCase();
        let result = posts.filter(p => {
            let tags = p.data.tags.map(s => s.toLowerCase());
            return tags.includes(tag);
        });

        return result;
    });

    const english = new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    eleventyConfig.addFilter('niceDate', function(d) {
        return english.format(d);
    });

    // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    eleventyConfig.addFilter('htmlDateString', (dateObj) => {
        return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
    });

    eleventyConfig.addFilter('extension', (file) => {
        if (file) {
            return path.extname(file).replace('.', '');
        }
        return undefined;
    });

	eleventyConfig.addPassthroughCopy('CNAME');
	eleventyConfig.addPassthroughCopy('src/images/**');

    eleventyConfig.addWatchTarget('src');

    eleventyConfig.setServerOptions({
        domDiff: false
    });

    return {
        dir: {
            input: 'src'
        }
    }

};