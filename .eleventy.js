const path = require("path");
const NOT_FOUND_PATH = '_site/404.html';
const { DateTime } = require('luxon');
const { minify } = require('terser');
const postcss = require('postcss');
const postcssMinify = require('postcss-minify');
const pluginReadingTime = require('eleventy-plugin-reading-time');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");
const filters = require('./src/_11ty/filters');
const shortcodes = require('./src/_11ty/shortcodes');

// TODO: Implement search using https://pagefind.app/docs/installation/

module.exports = eleventyConfig => {

    // Add plugins
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

    // Add bundles
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

    // Add filters
    Object.keys(filters).forEach(filterName => {
        eleventyConfig.addFilter(filterName, filters[filterName])
    })

    // Add shortcodes
    Object.keys(shortcodes).forEach(codeName => {
        eleventyConfig.addShortcode(codeName, shortcodes[codeName])
    })

    // Add collections
    eleventyConfig.addCollection('tags', function(collectionApi) {
        let tags = new Set();
        let posts = collectionApi.getFilteredByTag('post');
        posts.forEach(p => {
            let t = p.data.tags;
            t.forEach(c => tags.add(c));
        });
        return Array.from(tags);
    });

    // Add passthroughs
	eleventyConfig.addPassthroughCopy('CNAME');
	eleventyConfig.addPassthroughCopy('src/images/**');

    // Set dev server options
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