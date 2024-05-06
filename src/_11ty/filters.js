const {DateTime} = require("luxon");
const path = require("path");

function filterByTag(posts, tag) {
    /*
    case matters, so let's lowercase the desired tag and we will lowercase our posts tags
    */
    tag = tag.toLowerCase();
    let result = posts.filter(p => {
        let tags = p.data.tags.map(s => s.toLowerCase());
        return tags.includes(tag);
    });

    return result;
}

const english = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});
function niceDate(d) {
    return english.format(d);
}

// https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
function htmlDateString(dateObj) {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
}

function extension(file) {
    if (file) {
        return path.extname(file).replace('.', '');
    }
    return undefined;
}

module.exports = {
    filterByTag,
    niceDate,
    htmlDateString,
    extension
}