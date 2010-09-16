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
  
  construct : function(rootElement)
  {
    var root = rootElement || document.body;
    var elemControls = document.createElement("div");
    elemControls.id = "qxtestrunner_controls";
    elemControls.innerHTML = '<input type="submit" id="qxtestrunner_run" value="Run Tests"></input>';
    root.appendChild(elemControls);
    
    var elemResults = document.createElement("div");
    elemResults.id = "qxtestrunner_results";
    elemResults.innerHTML = '<ul id="qxtestrunner_resultslist"></ul>';
    root.appendChild(elemResults);
    
    var elemFooter = document.createElement("div");
    elemFooter.id = "qxtestrunner_footer";
    elemFooter.innerHTML = '<p id="qxtestrunner_status"></p>';
    root.appendChild(elemFooter);    
    
    var runButton = document.getElementById("qxtestrunner_run");
    qx.event.Registration.addListener(runButton, "click", function(ev) {
      this.fireEvent("runTests");
    }, this);
    
    this.__elemStatus = document.getElementById("qxtestrunner_status");
    this.__elemResultsList = document.getElementById("qxtestrunner_resultslist");
  },
  
  members :
  {
    __elemStatus : null,
    __elemResultsList : null,
    
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
    }
  }
  
});