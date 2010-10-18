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
 * This TestResultData class does not throw exceptions raised by test code,
 * instead storing them in an array attached to the test function itself. This
 * ensures that the entire body of each test function is executed.
 * 
 * It also supports an additional "skipped" state for tests that aren't run 
 * because infrastructure requirements are not met.
 */
qx.Class.define("testrunner.unit.TestResult", {

  extend : qx.dev.unit.TestResult,
  
  
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */
  events :
  {
    /**
     * Fired if the test was skipped, e.g. because a requirement was not met.
     *
     * Event data: The test {@link qx.dev.unit.TestFunction}
     */
    skip : "qx.event.type.Data"
  },
  
  
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {
    _timeout : null,
    
    run : function(test, testFunction, self, resume)
    {
      if(!this._timeout) {
        this._timeout = {};
      }

      if (resume && !this._timeout[test.getFullName()]) {
        this._timeout[test.getFullName()] = "failed";
        var qxEx = new qx.type.BaseError("Error in asynchronous test", "resume() called before wait()");
        this._createError("failure", qxEx, test);
        return;
      }
      
      // delete any exceptions stored in a previous run
      if (test.getTestClass()[test.getName()]._exceptions) {
        test.getTestClass()[test.getName()]._exceptions = [];
      }

      this.fireDataEvent("startTest", test);
      
      try {
        var require = test.getTestClass()["@require " + test.getName()];
        if (require) {
          test.getTestClass().require(require);
        }
      } catch(ex) {
        if (ex.classname == "testrunner.unit.RequirementError") {
          this._createError("skip", ex, test);
        } else {
          this._createError("failure", ex, test);
        }
        return;
      }

      if (this._timeout[test.getFullName()])
      {
        if (this._timeout[test.getFullName()] !== "failed") {
          this._timeout[test.getFullName()].stop();
        }
        delete this._timeout[test.getFullName()];
      }
      else
      {
        try {
          test.setUp();
        }
        catch(ex)
        {
          try {
            this.callTearDown(test);
          }
          catch(ex) {
            /* Any exceptions here are likely caused by setUp having failed
               previously, so we'll ignore them. */ 
          }
          var qxEx = new qx.type.BaseError("Error setting up test: " + ex.name, ex.message);
          this._createError("error", qxEx, test);
          return;
        }
      }

      try {
        testFunction.call(self || window);
      }
      catch(ex)
      {
        var error = true;
        if (ex instanceof qx.dev.unit.AsyncWrapper)
        {

          if (this._timeout[test.getFullName()]) {
            // Do nothing if there's already a timeout for this test
            return;
          }

          if (ex.getDelay()) {
            var that = this;
            var defaultTimeoutFunction = function() {
              throw new qx.core.AssertionError(
                "Asynchronous Test Error",
                "Timeout reached before resume() was called."
              );
            }
            var timeoutFunc = (ex.getDeferredFunction() ? ex.getDeferredFunction() : defaultTimeoutFunction);
            var context = (ex.getContext() ? ex.getContext() : window);
            this._timeout[test.getFullName()] = qx.event.Timer.once(function() {
               this.run(test, timeoutFunc, context);
            }, that, ex.getDelay());
            this.fireDataEvent("wait", test);
          }

        } else if (ex.classname == "qx.core.AssertionError") {
          try {
            this.callTearDown(test);
          } catch(except) {}
          this._createError("failure", ex, test);
        } else {
          try {
            this.callTearDown(test);
          } catch(except) {}
          this._createError("error", ex, test);
        }
      }
      
      var savedExceptions = test.getTestClass()[test.getName()]._exceptions;
      if (savedExceptions && savedExceptions.length > 0) {
        var error = true;
        try {
          this.callTearDown(test);
        } catch(except) {}
        this._createError("failure", savedExceptions[0], test);
      }

      if (!error)
      {
        try {
          this.callTearDown(test);
          this.fireDataEvent("endTest", test);
        } catch(ex) {
          var qxEx = new qx.type.BaseError("Error tearing down test: " + ex.name, ex.message);
          this._createError("error", qxEx, test);
        }
      }
    },
    
    
    /**
     * Calls the test class' generic tearDown, then the test function's specific
     * tearDown, if any.
     * 
     * @param test {Object} The test object (first argument of {@link #run})
     */
    callTearDown : function(test)
    {
      test.tearDown();
      var testClass = test.getTestClass();
      var specificTearDown = "@tearDown " + test.getName();
      if (testClass[specificTearDown]) {
        testClass[specificTearDown]();
      }
    }
  }

});