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
 * The TestRunner is responsible for loading the test classes and keeping track
 * of the test suite's state. 
 */
qx.Class.define("testrunner.runner.TestRunner", {

  extend : qx.core.Object,

  
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  construct : function()
  {
    if (qx.core.Setting.get("qx.globalErrorHandling") === "on") {
      qx.event.GlobalError.setErrorHandler(this._handleGlobalError, this);      
    }
    
    // Create view
    if (qx.core.Variant.isSet("testrunner.view", "console")) {
      this.view = new testrunner.view.Console();
    } else {
      var createFrame = qx.core.Variant.isSet("testrunner.testOrigin", "iframe");
      this.view = new testrunner.view.Html(null, createFrame);
    }
    
    // Connect view and controller
    this.view.addListener("runTests", function() {
      this.setTestSuiteState("running");
      this.runTests();
    }, this);
    
    this.view.addListener("stopTests", function() { 
      this.setTestSuiteState("aborted"); 
    }, this);
    this.bind("testSuiteState", this.view, "testSuiteState");
    this.bind("testCount", this.view, "testCount");
    this.bind("initialTestList", this.view, "initialTestList");
    
    if (qx.core.Variant.isSet("testrunner.view", "html")) {
      qx.data.SingleValueBinding.bind(this.view, "selectedTests", this, "selectedTests");
    }
    
    // Load unit tests
    if (qx.core.Variant.isSet("testrunner.testOrigin", "iframe")) {
      this._loadIframeTests();
    } else {
      this._loadInlineTests();
    }
    
    // Check if any test parts are defined
    try {
      this.__testParts = [];
      this.__testParts = this.__testParts.concat(qx.core.Setting.get("qx.testParts"));
    } catch(ex) {}
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** Current state of the test suite */
    testSuiteState :
    {
      init : "init",
      check : [ "init", "loading", "ready", "running", "finished", "aborted", "error" ],
      event : "changeTestSuiteState"
    },
    
    /** Number of tests that haven't run yet */
    testCount :
    {
      init : null,
      nullable : true,
      check : "Integer",
      event : "changeTestCount"
    },
    
    /** Flat list of all tests in the current suite */
    initialTestList :
    {
      init : [],
      check : "Array",
      event : "changeInitialTestList"
    },
    
    /** List of tests selected by the user */
    selectedTests :
    {
      init : null,
      apply : "_applySelectedTests"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __iframe : null,
    __loadTimer : null,
    __loadAttempts : null,
    __testParts : null,
  
    
    /**
     * Loads test classes that are a part of the TestRunner application.
     */
    _loadInlineTests : function(nameSpace)
    {
      nameSpace = nameSpace || qx.core.Setting.get("qx.testNameSpace");
      this.setTestSuiteState("loading");
      this.loader = new qx.dev.unit.TestLoaderInline();
      this.loader.setTestNamespace(nameSpace);
      this.__getTestData();
    },
    
    
    /**
     * Loads test classes from a standalone test application using an iframe.
     */
    _loadIframeTests : function()
    {
      this.setTestSuiteState("loading");
      this.__iframe = this.view.getIframe();
      qx.event.Registration.addListener(this.__iframe, "load", this._onLoadIframe, this);
      var src = qx.core.Setting.get("qx.testPageUri");
      src += "?testclass=" + qx.core.Setting.get("qx.testNameSpace");
      qx.bom.Iframe.setSource(this.__iframe, src);
      this.debug("Setting AUT URI: " + src);
    },
    
    
    /**
     * Stores test names in a list.
     */
    __getTestData : function()
    {
      var testRep = this.loader.getTestDescriptions();
      if (!testRep) {
        this.error("Couldn't get test descriptions from loader!");
        return;
      }
      testRep = qx.lang.Json.parse(testRep);
      
      this.testList = [];
      var testCount = 0;
      
      for (var i=0,l=testRep.length; i<l; i++) {
        var testClassName = testRep[i].classname;
        for (var j=0,m=testRep[i].tests.length; j<m; j++) {
          this.testList.push(testClassName + ":" + testRep[i].tests[j]);
        }
        testCount += testRep[i].tests.length;
      }
      this.testList.sort();
      this.setTestSuiteState("ready");
      this.setTestCount(testCount);
      this.setInitialTestList(this.testList);
    },
    
    
    /**
     * Runs all tests in the list.
     */
    runTests : function()
    {
      if (this.getTestSuiteState() == "aborted") {
        return;
      }
      
      if (this.testList.length == 0) {
        if (this.__testParts && this.__testParts.length > 0) {
          var nextPart = this.__testParts.shift();
          qx.io.PartLoader.require([nextPart], function()
          {
            this._loadInlineTests(nextPart);
            this.runTests();
          }, this);
          return;
        }
        else {
          this.setTestSuiteState("finished");
          return;
        }
      }
      
      var currentTestFull = this.testList.shift();
      this.setTestCount(this.testList.length);
      var className = currentTestFull.substr(0, currentTestFull.indexOf(":"));
      var functionName = currentTestFull.substr(currentTestFull.indexOf(":") + 1); 
      var testResult = this.__initTestResult();
      
      this.loader.runTests(testResult, className, functionName);
    },
    
    
    /**
     * Creates the TestResult object that will run the actual test functions.
     * @return {testrunner.unit.TestResult} The configured TestResult object
     */
    __initTestResult : function()
    {
      if (qx.core.Variant.isSet("testrunner.testOrigin", "iframe")) {
        var frameWindow = qx.bom.Iframe.getWindow(this.__iframe);
        try {
          var testResult = new frameWindow.testrunner.unit.TestResult();
        } catch(ex) {
          // TODO: Remove after testrunner.unit.TestResult has replaced
          // qx.dev.unit.TestResult
          var testResult = new frameWindow.qx.dev.unit.TestResult();
        }
      } else {
        var testResult = new testrunner.unit.TestResult();
      }
      
      testResult.addListener("startTest", function(e) {
        /* EXPERIMENTAL
        if (qx.core.Variant.isSet("testrunner.testOrigin", "iframe")) {
          this.__bodyLength = this.frameWindow.document.body.innerHTML.length;
        }
        */
        
        var test = e.getData();
        this.currentTestData = new testrunner.runner.TestResultData(test.getFullName());
        this.view.addTestResult(this.currentTestData);
      }, this);
      
      testResult.addListener("wait", function(e) {
        //var test = e.getData();
        this.currentTestData.setState("wait");
      }, this);
      
      testResult.addListener("failure", function(e) {
        var ex = e.getData().exception;
        this.currentTestData.setException(ex);
        this.currentTestData.setState("failure");
        //var test = e.getData().test;
      }, this);
      
      testResult.addListener("error", function(e) {
        //var test = e.getData();
        var ex = e.getData().exception;
        this.currentTestData.setException(ex);
        this.currentTestData.setState("error");
      }, this);
      
      testResult.addListener("skip", function(e) {
        //var test = e.getData();
        var ex = e.getData().exception;
        this.currentTestData.setException(ex);
        this.currentTestData.setState("skip");
      }, this);
      
      testResult.addListener("endTest", function(e) {
        //var test = e.getData();
        var state = this.currentTestData.getState();
        if (state == "start") {
          this.currentTestData.setState("success");
        }
        
        /* EXPERIMENTAL
        if (qx.core.Variant.isSet("testrunner.testOrigin", "iframe")) {
          if (!this.frameWindow.qx.test || !this.frameWindow.qx.test.ui ||
              !this.frameWindow.qx.test.ui.LayoutTestCase ||
              !e.getData().getTestClass() instanceof this.frameWindow.qx.test.ui.LayoutTestCase ) {
            this.frameWindow.qx.ui.core.queue.Dispose.flush();
            this.frameWindow.qx.ui.core.queue.Manager.flush();
            if (this.__bodyLength != this.frameWindow.document.body.innerHTML.length) {
              var error = new Error("Incomplete tearDown: The DOM was not reverted to its initial state!");
              this.currentTestData.setException(error);
              this.currentTestData.setState("error");
            }  
          
          }
        }
        */
        
        qx.event.Timer.once(this.runTests, this, 0);
      }, this);
      
      return testResult;
    },
    
    
    /**
     * Waits until the test application in the iframe has finished loading, then
     * retrieves its TestLoader.
     * @param ev {qx.event.type.Event} Iframe's "load" event
     */
    _onLoadIframe : function(ev)
    {
      if (!this.__loadAttempts) {
        this.__loadAttempts = 0;
      }
      this.__loadAttempts++;

      this.frameWindow = qx.bom.Iframe.getWindow(this.__iframe);

      if (this.__loadTimer)
      {
        this.__loadTimer.stop();
        this.__loadTimer = null;
      }

      if (this.__loadAttempts <= 300) {
        // Repeat until testrunner in iframe is loaded
        if (!this.frameWindow.testrunner) {
          this.__loadTimer = qx.event.Timer.once(this._onLoadIframe, this, 100);
          return;
        }

        this.loader = this.frameWindow.testrunner.TestLoader.getInstance();
        // Avoid errors in slow browsers

        if (!this.loader) {
          this.__loadTimer = qx.event.Timer.once(this._onLoadIframe, this, 100);
          return;
        }

        if (!this.loader.getSuite()) {
          this.__loadTimer = qx.event.Timer.once(this._onLoadIframe, this, 100);
          return;
        }
      }
      else {
        this.setTestSuiteState("error");
        return;
      }
      
      // Check if any test parts are defined
      try {
        this.__testParts = this.__testParts.concat(this.frameWindow.qx.core.Setting.get("qx.testParts"));
      } catch(ex) {}
      
      this.__getTestData();
    },
    
    
    /**
     * Sets the list of pending tests to those selected by the user.
     * 
     * @param value {String[]} Selected tests
     * @param old {String[]} Previous value
     */
    _applySelectedTests : function(value, old)
    {
      this.testList = value;
      // Make sure the value is applied even if it didn't change so the view is
      // updated
      if (value.length == this.getTestCount()) {
        this.resetTestCount();
      }
      this.setTestCount(value.length);
    },
    
    _handleGlobalError : function(ex)
    {
      this.error(ex);
    }
    
  }
    
});