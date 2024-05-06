const { extractExcerpt } = require("./helpers");

function excerpt(post) {
    if (!post.templateContent) return '';
    // Extract excerpt
    return extractExcerpt(post.templateContent);
}

function copyrightDate() {
    return new Date().getFullYear().toString();
}

module.exports = {
    excerpt,
    copyrightDate
}