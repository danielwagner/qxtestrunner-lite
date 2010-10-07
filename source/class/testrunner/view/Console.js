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

qx.Class.define("testrunner.view.Console", {

  extend : testrunner.view.Abstract,
  
  members :
  {
    
    run : function()
    {
      this.fireEvent("runTests");
    },
    
    _applyStatus : function(value, old)
    {
      if (!value[0] || (value === old)) {
        return;
      }
      
      var msg = value[0];
      var lvl = value[1] || "info";
      
      console.log(msg);
    },
    
    _applyTestSuiteState : function(value, old)
    {
      switch(value) 
      {
        case "loading" :
          this.setStatus(["Loading tests..."]);
          break;
        case "ready" :
          this.setStatus(["Test suite ready"]);
          break;
        case "running" :
          this.setStatus(["Running tests..."]);
          break;
        case "finished" :
          this.setStatus(["Test suite finished"]);
          break;
        case "aborted" :
          this.setStatus(["Test run aborted"]);
          break;
      };
    },
    
    _applyTestCount : function(value, old)
    {
      var suiteState = this.getTestSuiteState();
      switch(suiteState)
      {
        case "ready" :
          this.setStatus([value + " tests ready to run"]);
          break;
      };
    },
    
    _onTestChangeState : function(testResultData)
    {
      var testName = testResultData.getName();
      var state = testResultData.getState();
      var exception =  testResultData.getException();
      
      console.log(testName + " : " + state);
    }
  }
});