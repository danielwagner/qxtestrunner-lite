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

qx.Class.define("testrunner.view.Html", {

  extend : testrunner.view.Abstract,
  
  construct : function(rootElement, autIframe)
  {
    var root = rootElement || document.body;
    var elemControls = document.createElement("div");
    elemControls.id = "qxtestrunner_controls";
    elemControls.innerHTML = '<input type="submit" id="qxtestrunner_run" value="Run Tests"></input>';
    root.appendChild(elemControls);
    
    if (autIframe) {
      var elemAut = document.createElement("div");
      elemAut.id = "qxtestrunner_aut";
      this.__elemIframe = qx.bom.Iframe.create({id : "qxtestrunner_autframe"});
      root.appendChild(this.__elemIframe);
    }
    
    var elemResults = document.createElement("div");
    elemResults.id = "qxtestrunner_results";
    elemResults.innerHTML = '<ul id="qxtestrunner_resultslist"></ul>';
    root.appendChild(elemResults);
    
    var elemFooter = document.createElement("div");
    elemFooter.id = "qxtestrunner_footer";
    elemFooter.innerHTML = '<p id="qxtestrunner_status"></p>';
    root.appendChild(elemFooter);
    
    this.__runButton = document.getElementById("qxtestrunner_run");
    qx.event.Registration.addListener(this.__runButton, "click", function(ev) {
      this.fireEvent("runTests");
    }, this);
    
    this.__elemStatus = document.getElementById("qxtestrunner_status");
    this.__elemResultsList = document.getElementById("qxtestrunner_resultslist");
  },
  
  members :
  {
    __elemStatus : null,
    __elemResultsList : null,
    __elemIframe : null,
    
    _applyStatus : function(value, old)
    {
      if (!value[0] || (value === old)) {
        return;
      }
      
      var msg = value[0];
      var lvl = value[1] || "info";
      this.__elemStatus.className = lvl;
      this.__elemStatus.innerHTML = msg;
    },
    
    _applyTestSuiteState : function(value, old)
    {
      switch(value) 
      {
        case "loading" :
          this.setStatus(["Loading tests..."]);
          this.__runButton.disabled = true;
          break;
        case "ready" :
          this.setStatus(["Test suite ready"]);
          this.__runButton.disabled = false;
          break;
        case "running" :
          this.setStatus(["Running tests..."]);
          this.__runButton.disabled = true;
          break;
        case "finished" :
          this.setStatus(["Test suite finished"]);
          this.__runButton.disabled = true;
          break;
        case "aborted" :
          this.setStatus(["Test run aborted"]);
          this.__runButton.disabled = true;
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
        case "running" :
          this.setStatus([value + " tests pending"]);
          break;
      };
    },
    
    clearResults : function()
    {
      this.__elemResultsList.innerHTML = "";
    },
    
    _onTestChangeState : function(testResultData) {
      var testName = testResultData.getName();
      var state = testResultData.getState();
      var exception =  testResultData.getException();
      
      var id = this.__testNameToId(testName);
      var listItem = document.getElementById(id); 
      if (listItem) {
        qx.bom.element.Attribute.set(listItem, "class", state);
      } else {
        var itemHtml = '<li id="' + id + '" class="' + state + '">' + testName;
        itemHtml += '</li>';
        this.__elemResultsList.innerHTML += itemHtml;
        listItem = document.getElementById(id);
      }
      
      if (exception) {
        listItem.innerHTML += '<br/>' + exception;
      }
    },
          
    __testNameToId : function(testName)
    {
      var id = testName.replace(/\./g, "");
      id = id.replace(/\:/g, "");
      return id;
    },
    
    getIframe : function()
    {
      return this.__elemIframe;
    }
  }
  
});