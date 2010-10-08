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

qx.Class.define("testrunner.view.Abstract", {

  type : "abstract",
  
  extend : qx.core.Object,
  
  events :
  {
    runTests : "qx.event.type.Event"
  },
  
  properties :
  {
    status :
    {
      check : "Array",
      apply : "_applyStatus"
    },
    
    testSuiteState :
    {
      init : "init",
      apply : "_applyTestSuiteState",
      event : "changeTestSuiteState"
    },
    
    testCount :
    {
      apply : "_applyTestCount"
    }
  },
  
  members :
  {
    addTestResult : function(testResultData)
    {
      testResultData.addListener("changeState", function(ev) {
        this._onTestChangeState(testResultData);
      }, this);
    },
    
    _onTestChangeState : function(testResultData)
    {
      this.error("Missing implementation of __onTestChangeState!");
    }
  }
  
});
