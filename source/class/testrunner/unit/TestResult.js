qx.Class.define("testrunner.unit.TestResult", {

  extend : qx.dev.unit.TestResult,
  
  events :
  {
    /**
     * Fired if the test was skipped, e.g. because a requirement was not met.
     *
     * Event data: The test {@link qx.dev.unit.TestFunction}
     */
    skip : "qx.event.type.Data"
  },
  
  members :
  {
    run : function(test, testFunction, self, resume)
    {
      if(!this.__timeout) {
        this.__timeout = {};
      }

      if (resume && !this.__timeout[test.getFullName()]) {
        this.__timeout[test.getFullName()] = "failed";
        var qxEx = new qx.type.BaseError("Error in asynchronous test", "resume() called before wait()");
        this.__createError("failure", qxEx, test);
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
          this.__createError("skip", ex, test);
        } else {
          this.__createError("failure", ex, test);
        }
        return;
      }

      if (this.__timeout[test.getFullName()])
      {
        if (!this.__timeout[test.getFullName()] !== "failed") {
          this.__timeout[test.getFullName()].stop();
        }
        delete this.__timeout[test.getFullName()];
      }
      else
      {
        try {
          test.setUp();
        }
        catch(ex)
        {
          try {
            test.tearDown();
          }
          catch(ex) {
            /* Any exceptions here are likely caused by setUp having failed
               previously, so we'll ignore them. */
          }
          var qxEx = new qx.type.BaseError("Error setting up test: " + ex.name, ex.message);
          this.__createError("error", qxEx, test);
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

          if (this.__timeout[test.getFullName()]) {
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
            this.__timeout[test.getFullName()] = qx.event.Timer.once(function() {
               this.run(test, timeoutFunc, context);
            }, that, ex.getDelay());
            this.fireDataEvent("wait", test);
          }

        } else if (ex.classname == "qx.core.AssertionError") {
          try {
            test.tearDown();
          } catch(except) {}
          this.__createError("failure", ex, test);
        } else {
          try {
            test.tearDown();
          } catch(except) {}
          this.__createError("error", ex, test);
        }
      }
      
      var savedExceptions = test.getTestClass()[test.getName()]._exceptions;
      if (savedExceptions && savedExceptions.length > 0) {
        var error = true;
        try {
          test.tearDown();
        } catch(except) {}
        this.__createError("failure", savedExceptions[0], test);
      }

      if (!error)
      {
        try {
          test.tearDown();
          this.fireDataEvent("endTest", test);
        } catch(ex) {
          var qxEx = new qx.type.BaseError("Error tearing down test: " + ex.name, ex.message);
          this.__createError("error", qxEx, test);
        }
      }
    }
  }

});