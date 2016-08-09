"use strict";
var JavaScriptObfuscator = require('javascript-obfuscator'), multimatch = require('multimatch'), RawSource = require('webpack-core/lib/RawSource'), SourceMapSource = require("webpack-core/lib/SourceMapSource"), transferSourceMap = require("multi-stage-sourcemap").transfer;
var WebpackObfuscator = (function () {
    function WebpackObfuscator(options, excludes) {
        this.options = {};
        this.PLUGIN_NAME = 'webpack-obfuscator';
        this.options = options;
        this.excludes = typeof excludes === 'string' ? [excludes] : excludes || [];
    }
    WebpackObfuscator.prototype.apply = function (compiler) {
        var _this = this;
        compiler.plugin('compilation', function (compilation) {
            compilation.plugin("optimize-chunk-assets", function (chunks, callback) {
                var files = [];
                chunks.forEach(function (chunk) {
                    chunk['files'].forEach(function (file) {
                        files.push(file);
                    });
                });
                compilation.additionalChunkAssets.forEach(function (file) {
                    files.push(file);
                });
                files.forEach(function (file) {
                    if (_this.shouldExclude(file, _this.excludes)) {
                        return;
                    }
                    var asset = compilation.assets[file];
                    var input, inputSourceMap;
                    if (_this.options.sourceMap !== false) {
                        if (asset.sourceAndMap) {
                            var sourceAndMap = asset.sourceAndMap();
                            inputSourceMap = sourceAndMap.map;
                            input = sourceAndMap.source;
                        }
                        else {
                            inputSourceMap = asset.map();
                            input = asset.source();
                        }
                        if (inputSourceMap) {
                            _this.options.sourceMap = true;
                        }
                    }
                    else {
                        input = asset.source();
                    }
                    var obfuscationResult = JavaScriptObfuscator.obfuscate(input, _this.options);
                    if (_this.options.sourceMap) {
                        var obfuscationSourceMap = obfuscationResult.getSourceMap();
                        var transferedSourceMap = transferSourceMap({ fromSourceMap: obfuscationSourceMap, toSourceMap: inputSourceMap });
                        compilation.assets[file] = new SourceMapSource(obfuscationResult.toString(), file, JSON.parse(transferedSourceMap), asset.source(), inputSourceMap);
                    }
                    else {
                        compilation.assets[file] = new RawSource(obfuscationResult.toString());
                    }
                });
                callback();
            });
        });
    };
    WebpackObfuscator.prototype.shouldExclude = function (filePath, excludes) {
        for (var _i = 0, excludes_1 = excludes; _i < excludes_1.length; _i++) {
            var exclude = excludes_1[_i];
            if (multimatch(filePath, exclude).length > 0) {
                return true;
            }
        }
        return false;
    };
    return WebpackObfuscator;
}());
module.exports = WebpackObfuscator;
