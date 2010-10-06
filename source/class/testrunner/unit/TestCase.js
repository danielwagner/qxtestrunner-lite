qx.Class.define("testrunner.unit.TestCase", {

  extend : qx.dev.unit.TestCase,
  
  construct : function()
  {
    this.base(arguments);
    this._currentExceptions = [];
    
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
  
  members :
  {
    _currentExceptions : null
  }
  
});