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

qx.Class.define("testrunner.runner.TestRunner", {

  extend : qx.core.Object,
  
  construct : function()
  {
    // Create view
    if (qx.core.Variant.isSet("testrunner.view", "console")) {
      this.view = new testrunner.view.Console();
    } else {
      this.view = new testrunner.view.Html();
    }
    
    // Connect view and controller
    this.view.addListener("runTests", this.runTests, this);
    this.bind("testSuiteState", this.view, "testSuiteState");
    this.bind("testCount", this.view, "testCount");
    
    // Load unit tests
    if (qx.core.Variant.isSet("testrunner.testOrigin", "iframe")) {
      this._loadIframeTests();
    } else {
      this._loadInlineTests();
    }
  },
  
  properties :
  {
    testSuiteState :
    {
      init : "init",
      check : [ "init", "loading", "ready", "running", "finished", "aborted", "error" ],
      event : "changeTestSuiteState"
    },
    
    testCount :
    {
      init : 0,
      check : "Integer",
      event : "changeTestCount"
    }
  },
  
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __loadTimer : null,
    __loadAttempts : null,  
  
    _loadInlineTests : function()
    {
      this.setTestSuiteState("loading");
      this.loader = new qx.dev.unit.TestLoaderInline();
      this.loader.setTestNamespace(qx.core.Setting.get("qx.testNameSpace"));
      this.__getTestData();
    },
    
    _loadIframeTests : function()
    {
      this.setTestSuiteState("loading");
      var autElem = document.getElementById("aut");
      this._iframe = qx.bom.Iframe.create({id : "autframe"});
      autElem.appendChild(this._iframe);
      qx.event.Registration.addListener(this._iframe, "load", this._onLoadIframe, this);
      qx.bom.Iframe.setSource(this._iframe, "../test/html/tests-source.html?testclass=qx.test");
    },
    
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
        testCount +=  testRep[i].tests.length;
      }
      
      this.testList.sort();
      this.setTestSuiteState("ready");
      this.setTestCount(testCount);
    },
    
    runTests : function()
    {
      this.setTestSuiteState("running");
      if (document.body.childNodes.length == 0) {
        console.log(this.currentTestData.getName() + " broke the DOM!");
        return;
      }
      if (this.testList.length == 0) {
        this.setTestSuiteState("finished");
        return;
      };
      
      var currentTestFull = this.testList.shift();
      this.setTestCount(this.testList.length);
      var className = currentTestFull.substr(0, currentTestFull.indexOf(":"));
      var functionName = currentTestFull.substr(currentTestFull.indexOf(":") + 1); 
      var testResult = this.__initTestResult();
      
      this.loader.runTests(testResult, className, functionName);
    },
    
    __initTestResult : function()
    {
      if (this.frameWindow) {
        var testResult = new this.frameWindow.testrunner.unit.TestResult();
      } else {
        var testResult = new testrunner.unit.TestResult();
      }
      
      testResult.addListener("startTest", function(e) {
        var test = e.getData();
        this.currentTestData = new testrunner.runner.TestResultData(test.getFullName());
        this.view.addTestResult(this.currentTestData);
      }, this);
      
      testResult.addListener("wait", function(e) {
        var test = e.getData();
        this.currentTestData.setState("wait");
      }, this);
      
      testResult.addListener("failure", function(e) {
        var ex = e.getData().exception;
        this.currentTestData.setException(ex);
        this.currentTestData.setState("failure");
        var test = e.getData().test;
      }, this);
      
      testResult.addListener("error", function(e) {
        var test = e.getData();
        var ex = e.getData().exception;
        this.currentTestData.setException(ex);
        this.currentTestData.setState("error");
      }, this);
      
      testResult.addListener("skip", function(e) {
        var test = e.getData();
        var ex = e.getData().exception;
        this.currentTestData.setException(ex);
        this.currentTestData.setState("skip");
      }, this);
      
      testResult.addListener("endTest", function(e) {
        var test = e.getData();
        var state = this.currentTestData.getState();
        if (state == "start") {
          this.currentTestData.setState("success");
        }
        qx.event.Timer.once(this.runTests, this, 0);
      }, this);
      
      return testResult;
    },
    
    _onLoadIframe : function(ev)
    {
      if (!this.__loadAttempts) {
        this.__loadAttempts = 0;
      }
      this.__loadAttempts++;

      this.frameWindow = qx.bom.Iframe.getWindow(this._iframe);

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
      
      this.__getTestData();
    }
    
  }
    
});