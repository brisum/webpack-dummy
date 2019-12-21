'use strict';

import $ from 'jquery';
import BundleLoader from 'BundleLoader';

class RequireInit {
  constructor($element) {
    this.$element = $element;
    this._init();
  }
  
  _init() {
    let self = this,
      requires = {};
    
    self.$element.find('[data-require-init]').each(function (i, element) {
      let $element = $(element),
        args = $element.attr('data-require-init').split(','),
        name = args[0],
        priority = undefined !== args[1] ? parseInt(args[1]) : 100;
      
      if (!requires[priority + '-' + name]) {
        requires[priority + '-' + name] = {
          elements: [],
          name: name
        }
      }
      requires[priority + '-' + name].elements.push($element);
    });
    
    Object.keys(requires).sort().forEach(function (requireKey) {
      let requireInitConfig = requires[requireKey];
      
      Object.keys(requireInitConfig.elements).forEach(function (elementKey) {
        let $element = requireInitConfig.elements[elementKey],
          requireInit = requireInitConfig.name,
          callback = requireInit.match(/.+Widget$/) || requireInit.match(/.+\.widget$/)
            ? (function (requireElement) {
              if (requireElement && requireElement.__esModule && requireElement.default) {
                requireElement = requireElement.default;
              }
              let widget = new requireElement($element);
              widget._init();
            })
            : (function () {
            });
        
        console.log('data-require-init', requireInit);
        
        switch (requireInit) {
          /* case template:
          case '{{name}}':
              BundleLoader.load([require('bundle-loader?&name={{name}}!{{name}}')], callback);
              break;
          */
          
          
          case 'BundleLoader':
              BundleLoader.load([require('bundle-loader?&name=BundleLoader!BundleLoader')], callback);
              break;
          

          case 'SourceLoader':
              BundleLoader.load([require('bundle-loader?&name=SourceLoader!SourceLoader')], callback);
              break;
          

          case 'Widget':
              BundleLoader.load([require('bundle-loader?&name=Widget!Widget')], callback);
              break;
          

          case 'RequireInit':
              BundleLoader.load([require('bundle-loader?&name=RequireInit!RequireInit')], callback);
              break;
          
          
          default:
            console.log('not found require init: ' + requireInit);
        }
      });
    });
  }
}

export default RequireInit;
