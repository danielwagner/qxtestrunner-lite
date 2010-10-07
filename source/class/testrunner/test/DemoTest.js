/* ************************************************************************

   Copyright:

   License:

   Authors:

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
  //extend : qx.dev.unit.TestCase,
  extend : testrunner.unit.TestCase,

  members :
  {
    /*
    ---------------------------------------------------------------------------
      TESTS
    ---------------------------------------------------------------------------
    */
  
    setUp : function()
    {
      var div = document.createElement("div");
      div.id = "el";

      this._el = div;
      document.body.appendChild(div);
    },


    tearDown : function() {
      document.body.removeChild(this._el);
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
    
    testAsync : function()
    {
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
    
    testSsl : function() {
      this.require(["ssl"], function() {
        this.assert(qx.bom.client.Feature.SSL, "This test should have been skipped!");
      }, this);
    }    
  }
});
