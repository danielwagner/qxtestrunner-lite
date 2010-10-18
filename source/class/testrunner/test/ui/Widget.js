qx.Class.define("testrunner.test.ui.Widget", {

  extend : testrunner.unit.TestCase,
  
  members :
  {
    __widget : null,


    setUp : function() {
      this.__widget = new qx.ui.core.Widget();
    },


    tearDown : function() {
      this.__widget.destroy();
    },


    testAddState : function() {
      this.__widget.addState("test");
      this.assertTrue(this.__widget.hasState("test"));
    },


    testRemoveState : function() {
      this.__widget.addState("test");
      this.assertTrue(this.__widget.hasState("test"));
      this.__widget.removeState("test");
      this.assertFalse(this.__widget.hasState("test"));
    },

    testReplaceState : function() {
      this.__widget.addState("test");
      this.assertTrue(this.__widget.hasState("test"));
      this.__widget.replaceState("test", "affe");
      this.assertTrue(this.__widget.hasState("affe"));
      this.assertFalse(this.__widget.hasState("test"));
    }
  }
  
});