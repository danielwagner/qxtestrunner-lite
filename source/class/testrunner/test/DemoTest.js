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
 * This class demonstrates how to define unit tests for your application.
 *
 * Execute <code>generate.py test</code> to generate a testrunner application 
 * and open it from <tt>test/index.html</tt>
 *
 * The methods that contain the tests are instance methods with a 
 * <code>test</code> prefix. You can create an arbitrary number of test 
 * classes like this one. They can be organized in a regular class hierarchy, 
 * i.e. using deeper namespaces and a corresponding file structure within the 
 * <tt>test</tt> folder.
 */
qx.Class.define("testrunner.test.DemoTest",
{
  extend : testrunner.unit.TestCase,
  
  include : [testrunner.unit.MRequirements],
  

  members :
  {
    /*
    ---------------------------------------------------------------------------
      TESTS
    ---------------------------------------------------------------------------
    */
  
    
    setUp : function()
    {
      
    },


    tearDown : function() {
      this.info("common tearDown");
    },

    testSuccess : function()
    {
      this.assertEquals(4, 3+1, "This should never fail!");
      this.assertFalse(false, "Can false be true?!");
    },

    testFail: function () 
    {
      this.assertTrue(false, "Well, what did you expect?");
      this.debug("Executed code after failed assertion!");
    },
    
    testAsyncSimple : function()
    {
      var self = this;
      this.info("Setting timeout");
      window.setTimeout(function() {
        self.resume(function() {
          this.info("Async test OK");
        }, self);
      }, 1000);

      this.wait();
    },
    
    
    //"@require testSsl" : [ ["Opera", ">=", 9] ],
    "@require testSsl" : ["ssl"],
    testSsl : function() {
       this.assert(qx.bom.client.Feature.SSL, "This test should have been skipped!");
    },
    
    testAsyncBom : function()
    {
      var div = document.createElement("div");
      div.id = "el";

      this._el = div;
      document.body.appendChild(div);
      
      qx.event.Registration.addListener(this._el, "focus", function() {
        this.resume(function() {
          this.info("Element focused.");
        }, this);
      },this);

      var self = this;
      window.setTimeout(function(){
        qx.bom.Element.focus(self._el);
      }, 2000);
      
      this.wait();
    },
    
    "@tearDown testAsyncBom" : function()
    {
      document.body.removeChild(this._el);
      delete this._el;
      this.info("test specific teardown for testAsyncBom");
    }
    
  }
});
