/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Daniel Wagner (d_wagner)

************************************************************************ */

/**
 * Base class for unit tests. Supports verification of infrastructure 
 * requirements such as SSL. Wraps assertion methods so that assertion 
 * exceptions are stored in an array and attached to the function that called 
 * the assertion instead of being thrown.
 */
qx.Class.define("testrunner.unit.TestCase", {

  extend : qx.dev.unit.TestCase,
  
  
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  construct : function()
  {
    this.base(arguments);
    
    /**
     * Wrap assertions to store assertion exceptions.
     */
    for (var prop in this) {
      if (prop.indexOf("assert") == 0 && typeof this[prop] == "function") {
        // store original assertion func
        var originalName = "__" + prop;
        this[originalName] = this[prop];
        var self = this;
        // create wrapped assertion func
        this[prop] = function() {
          var argumentsArray = qx.lang.Array.fromArguments(arguments);
          try {
            self[arguments.callee.originalName].apply(self, argumentsArray);
          } catch(ex) {
            var testFunction = arguments.callee.caller;
            // attach any exceptions to the test function that called the
            // assertion
            if (!testFunction._exceptions || !(testFunction._exceptions instanceof Array)) {
              testFunction._exceptions = [];
            }
            testFunction._exceptions.push(ex);
          }
        };
        this[prop].originalName = originalName;
      }
    }    
  },
  
  
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {
    /**
     * Verifies a list of infrastructure requirements by checking for 
     * corresponding "has" methods. Throws RequirementErrors for unmet 
     * requirements.
     * 
     * @param featureList {String[]} List of infrastructure requirements
     */
    require : function(featureList) {
      for (var i=0,l=featureList.length; i<l; i++) {
        var feature = featureList[i];
        var hasMethodName = "has" + qx.lang.String.capitalize(feature);
        
        if (!this[hasMethodName]) {
          throw new Error('Unable to verify requirement: No method "' + hasMethodName + '" found');          
        }
        
        if (!this[hasMethodName]()) {
          throw new testrunner.unit.RequirementError(feature);
        }
      }
    },
    
    /**
     * Checks if the test application has been loaded over HTTPS.
     * 
     * @return {Boolean} Whether SSL is currently used
     */
    hasSsl : function()
    {
      return qx.bom.client.Feature.SSL;
    }
  }
});