const moment = require('moment');
const _ = require('lodash');

moment.locale('zh-cn');

function readableSize(bytes) {
    if (bytes < 0) {
        throw new Error(`Files size < 0: ${bytes} bytes.`);
    }
    if (bytes < 1024) {
        return bytes + ' B';
    }
    if (bytes < 1024 * 1024) {
        return Math.round((10 * bytes) / 1024) / 10 + ' KB';
    }
    if (bytes < 1024 * 1024 * 1024) {
        return Math.round((10 * bytes) / (1024 * 1024)) / 10 + ' MB';
    }
    return Math.round((10 * bytes) / (1024 * 1024 * 1024)) / 10 + ' GB';
}

export function prepareFiles(file, parent = null) {
    if (parent) {
        file.parent = parent;
        file.path = _.startsWith(file.name, '/') || _.endsWith(parent.path, '/')
            ? parent.path + file.name
            : `${parent.path}/${file.name}`;
    } else {
        file.path = '/';
    }
    file.isDir = file.hasOwnProperty('children');
    if (file.isDir) {
        if (!_.endsWith(file.path, '/')) {
            file.path += '/';
        }
        file.size = 0;
        file.time = 0;
        file.children.forEach((child) => {
            prepareFiles(child, file);
            file.size += child.size;
            if (child.time > file.time) {
                file.time = child.time;
            }
        });
    }
    file.fullUrl = process.env.VUE_APP_DOWNLOAD_BASE_URL + file.path;
    if (!file.hasOwnProperty('description')) {
        file.description = '';
    }
    file.sizeReadable = readableSize(file.size);
    file.timeForHuman = moment.unix(file.time).format('lll');
    file.timeFromNowForHuman = moment.unix(file.time).fromNow();
    return file;
}

export function flattenFiles(file, all = []) {
    all.push(file);
    if (file.isDir) {
        file.children.forEach((child) => {
            flattenFiles(child, all);
        });
    }
    return all;
}

export function cacheTimestamp(cacheTime = 86400) {
    return Math.floor(Date.now() / 1000 / cacheTime) * cacheTime;
}
